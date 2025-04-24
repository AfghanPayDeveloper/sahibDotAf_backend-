import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  content: { type: String },
  mediaUrls: [{ type: String }],
  messageType: {
    type: String,
    enum: ['text', 'image', 'audio', 'video', 'file'],
    default: 'text'
  },
  seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions: [{
    emoji: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  isDeleted: { type: Boolean, default: false },
  editedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);
