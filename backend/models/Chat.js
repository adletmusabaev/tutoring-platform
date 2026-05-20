const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messages: [{
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    senderRole: {
      type: String,
      enum: ['student', 'teacher']
    },
    text: {
      type: String,
      default: ''
    },
    attachments: [{
      originalName: String,
      fileName: String,
      url: String,
      mimeType: String,
      size: Number,
      fileType: {
        type: String,
        enum: ['image', 'document'],
        default: 'document'
      }
    }],
    messageType: {
      type: String,
      enum: ['text', 'attachment', 'mixed'],
      default: 'text'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Chat', chatSchema);
