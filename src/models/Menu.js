

import mongoose from 'mongoose';

const menuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    isActive: { 
    type: Boolean, 
    default: true 
  },

  },
  { timestamps: true }
);

const Menu = mongoose.model('Menu', menuSchema);
export default Menu;
