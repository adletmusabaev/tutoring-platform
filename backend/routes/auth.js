const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

const { upload } = require('../middleware/uploadMiddleware');

// POST /api/auth/register
router.post('/register', upload.single('certificate'), register);

// POST /api/auth/login
router.post('/login', login);

module.exports = router;