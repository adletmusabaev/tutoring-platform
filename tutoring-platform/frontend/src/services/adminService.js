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
