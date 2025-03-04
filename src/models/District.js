

import mongoose from 'mongoose';

const districtSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    province_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Province',
      required: true,
    },
    country_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Country',
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const District = mongoose.model('District', districtSchema);
export default District;
