const User = require('../models/User');
const Booking = require('../models/Booking');
const fs = require('fs');
const path = require('path');

// Get student statistics
const getStudentStats = async (req, res) => {
  try {
    const studentId = req.user.id;

    // specific status: completed
    const completedBookings = await Booking.find({
      studentId: studentId,
      status: 'completed'
    }).populate('teacherId', 'hourlyRate subject'); // We need hourlyRate from teacher

    // 1. Total Learning Hours
    let totalMinutes = 0;

    // 2. Total Spent
    let totalSpent = 0;

    // 3. Subject Counts for Top Subject
    const subjectCounts = {};

    completedBookings.forEach(booking => {
      // Calculate duration in minutes
      const start = new Date(booking.startTime);
      const end = new Date(booking.endTime);
      const durationMs = end - start;
      const durationMinutes = durationMs / (1000 * 60);

      totalMinutes += durationMinutes;

      // Calculate cost
      // Note: This uses CURRENT teacher rate, which is a known limitation
      // Ideally booking should store the rate at time of booking
      if (booking.teacherId && booking.teacherId.hourlyRate) {
        const hours = durationMinutes / 60;
        totalSpent += hours * booking.teacherId.hourlyRate;
      }

      // Count subjects
      const subject = booking.subject || 'General';
      subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
    });

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10; // Round to 1 decimal

    // 4. Classes Completed
    const classesCompleted = completedBookings.length;

    // Find Top Subject
    let topSubject = 'N/A';
    let maxCount = 0;

    for (const [subject, count] of Object.entries(subjectCounts)) {
      if (count > maxCount) {
        maxCount = count;
        topSubject = subject;
      }
    }

    res.json({
      totalHours,
      classesCompleted,
      totalSpent: Math.round(totalSpent * 100) / 100,
      topSubject
    });

  } catch (error) {
    console.error('Error fetching student stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

// Get current user profile
const getCurrentProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user profile by ID
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { bio, avatar, subjects, hourlyRate, goals, level, yearsOfExperience, isOnline } = req.body;

    const updateData = {};
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (subjects !== undefined) updateData.subjects = subjects;
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
    if (goals !== undefined) updateData.goals = goals;
    if (level !== undefined) updateData.level = level;
    if (yearsOfExperience !== undefined) updateData.yearsOfExperience = yearsOfExperience;
    if (isOnline !== undefined) {
      updateData.isOnline = isOnline;
      updateData.lastActive = Date.now();
    }

    updateData.updatedAt = Date.now();

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload certificate
const uploadCertificate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'teacher') {
      return res.status(403).json({ error: 'Only teachers can upload certificates' });
    }

    // Add certificate to user's certificates array
    const certificate = {
      filename: req.file.originalname,
      url: `/uploads/certificates/${req.file.filename}`,
      uploadedAt: new Date()
    };

    user.certificates.push(certificate);
    await user.save();

    const updatedUser = await User.findById(req.user.id).select('-password');

    res.json({
      message: 'Certificate uploaded successfully',
      user: updatedUser
    });
  } catch (error) {
    // Delete uploaded file if there's an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
};

// Delete certificate
const deleteCertificate = async (req, res) => {
  try {
    const { certId } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the certificate
    const certificate = user.certificates.id(certId);

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Delete file from disk
    const filePath = path.join(__dirname, '..', certificate.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from array
    certificate.remove();
    await user.save();

    const updatedUser = await User.findById(req.user.id).select('-password');

    res.json({
      message: 'Certificate deleted successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update online status
const updateOnlineStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;

    if (typeof isOnline !== 'boolean') {
      return res.status(400).json({ error: 'isOnline must be a boolean' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        isOnline,
        lastActive: Date.now()
      },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Online status updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getCurrentProfile,
  getProfile,
  updateProfile,
  uploadCertificate,
  deleteCertificate,
  updateOnlineStatus,
  getStudentStats
};
