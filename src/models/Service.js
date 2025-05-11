import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema(
  {
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
    serviceName: { type: String, required: true, trim: true, maxlength: 100 },
    serviceDescription: { 
      type: String,
      validate: {
        validator: function(value) {
          const stripped = value.replace(/<[^>]+>/g, '').trim();
          return stripped.length >= 2 && stripped.length <= 5000;
        },
        message: 'Description must contain between 20 and 5000 characters (after removing HTML tags)'
      }
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

   isActive: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },
  viewCount: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
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
