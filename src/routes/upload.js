// Import necessary modules
import express from 'express';
import upload from '../middleware/uploadMiddleware.js'; // Make sure this path is correct
import { authenticateToken } from '../middleware/auth.js'; // Optional, if you need authentication

const router = express.Router();

// Define the '/upload' route for testing file upload
router.post('/upload', upload.single('profileImage'), (req, res) => {
    // Check if file is uploaded
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    // If file is uploaded successfully, send a response with the file information
    return res.status(200).json({ message: 'File uploaded successfully', file: req.file });
});

export default router;
