import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);



const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
