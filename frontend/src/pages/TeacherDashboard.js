import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import * as bookingService from '../services/bookingService';
import * as userService from '../services/userService';

function TeacherDashboard() {
  const { user, updateUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState(user);

  useEffect(() => {
    fetchBookings();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await userService.getMyProfile();
      setProfileData(data);
      updateUser(data);
    } catch (err) {
      console.error('Failed to load profile data:', err);
    }
  };

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

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await bookingService.updateBookingStatus(bookingId, newStatus);
      setBookings(prev =>
        prev.map(b =>
          b._id === bookingId ? { ...b, status: newStatus } : b
        )
      );
    } catch (err) {
      alert('Failed to update booking status');
    }
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const completedBookings = bookings.filter(b => b.status === 'completed');

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white rounded-lg p-8">
        <h1 className="text-4xl font-bold mb-2">Welcome, {profileData?.name}!</h1>
        <p className="text-lg">Manage your lessons and connect with students</p>

      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link
          to="/profile"
          className="btn-primary px-6 py-3"
        >
          Edit Profile
        </Link>
        <Link
          to="/my-bookings"
          className="btn-secondary px-6 py-3"
        >
          View All Bookings
        </Link>
      </div>

      {/* Pending Bookings */}
      <div>
        <h2 className="text-2xl font-bold mb-4">⏳ Pending Booking Requests</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : pendingBookings.length === 0 ? (
          <div className="card text-center text-gray-600">
            <p>No pending booking requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingBookings.map(booking => (
              <div key={booking._id} className="card flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{booking.studentId?.name}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(booking.startTime).toLocaleString()} - {booking.subject}
                  </p>
                  {booking.notes && (
                    <p className="text-sm text-gray-500 mt-1">Note: {booking.notes}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange(booking._id, 'confirmed')}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleStatusChange(booking._id, 'cancelled')}
                    className="btn-danger px-4 py-2 text-sm"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmed Bookings */}
      <div>
        <h2 className="text-2xl font-bold mb-4">✅ Confirmed Lessons</h2>
        {confirmedBookings.length === 0 ? (
          <div className="card text-center text-gray-600">
            <p>No confirmed lessons</p>
          </div>
        ) : (
          <div className="space-y-4">
            {confirmedBookings.map(booking => (
              <div key={booking._id} className="card flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{booking.studentId?.name}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(booking.startTime).toLocaleString()} - {booking.subject}
                  </p>
                </div>
                <Link
                  to={`/chat/${booking._id}`}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  Open Chat
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherDashboard;