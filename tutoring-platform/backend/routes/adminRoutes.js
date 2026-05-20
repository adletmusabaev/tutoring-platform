const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const { getStats, getAllUsers, deleteUser } = require('../controllers/adminController');

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

module.exports = router;
