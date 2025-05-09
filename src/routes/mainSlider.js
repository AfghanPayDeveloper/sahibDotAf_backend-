import express from 'express';
import multer from 'multer';
import {
  createSlider,
  deleteSlider,
  getSliders,
  toggleSliderStatus,
  updateSlider,
} from '../controllers/mainSliderController.js';
import { authenticateToken as authenticate, authorizeRole } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.get('/', getSliders);
router.post('/', authenticate, authorizeRole('admin'), upload.single('image'), createSlider);
router.put('/:id', authenticate, authorizeRole('admin'), upload.single('image'), updateSlider);
router.delete('/:id', authenticate, authorizeRole('admin'), deleteSlider);
router.patch('/:id/toggle-status', authenticate, authorizeRole('admin'), toggleSliderStatus);

export default router;