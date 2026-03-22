import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Header() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
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
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
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