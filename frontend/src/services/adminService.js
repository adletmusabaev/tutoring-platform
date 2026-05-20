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
