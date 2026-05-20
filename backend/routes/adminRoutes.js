const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const { 
  getStats, 
  getAllUsers, 
  deleteUser, 
  getPendingApplications, 
  approveApplication, 
  rejectApplication 
} = require('../controllers/adminController');

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: 'Server error check admin' });
  }
};

// GET /api/admin/stats
router.get('/stats', authenticateToken, requireAdmin, getStats);

// GET /api/admin/users
router.get('/users', authenticateToken, requireAdmin, getAllUsers);

// DELETE /api/admin/users/:id
router.delete('/users/:id', authenticateToken, requireAdmin, deleteUser);

// GET /api/admin/applications - Get all pending teacher applications
router.get('/applications', authenticateToken, requireAdmin, getPendingApplications);

// POST /api/admin/applications/:id/approve - Approve teacher application
router.post('/applications/:id/approve', authenticateToken, requireAdmin, approveApplication);

// POST /api/admin/applications/:id/reject - Reject teacher application
router.post('/applications/:id/reject', authenticateToken, requireAdmin, rejectApplication);

module.exports = router;
