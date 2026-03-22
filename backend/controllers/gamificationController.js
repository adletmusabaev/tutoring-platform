const User = require('../models/User');

// Award points and check achievements
const awardPoints = async (req, res) => {
  try {
    const { points, reason, subject } = req.body;
    
    if (!points || typeof points !== 'number') {
      return res.status(400).json({ error: 'Valid points amount is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.points = (user.points || 0) + points;
    const newAchievements = [];

    // Achievement logic based on reason
    if (reason === 'level_test_passed' && subject) {
      const achievementName = `${subject} Novice`;
      if (!user.achievements.includes(achievementName)) {
        user.achievements.push(achievementName);
        newAchievements.push(achievementName);
      }
    }

    // Points-based achievements
    if (user.points >= 100 && !user.achievements.includes('100 Points Club')) {
      user.achievements.push('100 Points Club');
      newAchievements.push('100 Points Club');
    }
    
    if (user.points >= 500 && !user.achievements.includes('Scholar')) {
      user.achievements.push('Scholar');
      newAchievements.push('Scholar');
    }

    await user.save();

    res.json({
      message: 'Points updating successful',
      totalPoints: user.points,
      newAchievements,
      allAchievements: user.achievements
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get top students by points
const getLeaderboard = async (req, res) => {
  try {
    const topUsers = await User.find({ role: 'student' })
      .select('name avatar points achievements')
      .sort({ points: -1 })
      .limit(10);
    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { awardPoints, getLeaderboard };
