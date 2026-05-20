import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import * as teacherService from '../services/teacherService';
import * as userService from '../services/userService';

function StudentDashboard() {
  const { user } = useAuth();
  const [topTeachers, setTopTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const teachers = await teacherService.getTopRatedTeachers(6);
      setTopTeachers(teachers);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8">
        <h1 className="text-4xl font-bold mb-2">Welcome, {user?.name}!</h1>
        <p className="text-lg">Find your perfect tutor and start learning today</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/search-teachers"
          className="card text-center hover:shadow-xl cursor-pointer"
        >
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-xl font-semibold">Find Tutors</h3>
          <p className="text-gray-600 text-sm">Search and filter tutors by subject</p>
        </Link>

        <Link
          to="/my-bookings"
          className="card text-center hover:shadow-xl cursor-pointer"
        >
          <div className="text-4xl mb-3">📅</div>
          <h3 className="text-xl font-semibold">My Bookings</h3>
          <p className="text-gray-600 text-sm">View and manage your lessons</p>
        </Link>

        <Link
          to="/profile"
          className="card text-center hover:shadow-xl cursor-pointer"
        >
          <div className="text-4xl mb-3">👤</div>
          <h3 className="text-xl font-semibold">My Profile</h3>
          <p className="text-gray-600 text-sm">Edit your profile and goals</p>
        </Link>
        <Link
          to="/tests"
          className="card text-center hover:shadow-xl cursor-pointer border border-blue-200 bg-blue-50"
        >
          <div className="text-4xl mb-3"></div>
          <h3 className="text-xl font-semibold text-blue-800">Test Directory</h3>
          <p className="text-blue-600 text-sm">Find tests, challenge yourself, earn points</p>
        </Link>
      </div>

      {/* Top Rated Teachers */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">⭐ Top Rated Tutors</h2>
          <Link
            to="/search-teachers"
            className="text-blue-600 hover:underline font-semibold"
          >
            View All
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topTeachers.map(teacher => (
              <div key={teacher._id} className="card hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">{teacher.name}</h3>
                    <p className="text-sm text-gray-600">{teacher.subjects.join(', ')}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-bold">{teacher.rating}</span>
                    </div>
                    <p className="text-xs text-gray-500">{teacher.reviewCount} reviews</p>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{teacher.bio}</p>

                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-blue-600">${teacher.hourlyRate}/hr</span>
                  <Link
                    to={`/teacher/${teacher._id}`}
                    className="btn-primary text-sm px-3 py-2"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;