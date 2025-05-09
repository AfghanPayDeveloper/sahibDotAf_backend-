import mongoose from 'mongoose';

const hallSchema = new mongoose.Schema(
  {
    hallName: {
      type: String,
      required: true,
    },
    hallThumbnailImage: {
      type: String,
      required: true,
    },
    hallImages: [{ type: String }],
    description: {
      type: String,
      validate: {
        validator: function(value) {
          const stripped = value.replace(/<[^>]+>/g, '').trim();
          return stripped.length >= 2 && stripped.length <= 5000;
        },
        message: 'Description must contain between 20 and 5000 characters (after removing HTML tags)'
      }
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    isActive: { 
    type: Boolean, 
    default: true 
  },
  isApproved: { 
    type: Boolean, 
    default: false 
  }
  },
  { timestamps: true }
);

const Hall = mongoose.model('Hall', hallSchema);
export default Hall;
