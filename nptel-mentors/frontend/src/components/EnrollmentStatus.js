// src/components/EnrollmentStatus.js
import React from 'react';
import { getEnrollmentStatus } from '../utils/enrollmentStatus';

const EnrollmentStatus = () => {
  // Get the enrollment status message
  const statusMessage = getEnrollmentStatus();

  return (
    <div className="p-4 text-center" style={{ color: 'white', backgroundColor: '#000080' }}>
      <h2 className="text-xl font-bold">{statusMessage}</h2>
    </div>
  );
};

export default EnrollmentStatus;


