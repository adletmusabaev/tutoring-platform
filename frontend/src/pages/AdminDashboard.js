import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as adminService from '../services/adminService';

const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
];

const createEmptyQuestion = () => ({
  question: '',
  options: ['', '', '', ''],
  correctAnswer: 0
});

const formatLevel = (level) => level ? level.charAt(0).toUpperCase() + level.slice(1) : '';

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab and modal states
  const [activeTab, setActiveTab] = useState('users');
  const [selectedApp, setSelectedApp] = useState(null);
  const [appActionLoading, setAppActionLoading] = useState(false);
  const [testActionLoading, setTestActionLoading] = useState(false);
  const [testForm, setTestForm] = useState({
    title: '',
    subject: '',
    level: 'beginner',
    description: '',
    questions: [createEmptyQuestion()]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData, appsData, testsData] = await Promise.all([
        adminService.getStats(),
        adminService.getAllUsers(),
        adminService.getPendingApplications(),
        adminService.getTests()
      ]);
      setStats(statsData);
      setUsers(usersData);
      setApplications(appsData);
      setTests(testsData);
    } catch (err) {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      await adminService.deleteUser(userId);
      setUsers(prev => prev.filter(u => u._id !== userId));
      // Refresh stats
      const statsData = await adminService.getStats();
      setStats(statsData);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleApproveApp = async (appId) => {
    if (!window.confirm('Approve this teacher\'s application? An account will be created.')) return;
    
    try {
      setAppActionLoading(true);
      await adminService.approveApplication(appId);
      setApplications(prev => prev.filter(a => a._id !== appId));
      setSelectedApp(null);
      alert('Application successfully approved! Teacher account created.');
      
      // Refresh user list and stats
      const [statsData, usersData] = await Promise.all([
        adminService.getStats(),
        adminService.getAllUsers()
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (err) {
      alert(err.response?.data?.error || err.error || 'Error approving application');
    } finally {
      setAppActionLoading(false);
    }
  };

  const updateTestField = (field, value) => {
    setTestForm(prev => ({ ...prev, [field]: value }));
  };

  const updateQuestionField = (questionIndex, field, value) => {
    setTestForm(prev => ({
      ...prev,
      questions: prev.questions.map((question, index) => (
        index === questionIndex ? { ...question, [field]: value } : question
      ))
    }));
  };

  const updateOptionField = (questionIndex, optionIndex, value) => {
    setTestForm(prev => ({
      ...prev,
      questions: prev.questions.map((question, index) => {
        if (index !== questionIndex) return question;

        return {
          ...question,
          options: question.options.map((option, optIndex) => (
            optIndex === optionIndex ? value : option
          ))
        };
      })
    }));
  };

  const addQuestion = () => {
    setTestForm(prev => ({
      ...prev,
      questions: [...prev.questions, createEmptyQuestion()]
    }));
  };

  const removeQuestion = (questionIndex) => {
    setTestForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, index) => index !== questionIndex)
    }));
  };

  const handleCreateTest = async (event) => {
    event.preventDefault();

    try {
      setTestActionLoading(true);
      const newTest = await adminService.createTest(testForm);
      setTests(prev => [newTest, ...prev]);
      setTestForm({
        title: '',
        subject: '',
        level: 'beginner',
        description: '',
        questions: [createEmptyQuestion()]
      });
      alert('Test created successfully.');
    } catch (err) {
      alert(err.error || 'Failed to create test');
    } finally {
      setTestActionLoading(false);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Delete this test? Students will no longer see it.')) return;

    try {
      await adminService.deleteTest(testId);
      setTests(prev => prev.filter(test => test._id !== testId));
    } catch (err) {
      alert(err.error || 'Failed to delete test');
    }
  };

  const handleRejectApp = async (appId) => {
    if (!window.confirm('Reject this application? The certificate file will be deleted from the server.')) return;
    
    try {
      setAppActionLoading(true);
      await adminService.rejectApplication(appId);
      setApplications(prev => prev.filter(a => a._id !== appId));
      setSelectedApp(null);
      alert('Application successfully rejected.');
    } catch (err) {
      alert(err.response?.data?.error || err.error || 'Error rejecting application');
    } finally {
      setAppActionLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
        <p className="text-gray-600 mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
          <p className="text-gray-600">User management and teacher application moderation</p>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow">
          {error}
        </div>
      )}

      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="card text-center bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
            <div className="text-sm font-semibold text-gray-500 mt-1">Total Users</div>
          </div>
          <div className="card text-center bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="text-3xl font-bold text-green-600">{stats.studentsCount}</div>
            <div className="text-sm font-semibold text-gray-500 mt-1">Students</div>
          </div>
          <div className="card text-center bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="text-3xl font-bold text-purple-600">{stats.teachersCount}</div>
            <div className="text-sm font-semibold text-gray-500 mt-1">Teachers</div>
          </div>
          <div className="card text-center bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="text-3xl font-bold text-yellow-600">{stats.totalBookings}</div>
            <div className="text-sm font-semibold text-gray-500 mt-1">Total Bookings</div>
          </div>
          <div className="card text-center bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="text-3xl font-bold text-indigo-600">{stats.completedBookings}</div>
            <div className="text-sm font-semibold text-gray-500 mt-1">Completed</div>
          </div>
          <div className="card text-center bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="text-3xl font-bold text-emerald-600">${stats.totalRevenue}</div>
            <div className="text-sm font-semibold text-gray-500 mt-1">Revenue</div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-lg shadow-sm px-4 pt-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-6 font-semibold border-b-2 text-sm transition ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-blue-600'
          }`}
        >
          User Management ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`py-3 px-6 font-semibold border-b-2 text-sm transition flex items-center gap-2 ${
            activeTab === 'applications'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-blue-600'
          }`}
        >
          Teacher Applications
          {applications.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
              {applications.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`py-3 px-6 font-semibold border-b-2 text-sm transition ${
            activeTab === 'tests'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-blue-600'
          }`}
        >
          Tests ({tests.length})
        </button>
      </div>

      {/* Users Management Tab */}
      {activeTab === 'users' && (
        <div className="card bg-white rounded-b-lg shadow-sm border-t-0 p-6 overflow-hidden">
          <h2 className="text-xl font-bold mb-4 text-gray-800">User List</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Registration Date</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {u.avatar ? (
                            <img className="h-10 w-10 rounded-full object-cover border" src={u.avatar} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                              {u.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{u.name}</div>
                          <div className="text-sm text-gray-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        u.role === 'admin' ? 'bg-red-100 text-red-800' :
                        u.role === 'teacher' ? 'bg-green-100 text-green-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {u.role !== 'admin' && (
                        <button 
                          onClick={() => handleDeleteUser(u._id)}
                          className="text-red-600 hover:text-red-900 font-bold hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tests Management Tab */}
      {activeTab === 'tests' && (
        <div className="card bg-white rounded-b-lg shadow-sm border-t-0 p-6 overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-8">
            <form onSubmit={handleCreateTest} className="lg:w-1/2 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Create Test</h2>
                <p className="text-sm text-gray-500">Set the test title, subject, level, and questions.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Test Title</label>
                  <input
                    type="text"
                    value={testForm.title}
                    onChange={(e) => updateTestField('title', e.target.value)}
                    className="input-field w-full"
                    placeholder="Example: Algebra Basics"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">Subject</label>
                  <input
                    type="text"
                    value={testForm.subject}
                    onChange={(e) => updateTestField('subject', e.target.value)}
                    className="input-field w-full"
                    placeholder="Example: Algebra"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Level</label>
                <select
                  value={testForm.level}
                  onChange={(e) => updateTestField('level', e.target.value)}
                  className="input-field w-full"
                >
                  {LEVEL_OPTIONS.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Description</label>
                <textarea
                  value={testForm.description}
                  onChange={(e) => updateTestField('description', e.target.value)}
                  className="input-field w-full min-h-[90px]"
                  placeholder="Short description shown in the test directory."
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">Questions</h3>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-100"
                  >
                    Add Question
                  </button>
                </div>

                {testForm.questions.map((question, questionIndex) => (
                  <div key={questionIndex} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-700">Question {questionIndex + 1}</span>
                      {testForm.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(questionIndex)}
                          className="text-red-600 text-sm font-bold hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={question.question}
                      onChange={(e) => updateQuestionField(questionIndex, 'question', e.target.value)}
                      className="input-field w-full"
                      placeholder="Question text"
                      required
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {question.options.map((option, optionIndex) => (
                        <label key={optionIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${questionIndex}`}
                            checked={question.correctAnswer === optionIndex}
                            onChange={() => updateQuestionField(questionIndex, 'correctAnswer', optionIndex)}
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOptionField(questionIndex, optionIndex, e.target.value)}
                            className="input-field w-full"
                            placeholder={`Option ${optionIndex + 1}`}
                            required
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="btn-primary px-6 py-3 disabled:opacity-50"
                disabled={testActionLoading}
              >
                {testActionLoading ? 'Creating...' : 'Create Test'}
              </button>
            </form>

            <div className="lg:w-1/2">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Existing Tests</h2>
              {tests.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="font-medium">No custom tests yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tests.map(test => (
                    <div key={test._id} className="border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-900">{test.title}</h3>
                          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-blue-700">
                            {formatLevel(test.level)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{test.subject}</p>
                        <p className="text-xs text-gray-500 mt-1">{test.questions?.length || 0} questions</p>
                      </div>
                      <button
                        onClick={() => handleDeleteTest(test._id)}
                        className="text-red-600 hover:text-red-900 font-bold text-sm hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Applications Management Tab */}
      {activeTab === 'applications' && (
        <div className="card bg-white rounded-b-lg shadow-sm border-t-0 p-6 overflow-hidden">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Applications for Moderation</h2>
          {applications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <span className="text-4xl">🎉</span>
              <p className="mt-2 font-medium">No active applications for moderation</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidate</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">City</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subjects</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rate</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{app.name}</div>
                          <div className="text-sm text-gray-500">{app.email}</div>
                          <span className="text-xs text-gray-400">
                            Submitted: {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {app.city}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {app.subjects.map(sub => (
                            <span key={sub} className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100">
                              {sub}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-800">
                        ${app.hourlyRate}/hr
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold space-x-3">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="text-blue-600 hover:text-blue-900 font-bold hover:underline"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleApproveApp(app._id)}
                          className="text-green-600 hover:text-green-900 font-bold hover:underline"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectApp(app._id)}
                          className="text-red-600 hover:text-red-900 font-bold hover:underline"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Application Detail Viewer Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300">
            {/* Modal Header */}
            <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Teacher Application</h3>
                <p className="text-sm text-gray-500">Detailed view and certificate verification</p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold focus:outline-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Basic Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                    <div>
                      <span className="text-xs text-gray-400 block">Teacher Full Name</span>
                      <span className="font-semibold text-gray-800 text-base">{selectedApp.name}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block">Email Address</span>
                      <span className="text-gray-700">{selectedApp.email}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block">City</span>
                      <span className="text-gray-700">{selectedApp.city}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block">Desired Hourly Rate</span>
                      <span className="font-bold text-gray-800">${selectedApp.hourlyRate}/hr</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400 block">Submission Date</span>
                      <span className="text-sm text-gray-500">
                        {new Date(selectedApp.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider pt-2">Subjects Taught</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedApp.subjects.map(sub => (
                      <span key={sub} className="bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full border border-blue-100 text-xs">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Certificate Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Supporting Certificate</h4>
                  
                  {selectedApp.certificates && selectedApp.certificates.length > 0 ? (
                    selectedApp.certificates.map((cert, index) => {
                      const isImage = /\.(jpg|jpeg|png)$/i.test(cert.filename);
                      const fileUrl = `http://localhost:5000${cert.url}`;

                      return (
                        <div key={index} className="space-y-3">
                          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 p-3 rounded-lg">
                            <span className="text-2xl">{isImage ? '🖼️' : '📄'}</span>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-xs text-blue-800 truncate">{cert.filename}</p>
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-xs font-bold hover:underline block mt-0.5"
                              >
                                Open in new tab ↗
                              </a>
                            </div>
                          </div>

                          {/* Image preview */}
                          {isImage ? (
                            <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-2 flex items-center justify-center">
                              <img
                                className="max-h-64 object-contain rounded cursor-zoom-in hover:scale-[1.02] transition duration-300"
                                src={fileUrl}
                                alt="Certificate Preview"
                                onClick={() => window.open(fileUrl, '_blank')}
                              />
                            </div>
                          ) : (
                            <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                              <span className="text-4xl block mb-2">📄</span>
                              <p className="text-sm font-semibold text-gray-700">PDF Format File</p>
                              <p className="text-xs text-gray-500 mt-1 mb-4">PDF preview is not available in this window.</p>
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-600 text-white font-semibold text-xs px-4 py-2 rounded shadow hover:bg-blue-700 transition"
                              >
                                View PDF document
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="bg-yellow-50 text-yellow-800 border border-yellow-100 p-4 rounded-lg text-center text-sm">
                      ⚠️ Certificate was not uploaded.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 px-6 py-4 flex justify-between items-center bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold transition"
                disabled={appActionLoading}
              >
                Close
              </button>
              
              <div className="space-x-3">
                <button
                  onClick={() => handleRejectApp(selectedApp._id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition shadow disabled:opacity-50"
                  disabled={appActionLoading}
                >
                  {appActionLoading ? 'Processing...' : 'Reject Application'}
                </button>
                <button
                  onClick={() => handleApproveApp(selectedApp._id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition shadow disabled:opacity-50"
                  disabled={appActionLoading}
                >
                  {appActionLoading ? 'Processing...' : 'Approve & Create Account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
