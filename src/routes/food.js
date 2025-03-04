import express from 'express';
import multer from 'multer';
import Food from '../models/Food.js';
import Menu from '../models/Menu.js';
import { authenticateToken as authenticate } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const uploadsDir = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const deleteFiles = (files) => {
  files.forEach((file) => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
};


router.post(
  '/',
  authenticate,
  upload.single('image'),
  async (req, res) => {
    const { name, description, menuId, workspaceId } = req.body;
    console.log('Received data:', { name, description, menuId, workspaceId, image: req.file });
    if (!name || !description || !menuId || !workspaceId) {
      return res.status(400).json({ error: 'Required fields are missing: name, description, menuId, or workSpaceId.' });
    }

    try {
      const newFood = new Food({
        name,
        description,
        menuId,
        workspaceId,
        image: req.file ? `/uploads/${req.file.filename}` : null,
      });

      await newFood.save();
      res.status(201).json({ message: 'Food item created successfully', food: newFood });
    } catch (error) {
      console.error('Error creating food item:', error);
      res.status(500).json({ error: 'Failed to create food item' });
    }
  }
);


router.get('/', authenticate, async (req, res) => {
  const { menuId, workspaceId } = req.query;

  if (!menuId && !workspaceId) {
    return res.status(400).json({ error: 'Either menuId or workspaceId is required' });
  }

  try {
    const filter = {};
    if (menuId) filter.menuId = menuId;
    if (workspaceId) filter.workspaceId = workspaceId;

    const foods = await Food.find(filter);
    res.json({ foods });
  } catch (error) {
    console.error('Error fetching food items:', error);
    res.status(500).json({ error: 'Failed to retrieve food items' });
  }
});

router.patch('/:id', authenticate, upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { name, description, menuId, workspaceId } = req.body;

  console.log('Update Request:', req.body);  

  try {
    const food = await Food.findById(id);

    if (!food) {
      return res.status(404).json({ error: 'Food item not found' });
    }

    
    if (name) food.name = name;
    if (description) food.description = description;
    if (menuId) food.menuId = menuId;
    if (workspaceId) food.workspaceId = workspaceId;

    
    if (req.file) {
      console.log('New image uploaded:', req.file);  
      if (food.image) {
        deleteFiles([food.image]);  
      }
      food.image = `/uploads/${req.file.filename}`;  
    }

    await food.save();
    res.status(200).json({ message: 'Food item updated successfully', food });
  } catch (error) {
    console.error('Error updating food item:', error);
    res.status(500).json({ error: 'Failed to update food item' });
  }
});



router.patch('/:id/approve', authenticate, async (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;

  if (userRole !== 'superadmin') {
    return res.status(403).json({ error: 'Only superadmins can approve food items' });
  }

  try {
    const food = await Food.findById(id);
    if (!food) {
      return res.status(404).json({ error: 'Food item not found' });
    }

    food.isApproved = true;
    await food.save();

    res.status(200).json({ message: 'Food item approved successfully', food });
  } catch (error) {
    console.error('Error approving food item:', error);
    res.status(500).json({ error: 'Failed to approve food item' });
  }
});


router.patch('/:id/unapprove', authenticate, async (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;

  if (userRole !== 'superadmin') {
    return res.status(403).json({ error: 'Only superadmins can unapprove food items' });
  }

  try {
    const food = await Food.findById(id);
    if (!food) {
      return res.status(404).json({ error: 'Food item not found' });
    }

    food.isApproved = false;
    await food.save();

    res.status(200).json({ message: 'Food item unapproved successfully', food });
  } catch (error) {
    console.error('Error unapproving food item:', error);
    res.status(500).json({ error: 'Failed to unapprove food item' });
  }
});


router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const food = await Food.findById(id);
    if (!food) {
      return res.status(404).json({ error: 'Food item not found' });
    }

    if (food.image) {
      deleteFiles([food.image]);
    }

    await food.remove();

    res.status(200).json({ message: 'Food item deleted successfully' });
  } catch (error) {
    console.error('Error deleting food item:', error);
    res.status(500).json({ error: 'Failed to delete food item' });
  }
});

router.post(
  '/menu',
  authenticate,
  upload.single('image'),
  async (req, res) => {
    const { name } = req.body;

    if (!name || !req.file) {
      return res.status(400).json({ error: 'Menu name and image are required' });
    }

    try {
      const newMenu = new Menu({
        name,
        image: `/uploads/${req.file.filename}`,
      });

      await newMenu.save();
      res.status(201).json({ message: 'Menu created successfully', menu: newMenu });
    } catch (error) {
      console.error('Error creating menu:', error);
      res.status(500).json({ error: 'Failed to create menu' });
    }
  }
);


router.get('/menu', authenticate, async (req, res) => {
  try {
    const menus = await Menu.find();
    res.json({ menus });
  } catch (error) {
    console.error('Error fetching menus:', error);
    res.status(500).json({ error: 'Failed to retrieve menus' });
  }
});


router.patch(
  '/menu/:id',
  authenticate,
  upload.single('image'),
  async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    try {
      const menu = await Menu.findById(id);

      if (!menu) {
        return res.status(404).json({ error: 'Menu not found' });
      }

      if (req.file) {
     
        deleteFiles([menu.image]);
        menu.image = `/uploads/${req.file.filename}`;
      }

      if (name) {
        menu.name = name;
      }

      await menu.save();
      res.status(200).json({ message: 'Menu updated successfully', menu });
    } catch (error) {
      console.error('Error updating menu:', error);
      res.status(500).json({ error: 'Failed to update menu' });
    }
  }
);


router.delete('/menu/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const menu = await Menu.findById(id);

    if (!menu) {
      return res.status(404).json({ error: 'Menu not found' });
    }

  
    deleteFiles([menu.image]);


    await Food.deleteMany({ menu_id: id });
    await menu.remove();

    res.status(200).json({ message: 'Menu deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu:', error);
    res.status(500).json({ error: 'Failed to delete menu' });
  }
});

export default router;
