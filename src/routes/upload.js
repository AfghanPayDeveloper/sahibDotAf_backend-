
import express from 'express';
import upload from '../middleware/uploadMiddleware.js'; 
import { authenticateToken } from '../middleware/auth.js'; 

const router = express.Router();


router.post('/upload', upload.single('profileImage'), (req, res) => {

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }


    return res.status(200).json({ message: 'File uploaded successfully', file: req.file });
});

export default router;
