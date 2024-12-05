import storeService from '../services/storeService.js';
import { validationResult } from 'express-validator';

export const getstoreProfile = async (req, res) => {
    console.log('User ID from token:', req.user.id); 

    try {
        const store = await storeService.getProfile(req.user.id); 
        if (!store) {
            return res.status(404).json({ error: 'store profile not found' });
        }
        res.json(store);
    } catch (error) {
        console.error('Error fetching wholesaler profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updatestoreProfile = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { body, files } = req;
    let { imagesToRemove } = body;

    if (imagesToRemove && typeof imagesToRemove === 'string') {
        try {
            imagesToRemove = JSON.parse(imagesToRemove);  
        } catch (error) {
            console.error('Error parsing imagesToRemove:', error);
            imagesToRemove = [];
        }
    }

    console.log('Received data to update:', body);
    console.log('Received certificate file:', files['brandCertificate']);
    console.log('Received brand images:', files['images']);
    console.log('Images to remove:', imagesToRemove); 

    try {
        const updatedstore = await storeService.updateProfile(req.user.id, body, files, imagesToRemove);  
        if (!updatedstore) {
            return res.status(404).json({ error: 'store profile not found' });
        }

        console.log('Updated store and brand profile:', updatedstore);
        res.json(updatedstore);
    } catch (error) {
        console.error('Error updating store and brand profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
