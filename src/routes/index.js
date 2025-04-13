import express from 'express';
import path from 'path'; 
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import productRoutes from './productRoutes.js';
import locationRoutes from './locationRoutes.js';
import workspaceRoutes from './workspaceRoutes.js';
import foodRoutes from './foodRoutes.js';
import serviceRoutes from './serviceRoutes.js';
import roomRoutes from './roomRoutes.js';
import hallRoutes from './hallRoutes.js';
import viewRoutes from './viewRoutes.js';
import mainSLiderRoutes from './mainSliderRoutes.js';
import notificationRouter from './notificationRoutes.js';
// import messageRoutes from './messageRoutes.js';

const router = express.Router();


router.use('/auth', authRoutes);

router.use('/user', userRoutes);
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
