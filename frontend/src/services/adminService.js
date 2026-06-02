import api from './api';

export const getStats = async () => {
  const response = await api.get('/admin/stats');
  return response;
};

export const getAllUsers = async () => {
  const response = await api.get('/admin/users');
  return response;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response;
};

export const getPendingApplications = async () => {
  const response = await api.get('/admin/applications');
  return response;
};

export const approveApplication = async (appId) => {
  const response = await api.post(`/admin/applications/${appId}/approve`);
  return response;
};

export const rejectApplication = async (appId) => {
  const response = await api.post(`/admin/applications/${appId}/reject`);
  return response;
};

export const getTests = async () => {
  const response = await api.get('/admin/tests');
  return response;
};

export const createTest = async (testData) => {
  const response = await api.post('/admin/tests', testData);
  return response;
};

export const deleteTest = async (testId) => {
  const response = await api.delete(`/admin/tests/${testId}`);
  return response;
};
