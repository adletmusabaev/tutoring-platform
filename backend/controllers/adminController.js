const User = require('../models/User');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const TeacherApplication = require('../models/TeacherApplication');
const Test = require('../models/Test');
const fs = require('fs');
const path = require('path');

// Get overall platform statistics
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const studentsCount = await User.countDocuments({ role: 'student' });
    const teachersCount = await User.countDocuments({ role: 'teacher' });
    
    const totalBookings = await Booking.countDocuments();
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    
    // Revenue from transactions (assuming we implemented standard PayPal transactions)
    let totalRevenue = 0;
    try {
      const transactions = await Transaction.find({ status: 'COMPLETED' });
      totalRevenue = transactions.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    } catch (e) {
      console.error('Transaction model not found or error', e);
    }

    res.json({
      totalUsers,
      studentsCount,
      teachersCount,
      totalBookings,
      completedBookings,
      totalRevenue
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all users with basic info
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete user by ID
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent deleting other admins
    if (user.role === 'admin' && req.user.id !== user._id.toString()) {
       return res.status(403).json({ error: 'Cannot delete another admin' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all pending teacher applications
const getPendingApplications = async (req, res) => {
  try {
    const applications = await TeacherApplication.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve teacher application
const approveApplication = async (req, res) => {
  try {
    const app = await TeacherApplication.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Double check email uniqueness
    const existingUser = await User.findOne({ email: app.email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email is already registered' });
    }

    // Create teacher account
    const teacher = new User({
      name: app.name,
      email: app.email,
      password: app.password, // Password is already hashed
      city: app.city,
      role: 'teacher',
      subjects: app.subjects,
      hourlyRate: app.hourlyRate,
      certificates: app.certificates
    });

    await teacher.save();

    // Delete application
    await TeacherApplication.findByIdAndDelete(req.params.id);

    res.json({ message: 'Teacher account approved and created successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reject teacher application
const rejectApplication = async (req, res) => {
  try {
    const app = await TeacherApplication.findById(req.params.id);
    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Delete files from disk
    if (app.certificates && app.certificates.length > 0) {
      app.certificates.forEach(cert => {
        const filePath = path.join(__dirname, '..', cert.url);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error('Error unlinking certificate file:', err);
          }
        }
      });
    }

    // Delete application
    await TeacherApplication.findByIdAndDelete(req.params.id);

    res.json({ message: 'Teacher application rejected and certificate deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTests = async (req, res) => {
  try {
    const tests = await Test.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createTest = async (req, res) => {
  try {
    const { title, subject, level, description, questions } = req.body;
    const normalizedLevel = String(level || '').toLowerCase();

    if (!title || !subject || !normalizedLevel) {
      return res.status(400).json({ error: 'Title, subject, and level are required' });
    }

    if (!['beginner', 'intermediate', 'advanced'].includes(normalizedLevel)) {
      return res.status(400).json({ error: 'Level must be beginner, intermediate, or advanced' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Add at least one question' });
    }

    const normalizedQuestions = questions.map((item, index) => {
      const options = Array.isArray(item.options)
        ? item.options.map(option => String(option || '').trim()).filter(Boolean)
        : [];
      const correctAnswer = Number(item.correctAnswer);

      if (!String(item.question || '').trim()) {
        throw new Error(`Question ${index + 1} is missing text`);
      }
      if (options.length < 2) {
        throw new Error(`Question ${index + 1} must have at least two options`);
      }
      if (!Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) {
        throw new Error(`Question ${index + 1} has an invalid correct answer`);
      }

      return {
        question: item.question.trim(),
        options,
        correctAnswer
      };
    });

    const test = await Test.create({
      title: title.trim(),
      subject: subject.trim(),
      level: normalizedLevel,
      description: description ? description.trim() : '',
      questions: normalizedQuestions,
      createdBy: req.user.id
    });

    res.status(201).json(test);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    await Test.findByIdAndDelete(req.params.id);
    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { 
  getStats, 
  getAllUsers, 
  deleteUser,
  getPendingApplications,
  approveApplication,
  rejectApplication,
  getTests,
  createTest,
  deleteTest
};
