const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminMiddleware');
const {
  getAnalytics,
  getAllUsers,
  banUser,
  getAllBookings,
  deleteReview,
  getAllReviews
} = require('../controllers/adminController');

// All routes require auth + admin role
router.use(authenticateToken, requireAdmin);

router.get('/analytics', getAnalytics);
router.get('/users', getAllUsers);
router.patch('/users/:id/ban', banUser);
router.get('/bookings', getAllBookings);
router.get('/reviews', getAllReviews);
router.delete('/reviews/:id', deleteReview);

module.exports = router;
