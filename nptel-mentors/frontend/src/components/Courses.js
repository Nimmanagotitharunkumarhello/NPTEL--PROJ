import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for routing
import EnrollmentStatus from '../components/EnrollmentStatus';

const Courses = () => {
  return (
    <div>
       <div className="p-4">
      <EnrollmentStatus /> </div>
      {/* Courses Page Content */}
      <div className="p-6" style={{ backgroundColor: '#800000' }}>  
        <h1 className="text-4xl font-bold text-center mb-4">Welcome to Swayam-NPTEL</h1>
        <p className="text-xl text-center mb-6">Enhance skills that meet your need online</p>
        <hr className="mb-6" />
        
        <h2 className="text-2xl font-semibold mb-2">NPTEL Online Certification Courses</h2>
        <p className="mb-6">
          NPTEL is a project of MHRD initiated by 7 IITs along with the IISc, Bangalore in 2003, 
          to provide quality education to anyone interested in learning from the IITs.
        </p>
        
        <div className="flex justify-center space-x-8 mb-6">
          <a href="https://docs.google.com/spreadsheets/d/e/2PACX-1vSPMVrWoo0ZsAac7v1Cxx5bZ4qFUVTRpc5hjGr-krusAZcY_M70guTum2z7S2SmdsbpmgD7WbL_3aNU/pubhtml" 
             target="_blank" 
             rel="noopener noreferrer" 
             className="bg-blue-800 text-white px-4 py-2 rounded">
            FINAL COURSE LIST
          </a>
          <a href="https://docs.google.com/document/d/e/2PACX-1vQggp-dhZj_ufFZJ-BTn-XJqMqnwsXt_mdTveSY8_OP19F2gjh8YOif5bMhdJvrP3lWQqMWKLFWrCKv/pub" 
             target="_blank" 
             rel="noopener noreferrer" 
             className="bg-blue-800 text-white px-4 py-2 rounded">
            TIMELINES
          </a>
        </div>
      </div>

      {/* Navbar for About Swayam and Sign In/Register */}
      <nav className="p-4 mt-6" style={{ backgroundColor: '#800000' }}> 
        <div className="container mx-auto flex justify-between items-center">
          <a href="https://swayam.gov.in/about" 
             target="_blank" 
             rel="noopener noreferrer" 
             className="text-white hover:bg-gray-700 px-3 py-2 rounded">
            About Swayam
          </a>
          <Link to="/login" className="text-white hover:bg-gray-700 px-3 py-2 rounded">
            Sign Up/Register
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Courses;

