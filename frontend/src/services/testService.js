import api from './api';

export const getTests = async () => {
  const response = await api.get('/tests');
  return response;
};

export const getTestById = async (testId) => {
  const response = await api.get(`/tests/${testId}`);
  return response;
};
