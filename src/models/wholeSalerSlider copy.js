

import mongoose from 'mongoose';

const wholeSalerSliderSchema = new mongoose.Schema(
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

const WholeSalerSLider = mongoose.model('WholeSalerSlider', wholeSalerSliderSchema);
export default WholeSalerSLider;
