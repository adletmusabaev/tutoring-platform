import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import MainLayout from './components/MainLayout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import SearchTeachersPage from './pages/SearchTeachersPage';
import TeacherProfilePage from './pages/TeacherProfilePage';
import BookingPage from './pages/BookingPage';
import ChatPage from './pages/ChatPage';
import MyBookingsPage from './pages/MyBookingsPage';
import ProfilePage from './pages/ProfilePage';
import LevelTestPage from './pages/LevelTestPage';
import WelcomePage from './pages/WelcomePage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import AdminDashboard from './pages/AdminDashboard';
import TestsDirectoryPage from './pages/TestsDirectoryPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header />

          <MainLayout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<WelcomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/teacher-dashboard"
                element={
                  <ProtectedRoute>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/search-teachers"
                element={
                  <ProtectedRoute>
                    <SearchTeachersPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/teacher/:id"
                element={
                  <ProtectedRoute>
                    <TeacherProfilePage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/booking/:teacherId"
                element={
                  <ProtectedRoute>
                    <BookingPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/chat/:bookingId"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute>
                    <MyBookingsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/level-test/:subject"
                element={
                  <ProtectedRoute>
                    <LevelTestPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/tests"
                element={
                  <ProtectedRoute>
                    <TestsDirectoryPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/my-transactions"
                element={
                  <ProtectedRoute>
                    <TransactionHistoryPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

            </Routes>
          </MainLayout>

          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
