import express from 'express';
import multer from 'multer';
import { authenticateToken as authenticate } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs';
import { createRoom, deleteRoom, getAllRooms, updateRoom, updateRoomPUT } from '../controllers/roomControllers.js';

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

router.get('/', authenticate, getAllRooms);

router.post(
  '/',
  authenticate,
  upload.fields([{ name: 'roomThumbnailImage', maxCount: 1 }, { name: 'roomImages', maxCount: 5 }]),
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
  updateRoomPUT
);



export default router;
