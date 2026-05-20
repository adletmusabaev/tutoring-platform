const Chat = require('../models/Chat');

// Get or create chat for booking
const getOrCreateChat = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    let chat = await Chat.findOne({ bookingId });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found for this booking' });
    }

    await chat.populate('studentId', 'name avatar');
    await chat.populate('teacherId', 'name avatar');

    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get chat by booking ID
const getChatByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const chat = await Chat.findOne({ bookingId })
      .populate('studentId', 'name avatar')
      .populate('teacherId', 'name avatar');

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all chats for current user
const getMyChats = async (req, res) => {
  try {
    const { role } = req.user;
    const filter = role === 'student'
      ? { studentId: req.user.id }
      : { teacherId: req.user.id };

    const chats = await Chat.find(filter)
      .populate('studentId', 'name avatar')
      .populate('teacherId', 'name avatar')
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get chat messages
const getChatMessages = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const chat = await Chat.findOne({ bookingId })
      .populate('messages.senderId', 'name avatar');

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json(chat.messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload files for a chat message
const uploadChatFiles = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const chat = await Chat.findOne({ bookingId });
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const userId = req.user.id;
    const canUseChat =
      chat.studentId.toString() === userId ||
      chat.teacherId.toString() === userId;

    if (!canUseChat) {
      return res.status(403).json({ error: 'You do not have access to this chat' });
    }

    const files = (req.files || []).map((file) => ({
      originalName: file.originalname,
      fileName: file.filename,
      url: `/uploads/chat/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
      fileType: file.mimetype.startsWith('image/') ? 'image' : 'document'
    }));

    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getOrCreateChat,
  getChatByBooking,
  getMyChats,
  getChatMessages,
  uploadChatFiles
};
