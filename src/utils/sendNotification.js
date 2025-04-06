import { io } from "../index.js";
import { userSockets, onlineUsers } from "./socket.js";

export default function sendNotification(userId, data) {
  // const userSocketId = userSockets[userId];
  const userSocket = onlineUsers.get(userId);

  if (userSocket) {
    // io.to(userSocketId).emit("notification", data);
    userSocket.emit("notification", data);
  }
}
