const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createReview,
  getTeacherReviews,
  getMyReviews,
  deleteReview
} = require('../controllers/reviewController');

// POST /api/reviews - Create review
router.post('/', authenticateToken, createReview);

// GET /api/reviews/teacher/:teacherId - Get reviews for teacher
router.get('/teacher/:teacherId', authenticateToken, getTeacherReviews);

// GET /api/reviews/my - Get my reviews
router.get('/my', authenticateToken, getMyReviews);

// DELETE /api/reviews/:id - Delete review
router.delete('/:id', authenticateToken, deleteReview);

module.exports = router;