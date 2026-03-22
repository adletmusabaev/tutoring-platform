import api from './api';

export const getAllTeachers = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.subject) params.append('subject', filters.subject);
  if (filters.search) params.append('search', filters.search);
  if (filters.minRating) params.append('minRating', filters.minRating);
  if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
  if (filters.city) params.append('city', filters.city);
  if (filters.smartMatch) params.append('smartMatch', filters.smartMatch);

  const response = await api.get(`/teachers?${params.toString()}`);
  return response;
};

export const getTeacherById = async (teacherId) => {
  const response = await api.get(`/teachers/${teacherId}`);
  return response;
};

export const getTeachersBySubject = async (subject) => {
  const response = await api.get(`/teachers/subject/${subject}`);
  return response;
};

export const getTopRatedTeachers = async (limit = 10) => {
  const response = await api.get(`/teachers/top-rated?limit=${limit}`);
  return response;
};