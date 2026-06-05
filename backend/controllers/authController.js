const User = require('../models/User');
const TeacherApplication = require('../models/TeacherApplication');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this';

// Register
const register = async (req, res) => {
  try {
    const { name, email, password, role, subjects, hourlyRate, city } = req.body;

    // Validation
    if (!name || !email || !password || !role || !city) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Name, email, password, role, and city are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check if pending application exists
    const existingApp = await TeacherApplication.findOne({ email });
    if (existingApp) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'An application for this email is already pending approval' });
    }

    // Teacher-specific logic
    if (role === 'teacher') {
      let parsedSubjects = [];
      if (subjects) {
        if (Array.isArray(subjects)) {
          parsedSubjects = subjects;
        } else {
          try {
            parsedSubjects = JSON.parse(subjects);
          } catch (e) {
            parsedSubjects = subjects.split(',').map(s => s.trim()).filter(Boolean);
          }
        }
      }

      if (parsedSubjects.length === 0) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Teachers must specify at least one subject' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Teacher certificate is required' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create Teacher Application
      const application = new TeacherApplication({
        name,
        email,
        password: hashedPassword,
        city,
        subjects: parsedSubjects,
        hourlyRate: hourlyRate ? parseInt(hourlyRate) : 0,
        certificates: [{
          filename: req.file.originalname,
          url: `/uploads/certificates/${req.file.filename}`,
          uploadedAt: new Date()
        }]
      });

      await application.save();

      return res.status(201).json({
        message: 'Ваша заявка успешно отправлена на модерацию. После одобрения администратором вы сможете войти в свой аккаунт.',
        isPendingTeacher: true
      });
    }

    // Student registration logic (role === 'student' or 'admin')
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      city,
      subjects: [],
      hourlyRate: 0
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error unlinking file on catch:', err);
      }
    }
    res.status(500).json({ error: error.message });
  }
};


// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Block admins from logging in via standard route
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Admins must log in via the admin portal' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Logged in successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Logged in successfully as Admin',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        city: user.city,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login, adminLogin };