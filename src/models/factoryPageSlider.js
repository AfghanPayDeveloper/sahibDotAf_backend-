

import mongoose from 'mongoose';

const factoryPageSlderSchema = new mongoose.Schema(
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

const FactoryPageSlider = mongoose.model('FactoryPageSlider ', factoryPageSlderSchema);
export default FactoryPageSlider ;
