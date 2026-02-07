import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext'; // Import the context
import axios from 'axios'; // For making HTTP requests

const ViewAssignedStudents = () => {
  const { studentDetails } = useContext(AppContext); // Accessing student details from context

  const [facultyName, setFacultyName] = useState('');
  const [erpId, setErpId] = useState('');
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [message, setMessage] = useState('');
  console.log(studentDetails)

   // Define the fetch function outside the handleSubmit
   const fetchAssignedStudents = async () => {
    try {
        const response = await axios.get('http://127.0.0.1:5000/get-assigned-students', {
            params: { facultyName, erpId },
        });

        if (response.data.assignedStudents && response.data.assignedStudents.length > 0) {
            setAssignedStudents(response.data.assignedStudents);
            setMessage('');
        } else {
            setAssignedStudents([]);
            setMessage('No students assigned to this faculty.');
        }
    } catch (error) {
        setAssignedStudents([]);
        setMessage(
            error.response?.data || 'An error occurred while fetching students.'
        );
        console.error('Error fetching assigned students:', error);
    }
};


  const handleSubmit = () => {
    // Validate the input fields
    if (!facultyName && !erpId) {
      setMessage('Please enter either Faculty Name or ERP ID');
      return;
    }

    // Call the fetch function when inputs are valid
    fetchAssignedStudents();
  };
      

  return (
    <div className="container mx-auto p-6">
      <div className="bg-[#800000] p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">View Assigned Students</h1>

        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex flex-col">
            <label className="font-bold text-white mb-1">Faculty Name:</label>
            <input
              type="text"
              value={facultyName}
              onChange={(e) => setFacultyName(e.target.value)}
              placeholder="Enter Faculty Name"
              className="px-3 py-2 border border-gray-300 rounded bg-white text-gray-700 font-bold"
            />
          </div>

          <div className="flex flex-col">
            <label className="font-bold text-white mb-1">ERP ID:</label>
            <input
              type="text"
              value={erpId}
              onChange={(e) => setErpId(e.target.value)}
              placeholder="Enter ERP ID"
              className="px-3 py-2 border border-gray-300 rounded bg-white text-gray-700 font-bold"
            />
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <button
            onClick={handleSubmit}
            className="bg-blue-800 hover:bg-blue-700 text-white px-6 py-3 rounded font-bold"
          >
            View Students
          </button>
        </div>

        {/* Display message */}
        {message && (
          <div className="mt-4 text-center text-red-500 font-bold">
            {message}
          </div>
        )}

        {/* Display students in a table if any */}
        {assignedStudents.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-bold text-white">Assigned Students:</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto text-white border-collapse border border-gray-300">
                <thead className="bg-[#800000]">
                  <tr>
                    <th className="px-4 py-2 border border-white">Student Name</th>
                    <th className="px-4 py-2 border border-white">Registration No</th>
                    <th className="px-4 py-2 border border-white">Year</th>
                    <th className="px-4 py-2 border border-white">Course Name</th>
                    <th className="px-4 py-2 border border-white">Instructor Name</th>
                    <th className="px-4 py-2 border border-white">Duration</th> {/* Added Duration Column */}
                  </tr>
                </thead>
                <tbody>
                  {assignedStudents.map((student, index) => (
                    <tr key={index} className="border-b border-gray-300">
                      <td className="px-4 py-2 border-r border-gray-300">{student.studentName}</td>
                      <td className="px-4 py-2 border-r border-gray-300">{student.regNo}</td>
                      <td className="px-4 py-2 border-r border-gray-300">{student.year}</td>
                      <td className="px-4 py-2 border-r border-gray-300">{student.courseName}</td>
                      <td className="px-4 py-2 border-r border-gray-300">{student.instructorName}</td>
                      <td className="px-4 py-2">{student.duration}</td> {/* Display Duration */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewAssignedStudents;
