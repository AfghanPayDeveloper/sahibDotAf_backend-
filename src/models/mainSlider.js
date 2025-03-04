

import mongoose from 'mongoose';

const mainSliderSchema = new mongoose.Schema(
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

const MainSLider = mongoose.model('MainSlider', mainSliderSchema);
export default MainSLider;
