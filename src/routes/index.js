import express from 'express';
import path from 'path'; 
import authRoutes from './authRoutes.js';
import userRoutes from './user.js';
import wholesalerRoutes from './wholesalerRoutes.js';
import storeRoutes from './storeRoutes.js';
import productRoutes from './product.js';
import locationRoutes from './locationRoute.js';
import workspaceRoutes from './workspace.js';
import foodRoutes from './food.js';
import serviceRoutes from './serviceRoutes.js';
import roomRoutes from './roomRoutes.js';
import hallRoutes from './hallRoutes.js';
import viewRoutes from './viewRoutes.js';
import mainSLiderRoutes from '../routes/mainSliderRoutes.js';
import notificationRouter from './notificationRoutes.js';
// import messageRoutes from './messageRoutes.js';

const router = express.Router();


router.use('/auth', authRoutes);

router.use('/user', userRoutes);
router.use('/wholesaler', wholesalerRoutes);
router.use('/store', storeRoutes);
router.use('/products', productRoutes);
router.use('/food', foodRoutes);
router.use('/location', locationRoutes);
router.use('/workspace', workspaceRoutes);
router.use('/service', serviceRoutes);
router.use('/room', roomRoutes);
router.use('/hall', hallRoutes);
router.use('/', viewRoutes);
router.use('/', mainSLiderRoutes);
// router.use('/messages', messageRoutes);
router.use('/notifications', notificationRouter);

router.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

export default router;
