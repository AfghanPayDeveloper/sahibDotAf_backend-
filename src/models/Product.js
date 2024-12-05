import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
    category: { type: String, required: true },
    subCategory: { type: String },
    productName: { type: String, required: true },
    oldPrice: { type: Number },
    newPrice: { 
      type: Number, 
      required: true,
      validate: {
        validator: function(value) {
          return this.oldPrice ? value < this.oldPrice : true;  
        },
        message: 'New price must be less than old price.',
      }
    },
    description: { type: String },
    mainImage: { type: String },
    galleryImages: [{ type: String }], 
    isApproved: { type: Boolean, default: false }, 
    createdAt: { type: Date, default: Date.now },
  }, 
  { timestamps: true } 
);

export default mongoose.model('Product', ProductSchema);
