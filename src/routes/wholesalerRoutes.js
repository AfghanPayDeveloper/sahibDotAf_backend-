

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { authenticateToken as authenticate } from '../middleware/auth.js';
import { getWholesalerProfile, updateWholesalerProfile } from '../controllers/wholesalerController.js';
import { updateWholesalerValidator } from '../validators/wholesalerValidator.js';

dotenv.config();

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

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

router.use('/uploads', express.static(uploadsDir));


router.get('/me', authenticate, getWholesalerProfile);

router.put(
    '/me',
    authenticate,
    upload.fields([
        { name: 'profileImage', maxCount: 1 },
        { name: 'brandProfileImage', maxCount: 1 },
        { name: 'brandCertificate', maxCount: 1 },
        { name: 'images', maxCount: 10 }
    ]),
    updateWholesalerValidator,
    updateWholesalerProfile
);

export default router;
