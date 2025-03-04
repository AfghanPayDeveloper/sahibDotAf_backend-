import express from 'express';
import WebsiteView from '../models/WebsiteView.js';
import Product from '../models/Product.js';

const router = express.Router();

// Route to increment website view count
router.post('/views/website', async (req, res) => {
    try {
        // Increment website view count, upsert to create if not exists
        await WebsiteView.updateOne({}, { $inc: { count: 1 } }, { upsert: true });
        res.status(200).json({ message: 'Website view incremented' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update website views' });
    }
});

// Route to increment product view count
router.post('/views/product/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Increment product view count
        await Product.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
        res.status(200).json({ message: 'Product view incremented' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update product views' });
    }
});

// Route to get the current website view count
router.get('/views/website', async (req, res) => {
    try {
        // Retrieve the current website view count
        const viewData = await WebsiteView.findOne({});
        const count = viewData?.count || 0; // If no data exists, default to 0
        res.status(200).json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve website views' });
    }
});

export default router;
