const express = require('express');
const router = express.Router();
const { createOrder, captureOrder, getTransactions } = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

// All payment routes require authentication
router.post('/create-order', authenticateToken, createOrder);
router.post('/capture-order', authenticateToken, captureOrder);
router.get('/transactions', authenticateToken, getTransactions);

module.exports = router;
