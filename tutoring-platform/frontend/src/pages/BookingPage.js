import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import * as teacherService from '../services/teacherService';
import * as paymentService from '../services/paymentService';

function BookingPage() {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPaypal, setShowPaypal] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [formData, setFormData] = useState({
    subject: '',
    startTime: '',
    endTime: '',
    notes: ''
  });

  useEffect(() => {
    fetchTeacher();
  }, [teacherId]);

  // Recalculate price when times change
  useEffect(() => {
    if (teacher && formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      if (end > start) {
        const durationHours = (end - start) / (1000 * 60 * 60);
        const price = Math.round(teacher.hourlyRate * durationHours * 100) / 100;
        setCalculatedPrice(price);
      } else {
        setCalculatedPrice(0);
      }
    } else {
      setCalculatedPrice(0);
    }
  }, [formData.startTime, formData.endTime, teacher]);

  const fetchTeacher = async () => {
    try {
      const data = await teacherService.getTeacherById(teacherId);
      setTeacher(data);
      if (data.subjects.length > 0) {
        setFormData(prev => ({ ...prev, subject: data.subjects[0] }));
      }
    } catch (err) {
      setError('Failed to load teacher');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setShowPaypal(false); // reset PayPal if form changes
  };

  const validateForm = () => {
    if (!formData.subject || !formData.startTime || !formData.endTime) {
      setError('Please fill in all required fields');
      return false;
    }
    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    if (start >= end) {
      setError('End time must be after start time');
      return false;
    }
    if (calculatedPrice <= 0) {
      setError('Price must be greater than 0');
      return false;
    }
    return true;
  };

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    setError('');
    if (validateForm()) {
      setShowPaypal(true);
    }
  };

  const getDurationText = () => {
    if (!formData.startTime || !formData.endTime) return '';
    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    if (end <= start) return '';
    const durationMs = end - start;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} hr`;
    return `${hours} hr ${minutes} min`;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error || 'Teacher not found'}
      </div>
    );
  }

  const paypalClientId = process.env.REACT_APP_PAYPAL_CLIENT_ID || 'test';

  return (
    <PayPalScriptProvider options={{ 'client-id': paypalClientId, currency: 'USD' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Book a Lesson</h1>
        <p className="text-gray-600 mb-6">Schedule a lesson with {teacher.name}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Teacher Card */}
          <div className="card md:col-span-1">
            <h3 className="text-lg font-semibold mb-2">{teacher.name}</h3>
            <div className="flex items-center gap-1 mb-3">
              <span className="text-yellow-500">⭐</span>
              <span className="font-bold">{teacher.rating}</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{teacher.subjects.join(', ')}</p>
            <div className="text-2xl font-bold text-blue-600">${teacher.hourlyRate}/hr</div>

            {/* Price Preview */}
            {calculatedPrice > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Duration: {getDurationText()}</div>
                <div className="text-xl font-bold text-green-700">Total: ${calculatedPrice}</div>
              </div>
            )}
          </div>

          {/* Booking Form */}
          <div className="card md:col-span-2 space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            {/* Subject */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Subject</label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select a subject</option>
                {teacher.subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Start Date & Time</label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">End Date & Time</label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Notes (Optional)</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="input-field"
                placeholder="Tell the tutor what you'd like to focus on..."
                rows="3"
              />
            </div>

            {/* Step 1: Proceed to Payment Button */}
            {!showPaypal && (
              <button
                onClick={handleProceedToPayment}
                className="btn-primary w-full py-3 font-semibold"
              >
                {calculatedPrice > 0
                  ? `Proceed to Payment — $${calculatedPrice}`
                  : 'Proceed to Payment'}
              </button>
            )}

            {/* Step 2: PayPal Buttons */}
            {showPaypal && (
              <div>
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Paying</p>
                  <p className="text-2xl font-bold text-blue-700">${calculatedPrice}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.subject} · {getDurationText()} · with {teacher.name}
                  </p>
                </div>

                <PayPalButtons
                  style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' }}
                  forceReRender={[calculatedPrice, formData]}
                  createOrder={async (data, actions) => {
                    try {
                      const result = await paymentService.createPaypalOrder({
                        teacherId,
                        subject: formData.subject,
                        startTime: formData.startTime,
                        endTime: formData.endTime,
                        notes: formData.notes
                      });
                      return result.orderId;
                    } catch (err) {
                      setError('Failed to create PayPal order. Please try again.');
                      throw err;
                    }
                  }}
                  onApprove={async (data) => {
                    try {
                      setError('');
                      await paymentService.capturePaypalOrder(data.orderID, {
                        teacherId,
                        subject: formData.subject,
                        startTime: formData.startTime,
                        endTime: formData.endTime,
                        notes: formData.notes,
                        price: calculatedPrice
                      });
                      setSuccess('Payment successful! Your booking is confirmed. Redirecting...');
                      setTimeout(() => navigate('/my-bookings'), 2000);
                    } catch (err) {
                      setError('Payment was captured but booking creation failed. Contact support.');
                    }
                  }}
                  onError={(err) => {
                    console.error('PayPal error:', err);
                    setError('PayPal encountered an error. Please try again.');
                  }}
                  onCancel={() => {
                    setShowPaypal(false);
                    setError('Payment was cancelled.');
                  }}
                />

                <button
                  onClick={() => setShowPaypal(false)}
                  className="btn-secondary w-full py-2 mt-2 text-sm"
                >
                  ← Back to Edit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}

export default BookingPage;