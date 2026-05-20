import api from './api';

export const register = async (name, email, password, role, city, subjects = [], hourlyRate = 0, goals = [], certificateFile = null) => {
  if (role === 'teacher') {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('role', role);
    formData.append('city', city);
    subjects.forEach(subject => formData.append('subjects', subject));
    formData.append('hourlyRate', hourlyRate);
    if (certificateFile) {
      formData.append('certificate', certificateFile);
    }
    
    const response = await api.post('/auth/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response;
  }

  const response = await api.post('/auth/register', {
    name,
    email,
    password,
    role,
    city,
    goals: role === 'student' ? goals : []
  });
  return response;
};

export const login = async (email, password) => {
  const response = await api.post('/auth/login', {
    email,
    password
  });
  return response;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};