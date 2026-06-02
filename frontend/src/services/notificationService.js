import api from './api';

export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response;
};

export const markNotificationRead = async (notificationId) => {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response;
};

export const markAllNotificationsRead = async () => {
  const response = await api.put('/notifications/read-all');
  return response;
};
