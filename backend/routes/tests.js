const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Test = require('../models/Test');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const tests = await Test.find({ isActive: true })
      .select('title subject level description questions createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json(tests.map(test => ({
      _id: test._id,
      title: test.title,
      subject: test.subject,
      level: test.level,
      description: test.description,
      questionCount: test.questions.length,
      createdAt: test.createdAt
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const test = await Test.findOne({ _id: req.params.id, isActive: true });
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
