const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { awardPoints, getLeaderboard } = require('../controllers/gamificationController');

// POST /api/gamification/award - Award points to authenticated user
router.post('/award', authenticateToken, awardPoints);

// GET /api/gamification/leaderboard - Get top students
router.get('/leaderboard', authenticateToken, getLeaderboard);

module.exports = router;
