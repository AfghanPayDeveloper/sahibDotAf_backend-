import { userSockets } from "./socket.js";

export default function sendNotification(userId, data) {
  const userSocket = userSockets[userId];
  
  if (userSocket) {
    console.log(userId, userSocket.id, " ✅✅✅");
    console.log("Sending notification to user: ❌❌❌", userId);
    userSocket.emit("notification", data);
  } else {
    console.log(`${userId} is offline `, "❌❌❌");
  }
}
