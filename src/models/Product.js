
import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  category: { type: String, required: true },
  subCategory: { type: String },
  productName: { type: String, required: true },
  oldPrice: { type: Number },
  newPrice: { type: Number, required: true },
  description: { type: String },
  mainImage: { type: String },
  galleryImages: [{ type: String }], 
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Product', ProductSchema);
