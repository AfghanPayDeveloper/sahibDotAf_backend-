import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  isGroup: { type: Boolean, default: false },
  chatName: { type: String },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  adminIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  chatPicture: { type: String },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }
}, { timestamps: true });

export default mongoose.model('Chat', chatSchema);