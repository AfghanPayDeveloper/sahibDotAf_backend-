import User from "../models/User.js";
import { userSockets } from "./socket.js";

export default function sendNotification(userId, data) {
  const userSocket = userSockets[userId];

  User.findById(data.from?.id || data.from).then((user) => {
    if (user) {
      if (userSocket) {
        console.log("Sending notification to user: 🔔🔔🔔", userId);
        userSocket.emit("notification", { ...data, from: user });
      } else {
        console.log(`${userId} is offline `, "💀💀💀");
      }
    }
  }).catch((error) => {
    console.error("Error fetching user:", error);
  });

}
