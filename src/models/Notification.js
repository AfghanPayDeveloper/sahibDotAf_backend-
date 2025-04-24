import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  data: { type: [], 
    // required: [true, "data for notification is required"]
   },
  to: { type: mongoose.Types.ObjectId, ref: "User", required: true },
  from: { type: mongoose.Types.ObjectId, ref: "User", required: true },
  unread: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("Notification", NotificationSchema);
