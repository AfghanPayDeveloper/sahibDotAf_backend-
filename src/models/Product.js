import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory', required: true },
    productName: {type: String,},
    oldPrice: { type: Number },
    newPrice: { 
      type: Number, 
      // required: true,
      validate: {
        validator: function(value) {
          return this.oldPrice ? value < this.oldPrice : true;  
        },
        message: 'New price must be less than old price.',
      }
    },
      isActive: { 
    type: Boolean, 
    default: true 
  },
    description: {
      type: String,
      validate: {
        validator: function(value) {
          const stripped = value.replace(/<[^>]+>/g, '').trim();
          return stripped.length >= 2 && stripped.length <= 5000;
        },
        message: 'Description must contain between 20 and 5000 characters (after removing HTML tags)'
      }
    },
    mainImage: { type: String },
    viewCount: { type: Number, default: 0 },
    galleryImages: [{ type: String }],
    isApproved: { type: Boolean, default: false },
    status: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('Product', ProductSchema);
