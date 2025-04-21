import mongoose from 'mongoose';
import findOrCreate from "mongoose-findorcreate"

const chatSchema = new mongoose.Schema({
  isGroup: { type: Boolean, default: false },
  chatName: { type: String },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  adminIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  chatProfile: { type: String },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }
}, { timestamps: true });

chatSchema.plugin(findOrCreate);

export default mongoose.model('Chat', chatSchema);