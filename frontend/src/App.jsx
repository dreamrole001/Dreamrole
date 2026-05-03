// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import VoiceAssistant from './components/VoiceAssistant';
import authService from './services/auth';
import AdminDashboard from "./pages/AdminDashboard";
import InterviewPage from './pages/InterviewPage';
import CandidateTest from './components/CandidateTest';
import TestResults from './pages/TestResults';
import ProctoringTest from './components/ProctoringTest';
import UserProfile from './pages/UserProfile';
import Internships from './pages/Internships';

// Your existing components
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import ResumeUpload from './pages/ResumeUpload';

// New recruiter components
import RecruiterRegister from './pages/RecruiterRegister';
import RecruiterDashboard from './pages/RecruiterDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on app load
    const checkAuth = async () => {
      try {
        const currentUser = await authService.checkAuth();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Update user state when authentication changes
  const handleAuthChange = (userData) => {
    setUser(userData);
  };

  // Helper function to check if user is recruiter
  const isRecruiter = (user) => {
    return user && user.role === 'ROLE_RECRUITER';
  };

  // Helper function to check if user is admin
  const isAdmin = (user) => {
    return user && user.role === 'ROLE_ADMIN';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar onAuthChange={handleAuthChange} />
        <main>
          <Routes>
            {/* Public routes - accessible without authentication */}
            <Route path="/login" element={
              user ? <Navigate to="/dashboard" replace /> : <Login onAuthChange={handleAuthChange} />
            } />
            <Route path="/register" element={
              user ? <Navigate to="/dashboard" replace /> : <Register onAuthChange={handleAuthChange} />
            } />
            <Route path="/recruiter/register" element={
              user ? <Navigate to="/dashboard" replace /> : <RecruiterRegister onAuthChange={handleAuthChange} />
            } />
            
            {/* Proctoring Test Route - For debugging */}
            <Route path="/proctoring-test" element={<ProctoringTest />} />
            
            {/* Protected routes - require authentication */}
            <Route path="/" element={
              <ProtectedRoute user={user}>
                <Home />
              </ProtectedRoute>
            } />
            
            {/* Profile Route */}
            <Route path="/profile" element={
              <ProtectedRoute user={user}>
                <UserProfile />
              </ProtectedRoute>
            } />
            
            {/* Internships Route */}
            <Route path="/internships" element={
              <ProtectedRoute user={user}>
                <Internships />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/dashboard" element={
              <ProtectedRoute user={user}>
                {isAdmin(user) ? <AdminDashboard /> : <Navigate to="/dashboard" replace />}
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute user={user}>
                {isRecruiter(user) ? <RecruiterDashboard user={user} /> : <Dashboard />}
              </ProtectedRoute>
            } />
            
            <Route path="/recruiter/dashboard" element={
              <ProtectedRoute user={user}>
                {isRecruiter(user) ? <RecruiterDashboard user={user} /> : <Navigate to="/dashboard" replace />}
              </ProtectedRoute>
            } />

            {/* New Interview Management Route */}
            <Route path="/recruiter/interviews" element={
              <ProtectedRoute user={user}>
                {isRecruiter(user) ? <InterviewPage /> : <Navigate to="/dashboard" replace />}
              </ProtectedRoute>
            } />

            {/* Aptitude Test Routes */}
            <Route path="/test/:assignmentId" element={
              <ProtectedRoute user={user}>
                <CandidateTest />
              </ProtectedRoute>
            } />

            <Route path="/test-results/:assignmentId" element={
              <ProtectedRoute user={user}>
                <TestResults />
              </ProtectedRoute>
            } />
            
            <Route path="/jobs" element={
              <ProtectedRoute user={user}>
                <Jobs />
              </ProtectedRoute>
            } />
            
            <Route path="/upload" element={
              <ProtectedRoute user={user}>
                <ResumeUpload />
              </ProtectedRoute>
            } />
            
            {/* Redirect unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <VoiceAssistant />
      </div>
    </Router>
  );
}

export default App;