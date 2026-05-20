import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as teacherService from '../services/teacherService';
import { useAuth } from '../hooks/useAuth';

const SUBJECTS = [
  'Algebra', 'Geometry',
  'Physics', 'Chemistry', 'Biology',
  'History', 'Geography', 'Social Studies',
  'Literature', 'English', 'French', 'Spanish',
  'Art', 'Music', 'Physical Education'
];

function SearchTeachersPage() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    subject: '',
    search: '',
    minRating: '',
    maxPrice: '',
    city: user?.city || '',
    smartMatch: false
  });

  useEffect(() => {
    if (user?.city) {
      setFilters(prev => ({ ...prev, city: user.city }));
      fetchTeachers({ ...filters, city: user.city });
    } else {
      fetchTeachers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchTeachers = async (appliedFilters = filters) => {
    try {
      setLoading(true);
      setError('');
      const data = await teacherService.getAllTeachers(appliedFilters);
      setTeachers(data);
    } catch (err) {
      setError('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTeachers(filters);
  };

  const handleReset = () => {
    setFilters({
      subject: '',
      search: '',
      minRating: '',
      maxPrice: '',
      city: '',
      smartMatch: false
    });
    fetchTeachers({});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Find Your Perfect Tutor</h1>
        <p className="text-gray-600">Browse and filter tutors by subject, rating, and price</p>
      </div>

      {/* Filters */}
      <div className="card">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Subject Filter */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Subject</label>
              <select
                name="subject"
                value={filters.subject}
                onChange={handleFilterChange}
                className="input-field"
              >
                <option value="">All Subjects</option>
                {SUBJECTS.map(subject => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Filter */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Search</label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                className="input-field"
                placeholder="Tutor name..."
              />
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Min Rating</label>
              <select
                name="minRating"
                value={filters.minRating}
                onChange={handleFilterChange}
                className="input-field"
              >
                <option value="">Any</option>
                <option value="3">3+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="5">5 Stars</option>
              </select>
            </div>

            {/* Price Filter */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Max Price</label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className="input-field"
                placeholder="Maximum hourly rate"
                min="0"
              />
            </div>

            {/* City Filter */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">City</label>
              <input
                type="text"
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
                className="input-field"
                placeholder="City..."
              />
            </div>
          </div>

          {/* Buttons and Toggles flex container */}
          <div className="flex items-center justify-between gap-4 flex-wrap mt-4">
            <div className="flex gap-2">
              <button
                type="submit"
                className="btn-primary px-6 py-2"
              >
                🔍 Search
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary px-6 py-2"
              >
                Reset
              </button>
            </div>

            <label className="flex items-center cursor-pointer gap-2 select-none group">
              <input
                type="checkbox"
                name="smartMatch"
                checked={filters.smartMatch}
                onChange={handleFilterChange}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-blue-800 font-bold bg-blue-100 px-4 py-2 rounded-full text-sm flex items-center gap-2 group-hover:bg-blue-200 transition-colors shadow-sm">
                Smart Match
              </span>
            </label>
          </div>
        </form>
      </div>

      {/* Results */}
      <div>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : teachers.length === 0 ? (
          <div className="card text-center text-gray-600 py-8">
            <p>No tutors found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-4">
              Found <strong>{teachers.length}</strong> tutor{teachers.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teachers.map(teacher => (
                <div key={teacher._id} className="card hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-3">
                      {teacher.avatar ? (
                        <img
                          src={teacher.avatar}
                          alt={teacher.name}
                          className="h-12 w-12 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                          {teacher.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold">{teacher.name}</h3>
                          {teacher.isOnline && (
                            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                              Online
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{teacher.subjects.join(', ')}</p>
                        {teacher.yearsOfExperience > 0 && (
                          <p className="text-xs text-purple-600 font-semibold mt-1">
                            {teacher.yearsOfExperience}+ yrs experience
                          </p>
                        )}
                      </div>
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
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchTeachersPage;