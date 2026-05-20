import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import * as userService from '../services/userService';
import * as reviewService from '../services/reviewService';
import * as bookingService from '../services/bookingService';

const SUBJECTS = [
  'Algebra', 'Geometry',
  'Physics', 'Chemistry', 'Biology',
  'History', 'Geography', 'Social Studies',
  'Literature', 'English', 'French', 'Spanish',
  'Art', 'Music', 'Physical Education'
];

function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar: '',
    subjects: [],
    hourlyRate: '',
    goals: [],
    level: 'beginner',
    yearsOfExperience: 0,
    isOnline: false
  });
  const [reviews, setReviews] = useState([]);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [certError, setCertError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      console.log('Fetching profile...');
      const profileData = await userService.getMyProfile();
      setProfile(profileData);
      setFormData({
        name: profileData.name || '',
        bio: profileData.bio || '',
        avatar: profileData.avatar || '',
        subjects: profileData.subjects || [],
        hourlyRate: profileData.hourlyRate || '',
        goals: profileData.goals || [],
        level: profileData.level || 'beginner',
        yearsOfExperience: profileData.yearsOfExperience || 0,
        isOnline: profileData.isOnline || false
      });

      // Fetch reviews based on role
      if (profileData.role === 'teacher' && profileData._id) {
        fetchReviews(profileData._id);
        fetchBookings();
      } else if (profileData.role === 'student') {
        // Fetch student stats
        try {
          console.log('Fetching student stats...');
          const studentStats = await userService.getStudentStats();
          console.log('Stats fetched:', studentStats);
          setStats(studentStats);
        } catch (e) {
          console.error('Failed to load student stats', e);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load profile');
      setLoading(false);
    }
  };

  const fetchReviews = async (teacherId) => {
    try {
      console.log('[DEBUG] Fetching reviews for teacher:', teacherId);
      const data = await reviewService.getTeacherReviews(teacherId);
      console.log('[DEBUG] Fetched reviews:', data);
      setReviews(data);
    } catch (err) {
      console.error('Failed to load reviews', err);
    }
  };

  const fetchBookings = async () => {
    try {
      const data = await bookingService.getMyBookings();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings', err);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      await reviewService.deleteReview(reviewId);
      if (profile?._id) {
        fetchReviews(profile._id);
      }
    } catch (err) {
      console.error('Failed to delete review:', err);
      alert('Failed to delete review');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubjectToggle = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleGoalToggle = (goal) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const updateData = {
        name: formData.name,
        bio: formData.bio,
        avatar: formData.avatar
      };

      if (user?.role === 'teacher') {
        updateData.subjects = formData.subjects;
        updateData.hourlyRate = formData.hourlyRate ? parseInt(formData.hourlyRate) : 0;
        updateData.yearsOfExperience = parseInt(formData.yearsOfExperience) || 0;
        updateData.isOnline = formData.isOnline;
      } else {
        updateData.goals = formData.goals;
        updateData.level = formData.level;
      }

      const response = await userService.updateProfile(updateData);
      updateUser(response.user);
      setProfile(response.user);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCertificateUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setCertError('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setCertError('Only PDF, JPG, JPEG, and PNG files are allowed');
      return;
    }

    setCertError('');
    setUploadingCert(true);

    try {
      const response = await userService.uploadCertificate(file);
      setProfile(response.user);
      setSuccess('Certificate uploaded successfully!');
      e.target.value = ''; // Reset file input
    } catch (err) {
      setCertError(err.error || 'Failed to upload certificate');
    } finally {
      setUploadingCert(false);
    }
  };

  const handleDeleteCertificate = async (certId) => {
    if (!window.confirm('Are you sure you want to delete this certificate?')) return;

    try {
      const response = await userService.deleteCertificate(certId);
      setProfile(response.user);
      setSuccess('Certificate deleted successfully!');
    } catch (err) {
      setError('Failed to delete certificate');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">My Profile</h1>
      <p className="text-gray-600 mb-6">Manage your profile information</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="card space-y-6">
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

            {/* Name */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="input-field"
                placeholder="Tell students about yourself..."
                rows="4"
              />
            </div>

            {/* Avatar */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Avatar URL</label>
              <input
                type="url"
                name="avatar"
                value={formData.avatar}
                onChange={handleChange}
                className="input-field"
                placeholder="https://example.com/avatar.jpg"
              />
              {formData.avatar && (
                <div className="mt-3">
                  <img
                    src={formData.avatar}
                    alt="Avatar Preview"
                    className="h-24 w-24 rounded-lg object-cover"
                    onError={() => setError('Invalid image URL')}
                  />
                </div>
              )}
            </div>

            {/* Teacher Specific Fields */}
            {user?.role === 'teacher' && (
              <>
                {/* Subjects */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-3">Teaching Subjects</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {SUBJECTS.map(subject => (
                      <label key={subject} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.subjects.includes(subject)}
                          onChange={() => handleSubjectToggle(subject)}
                          className="mr-2"
                        />
                        <span className="text-sm">{subject}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Hourly Rate */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Hourly Rate ($)</label>
                  <input
                    type="number"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleChange}
                    className="input-field"
                    min="0"
                  />
                </div>

                {/* Years of Experience */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Years of Experience</label>
                  <input
                    type="number"
                    name="yearsOfExperience"
                    value={formData.yearsOfExperience}
                    onChange={handleChange}
                    className="input-field"
                    min="0"
                    max="70"
                  />
                </div>

                {/* Online Status Toggle */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isOnline}
                      onChange={(e) => setFormData(prev => ({ ...prev, isOnline: e.target.checked }))}
                      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <div>
                      <span className="text-gray-700 font-semibold">Online Status</span>
                      <p className="text-sm text-gray-500">
                        {formData.isOnline ? (
                          <span className="text-green-600">✓ You appear online to students</span>
                        ) : (
                          <span className="text-gray-500">○ You appear offline to students</span>
                        )}
                      </p>
                    </div>
                  </label>
                </div>

                {/* Certificates Section */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Certificates & Diplomas</label>

                  {certError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-3 text-sm">
                      {certError}
                    </div>
                  )}

                  <div className="mb-3">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleCertificateUpload}
                      disabled={uploadingCert}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload PDF, JPG, JPEG, or PNG (max 5MB)</p>
                  </div>

                  {profile?.certificates && profile.certificates.length > 0 && (
                    <div className="space-y-2">
                      {profile.certificates.map((cert) => (
                        <div key={cert._id} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {cert.filename.endsWith('.pdf') ? '📄' : '🖼️'}
                            </span>
                            <div>
                              <p className="font-medium text-sm">{cert.filename}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(cert.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={`http://localhost:5000${cert.url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                            >
                              View
                            </a>
                            <button
                              onClick={() => handleDeleteCertificate(cert._id)}
                              className="text-red-500 hover:text-red-700 text-sm font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Student Specific Fields */}
            {user?.role === 'student' && (
              <>
                <div>
                  <label className="block text-gray-700 font-semibold mb-3">Learning Goals (Subjects to learn)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {SUBJECTS.map(subject => (
                      <label key={subject} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.goals.includes(subject)}
                          onChange={() => handleGoalToggle(subject)}
                          className="mr-2"
                        />
                        <span className="text-sm">{subject}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-gray-700 font-semibold mb-2">Current Level</label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full py-3 font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>

          {/* Reviews Section for Teachers */}
          {user?.role === 'teacher' && (
            <div className="mt-6">
              <h2 className="text-2xl font-bold mb-6">Student Reviews ({reviews.length})</h2>

              {reviews.length === 0 ? (
                <div className="card text-center text-gray-600 py-8">
                  <p>No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review._id} className="card">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{review.studentId?.name || 'Anonymous Student'}</h3>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                          <button
                            onClick={() => handleDeleteReview(review._id)}
                            className="text-red-500 hover:text-red-700 text-sm font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Statistics Sidebar */}
        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <h2 className="text-xl font-bold mb-4">Statistics</h2>

            {user?.role === 'teacher' ? (
              <div className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{bookings.length}</div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                </div>

                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-3xl font-bold text-yellow-600">{pendingBookings.length}</div>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{confirmedBookings.length}</div>
                  <p className="text-sm text-gray-600">Confirmed</p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">{profile?.rating || 0}</div>
                  <p className="text-sm text-gray-600">⭐ Rating</p>
                </div>

                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-3xl font-bold text-indigo-600">{reviews.length}</div>
                  <p className="text-sm text-gray-600">Reviews</p>
                </div>

              </div>
            ) : (
              <div className="space-y-4">
                {stats ? (
                  <>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">{stats.totalHours}</div>
                      <p className="text-sm text-gray-600">Total Hours</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">{stats.classesCompleted}</div>
                      <p className="text-sm text-gray-600">Classes Completed</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-xl font-bold text-purple-600 truncate">{stats.topSubject}</div>
                      <p className="text-sm text-gray-600">Top Subject</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-3xl font-bold text-yellow-600">${stats.totalSpent}</div>
                      <p className="text-sm text-gray-600">Total Spent</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-100 rounded-lg">
                      <div className="text-3xl font-bold text-yellow-700">{user?.points || 0}</div>
                      <p className="text-sm text-gray-600">Points</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-3xl font-bold text-purple-600">{user?.achievements?.length || 0}</div>
                      <p className="text-sm text-gray-600">Achievements</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500 py-4">Loading stats...</div>
                )}
              </div>
            )}

            {/* Achievements Display for Student */}
            {user?.role === 'student' && user?.achievements && user.achievements.length > 0 && (
              <div className="mt-8">
                <h3 className="font-bold text-lg text-gray-800 border-b pb-2 mb-4">My Achievements</h3>
                <div className="flex flex-wrap gap-2">
                  {user.achievements.map((ach, idx) => (
                    <span key={idx} className="bg-purple-100 text-purple-800 border border-purple-200 px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1 shadow-sm w-full sm:w-auto">
                      {ach}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Available Tests block for Student */}
            {user?.role === 'student' && (
              <div className="mt-8 space-y-4">
                 <h3 className="font-bold text-lg text-gray-800 border-b pb-2">Level Tests</h3>
                 <p className="text-sm text-gray-600 mb-4">
                   Ready to challenge yourself? Browse our extensive catalog of tests for all subjects and levels to earn points and achievements!
                 </p>
                 <Link to="/tests" className="btn-primary w-full py-3 flex justify-center items-center gap-2">
                   <span>Browse All Tests</span>
                   <span>→</span>
                 </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;