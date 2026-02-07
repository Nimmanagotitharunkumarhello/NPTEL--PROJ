import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/navbar';
import { AppProvider } from './context/AppContext';
import Courses from './components/Courses';
import Mentors from './components/Mentors';
import Students from './components/Students';
import Signup from './components/signup';
import Login from './components/login';
import ViewAssignedStudents from './components/ViewAssignedStudents';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import AdminPaymentDashboard from './components/AdminPaymentDashboard';

function App() {
  const [loading, setLoading] = useState(true); // Loading state for initial checks
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("token"));
  const [faculties, setFaculties] = useState([]); // State to store faculty data
  const [userRole, setUserRole] = useState(() => localStorage.getItem("role"));

  // Handle user login
  const handleLogin = (token, role) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    setIsAuthenticated(true);
    setUserRole(role);
  };

  // Handle user logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setIsAuthenticated(false);
    setUserRole(null);
  };

  // Fetch faculty data
  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/get-faculties'); // Replace with your API endpoint
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        setFaculties(data.faculties || []); // Safeguard for missing data
      } catch (error) {
        console.error("Error fetching faculties:", error);
        setFaculties([]); // Reset faculties on error
      } finally {
        setLoading(false); // End loading regardless of outcome
      }
    };

    fetchFaculties();

    // Check authentication status
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    setUserRole(localStorage.getItem("role"));
  }, []);

  // Render loading screen while data is being fetched
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <AppProvider>
        <div
          style={{
            backgroundImage: "url('/sathyabama_university.jpg')",
            backgroundColor: 'white',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: '100vh',
            overflowY: 'auto', // Ensures that the background extends with scrolling content
          }}
        >
          <Navbar onLogout={handleLogout} isAuthenticated={isAuthenticated} userRole={userRole} />
          <div className="w-[80%] mx-auto pt-10 pb-2">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Private Routes */}
              {isAuthenticated ? (
                <>
                  <Route path="/courses" element={<Courses />} />

                  {/* Student Routes */}
                  {(userRole === 'student' || userRole === 'admin') && (
                    <Route path="/students" element={<Students />} />
                  )}

                  {/* Mentor Routes */}
                  {(userRole === 'mentor' || userRole === 'admin') && (
                    <>
                      <Route path="/mentors" element={<Mentors faculties={faculties} />} />
                      <Route path="/view-assigned-students" element={<ViewAssignedStudents />} />
                    </>
                  )}

                  {/* Admin Routes */}
                  {userRole === 'admin' && (
                    <Route path="/admin" element={<AdminPaymentDashboard />} />
                  )}

                  {/* Redirect based on role if hitting root or unknown while auth */}
                  <Route path="/" element={
                    userRole === 'admin' ? <Navigate to="/admin" replace /> :
                      userRole === 'mentor' ? <Navigate to="/mentors" replace /> :
                        <Navigate to="/students" replace />
                  } />
                </>
              ) : (
                <Route path="*" element={<Navigate to="/login" replace />} />
              )}
            </Routes>
          </div>
        </div>
      </AppProvider>
    </Router>
  );
}

export default App;
