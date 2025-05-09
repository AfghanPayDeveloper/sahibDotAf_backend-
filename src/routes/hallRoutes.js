import express from 'express';
import multer from 'multer';
import { authenticateToken as authenticate, authorizeRole, optionalAuthenticate, } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs';
import { createHall, deleteHall, getHalls, updateHall, updateHallPUT, activateHall, deactivateHall } from '../controllers/hallController.js';
import { sanitizeDescription } from '../utils/sanitizer.js';

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

router.get('/', optionalAuthenticate, getHalls);

router.post(
  '/',
  authenticate,
  upload.fields([{ name: 'hallThumbnailImage', maxCount: 1 }, { name: 'hallImages', maxCount: 5 }]),
  sanitizeDescription,
  createHall
);

router.delete('/:id', authenticate, deleteHall);

router.patch('/:id', authenticate, upload.fields([
  { name: 'hallThumbnailImage', maxCount: 1 },
  { name: 'hallImages', maxCount: 10 },
]), updateHall);
router.patch('/:id/activate', authenticate, authorizeRole('superadmin'), activateHall);
router.patch('/:id/deactivate', authenticate, authorizeRole('superadmin'), deactivateHall);
router.put('/:id', authenticate,
  upload.fields([
    { name: 'hallThumbnailImage', maxCount: 1 },
    { name: 'hallImages', maxCount: 5 }
  ]), sanitizeDescription, updateHallPUT
);

export default router;
