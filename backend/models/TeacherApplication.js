const mongoose = require('mongoose');

const teacherApplicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  subjects: [{
    type: String
  }],
  hourlyRate: {
    type: Number,
    default: 0
  },
  certificates: [{
    filename: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TeacherApplication', teacherApplicationSchema);
