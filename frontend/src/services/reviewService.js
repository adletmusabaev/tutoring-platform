import api from './api';

export const createReview = async (teacherId, rating, comment = '') => {
  const response = await api.post('/reviews', {
    teacherId,
    rating,
    comment
  });
  return response;
};

export const getTeacherReviews = async (teacherId) => {
  const response = await api.get(`/reviews/teacher/${teacherId}`);
  return response;
};

export const getMyReviews = async () => {
  const response = await api.get('/reviews/my');
  return response;
};

export const deleteReview = async (reviewId) => {
  const response = await api.delete(`/reviews/${reviewId}`);
  return response;
};