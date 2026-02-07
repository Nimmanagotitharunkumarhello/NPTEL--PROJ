import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext'; // Import the context
import axios from 'axios'; // Import Axios for API calls

const Mentors = ({ faculties }) => {
  const { selectedMentor, setStudentDetails } = useContext(AppContext); // Destructure only necessary context values
  const [masterCourses, setMasterCourses] = useState([]); // Master list

  const [formValues, setFormValues] = useState({
    facultyName: '',
    erpId: '',
    department: '',
    emailId: '',
    courseName: '',
    instructorName: '',
    duration: ''
  });

  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Clear the student details when the selected mentor changes
    setStudentDetails({});
  }, [selectedMentor, setStudentDetails]); // Ensure selectedMentor is a dependency

  // Fetch Master Courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('http://localhost:5000/get-courses');
        setMasterCourses(response.data.courses);
      } catch (error) {
        console.error('Error fetching master courses:', error);
      }
    };
    fetchCourses();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormValues((prev) => {
      const newData = { ...prev, [name]: value };

      // Auto-fill for Course Name
      if (name === 'courseName') {
        const matched = masterCourses.find(c => c.courseName.toLowerCase() === value.toLowerCase());
        if (matched) {
          newData.instructorName = matched.instructorName;
          // Align duration format if needed
          newData.duration = matched.duration;
        }
      }
      return newData;
    });
  };

  const validateEmail = (email) => {
    // Basic email validation
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEnroll = async () => {
    // Validate fields
    const requiredFields = [
      { name: 'facultyName', message: 'Please fill out the Faculty Name field.' },
      { name: 'erpId', message: 'Please fill out the ERP ID field.' },
      { name: 'department', message: 'Please fill out the Department field.' },
      { name: 'emailId', message: 'Please fill out a valid Email ID field.' },
      { name: 'courseName', message: 'Please fill out the Course Name field.' },
      { name: 'instructorName', message: 'Please fill out the Instructor Name field.' },
      { name: 'duration', message: 'Please fill out the Duration field.' }
    ];

    for (const field of requiredFields) {
      if (!formValues[field.name] || (field.name === 'emailId' && !validateEmail(formValues.emailId))) {
        alert(field.message); // Show popup message
        return;
      }
    }

    // If validation passes, make the API call to save the mentor details
    setLoading(true); // Start loading state
    try {
      await axios.post('http://localhost:5000/enroll-mentor', formValues); // Flask endpoint
      setMessage('Enrolled successfully');
      setTimeout(() => setMessage(''), 2000);

      // Clear form values after successful enrollment
      setFormValues({
        facultyName: '',
        erpId: '',
        department: '',
        emailId: '',
        courseName: '',
        instructorName: '',
        duration: ''
      });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'An error occurred while enrolling. Please try again.');
      setTimeout(() => setErrorMessage(''), 5000); // Clear error message after 5 seconds
      console.error(error);
    } finally {
      setLoading(false); // Stop loading state
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="bg-[#800000] p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">Course Enrollment</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="flex flex-col">
              <label className="font-bold text-white mb-1">Faculty Name:</label>
              <input
                type="text"
                name="facultyName"
                value={formValues.facultyName}
                onChange={handleChange}
                placeholder="Faculty Name"
                className="px-3 py-2 border border-gray-300 rounded bg-white text-gray-700 font-bold"
              />
            </div>

            <div className="flex flex-col">
              <label className="font-bold text-white mb-1">ERP ID:</label>
              <input
                type="text"
                name="erpId"
                value={formValues.erpId}
                onChange={handleChange}
                placeholder="ERP ID"
                className="px-3 py-2 border border-gray-300 rounded bg-white text-gray-700 font-bold"
              />
            </div>

            <div className="flex flex-col">
              <label className="font-bold text-white mb-1">Department:</label>
              <input
                type="text"
                name="department"
                value={formValues.department}
                onChange={handleChange}
                placeholder="Department"
                className="px-3 py-2 border border-gray-300 rounded bg-white text-gray-700 font-bold"
              />
            </div>

            <div className="flex flex-col">
              <label className="font-bold text-white mb-1">Email ID:</label>
              <input
                type="email"
                name="emailId"
                value={formValues.emailId}
                onChange={handleChange}
                placeholder="Email ID"
                className="px-3 py-2 border border-gray-300 rounded bg-white text-gray-700 font-bold"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="flex flex-col">
              <label className="font-bold text-white mb-1">Course Name:</label>
              <input
                type="text"
                name="courseName"
                value={formValues.courseName}
                onChange={handleChange}
                placeholder="Course Name"
                list="courseAvailableMentor"
                className="px-3 py-2 border border-gray-300 rounded bg-white text-gray-700 font-bold"
              />
              <datalist id="courseAvailableMentor">
                {masterCourses.map((course, idx) => (
                  <option key={idx} value={course.courseName} />
                ))}
              </datalist>
            </div>

            <div className="flex flex-col">
              <label className="font-bold text-white mb-1">Instructor Name:</label>
              <input
                type="text"
                name="instructorName"
                value={formValues.instructorName}
                onChange={handleChange}
                placeholder="Instructor Name"
                className="px-3 py-2 border border-gray-300 rounded bg-white text-gray-700 font-bold"
              />
            </div>

            <div className="flex flex-col">
              <label className="font-bold text-white mb-1">Duration:</label>
              <select
                name="duration"
                value={formValues.duration}
                onChange={handleChange}
                className="px-3 py-2 border border-gray-300 rounded bg-white text-gray-700 font-bold"
              >
                <option value="">Select Duration</option>
                <option value="4 weeks">4 weeks</option>
                <option value="8 weeks">8 weeks</option>
                <option value="12 weeks">12 weeks</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleEnroll}
            className="bg-blue-800 hover:bg-blue-800 text-white px-6 py-3 rounded font-bold"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Enroll'}
          </button>
        </div>

        {message && (
          <div className="mt-4 text-center text-green-500 font-bold">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 text-center text-red-500 font-bold">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Mentor List Section */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#800000]">Current Mentors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {faculties.length > 0 ? (
            faculties.map((faculty, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h3 className="text-xl font-bold text-[#800000] mb-2">{faculty.facultyName}</h3>
                <p className="text-gray-700"><strong>Course:</strong> {faculty.courseName}</p>
                <p className="text-gray-700"><strong>Email:</strong> {faculty.emailId || 'N/A'}</p>

                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-gray-700">Capacity:</span>
                    <span className={`text-sm font-bold ${(faculty.currentStudentCount || 0) >= (faculty.maxStudents || 25) ? 'text-red-500' : 'text-green-500'}`}>
                      {faculty.currentStudentCount || 0} / {faculty.maxStudents || 25}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${(faculty.currentStudentCount || 0) >= (faculty.maxStudents || 25) ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(100, ((faculty.currentStudentCount || 0) / (faculty.maxStudents || 25)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 col-span-full">No mentors found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Mentors;