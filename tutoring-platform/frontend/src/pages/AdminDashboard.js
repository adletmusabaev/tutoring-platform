import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as adminService from '../services/adminService';

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData] = await Promise.all([
        adminService.getStats(),
        adminService.getAllUsers()
      ]);
      setStats(statsData);
      setUsers(usersData);
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
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user');
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
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-gray-600 mb-8">Platform analytics and user management</p>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Stats Section */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
            <div className="text-sm text-gray-600 mt-1">Total Users</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-green-600">{stats.studentsCount}</div>
            <div className="text-sm text-gray-600 mt-1">Students</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.teachersCount}</div>
            <div className="text-sm text-gray-600 mt-1">Teachers</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-yellow-600">{stats.totalBookings}</div>
            <div className="text-sm text-gray-600 mt-1">Total Bookings</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-indigo-600">{stats.completedBookings}</div>
            <div className="text-sm text-gray-600 mt-1">Completed</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-emerald-600">${stats.totalRevenue}</div>
            <div className="text-sm text-gray-600 mt-1">Revenue</div>
          </div>
        </div>
      )}

      {/* Users Management */}
      <div className="card overflow-hidden">
        <h2 className="text-xl font-bold mb-4">User Management</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50">
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
                        <div className="text-sm font-medium text-gray-900">{u.name}</div>
                        <div className="text-sm text-gray-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                        className="text-red-600 hover:text-red-900 font-semibold"
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
    </div>
  );
}

export default AdminDashboard;
