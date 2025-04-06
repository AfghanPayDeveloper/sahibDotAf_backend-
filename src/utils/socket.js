import { Server } from "socket.io";

// export const userSockets = {};
export const onlineUsers = new Map();
let io;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000"];


export default function setupSocket(server) {
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
      // userSockets[userId] = socket.id;
      // console.log(`User ${userId} registered with socket ID ${socket.id}`);
      if (userId) {
        console.log(`User ${userId} is online`);
        socket.userId = userId;
        onlineUsers.set(userId, socket);
        socket.broadcast.emit("userOnline", userId);
      }
    });

    socket.on("notify", (userId) => {
      console.log("Notify event received for user ID:", userId);
    });

    // socket.on("disconnect", () => {
    //   console.log("User disconnected:", socket.id);
    //   for (const [userId, socketId] of Object.entries(userSockets)) {
    //     if (socketId === socket.id) {
    //       delete userSockets[userId];
    //       break;
    //     }
    //   }
    // });

    socket.on("disconnect", () => {
      if (socket.userId) {
        console.log(`User ${socket.userId} disconnected`);
        onlineUsers.delete(socket.userId);
        socket.broadcast.emit("userOffline", socket.userId);
      }
    });
  });

  return io;
}
