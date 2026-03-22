const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking
} = require('../controllers/bookingController');

// POST /api/bookings - Create new booking
router.post('/', authenticateToken, createBooking);

// GET /api/bookings - Get my bookings
router.get('/', authenticateToken, getMyBookings);

// GET /api/bookings/:id - Get booking by ID
router.get('/:id', authenticateToken, getBookingById);

// PUT /api/bookings/:id - Update booking status
router.put('/:id', authenticateToken, updateBookingStatus);

// DELETE /api/bookings/:id - Cancel booking
router.delete('/:id', authenticateToken, cancelBooking);

module.exports = router;