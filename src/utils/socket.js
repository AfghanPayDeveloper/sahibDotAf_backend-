import { Server } from "socket.io";

export const userSockets = {};
let io;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000"];

function setupSocket(server) {
  if (!io) {
    io = new Server(server, {
      cors: {
        origin: allowedOrigins,
        credentials: true,
      },
    });
  }

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("userOnline", (userId) => {
      if (userId) {
        socket.userId = userId;
        userSockets[userId] = socket;
        console.log(`User ${userId} registered with socket ID ${socket.id} 🆔`);
        socket.broadcast.emit("userOnline", userId);
      }
    });

    socket.on("sendMessage", (message) => {
      socket.broadcast.emit("receiveMessage", { ...message, sender: true });
    });

    socket.on("disconnect", (disconnectedSocket) => {
      console.log("User disconnected:", socket.id);
      for (const [userId, socket] of Object.entries(userSockets)) {
        if (disconnectedSocket.id === socket.id) {
          delete userSockets[userId];
          break;
        }
      }
    });
  });

  return io;
}

export default setupSocket;
