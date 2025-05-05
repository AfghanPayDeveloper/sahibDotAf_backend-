import express from 'express';
import WebsiteView from '../models/WebsiteView.js';
import Product from '../models/Product.js';

const router = express.Router();


router.post('/website', async (req, res) => {
    try {
        await WebsiteView.updateOne({}, { $inc: { count: 1 } }, { upsert: true });
        res.status(200).json({ message: 'Website view incremented' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update website views' });
    }
});


router.post('/product/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Product.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
        res.status(200).json({ message: 'Product view incremented' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update product views' });
    }
});


router.get('/website', async (req, res) => {
    try {
        const viewData = await WebsiteView.findOne({});
        const count = viewData?.count || 0; 
        res.status(200).json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve website views' });
    }
});

export default router;
