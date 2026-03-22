const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: '🏅'
  },
  conditionType: {
    type: String,
    enum: ['bookings_completed', 'reviews_left', 'points_earned', 'registration'],
    required: true
  },
  conditionValue: {
    type: Number,
    default: 1
  },
  pointsReward: {
    type: Number,
    default: 0
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  }
});

module.exports = mongoose.model('Achievement', achievementSchema);
