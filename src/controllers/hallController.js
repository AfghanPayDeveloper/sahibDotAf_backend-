
import Hall from '../models/Hall.js';
import path from 'path';
import fs from 'fs';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import sendNotification from '../utils/sendNotification.js';


const deleteFiles = (files) => {
    files.forEach((file) => {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    });
};

export const getHalls = async (req, res) => {
    try {
        const { workspaceId, approved } = req.query;

        const query = { isDeleted: false };
        if (workspaceId) query.workspaceId = workspaceId;
        if (approved) query.isApproved = approved === 'true';

        const halls = await Hall.find(query);
        res.status(200).json({ success: true, data: halls });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch halls', error: error.message });
    }
}

export const createHall = async (req, res) => {
    const { workspaceId, hallName, description } = req.body;

    if (!workspaceId || !hallName) {
        return res.status(400).json({ error: 'Required fields are missing: workspaceId hallName, or description.' });
    }

    if (!req.files['hallThumbnailImage']) {
        return res.status(400).json({ error: 'Hall main image is required' });
    }

    try {
        const newHall = new Hall({
            workspaceId,
            hallName,
            description,
            hallThumbnailImage: `/uploads/${req.files['hallThumbnailImage'][0].filename}`,
            hallImages: req.files['hallImages'] ? req.files['hallImages'].map(file => `/uploads/${file.filename}`) : [],
            isApproved: false,
        });

        await newHall.save();

        const admin = await User.findOne({ role: "superadmin" });
        if (admin) {
            const notification = new Notification({
                to: admin._id,
                title: `Hall created`,
                content: `(${newHall.hallName}) Hall has been created by ${req.user.fullName}.`,
                from: req.user.id
            });
            await notification.save();

            sendNotification(admin._id, { ...notification.toJSON(), from: req.user });
        }
        res.status(201).json({ message: 'Hall created successfully, awaiting approval', hall: newHall });
    } catch (error) {
        console.error('Error creating hall:', error);
        res.status(500).json({ error: 'Failed to create hall' });
    }
}

export const updateHall = async (req, res) => {
    try {
        const { id } = req.params;
        const { hallName, description, workspaceId } = req.body;
        const hall = await Hall.findById(id);

        if (!hall) {
            return res.status(404).json({ message: 'Hall not found' });
        }

        if (req.files['hallThumbnailImage']) {
            deleteFiles([hall.hallThumbnailImage]);
            hall.hallThumbnailImage = req.files['hallThumbnailImage'][0].path;
        }

        if (req.files['hallImages']) {
            deleteFiles(hall.hallImages);
            hall.hallImages = req.files['hallImages'].map(file => file.path);
        }

        hall.hallName = hallName || hall.hallName;
        hall.description = description || hall.description;
        hall.workspaceId = workspaceId || hall.workspaceId;

        await hall.save();

        const admin = await User.findOne({ role: "superadmin" });
        if (admin) {
            const notification = new Notification({
                to: admin._id,
                title: `Hall updated`,
                content: `(${hall.hallName}) Hall has been updated by ${req.user.fullName}.`,
                from: req.user.id
            });
            await notification.save();

            sendNotification(admin._id, { ...notification.toJSON(), from: req.user });
        }

        res.status(200).json(hall);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update hall' });
    }
}

