import { Server } from 'socket.io';

const io = new Server(5000, {
  cors: {
    origin: 'http://localhost:3000', // Make sure this matches your frontend URL
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const onlineUsers = new Map(); // Map to store online users

io.on('connection', (socket) => {
  console.log(`New socket connection: ${socket.id}`);

  socket.on('userOnline', (userId) => {
    console.log(`User ${userId} is online`);
    onlineUsers.set(userId, socket);
  });

  socket.on('sendMessage', ({ recipientId, message }) => {
    console.log(`Received message for ${recipientId}: ${message}`);
    
    const recipientSocket = onlineUsers.get(recipientId);
    if (recipientSocket) {
      recipientSocket.emit('receiveMessage', {
        senderId: socket.id,
        message,
      });
      console.log(`Message sent to ${recipientId}`);
    } else {
      console.log(`User ${recipientId} is not online`);
    }
  });

  socket.on('disconnect', () => {
    onlineUsers.forEach((s, userId) => {
      if (s.id === socket.id) {
        console.log(`User ${userId} is offline`);
        onlineUsers.delete(userId);
      }
    });
  });
});

console.log('Server running on port 5000');
