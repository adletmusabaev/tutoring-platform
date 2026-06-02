const mongoose = require('mongoose');

const testQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [{
    type: String,
    required: true,
    trim: true
  }],
  correctAnswer: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 80
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  questions: {
    type: [testQuestionSchema],
    validate: {
      validator: questions => questions.length > 0,
      message: 'A test must include at least one question'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Test', testSchema);
