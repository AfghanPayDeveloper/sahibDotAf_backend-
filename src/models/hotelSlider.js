

import mongoose from 'mongoose';

const hotelSliderSchema = new mongoose.Schema(
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

const HotelSLider = mongoose.model('HotelSlider', hotelSliderSchema);
export default HotelSLider;
