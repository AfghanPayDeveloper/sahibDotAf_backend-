import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);




const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log(token);

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        req.user = user;
        next();
    });
};


const authorizeRole = (role) => (req, res, next) => {
    if (req.user.role !== role && req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Access denied: Insufficient permissions' });
    }
    next();
};

router.use('/uploads', express.static(path.join(__dirname, '../uploads')));


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, `${Date.now()}-${sanitizedFilename}`);
    },
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
});


router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const profileImage = user.profileImage ? user.profileImage : null;

        res.json({
            ...user._doc,
            profileImage,
        });
    } catch (error) {
        console.error('Error retrieving user details:', error);
        res.status(500).json({ error: error.message });
    }
});


router.put('/me', authenticateToken, upload.single('profileImage'), async (req, res) => {
    try {
        const updateData = { ...req.body };

        if (req.file) {
            updateData.profileImage = `/uploads/${req.file.filename}`;
        }

        if (req.body.password) {
            updateData.password = await bcrypt.hash(req.body.password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'User details updated successfully',
            user: updatedUser,
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: error.message });
    }
});


router.post('/create', authenticateToken, authorizeRole('superadmin'), async (req, res) => {
    const { fullName, email, password, role } = req.body;

    if (role !== 'admin' && role !== 'superadmin') {
        return res.status(400).json({ error: 'Role must be either admin or superadmin' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = new User({
            fullName,
            email,
            password: hashedPassword,
            role,
        });

        await newAdmin.save();
        res.status(201).json({ message: 'Admin created successfully', user: newAdmin });
    } catch (error) {
        if (error.message.includes('duplicate key error')) {
            res.status(409).json({ error: 'Email is already registered' });
        } else {
            res.status(500).json({ error: 'An error occurred while creating admin' });
        }
    }
});


router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    console.log('Delete request received for user ID:', req.params.id); // Debug log

    try {
        // Check if the user exists
        const user = await User.findById(req.params.id);
        if (!user) {
            console.error('User not found for ID:', req.params.id); // Debug log
            return res.status(404).json({ error: 'User not found' });
        }

        // Proceed to delete the user
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error.message); // Debug log
        res.status(500).json({ error: error.message });
    }
});



router.put('/:id/deactivate', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ message: 'User deactivated successfully', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



router.put('/:id/activate', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive: true },
            { new: true }
        );

        if (!user) {
            console.error('User not found for ID:', req.params.id); // Debug log
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            message: 'User activated successfully',
            user
        });
    } catch (error) {
        console.error('Error activating user:', error.message); 
        res.status(500).json({ error: 'An error occurred while activating the user' });
    }
});


router.get('/all', authenticateToken, authorizeRole('superadmin'), async (req, res) => {
    try {
        console.log('User ID from token (inside /all):', req.user.id);


        const users = await User.find({ role: { $ne: 'superadmin' } });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

  
  router.use((req, res, next) => {
    console.log('Before authenticateToken, req.user:', req.user);
    next();
  });

  router.use(authenticateToken, (req, res, next) => {
    console.log('After authenticateToken, req.user:', req.user);
    next();
  });

  router.get('/test', authenticateToken, (req, res) => {
    console.log('User from token:', req.user);
    res.status(200).json({ user: req.user });
});



export default router;
