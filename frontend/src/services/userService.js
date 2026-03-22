import api from './api';

export const getMyProfile = async () => {
  const response = await api.get('/users/me');
  return response;
};

export const getProfileById = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response;
};

export const updateProfile = async (data) => {
  const response = await api.put('/users/me', data);
  return response;
};

export const uploadCertificate = async (file) => {
  const formData = new FormData();
  formData.append('certificate', file);

  const response = await api.post('/users/profile/certificates', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response;
};

export const deleteCertificate = async (certId) => {
  const response = await api.delete(`/users/profile/certificates/${certId}`);
  return response;
};

export const updateOnlineStatus = async (isOnline) => {
  const response = await api.patch('/users/profile/online-status', { isOnline });
  return response;
};

export const getStudentStats = async () => {
  const response = await api.get('/users/stats');
  return response;
};
