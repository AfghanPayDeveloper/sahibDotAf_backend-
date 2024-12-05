import User from '../models/User.js';
import WholesalerService from '../services/wholesalerService.js';
import { validationResult } from 'express-validator';

export const getWholesalerProfile = async (req, res) => {
    console.log('User ID from token:', req.user.id); 

    try {
        const wholesaler = await WholesalerService.getProfile(req.user.id); 
        if (!wholesaler) {
            return res.status(404).json({ error: 'Wholesaler profile not found' });
        }
        res.json(wholesaler);
    } catch (error) {
        console.error('Error fetching wholesaler profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateWholesalerProfile = async (req, res) => {
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
        const updatedWholesaler = await WholesalerService.updateProfile(req.user.id, body, files, imagesToRemove);  
        if (!updatedWholesaler) {
            return res.status(404).json({ error: 'Wholesaler profile not found' });
        }

        console.log('Updated wholesaler and brand profile:', updatedWholesaler);
        res.json(updatedWholesaler);
    } catch (error) {
        console.error('Error updating wholesaler and brand profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getAllWholesalers = async (req, res) => {
    try {
        const wholesalers = await User.find({ role: 'seller', category: 'wholesaler' }, '-password');
        res.status(200).json(wholesalers);
    } catch (error) {
        console.error('Error fetching wholesalers:', error);
        res.status(500).json({ error: 'An error occurred while fetching wholesalers.' });
    }
};
