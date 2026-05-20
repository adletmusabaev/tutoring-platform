import api from './api';

// Create a PayPal order (returns orderId and price)
export const createPaypalOrder = async (bookingData) => {
  const response = await api.post('/payments/create-order', bookingData);
  return response;
};

// Capture payment after PayPal approval (creates booking + transaction)
export const capturePaypalOrder = async (orderId, bookingData) => {
  const response = await api.post('/payments/capture-order', {
    orderId,
    ...bookingData
  });
  return response;
};

// Get transaction history for current user
export const getTransactions = async () => {
  const response = await api.get('/payments/transactions');
  return response;
};
