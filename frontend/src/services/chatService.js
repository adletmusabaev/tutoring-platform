import api from './api';

export const getChatByBooking = async (bookingId) => {
  const response = await api.get(`/chat/${bookingId}`);
  return response;
};

export const getMyChats = async () => {
  const response = await api.get('/chat');
  return response;
};

export const getChatMessages = async (bookingId) => {
  const response = await api.get(`/chat/${bookingId}/messages`);
  return response;
};