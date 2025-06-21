import Room from '../models/Room.js';
import path from 'path';
import fs from 'fs';
import sendNotification from '../utils/sendNotification.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';


const deleteFiles = (files) => {
    files.forEach((file) => {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    });
};

export const createRoom = async (req, res) => {
    const { workspaceId, roomName, description, newPrice } = req.body;

    if (!workspaceId || !roomName || !newPrice) {
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
            newPrice
        });

        await newRoom.save();
        const admin = await User.findOne({ role: "superadmin" });
        if (admin) {
            const notification = new Notification({
                to: admin._id,
                title: `Room Added`,
                content: `${req.user.fullName} Added (${newRoom.roomName}) Room.`, from: req.user.id
            });
            await notification.save();

            sendNotification(admin._id, {...notification.toJSON(), from: req.user});
        }
        res.status(201).json({ message: 'Room created successfully, awaiting approval', room: newRoom });
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ error: 'Failed to create room' });
    }
}

export const getAllRooms = async (req, res) => {
  try {
    const { workspaceId, approved, search, page = 1, limit = 10 } = req.query;

    const query = { isDeleted: false };
    if (workspaceId) query.workspaceId = workspaceId;
    if (approved) query.isApproved = approved === 'true';
    if (search) {
      query.roomName = { $regex: search, $options: 'i' }; // case-insensitive partial match
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Room.countDocuments(query);
    const rooms = await Room.find(query)
      .populate('workspaceId', 'name') // if needed
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: rooms,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch rooms', error: error.message });
  }
};

export const updateRoom = async (req, res) => {
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

        const admin = await User.findOne({ role: "superadmin" });
        if (admin) {
            const notification = new Notification({
                to: admin._id,
                title: `Room Updated`,
                content: `(${room.roomName}) Room has been Updated by ${req.user.fullName}.`,
                from: req.user.id
            });
            await notification.save();

            sendNotification(admin._id, {...notification.toJSON(), from: req.user});
        }
        res.status(200).json(room);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update room' });
    }
}

export const deleteRoom = async (req, res) => {
    const { id } = req.params;
    const { workspaceId } = req.body;
    const userRole = req.user.role;

    try {
        let room;
        if (userRole === 'superadmin') {
            room = await Room.findById(id).populate('workspaceId');
        } else {
            room = await Room.findOne({ _id: id, workspaceId }).populate('workspaceId');
        }

        if (!room) {
            return res.status(404).json({ error: 'Room not found or access denied' });
        }

        const filesToDelete = [room.roomThumbnailImage, ...room.roomImages].filter(Boolean);
        deleteFiles(filesToDelete);

        await room.remove();

        if (req.user.role == 'superadmin') {
            if (room.workspaceId) {
                const notification = new Notification({
                    to: room.workspaceId.userId,
                    title: `Room deleted`,
                    content: `(${room.roomName}) Room has been deleted by Sahib's Team.`,
                    from: req.user.id
                });
                await notification.save();

                sendNotification(room.workspaceId.userId, {...notification.toJSON(), from: req.user});
            }
        } else {
            const admin = await User.findOne({ role: "superadmin" });
            if (admin) {
                const notification = new Notification({
                    to: admin._id,
                    title: `Room deleted`,
                    content: `(${room.roomName}) Room has been deleted by ${req.user.fullName}.`,
                    from: req.user.id
                });
                await notification.save();

                sendNotification(admin._id, {...notification.toJSON(), from: req.user});
            }
        }

        res.status(200).json({ message: 'Room deleted successfully' });
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ error: 'Failed to delete room' });
    }
}

export const updateRoomPUT = async (req, res) => {
    const { id } = req.params;
    const { workspaceId, roomName, description, deletedRoomImages } = req.body;

    if (!workspaceId || !roomName) {
        return res.status(400).json({ error: 'Required fields are missing: workspaceId, roomName' });
    }

    try {
        const room = await Room.findById(id).populate('workspaceId');
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

        let toUserId = room.workspaceId.userId?.toString();
        room.workspaceId = workspaceId;

        room.roomName = roomName;

        room.description = description;

        await room.save();

        if (req.user.role == 'superadmin') {
            if (room.workspaceId) {
                const notification = new Notification({
                    to: toUserId,
                    title: `Room Updated`,
                    content: `(${room.roomName}) Room has been Updated by Sahib's Team.`,
                    from: req.user.id
                });
                await notification.save();

                sendNotification(toUserId, {...notification.toJSON(), from: req.user});
            }
        } else {
            const admin = await User.findOne({ role: "superadmin" });
            if (admin) {
                const notification = new Notification({
                    to: admin._id,
                    title: `Room Updated`,
                    content: `(${room.roomName}) Room has been Updated by ${req.user.fullName}.`,
                    from: req.user.id
                });
                await notification.save();

                sendNotification(admin._id, {...notification.toJSON(), from: req.user});
            }
        }

        res.status(200).json({ message: 'room updated successfully', room });
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({ error: 'Failed to update room' });
    }
}

export const approveRoom = async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await Room.findById(roomId).populate('workspaceId');
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    room.isApproved = true;
    await room.save();

    // Notify room owner
    const toUserId = room.workspaceId.userId?.toString();
    const notification = new Notification({
      to: toUserId,
      title: "Room Approved",
      content: `Your room "${room.roomName}" has been approved.`,
      from: req.user.id
    });
    await notification.save();
    sendNotification(toUserId, { ...notification.toJSON(), from: req.user });

    res.status(200).json({ message: "Room approved successfully", room });
  } catch (error) {
    console.error("Error approving room:", error);
    res.status(500).json({ error: "Failed to approve room" });
  }
};

export const unapproveRoom = async (req, res) => {
  const { roomId } = req.params;

  try {
    const room = await Room.findById(roomId).populate('workspaceId');
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    room.isApproved = false;
    await room.save();

    // Notify room owner
    const toUserId = room.workspaceId.userId?.toString();
    const notification = new Notification({
      to: toUserId,
      title: "Room Unapproved",
      content: `Your room "${room.roomName}" has been unapproved.`,
      from: req.user.id
    });
    await notification.save();
    sendNotification(toUserId, { ...notification.toJSON(), from: req.user });

    res.status(200).json({ message: "Room unapproved successfully", room });
  } catch (error) {
    console.error("Error unapproving room:", error);
    res.status(500).json({ error: "Failed to unapprove room" });
  }
};
