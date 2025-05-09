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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const MainSlider = mongoose.model('MainSlider', mainSliderSchema);
export default MainSlider;