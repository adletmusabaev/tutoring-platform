const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getMyGamification, getLeaderboard } = require('../controllers/gamificationController');

router.get('/me', authenticateToken, getMyGamification);
router.get('/leaderboard', authenticateToken, getLeaderboard);

module.exports = router;
