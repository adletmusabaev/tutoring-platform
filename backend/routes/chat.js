const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { chatUpload } = require('../middleware/chatUploadMiddleware');
const {
  getOrCreateChat,
  getChatByBooking,
  getMyChats,
  getChatMessages,
  uploadChatFiles
} = require('../controllers/chatController');

// POST /api/chat - Create/get chat
router.post('/', authenticateToken, getOrCreateChat);

// GET /api/chat - Get my chats
router.get('/', authenticateToken, getMyChats);

// GET /api/chat/:bookingId - Get chat by booking ID
router.get('/:bookingId', authenticateToken, getChatByBooking);

// GET /api/chat/:bookingId/messages - Get chat messages
router.get('/:bookingId/messages', authenticateToken, getChatMessages);

// POST /api/chat/:bookingId/attachments - Upload chat attachments
router.post(
  '/:bookingId/attachments',
  authenticateToken,
  chatUpload.array('files', 5),
  uploadChatFiles
);

module.exports = router;
