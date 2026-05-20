import api from './api';

export const awardPoints = async (points, reason, subject) => {
  const response = await api.post('/gamification/award', { points, reason, subject });
  return response;
};

export const getLeaderboard = async () => {
  const response = await api.get('/gamification/leaderboard');
  return response;
};
