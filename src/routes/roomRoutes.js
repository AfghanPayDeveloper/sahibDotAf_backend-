import express from 'express';
import multer from 'multer';
import { authenticateToken as authenticate, optionalAuthenticate } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs';
import { approveRoom, createRoom, deleteRoom, getAllRooms, unapproveRoom, updateRoom, updateRoomPUT } from '../controllers/roomControllers.js';
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

router.get('/', optionalAuthenticate, getAllRooms);

router.post(
  '/',
  authenticate,
  upload.fields([{ name: 'roomThumbnailImage', maxCount: 1 }, { name: 'roomImages', maxCount: 5 }]),
  sanitizeDescription,
  createRoom
);

router.patch('/:id', authenticate,
  upload.fields([
    { name: 'roomThumbnailImage', maxCount: 1 },
    { name: 'roomImages', maxCount: 10 },
  ]),
  updateRoom
);

router.delete('/:id', authenticate, deleteRoom);

router.put('/:id', authenticate,
  upload.fields([
    { name: 'roomThumbnailImage', maxCount: 1 },
    { name: 'roomImages', maxCount: 5 }
  ]),
  sanitizeDescription,
  updateRoomPUT
);


router.patch('/:roomId/approve', authenticate, approveRoom);

router.patch('/:roomId/unapprove', authenticate, unapproveRoom);


export default router;
