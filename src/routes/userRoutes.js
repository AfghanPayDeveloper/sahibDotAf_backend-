import express from 'express';
import multer from 'multer';
import path from 'path';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import fs from 'fs';
import { fetchCountries, fetchProvinces, fetchDistricts } from '../controllers/locationController.js';

const rootDir = path.resolve();
const profileDir = path.join(rootDir, 'uploads', 'profiles');

if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profileDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });


router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userResponse = {
      ...user.toObject(),
      profileImageUrl: `http://localhost:8080/uploads/profiles/${user.profileImage}`,
    };

    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.get('/countries', fetchCountries);
router.get('/provinces/:countryId', fetchProvinces);
router.get('/districts/:provinceId', fetchDistricts);


router.get('/all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



router.put('/me', authenticateToken, upload.single('profileImage'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updates = {
      fullName: req.body.fullName || user.fullName,
      email: req.body.email || user.email,
      phone: req.body.phone || user.phone,
      address: req.body.address || user.address,
      city: req.body.city || user.city,
      whatsapp: req.body.whatsapp || user.whatsapp,
      zipCode: req.body.zipCode || user.zipCode,
      country_id: req.body.country_id || user.country_id,
      province_id: req.body.province_id || user.province_id,
      district_id: req.body.district_id || user.district_id,
    };

    if (req.file) {
      if (user.profileImage) {
        fs.unlinkSync(path.join(profileDir, user.profileImage));
      }
      updates.profileImage = req.file.filename;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, { new: true });

    res.json({
      ...updatedUser.toObject(),
      profileImageUrl: `http://localhost:8080/uploads/profiles/${updatedUser.profileImage}`,
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(path.join(profileDir, req.file.filename));
    }
    res.status(500).json({ message: error.message });
  }
});


router.put('/:id/activate', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isActive) {
      return res.status(400).json({ message: 'User is already active.' });
    }

    user.isActive = true;
    await user.save();

    res.json({ message: 'User has been activated successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.put('/:id/deactivate', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(400).json({ message: 'User is already inactive.' });
    }

    user.isActive = false;
    await user.save();

    res.json({ message: 'User has been deactivated successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



router.put('/:id/approve', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { isApproved } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isApproved = isApproved;
    await user.save();

    res.json({ message: `User has been ${isApproved ? 'approved' : 'disapproved'}.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.profileImage) {
      fs.unlinkSync(path.join(profileDir, user.profileImage));
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User has been deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
