import express from 'express';
import multer from 'multer';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';
import { authenticateToken as authenticate, authorizeRole } from '../middleware/auth.js';
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
  upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'galleryImages', maxCount: 5 }]),
  async (req, res) => {
    const { workspaceId, categoryId, subcategoryId, productName, oldPrice, newPrice, description } = req.body;

    if (!workspaceId || !categoryId || !productName || !newPrice) {
      return res.status(400).json({ error: 'Required fields are missing: workspaceId, categoryId, productName, or newPrice.' });
    }

    if (!req.files['mainImage']) {
      return res.status(400).json({ error: 'Main image is required' });
    }

    try {
      const newProduct = new Product({
        workspaceId,
        categoryId,
        subcategoryId,
        productName,
        description,
        oldPrice,
        newPrice,
        mainImage: `/uploads/${req.files['mainImage'][0].filename}`,
        galleryImages: req.files['galleryImages'] ? req.files['galleryImages'].map(file => `/uploads/${file.filename}`) : [],
        isApproved: false,
      });

      await newProduct.save();
      res.status(201).json({ message: 'Product created successfully, awaiting approval', product: newProduct });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
);

router.get('/', authenticate, async (req, res) => {
  const { workspaceId, approved } = req.query; 
  const userRole = req.user.role;

  try {
    const filter = { workspaceId };
    if (userRole !== 'superadmin') {
      if (!workspaceId) {
        return res.status(400).json({ error: 'Workspace ID is required for non-superadmin users' });
      }
      filter.workspaceId = workspaceId;
    }
    if (approved === 'true') {
      filter.isApproved = true;
    }

    const products = await Product.find(filter);

    const formattedProducts = products.map((product) => ({
      ...product.toObject(),
      status: product.isApproved ? 'approved' : 'pending',
    }));

    res.json({ products: formattedProducts });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

router.patch('/:id/approve', authenticate, async (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;

  if (userRole !== 'superadmin') {
    return res.status(403).json({ error: 'Only superadmins can approve products' });
  }

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    product.isApproved = true;
    await product.save();

    res.status(200).json({ message: 'Product approved successfully', product });
  } catch (error) {
    console.error('Error approving product:', error);
    res.status(500).json({ error: 'Failed to approve product' });
  }
});

router.patch('/:id/unapprove', authenticate, async (req, res) => {
  const { id } = req.params;
  const userRole = req.user.role;

  if (userRole !== 'superadmin') {
    return res.status(403).json({ error: 'Only superadmins can unapprove products' });
  }

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    product.isApproved = false;
    await product.save();

    res.status(200).json({ message: 'Product unapproved successfully', product });
  } catch (error) {
    console.error('Error unapproving product:', error);
    res.status(500).json({ error: 'Failed to unapprove product' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { workspaceId } = req.body;
  const userRole = req.user.role;

  try {
    let product;

    if (userRole === 'superadmin') {
      product = await Product.findById(id);
    } else {
      product = await Product.findOne({ _id: id, workspaceId });
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found or access denied' });
    }

    const filesToDelete = [product.mainImage, ...product.galleryImages].filter(Boolean);
    deleteFiles(filesToDelete);

    await product.remove();

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

router.put('/:id', authenticate, upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'galleryImages', maxCount: 5 }]), async (req, res) => {
  const { id } = req.params;
  const { workspaceId, categoryId, subcategoryId, productName, oldPrice, newPrice, description, deletedGalleryImages } = req.body;

  if (!workspaceId || !categoryId || !productName || !newPrice) {
    return res.status(400).json({ error: 'Required fields are missing: workspaceId, categoryId, productName, or newPrice.' });
  }

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

   
    if (req.files['mainImage']) {
      const oldMainImagePath = path.join(process.cwd(), product.mainImage);
      if (fs.existsSync(oldMainImagePath)) {
        fs.unlinkSync(oldMainImagePath);
      }
      product.mainImage = `/uploads/${req.files['mainImage'][0].filename}`;
    }

  
    if (deletedGalleryImages && Array.isArray(deletedGalleryImages)) {
      deletedGalleryImages.forEach((imagePath) => {
        const oldImagePath = path.join(process.cwd(), imagePath);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      });
      product.galleryImages = product.galleryImages.filter((img) => !deletedGalleryImages.includes(img));
    }


    if (req.files['galleryImages']) {
      const newGalleryImages = req.files['galleryImages'].map(file => `/uploads/${file.filename}`);
      product.galleryImages = [...product.galleryImages, ...newGalleryImages];
    }


    product.workspaceId = workspaceId;
    product.categoryId = categoryId;
    product.subcategoryId = subcategoryId;
    product.productName = productName;
    product.oldPrice = oldPrice;
    product.newPrice = newPrice;
    product.description = description;

    await product.save();

    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});


router.post('/category', authenticate, async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    const newCategory = new Category({ name });
    await newCategory.save();

    res.status(201).json({ message: 'Category created successfully', category: newCategory });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.get('/category', authenticate, async (req, res) => {
  try {
    const categories = await Category.find();
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});

router.post('/subcategory', authenticate, async (req, res) => {
  const { name, categoryId } = req.body;

  if (!name || !categoryId) {
    return res.status(400).json({ error: 'SubCategory name and categoryId are required' });
  }

  try {
    const newSubCategory = new SubCategory({ name, categoryId });
    await newSubCategory.save();

    res.status(201).json({ message: 'SubCategory created successfully', subcategory: newSubCategory });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    res.status(500).json({ error: 'Failed to create subcategory' });
  }
});

router.get('/subcategory', authenticate, async (req, res) => {
  const { categoryId } = req.query;

  try {
    const filter = categoryId ? { categoryId } : {};
    const subcategories = await SubCategory.find(filter);

    res.json({ subcategories });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ error: 'Failed to retrieve subcategories' });
  }
});



router.get('/all', authenticate, authorizeRole('superadmin'), async (req, res) => {
  try {
    const products = await Product.find(); 
    const formattedProducts = products.map((product) => ({
      ...product.toObject(),
      status: product.isApproved ? 'approved' : 'pending',
    }));

    res.json({ products: formattedProducts });
  } catch (error) {
    console.error('Error fetching all products:', error);
    res.status(500).json({ error: 'Failed to retrieve all products' });
  }
});


router.patch('/:id/activate', authenticate, authorizeRole('superadmin'), async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    product.isActive = true;  
    await product.save();

    res.status(200).json({ message: 'Product activated successfully', product });
  } catch (error) {
    console.error('Error activating product:', error);
    res.status(500).json({ error: 'Failed to activate product' });
  }
});


router.patch('/:id/approve', authenticate, authorizeRole('superadmin'), async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    product.isApproved = true;  
    await product.save();

    res.status(200).json({ message: 'Product approved successfully', product });
  } catch (error) {
    console.error('Error approving product:', error);
    res.status(500).json({ error: 'Failed to approve product' });
  }
});


router.delete('/:id', authenticate, authorizeRole('superadmin'), async (req, res) => {
  const { id } = req.params;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const filesToDelete = [product.mainImage, ...product.galleryImages].filter(Boolean);
    deleteFiles(filesToDelete);

    await product.remove();

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});


export default router;
