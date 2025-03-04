import mongoose from 'mongoose';

const websiteViewSchema = new mongoose.Schema({
    count: {
        type: Number,
        default: 0,
    },
});

const WebsiteView = mongoose.model('WebsiteView', websiteViewSchema);

export default WebsiteView; 
