import React, { createContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  // Register
  const register = async (name, email, password, role, city, subjects = [], hourlyRate = 0, goals = [], certificateFile = null) => {
    try {
      setError(null);
      const response = await authService.register(name, email, password, role, city, subjects, hourlyRate, goals, certificateFile);

      if (response.isPendingTeacher) {
        return response;
      }

      setToken(response.token);
      setUser(response.user);

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authService.login(email, password);

      setToken(response.token);
      setUser(response.user);

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Admin Login
  const adminLogin = async (email, password) => {
    try {
      setError(null);
      const response = await authService.adminLogin(email, password);

      setToken(response.token);
      setUser(response.user);

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Update user
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    loading,
    error,
    register,
    login,
    adminLogin,
    logout,
    updateUser,
    isAuthenticated: !!token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}