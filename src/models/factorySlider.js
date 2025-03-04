

import mongoose from 'mongoose';

const factorySliderSchema = new mongoose.Schema(
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

const FactorySlider = mongoose.model('FactorySlider', factorySliderSchema);
export default FactorySlider;
