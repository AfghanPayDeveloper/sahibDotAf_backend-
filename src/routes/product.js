
import express from 'express';
import multer from 'multer';
import Product from '../models/Product.js';
import { authenticateToken as authenticate } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post(
  '/',
  authenticate,
  upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'galleryImages', maxCount: 5 }]),
  async (req, res) => {
    const { category, subCategory, productName, oldPrice, newPrice, description } = req.body;
    const userId = req.userId; 

    try {
      const newProduct = new Product({
        userId, 
        category,
        subCategory,
        productName,
        oldPrice,
        newPrice,
        description,
        mainImage: req.files['mainImage'] ? `/uploads/${req.files['mainImage'][0].filename}` : null,
        galleryImages: req.files['galleryImages']
          ? req.files['galleryImages'].map(file => `/uploads/${file.filename}`)
          : [],
      });

      await newProduct.save();
      res.status(201).json({ message: 'Product created successfully!', product: newProduct });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
);

router.get('/', authenticate, async (req, res) => {
    try {
      const products = await Product.find({ userId: req.userId });
      res.json({ products });
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve products' });
    }
  });

  router.delete('/:id', authenticate, async (req, res) => {
    const { id } = req.params;
  
    try {
      const deletedProduct = await Product.findOneAndDelete({ _id: id, userId: req.userId }); 
  
      if (!deletedProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });
  

export default router;
