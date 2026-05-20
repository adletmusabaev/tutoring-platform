const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/uploadMiddleware');
const {
    getCurrentProfile,
    getProfile,
    updateProfile,
    uploadCertificate,
    deleteCertificate,
    updateOnlineStatus,
    getStudentStats
} = require('../controllers/userController');

// GET /api/users/stats - Get student statistics
router.get('/stats', authenticateToken, getStudentStats);

// GET /api/users/me - Get current user profile
router.get('/me', authenticateToken, getCurrentProfile);

// GET /api/users/:id - Get user profile by ID
router.get('/:id', authenticateToken, getProfile);

// PUT /api/users/me - Update current user profile
router.put('/me', authenticateToken, updateProfile);

// POST /api/users/profile/certificates - Upload certificate
router.post('/profile/certificates', authenticateToken, upload.single('certificate'), uploadCertificate);

// DELETE /api/users/profile/certificates/:certId - Delete certificate
router.delete('/profile/certificates/:certId', authenticateToken, deleteCertificate);

// PATCH /api/users/profile/online-status - Update online status
router.patch('/profile/online-status', authenticateToken, updateOnlineStatus);

module.exports = router;
