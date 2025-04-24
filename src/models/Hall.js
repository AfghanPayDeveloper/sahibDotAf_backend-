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
      required: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
  },
  { timestamps: true }
);

const Hall = mongoose.model('Hall', hallSchema);
export default Hall;
