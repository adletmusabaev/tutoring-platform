const socketIo = require('socket.io');
const Chat = require('../models/Chat');

const setupSocket = (server) => {
  const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

  // Track connected users
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id);

    // User joins a chat room
    socket.on('join-chat', (bookingId) => {
      socket.join(bookingId);
      connectedUsers.set(socket.id, bookingId);
      console.log(`📍 User ${socket.id} joined chat room: ${bookingId}`);
      
      // Notify other users in the room
      io.to(bookingId).emit('user-joined', {
        socketId: socket.id,
        message: 'User joined the chat'
      });
    });

    // Send message
    socket.on('send-message', async (data) => {
      try {
        const { bookingId, userId, userRole, message } = data;

        console.log(`💬 Message received from ${userId}:`, message);
        console.log(`Looking for chat with bookingId:`, bookingId);

        if (!message || !message.trim()) {
          console.log('⚠️ Empty message, ignoring');
          return socket.emit('error', { error: 'Empty message' });
        }

        // Save message to database
        const chat = await Chat.findOne({ bookingId: bookingId });
        
        if (!chat) {
          console.log('❌ Chat not found for bookingId:', bookingId);
          console.log('Available chats:', await Chat.find().select('bookingId'));
          return socket.emit('error', { error: 'Chat not found' });
        }

        console.log('✅ Chat found, adding message...');

        chat.messages.push({
          senderId: userId,
          senderRole: userRole,
          text: message,
          timestamp: new Date()
        });
        chat.updatedAt = new Date();
        await chat.save();

        console.log(`✅ Message saved to database. Total messages:`, chat.messages.length);

        // Broadcast message to all users in the room
        io.to(bookingId).emit('receive-message', {
          userId,
          userRole,
          message,
          timestamp: new Date()
        });

        console.log(`✅ Message broadcasted to room: ${bookingId}`);
      } catch (error) {
        console.error('❌ Chat error:', error.message);
        console.error('Stack:', error.stack);
        socket.emit('error', { error: 'Failed to send message' });
      }
    });

    // User is typing
    socket.on('user-typing', (bookingId) => {
      socket.broadcast.to(bookingId).emit('user-typing', {
        socketId: socket.id
      });
      console.log(`⌨️ User typing in chat ${bookingId}`);
    });

    // User stopped typing
    socket.on('user-stop-typing', (bookingId) => {
      socket.broadcast.to(bookingId).emit('user-stop-typing', {
        socketId: socket.id
      });
    });

    // Leave chat
    socket.on('leave-chat', (bookingId) => {
      socket.leave(bookingId);
      connectedUsers.delete(socket.id);
      console.log(`📍 User ${socket.id} left chat: ${bookingId}`);
      
      io.to(bookingId).emit('user-left', {
        socketId: socket.id,
        message: 'User left the chat'
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      const bookingId = connectedUsers.get(socket.id);
      connectedUsers.delete(socket.id);
      
      if (bookingId) {
        io.to(bookingId).emit('user-left', {
          socketId: socket.id,
          message: 'User disconnected'
        });
        console.log(`📍 User ${socket.id} disconnected from chat: ${bookingId}`);
      }
      
      console.log('❌ User disconnected:', socket.id);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  });

  return io;
};

module.exports = { setupSocket };