const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require('../controllers/notificationController');

router.get('/', authenticateToken, getMyNotifications);
router.put('/read-all', authenticateToken, markAllNotificationsRead);
router.put('/:id/read', authenticateToken, markNotificationRead);

module.exports = router;
