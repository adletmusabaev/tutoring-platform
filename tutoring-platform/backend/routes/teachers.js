const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllTeachers,
  getTeacherById,
  getTeachersBySubject,
  getTopRatedTeachers
} = require('../controllers/teacherController');

// GET /api/teachers - Get all teachers with filters
router.get('/', authenticateToken, getAllTeachers);

// GET /api/teachers/top - Get top-rated teachers
router.get('/top-rated', authenticateToken, getTopRatedTeachers);

// GET /api/teachers/subject/:subject - Get teachers by subject
router.get('/subject/:subject', authenticateToken, getTeachersBySubject);

// GET /api/teachers/:id - Get teacher by ID
router.get('/:id', authenticateToken, getTeacherById);

module.exports = router;