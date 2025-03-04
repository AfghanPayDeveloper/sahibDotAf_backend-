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
    roomImages: [{ type: String }],
    description: {
      type: String,
      required: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkSpace',
      required: true,
    },
  },
  { timestamps: true }
);

const Room = mongoose.model('Room', roomSchema);
export default Room;
