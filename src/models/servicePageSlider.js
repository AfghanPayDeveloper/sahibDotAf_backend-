

import mongoose from 'mongoose';

const servicePageSliderSchema = new mongoose.Schema(
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

const ServicePageSlider= mongoose.model('ServicePageSlider', servicePageSliderSchema);
export default ServicePageSlider;
