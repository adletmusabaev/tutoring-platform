import api from './api';

export const createBooking = async (teacherId, subject, startTime, endTime, notes = '') => {
  const response = await api.post('/bookings', {
    teacherId,
    subject,
    startTime,
    endTime,
    notes
  });
  return response;
};

export const getMyBookings = async () => {
  const response = await api.get('/bookings');
  return response;
};

export const getBookingById = async (bookingId) => {
  const response = await api.get(`/bookings/${bookingId}`);
  return response;
};

export const updateBookingStatus = async (bookingId, status) => {
  const response = await api.put(`/bookings/${bookingId}`, { status });
  return response;
};

export const cancelBooking = async (bookingId) => {
  const response = await api.delete(`/bookings/${bookingId}`);
  return response;
};