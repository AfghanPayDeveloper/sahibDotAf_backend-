import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    media: {
      type: String,
      required: false, 
    },
    mediaType: {
      type: String, 
      enum: ['image', 'video', 'file', 'none'],
      default: 'none',
    },
    reactions: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
      emoji: { type: String }, 
    }],
    timestamp: {
      type: Date,
      default: Date.now,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    messageStatus: {
      type: String, 
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Conversation',  
      required: true,
    },
  },
  { timestamps: true }
);


messageSchema.index({ conversationId: 1, timestamp: -1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
