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

export const uploadChatFiles = async (bookingId, files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const response = await api.post(`/chat/${bookingId}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response;
};
