

import mongoose from 'mongoose';

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
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
    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
      required: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    isActive: { 
    type: Boolean, 
    default: true 
  },
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Food = mongoose.model('Food', foodSchema);
export default Food;
