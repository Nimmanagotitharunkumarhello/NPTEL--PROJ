import React from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import Link for routing

const Navbar = ({ onLogout, isAuthenticated, userRole }) => {
  // Internal handleLogout removed, using passed prop

  if (!isAuthenticated) return null; // Don't show navbar if not logged in

  return (
    <nav className="p-4 sticky top-0 z-50 bg-[#003366]">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo Section */}
        <Link to="/" className="flex items-center">
          <img
            src="/images/sistlogo.png" // Path to your logo image in the public directory
            alt="Logo"
            className="h-8 mr-3" // Adjust size and add margin-right for spacing
          />
          <span className="text-white text-2xl font-bold">Sathyabama - NPTEL Enrollment</span>
        </Link>

        {/* NPTEL Logo */}
        <div className="flex items-center">
          <img
            src="/images/nptelogo.jpeg" // Path to your NPTEL logo image
            alt="NPTEL Logo"
            className="h-8 mr-4" // Adjust size as needed and add margin-right
          />

          {/* Navigation Links */}
          <div className="space-x-4">

            {/* Common Link */}
            <Link to="/courses" className="text-white hover:bg-gray-700 px-3 py-2 rounded">
              Courses
            </Link>

            {/* Student Links */}
            {(userRole === 'student' || userRole === 'admin') && (
              <Link to="/students" className="text-white hover:bg-gray-700 px-3 py-2 rounded">
                Students
              </Link>
            )}

            {/* Mentor Links */}
            {(userRole === 'mentor' || userRole === 'admin') && (
              <>
                <Link to="/mentors" className="text-white hover:bg-gray-700 px-3 py-2 rounded">
                  Mentors
                </Link>
                <Link to="/view-assigned-students" className="text-white hover:bg-gray-700 px-3 py-2 rounded">
                  View Assigned Students
                </Link>
              </>
            )}

            {/* Admin Links */}
            {userRole === 'admin' && (
              <Link to="/admin" className="text-white bg-red-700 hover:bg-red-800 px-3 py-2 rounded font-bold">
                Admin Dashboard
              </Link>
            )}

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="text-white hover:bg-red-700 px-3 py-2 rounded ml-4"
            >
              Logout
            </button>

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
