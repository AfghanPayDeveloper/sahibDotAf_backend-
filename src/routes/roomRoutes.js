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



router.post(
  '/',
  authenticate,
  upload.fields([{ name: 'roomThumbnailImage', maxCount: 1 }, { name: 'roomImages', maxCount: 5 }]),
  async (req, res) => {
    const { workspaceId,  roomName, description } = req.body;

    if (!workspaceId || !roomName ) {
      return res.status(400).json({ error: 'Required fields are missing: workspaceId roomName, or description.' });
    }

    if (!req.files['roomThumbnailImage']) {
      return res.status(400).json({ error: 'Room main image is required' });
    }

    try {
      const newRoom = new Room({
        workspaceId,
        roomName,
        description,
        roomThumbnailImage: `/uploads/${req.files['roomThumbnailImage'][0].filename}`,
        roomImages: req.files['roomImages'] ? req.files['roomImages'].map(file => `/uploads/${file.filename}`) : [],
        isApproved: false,
      });

      await newRoom.save();
      res.status(201).json({ message: 'Room created successfully, awaiting approval', room: newRoom });
    } catch (error) {
      console.error('Error creating room:', error);
      res.status(500).json({ error: 'Failed to create room' });
    }
  }
);




router.get('/', authenticate, async (req, res) => {
  try {
    const { workspaceId, approved } = req.query;

    const query = { isDeleted: false };
    if (workspaceId) query.workspaceId = workspaceId;
    if (approved) query.isApproved = approved === 'true';

    const rooms = await Room.find(query);
    res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch rooms', error: error.message });
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
  const { id } = req.params;
  const { workspaceId } = req.body;
  const userRole = req.user.role;

  try {
    let room;
    if (userRole === 'superadmin') {
      room = await Room.findById(id); 
    } else {
      room = await Room.findOne({ _id: id, workspaceId }); 
    }

    if (!room) {
      return res.status(404).json({ error: 'Room not found or access denied' });
    }


    const filesToDelete = [room.roomThumbnailImage, ...room.roomImages].filter(Boolean);
    deleteFiles(filesToDelete);

    await room.remove();

    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});


router.put('/:id', authenticate, upload.fields([{ name: 'roomThumbnailImage', maxCount: 1 }, { name: 'roomImages', maxCount: 5 }]), async (req, res) => {
  const { id } = req.params;
  const { workspaceId, roomName,  description, deletedRoomImages } = req.body;

  if (!workspaceId ||  !roomName ) {
    return res.status(400).json({ error: 'Required fields are missing: workspaceId, roomName' });
  }

  try {
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

   
    if (req.files['roomThumbnailImage']) {
      const oldRoomThumbnailImagePath = path.join(process.cwd(), room.roomThumbnailImage);
      if (fs.existsSync(oldRoomThumbnailImagePath)) {
        fs.unlinkSync(oldRoomThumbnailImagePath);
      }
      room.roomThumbnailImage = `/uploads/${req.files['roomThumbnailImage'][0].filename}`;
    }

  
    if (deletedRoomImages && Array.isArray(deletedRoomImages)) {
      deletedRoomImages.forEach((imagePath) => {
        const oldImagePath = path.join(process.cwd(), imagePath);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      });
      room.roomImages = room.roomImages.filter((img) => !deletedRoomImages.includes(img));
    }


    if (req.files['roomImages']) {
      const newRoomImages = req.files['roomImages'].map(file => `/uploads/${file.filename}`);
      room.roomImages = [...room.roomImages, ...newRoomImages];
    }


    room.workspaceId = workspaceId;

    room.roomName = roomName;

    room.description = description;

    await room.save();

    res.status(200).json({ message: 'room updated successfully', room });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});



export default router;
