import api from './api';

export const register = async (name, email, password, role, city, subjects = [], hourlyRate = 0, goals = []) => {
  const response = await api.post('/auth/register', {
    name,
    email,
    password,
    role,
    city,
    subjects: role === 'teacher' ? subjects : [],
    hourlyRate: role === 'teacher' ? hourlyRate : 0,
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