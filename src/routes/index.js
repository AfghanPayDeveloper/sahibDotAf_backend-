import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './user.js';
import wholesalerRoutes from './wholesalerRoutes.js';
import productRoutes from './product.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/wholesaler', wholesalerRoutes);
router.use('/products', productRoutes);

export default router;