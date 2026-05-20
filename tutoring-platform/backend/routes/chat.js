const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getOrCreateChat,
  getChatByBooking,
  getMyChats,
  getChatMessages
} = require('../controllers/chatController');

// POST /api/chat - Create/get chat
router.post('/', authenticateToken, getOrCreateChat);

// GET /api/chat - Get my chats
router.get('/', authenticateToken, getMyChats);

// GET /api/chat/:bookingId - Get chat by booking ID
router.get('/:bookingId', authenticateToken, getChatByBooking);

// GET /api/chat/:bookingId/messages - Get chat messages
router.get('/:bookingId/messages', authenticateToken, getChatMessages);

module.exports = router;