import express from 'express';
import multer from 'multer';
import Hall from '../models/Hall.js';
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
  upload.fields([{ name: 'hallThumbnailImage', maxCount: 1 }, { name: 'hallImages', maxCount: 5 }]),
  async (req, res) => {
    const { workspaceId,  hallName, description } = req.body;

    if (!workspaceId || !hallName ) {
      return res.status(400).json({ error: 'Required fields are missing: workspaceId hallName, or description.' });
    }

    if (!req.files['hallThumbnailImage']) {
      return res.status(400).json({ error: 'Hall main image is required' });
    }

    try {
      const newHall = new Hall({
        workspaceId,
        hallName,
        description,
        hallThumbnailImage: `/uploads/${req.files['hallThumbnailImage'][0].filename}`,
        hallImages: req.files['hallImages'] ? req.files['hallImages'].map(file => `/uploads/${file.filename}`) : [],
        isApproved: false,
      });

      await newHall.save();
      res.status(201).json({ message: 'Hall created successfully, awaiting approval', hall: newHall });
    } catch (error) {
      console.error('Error creating hall:', error);
      res.status(500).json({ error: 'Failed to create hall' });
    }
  }
);




router.get('/', authenticate, async (req, res) => {
  try {
    const { workspaceId, approved } = req.query;

    const query = { isDeleted: false };
    if (workspaceId) query.workspaceId = workspaceId;
    if (approved) query.isApproved = approved === 'true';

    const halls = await Hall.find(query);
    res.status(200).json({ success: true, data: halls });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch halls', error: error.message });
  }
});

router.patch('/:id', authenticate, upload.fields([
  { name: 'hallThumbnailImage', maxCount: 1 },
  { name: 'hallImages', maxCount: 10 },
]), async (req, res) => {
  try {
    const { id } = req.params;
    const { hallName, description, workspaceId } = req.body;
    const hall = await Hall.findById(id);

    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }

    if (req.files['hallThumbnailImage']) {
      deleteFiles([hall.hallThumbnailImage]);
      hall.hallThumbnailImage = req.files['hallThumbnailImage'][0].path;
    }

    if (req.files['hallImages']) {
      deleteFiles(hall.hallImages);
      hall.hallImages = req.files['hallImages'].map(file => file.path);
    }

    hall.hallName = hallName || hall.hallName;
    hall.description = description || hall.description;
    hall.workspaceId = workspaceId || hall.workspaceId;

    await hall.save();
    res.status(200).json(hall);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update hall' });
  }
});


router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { workspaceId } = req.body;
  const userRole = req.user.role;

  try {
    let hall;
    if (userRole === 'superadmin') {
      hall = await Hall.findById(id); 
    } else {
      hall = await Hall.findOne({ _id: id, workspaceId }); 
    }

    if (!hall) {
      return res.status(404).json({ error: 'Hall not found or access denied' });
    }


    const filesToDelete = [hall.hallThumbnailImage, ...hall.hallImages].filter(Boolean);
    deleteFiles(filesToDelete);

    await hall.remove();

    res.status(200).json({ message: 'Hall deleted successfully' });
  } catch (error) {
    console.error('Error deleting hall:', error);
    res.status(500).json({ error: 'Failed to delete hall' });
  }
});


router.put('/:id', authenticate, upload.fields([{ name: 'hallThumbnailImage', maxCount: 1 }, { name: 'hallImages', maxCount: 5 }]), async (req, res) => {
  const { id } = req.params;
  const { workspaceId, hallName,  description, deletedHallImages } = req.body;

  if (!workspaceId ||  !hallName ) {
    return res.status(400).json({ error: 'Required fields are missing: workspaceId, hallName' });
  }

  try {
    const hall = await Hall.findById(id);
    if (!hall) {
      return res.status(404).json({ error: 'Hall not found' });
    }

   
    if (req.files['hallThumbnailImage']) {
      const oldHallThumbnailImagePath = path.join(process.cwd(), hall.hallThumbnailImage);
      if (fs.existsSync(oldHallThumbnailImagePath)) {
        fs.unlinkSync(oldHallThumbnailImagePath);
      }
      hall.hallThumbnailImage = `/uploads/${req.files['hallThumbnailImage'][0].filename}`;
    }

  
    if (deletedHallImages && Array.isArray(deletedHallImages)) {
      deletedHallImages.forEach((imagePath) => {
        const oldImagePath = path.join(process.cwd(), imagePath);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      });
      hall.hallImages = hall.hallImages.filter((img) => !deletedHallImages.includes(img));
    }


    if (req.files['hallImages']) {
      const newHallImages = req.files['hallImages'].map(file => `/uploads/${file.filename}`);
      hall.hallImages = [...hall.hallImages, ...newHallImages];
    }


    hall.workspaceId = workspaceId;

    hall.hallName = hallName;

    hall.description = description;

    await hall.save();

    res.status(200).json({ message: 'hall updated successfully', hall });
  } catch (error) {
    console.error('Error updating hall:', error);
    res.status(500).json({ error: 'Failed to update hall' });
  }
});



export default router;
