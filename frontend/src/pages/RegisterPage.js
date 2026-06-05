import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    city: '',
    subjects: [],
    hourlyRate: '',
    goals: []
  });
  const [certificateFile, setCertificateFile] = useState(null);
  const [isSubmittedTeacher, setIsSubmittedTeacher] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const CITIES = [
    'Astana', 'Almaty', 'Shymkent', 'Karaganda', 'Aktobe', 'Taraz',
    'Pavlodar', 'Ust-Kamenogorsk', 'Semey', 'Atyrau', 'Kyzylorda',
    'Kostanay', 'Uralsk', 'Petropavlovsk', 'Aktau', 'Turkistan',
    'Kokshetau', 'Temirtau', 'Taldykorgan', 'Ekibastuz'
  ];

  const SUBJECTS = [
    'Algebra', 'Geometry',
    'Physics', 'Chemistry', 'Biology',
    'History', 'Geography', 'Social Studies',
    'Literature', 'English', 'French', 'Spanish',
    'Art', 'Music', 'Physical Education'
  ];

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (role === 'teacher') {
      if (formData.subjects.length === 0) {
        setError('Please select at least one subject');
        return;
      }
      if (!certificateFile) {
        setError('Please upload a supporting certificate');
        return;
      }
    }

    setLoading(true);

    try {
      const res = await register(
        formData.name,
        formData.email,
        formData.password,
        role,
        formData.city,
        formData.subjects,
        formData.hourlyRate ? parseInt(formData.hourlyRate) : 0,
        formData.goals,
        certificateFile
      );

      if (res && res.isPendingTeacher) {
        setIsSubmittedTeacher(true);
      } else if (role === 'student') {
        navigate('/dashboard');
      } else {
        navigate('/teacher-dashboard');
      }
    } catch (err) {
      setError(err.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isSubmittedTeacher) {
    return (
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="container mx-auto max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 text-3xl font-bold">
              ✓
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Application Submitted!</h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              Your teacher registration application has been successfully submitted and is awaiting administrator moderation.
              We will verify your data and certificate shortly.
            </p>
            <p className="text-gray-500">
              You will be able to log in to your account using the specified email and password immediately after your application is approved.
            </p>
            <div className="pt-4">
              <Link to="/login" className="btn-primary px-6 py-3 font-semibold text-white inline-block rounded shadow hover:bg-blue-700 transition">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2">Create Account</h1>
          <p className="text-center text-gray-600 mb-6">Join our learning community</p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-gray-700 font-semibold mb-3">I am a:</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="student"
                    checked={role === 'student'}
                    onChange={(e) => setRole(e.target.value)}
                    className="mr-2"
                  />
                  <span>Student</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="teacher"
                    checked={role === 'teacher'}
                    onChange={(e) => setRole(e.target.value)}
                    className="mr-2"
                  />
                  <span>Teacher/Mentor</span>
                </label>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                placeholder="John Doe"
                required
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">City</label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select your city</option>
                {CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="your@email.com"
                required
              />
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Teacher Specific Fields */}
            {role === 'teacher' && (
              <>
                {/* Subjects */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-3">What do you teach? (select at least one)</label>
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
                    placeholder="25"
                    min="0"
                  />
                </div>

                {/* Certificate Upload */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Supporting Certificate (PDF, JPG, PNG)</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setCertificateFile(e.target.files[0])}
                    className="w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Please upload a document confirming your teacher qualification. Max size: 5MB.
                  </p>
                </div>
              </>
            )}

            {/* Student Specific Fields */}
            {role === 'student' && (
              <div>
                <label className="block text-gray-700 font-semibold mb-3">What are your learning goals?</label>
                <textarea
                  name="goals"
                  value={formData.goals.join('\n')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    goals: e.target.value.split('\n').filter(g => g.trim())
                  }))}
                  className="input-field"
                  placeholder="Learn JavaScript&#10;Master React&#10;Build projects"
                  rows="4"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 font-semibold disabled:opacity-50"
            >
              {loading ? 'Submitting...' : role === 'teacher' ? 'Submit Application' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-gray-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;