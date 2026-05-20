const User = require('../models/User');

// Get all teachers with filters
const getAllTeachers = async (req, res) => {
  try {
    const { subject, search, minRating, maxPrice, city, smartMatch } = req.query;
    const filter = { role: 'teacher' };

    // Filter by city
    if (city) {
      filter.city = city;
    }

    // Filter by subject
    if (subject) {
      filter.subjects = { $in: [subject] };
    }

    // Search by name or bio
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by minimum rating
    if (minRating) {
      filter.rating = { $gte: parseFloat(minRating) };
    }

    // Filter by max hourly rate
    if (maxPrice) {
      filter.hourlyRate = { $lte: parseFloat(maxPrice) };
    }

    let teachers = await User.find(filter).select('-password');

    // Smart Match Logic
    if (smartMatch === 'true' && req.user && req.user.id) {
      const student = await User.findById(req.user.id);
      
      if (student && student.goals && student.goals.length > 0) {
        const studentGoalsLower = student.goals.map(g => g.toLowerCase());
        
        teachers = teachers.map(teacher => {
          let relevanceScore = 0;
          if (teacher.subjects && teacher.subjects.length > 0) {
            teacher.subjects.forEach(subj => {
              if (studentGoalsLower.includes(subj.toLowerCase())) {
                relevanceScore += 1;
              }
            });
          }
          return { ...teacher.toObject(), relevanceScore };
        });

        teachers.sort((a, b) => {
          if (b.relevanceScore !== a.relevanceScore) {
            return b.relevanceScore - a.relevanceScore;
          }
          return (b.rating || 0) - (a.rating || 0);
        });
      } else {
        // Student has no goals, fallback to rating sort
        teachers = teachers.map(t => t.toObject()).sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }
    } else {
      // Regular search, sort by rating
      teachers = teachers.map(t => t.toObject()).sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get teacher by ID
const getTeacherById = async (req, res) => {
  try {
    const teacher = await User.findById(req.params.id).select('-password');

    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    res.json(teacher);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get teachers by subject
const getTeachersBySubject = async (req, res) => {
  try {
    const { subject } = req.params;

    const teachers = await User.find({
      role: 'teacher',
      subjects: { $in: [subject] }
    })
      .select('-password')
      .sort({ rating: -1 });

    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get top-rated teachers
const getTopRatedTeachers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const teachers = await User.find({ role: 'teacher' })
      .select('-password')
      .sort({ rating: -1 })
      .limit(limit);

    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllTeachers,
  getTeacherById,
  getTeachersBySubject,
  getTopRatedTeachers
};