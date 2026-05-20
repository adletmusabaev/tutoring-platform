const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

// Imports
const { connectDB } = require('./config/database');
const { setupSocket } = require('./utils/socket');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const teacherRoutes = require('./routes/teachers');
const bookingRoutes = require('./routes/bookings');
const reviewRoutes = require('./routes/reviews');
const chatRoutes = require('./routes/chat');
const paymentRoutes = require('./routes/payments');
const gamificationRoutes = require('./routes/gamificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json());

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));


// Database Connection
connectDB();

// Socket.io Setup
setupSocket(server);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/admin', adminRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running ✅' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handler Middleware
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` WebSocket ready for real-time chat`);
  console.log(` CORS enabled for frontend`);
});