export const deleteHall = async (req, res) => {
    const { id } = req.params;
    const { workspaceId } = req.body;
    const userRole = req.user.role;

    try {
        let hall;
        if (userRole === 'superadmin') {
            hall = await Hall.findById(id).populate('workspaceId');
        } else {
            hall = await Hall.findOne({ _id: id, workspaceId }).populate('workspaceId');
        }

        if (!hall) {
            return res.status(404).json({ error: 'Hall not found or access denied' });
        }

        const filesToDelete = [hall.hallThumbnailImage, ...hall.hallImages].filter(Boolean);
        deleteFiles(filesToDelete);

        await hall.remove();

        if (userRole == 'superadmin') {
            if (hall.workspaceId) {
                const notification = new Notification({
                    to: hall.workspaceId.userId,
                    title: `Hall deleted`,
                    content: `(${hall.hallName}) Hall has been deleted by Sahib's Team.`,
                    from: req.user.id
                });
                await notification.save();

                sendNotification(hall.workspaceId.userId, {...notification.toJSON(), from: req.user});
            }
        } else {
            const admin = await User.findOne({ role: "superadmin" });
            if (admin) {
                const notification = new Notification({
                    to: admin._id,
                    title: `Hall deleted`,
                    content: `(${hall.hallName}) Hall has been deleted by ${req.user.fullName}.`,
                    from: req.user.id
                });
                await notification.save();

                sendNotification(admin._id, {...notification.toJSON(), from: req.user});
            }
        }


        res.status(200).json({ message: 'Hall deleted successfully' });
    } catch (error) {
        console.error('Error deleting hall:', error);
        res.status(500).json({ error: 'Failed to delete hall' });
    }
}

export const updateHallPUT = async (req, res) => {
    const { id } = req.params;
    const { workspaceId, hallName, description, deletedHallImages } = req.body;

    if (!workspaceId || !hallName) {
        return res.status(400).json({ error: 'Required fields are missing: workspaceId, hallName' });
    }

    try {
        const hall = await Hall.findById(id).populate('workspaceId');
        if (!hall) {
            return res.status(404).json({ error: 'Hall not found' });
        }

        if (req.files['hallThumbnailImage']) {
            const oldHallThumbnailImagePath = path.join(process.cwd(), hall.hallThumbnailImage);
            if (fs.existsSync(oldHallThumbnailImagePath)) {
                fs.unlinkSync(oldHallThumbnailImagePath);
            }
            hall.hallThumbnailImage = `/uploads/${req.files['hallThumbnailImage'][0].filename}`;
        }

        if (deletedHallImages && Array.isArray(deletedHallImages)) {
            deletedHallImages.forEach((imagePath) => {
                const oldImagePath = path.join(process.cwd(), imagePath);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            });
            hall.hallImages = hall.hallImages.filter((img) => !deletedHallImages.includes(img));
        }

        if (req.files['hallImages']) {
            const newHallImages = req.files['hallImages'].map(file => `/uploads/${file.filename}`);
            hall.hallImages = [...hall.hallImages, ...newHallImages];
        }

        hall.workspaceId = workspaceId;
        hall.hallName = hallName;
        hall.description = description;

        await hall.save();


        if (req.user.role == 'superadmin') {
            if (hall.workspaceId) {
                const notification = new Notification({
                    to: hall.workspaceId._id,
                    title: `Hall deleted`,
                    content: `(${hall.hallName}) Hall has been deleted by Sahib's Team.`,
                    from: req.user.id
                });
                await notification.save();

                sendNotification(hall.workspaceId._id, {...notification.toJSON(), from: req.user});
            }
        } else {
            const admin = await User.findOne({ role: "superadmin" });
            if (admin) {
                const notification = new Notification({
                    to: admin._id,
                    title: `Hall deleted`,
                    content: `(${hall.hallName}) Hall has been deleted by ${req.user.fullName}.`,
                    from: req.user.id
                });
                await notification.save();

                sendNotification(admin._id, {...notification.toJSON(), from: req.user});
            }
        }

        const admin = await User.findOne({ role: "superadmin" });
        if (admin) {
            const notification = new Notification({
                to: admin._id,
                title: `Hall updated`,
                content: `(${hall.hallName}) Hall has been updated by ${req.user.fullName}.`,
                from: req.user.id
            });
            await notification.save();

            sendNotification(admin._id, {...notification.toJSON(), from: req.user});
        }

        res.status(200).json({ message: 'Hall updated successfully', hall });
    } catch (error) {
        console.error('Error updating hall:', error);
        res.status(500).json({ error: 'Failed to update hall' });
    }
}