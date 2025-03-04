

import mongoose from 'mongoose';

const restaurantSliderSchema = new mongoose.Schema(
  {
    imageName: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const RestaurantSlider = mongoose.model('RestaurantSlider', restaurantSliderSchema);
export default RestaurantSlider;
