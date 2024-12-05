import express from 'express';
import multer from 'multer';
import Product from '../models/Product.js';
import { authenticateToken as authenticate } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const uploadsDir = path.join(process.cwd(), 'uploads');

// Ensure the upload directory exists
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
  limits: { fileSize: 10 * 1024 * 1024 }, // Max file size 10MB
});

// Helper to delete files from disk
const deleteFiles = (files) => {
  files.forEach((file) => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
};

// Create a new product
router.post(
  '/',
  authenticate, // Authenticate user
  upload.fields([{ name: 'mainImage', maxCount: 1 }, { name: 'galleryImages', maxCount: 5 }]), // File upload middleware
  async (req, res) => {
    const { category, subCategory, productName, oldPrice, newPrice, description } = req.body;
    const userId = req.user.id; // Correctly use `userId` from the decoded token

    // Validate required fields
    if (!category || !productName || !newPrice) {
      return res.status(400).json({ error: 'Required fields are missing: category, productName, or newPrice.' });
    }

    try {
      // Create a new product document
      const newProduct = new Product({
        userId, // Attach userId to the product
        category,
        subCategory,
        productName,
        oldPrice,
        newPrice,
        description,
        mainImage: req.files['mainImage'] ? `/uploads/${req.files['mainImage'][0].filename}` : null, // Handle main image
        galleryImages: req.files['galleryImages']
          ? req.files['galleryImages'].map((file) => `/uploads/${file.filename}`)
          : [], // Handle gallery images
        isApproved: false, // Initial approval status is false
      });

      // Save the product
      await newProduct.save();
      res.status(201).json({ message: 'Product created successfully, awaiting approval', product: newProduct });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
);


router.get('/', authenticate, async (req, res) => {
  const userRole = req.user.role; 
  const userId = req.user.id; 
  const showApproved = req.query.approved === 'true'; 

  try {
    let products;

  
    if (userRole === 'superadmin') {
      products = showApproved
        ? await Product.find({ isApproved: true })  
        : await Product.find();  
    } else {
     
      products = showApproved
        ? await Product.find({ userId, isApproved: true }) 
        : await Product.find({ userId });  
    }


    const updatedProducts = products.map((product) => ({
      ...product.toObject(), 
      status: product.isApproved ? 'approved' : 'pending', 
    }));

    res.json({ products: updatedProducts });
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
  const userId = req.user.id; 
  const userRole = req.user.role; 

  try {
    let product;

  
    if (userRole === 'superadmin') {
      product = await Product.findById(id);
    } else {
   
      product = await Product.findOne({ _id: id, userId });
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

export default router;
