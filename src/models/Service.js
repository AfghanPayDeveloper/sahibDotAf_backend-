import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema(
  {
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    serviceName: { type: String, required: true, trim: true, maxlength: 100 },
    serviceDescription: { 
      type: String,
      required: true 
    },
    serviceThumbnailImage: { 
      type: String, 
    //   validate: { 
    //     validator: (v) => /^https?:\/\/.+\.(jpg|jpeg|png|webp|svg)$/.test(v), 
    //     message: 'Invalid image URL' 
    //   } 
    },
    serviceImages: {
      type: [String],
    //   validate: {
    //     validator: (v) => v.every((img) => /^https?:\/\/.+\.(jpg|jpeg|png|webp|svg)$/.test(img)),
    //     message: 'All service images must have valid URLs',
    //   },
    },
    isApproved: { type: Boolean, default: false },
    status: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ServiceSchema.methods.approve = function () {
  this.isApproved = true;
  return this.save();
};

ServiceSchema.statics.findApproved = function () {
  return this.find({ isApproved: true });
};

export default mongoose.model('Service', ServiceSchema);
