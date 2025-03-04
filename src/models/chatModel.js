import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
   sender_id:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User'
   },
   receiver_id:{
      type:mongoose.Schema.Types.ObjectId,
    ref:'User'
   },
   message:{
    type:String,
    required:true
   },
  },
  { timestamps: true }
);


const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);

export default Chat;
