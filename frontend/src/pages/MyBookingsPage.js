import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import * as bookingService from '../services/bookingService';

function MyBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getMyBookings();
      setBookings(data);
    } catch (err) {
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await bookingService.cancelBooking(bookingId);
        setBookings(prev => prev.map(b =>
          b._id === bookingId ? { ...b, status: 'cancelled' } : b
        ));
      } catch (err) {
        alert('Failed to cancel booking');
      }
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await bookingService.updateBookingStatus(bookingId, newStatus);
      setBookings(prev => prev.map(b =>
        b._id === bookingId ? { ...b, status: newStatus } : b
      ));
    } catch (err) {
      alert('Failed to update booking');
    }
  };

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filter);

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-300';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
        <p className="text-gray-600">Manage your lessons and bookings</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="card text-center text-gray-600 py-8">
          <p>No bookings found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map(booking => (
            <div key={booking._id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">
                    {user?.role === 'student' ? booking.teacherId?.name : booking.studentId?.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    📚 {booking.subject}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    📅 {new Date(booking.startTime).toLocaleString()}
                  </p>
                  {booking.notes && (
                    <p className="text-sm text-gray-500 mt-2">
                      <strong>Notes:</strong> {booking.notes}
                    </p>
                  )}
                </div>

                {/* Status Badge */}
                <div className={`px-3 py-1 rounded-full border font-semibold text-sm ${getStatusColor(booking.status)}`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {booking.status === 'confirmed' && (
                  <Link
                    to={`/chat/${booking._id}`}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    💬 Open Chat
                  </Link>
                )}

                {booking.status === 'pending' && user?.role === 'teacher' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(booking._id, 'confirmed')}
                      className="btn-primary px-4 py-2 text-sm"
                    >
                      ✅ Confirm
                    </button>
                    <button
                      onClick={() => handleCancel(booking._id)}
                      className="btn-danger px-4 py-2 text-sm"
                    >
                      ❌ Decline
                    </button>
                  </>
                )}

                {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                  <button
                    onClick={() => handleCancel(booking._id)}
                    className="btn-danger px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                )}

                {booking.status === 'confirmed' && (
                  <Link
                    to={`/teacher/${user?.role === 'student' ? booking.teacherId?._id : booking.studentId?._id}`}
                    className="btn-secondary px-4 py-2 text-sm"
                  >
                    👤 View Profile
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyBookingsPage;