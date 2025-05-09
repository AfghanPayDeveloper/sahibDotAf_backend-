import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    roomName: {
      type: String,
      required: true,
    },
    roomThumbnailImage: {
      type: String,
      required: true,
    },
    newPrice: {
      type: Number,
      // required: true,
    },
    isActive: { 
    type: Boolean, 
    default: true 
  },
  isApproved: { 
    type: Boolean, 
    default: false 
  },
    roomImages: [{ type: String }],
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
  },
  { timestamps: true }
);

const Room = mongoose.model('Room', roomSchema);
export default Room;
