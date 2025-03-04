import express from 'express';
import multer from 'multer';
import Room from '../models/Room.js';
import { authenticateToken as authenticate } from '../middleware/auth.js';
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



router.post('/', authenticate, upload.fields([
  { name: 'roomThumbnailImage', maxCount: 1 },
  { name: 'roomImages', maxCount: 10 },
]), async (req, res) => {
  try {
    const { roomName, description, workspaceId } = req.body;
    const roomThumbnailImage = req.files['roomThumbnailImage']?.[0]?.path.replace(process.cwd(), '');
    const roomImages = req.files['roomImages']?.map(file => file.path.replace(process.cwd(), ''));

    if (!roomName || !description || !workspaceId || !roomThumbnailImage) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const room = new Room({
      roomName,
      description,
      workspaceId,
      roomThumbnailImage,
      roomImages,
    });

    await room.save();
    res.status(201).json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create room' });
  }
});


router.get('/', authenticate, async (req, res) => {
  try {
    const rooms = await Room.find().populate('workspaceId');
    res.status(200).json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch rooms' });
  }
});


router.patch('/:id', authenticate, upload.fields([
  { name: 'roomThumbnailImage', maxCount: 1 },
  { name: 'roomImages', maxCount: 10 },
]), async (req, res) => {
  try {
    const { id } = req.params;
    const { roomName, description, workspaceId } = req.body;
    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (req.files['roomThumbnailImage']) {
      deleteFiles([room.roomThumbnailImage]);
      room.roomThumbnailImage = req.files['roomThumbnailImage'][0].path;
    }

    if (req.files['roomImages']) {
      deleteFiles(room.roomImages);
      room.roomImages = req.files['roomImages'].map(file => file.path);
    }

    room.roomName = roomName || room.roomName;
    room.description = description || room.description;
    room.workspaceId = workspaceId || room.workspaceId;

    await room.save();
    res.status(200).json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update room' });
  }
});


router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    deleteFiles([room.roomThumbnailImage, ...room.roomImages]);
    await Room.findByIdAndDelete(id);

    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete room' });
  }
});

export default router;
