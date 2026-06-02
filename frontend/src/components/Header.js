import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import * as notificationService from '../services/notificationService';

function Header() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await notificationService.markNotificationRead(notification._id);
        setNotifications(prev => prev.map(item =>
          item._id === notification._id ? { ...item, isRead: true } : item
        ));
        setUnreadCount(prev => Math.max(prev - 1, 0));
      }
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }

    setNotificationsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllNotificationsRead();
      setNotifications(prev => prev.map(item => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark notifications as read', err);
    }
  };

  const formatNotificationTime = (date) => {
    const createdAt = new Date(date);
    const diffMs = Date.now() - createdAt.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return createdAt.toLocaleDateString();
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          Tutoring Platform
        </Link>

        <nav className="hidden md:flex space-x-6 items-center">
          {isAuthenticated ? (
            <>
              {user?.role === 'admin' ? (
                <>
                  <Link to="/admin" className="text-gray-600 hover:text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded">
                    Admin Panel
                  </Link>
                  <Link to="/profile" className="text-gray-600 hover:text-blue-600">
                    Profile
                  </Link>
                </>
              ) : user?.role === 'student' ? (
                <>
                  <Link to="/dashboard" className="text-gray-600 hover:text-blue-600">
                    Dashboard
                  </Link>
                  <Link to="/search-teachers" className="text-gray-600 hover:text-blue-600">
                    Find Teachers
                  </Link>
                  <Link to="/tests" className="text-gray-600 hover:text-blue-600 font-semibold flex items-center gap-1">
                   Tests
                  </Link>
                  <Link to="/my-bookings" className="text-gray-600 hover:text-blue-600">
                    My Bookings
                  </Link>
                  <Link to="/my-transactions" className="text-gray-600 hover:text-blue-600">
                    Payments
                  </Link>
                  <Link to="/profile" className="text-gray-600 hover:text-blue-600">
                    Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/teacher-dashboard" className="text-gray-600 hover:text-blue-600">
                    Dashboard
                  </Link>
                  <Link to="/my-bookings" className="text-gray-600 hover:text-blue-600">
                    Bookings
                  </Link>
                  <Link to="/my-transactions" className="text-gray-600 hover:text-blue-600">
                    Payments
                  </Link>
                  <Link to="/profile" className="text-gray-600 hover:text-blue-600">
                    Profile
                  </Link>
                </>
              )}
            </>
          ) : null}
        </nav>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setDropdownOpen(false);
                }}
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"
                aria-label="Notifications"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-red-600 px-1 text-center text-[11px] font-bold leading-[18px] text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <h2 className="text-sm font-semibold text-gray-900">Notifications</h2>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <button
                          key={notification._id}
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          className={`block w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 ${
                            notification.isRead ? 'bg-white' : 'bg-blue-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {!notification.isRead && (
                              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600"></span>
                            )}
                            <div className={notification.isRead ? 'pl-5' : ''}>
                              <p className="text-sm font-semibold text-gray-900">
                                {notification.title}
                              </p>
                              <p className="mt-1 text-sm text-gray-600">
                                {notification.message}
                              </p>
                              <p className="mt-2 text-xs text-gray-400">
                                {formatNotificationTime(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setDropdownOpen(!dropdownOpen);
                  setNotificationsOpen(false);
                }}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <span className="text-xl">👤</span>
                )}
                <span className="font-medium">{user?.name}</span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    My Profile
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100 font-semibold"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <Link
                    to="/my-transactions"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    My Transactions
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
