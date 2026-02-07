import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';

const Students = () => {
  const { setStudentDetails, setSelectedMentor } = useContext(AppContext);
  const [students, setStudents] = useState([]);
  const [faculties, setFaculties] = useState([]); // Ensure local state for faculties
  const [filteredFaculties, setFilteredFaculties] = useState([]);
  const [masterCourses, setMasterCourses] = useState([]); // Master list from Excel
  const [formData, setFormData] = useState({
    name: '',
    regNo: '',
    year: '',
    email: '',
    courseName: '',
    duration: '',
    instructorName: '',
    facultyName: ''
  });
  const [paymentFile, setPaymentFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const MAX_STUDENTS_PER_FACULTY = 25; // Updated to 25 as per logic

  // Fetch students when the component loads
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/get-students');
        const data = await response.json();
        if (response.ok) {
          setStudents(data);
        } else {
          console.error('Error fetching students:', data.message);
        }
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };
    fetchStudents();
  }, []);

  // Fetch all faculties and Master Courses on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Faculties
        const facResponse = await fetch('http://127.0.0.1:5000/get-faculties');
        const facData = await facResponse.json();

        if (facResponse.ok) {
          const allFaculties = facData.faculties.map(faculty => ({
            ...faculty,
            count: faculty.currentStudentCount || 0,
            max: faculty.maxStudents || 25
          }));
          setFaculties(allFaculties);
          setFilteredFaculties(allFaculties);
        } else {
          setMessage(facData.message || 'Error fetching faculties.');
        }

        // Fetch Master Courses
        const courseResponse = await fetch('http://127.0.0.1:5000/get-courses');
        const courseData = await courseResponse.json();
        if (courseResponse.ok) {
          setMasterCourses(courseData.courses);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage('Error fetching data.');
      }
    };
    fetchData();
  }, []);

  // Filter faculties when form data changes
  useEffect(() => {
    const filterFaculties = () => {
      let filtered = faculties;

      if (formData.courseName) {
        filtered = filtered.filter(f => f.courseName && f.courseName.toLowerCase().includes(formData.courseName.toLowerCase()));
      }
      // Removed strict instructor and duration filtering to prevent hiding valid faculties.
      // The auto-fill logic will correct these fields upon faculty selection.

      setFilteredFaculties(filtered);
    };

    filterFaculties();
  }, [formData.courseName, formData.instructorName, formData.duration, faculties]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => {
      const newData = { ...prevData, [name]: value };

      // Auto-fill if Course Name matches a Master Course
      if (name === 'courseName') {
        const matchedCourse = masterCourses.find(c => c.courseName.toLowerCase() === value.toLowerCase());
        if (matchedCourse) {
          newData.instructorName = matchedCourse.instructorName;
          newData.duration = matchedCourse.duration;
        }
      }
      return newData;
    });
  };

  const handleFacultyChange = (e) => {
    const selectedName = e.target.value;
    const selectedFaculty = faculties.find(f => f.facultyName === selectedName);

    setFormData(prev => ({
      ...prev,
      facultyName: selectedName,
      // Only override if the user hasn't selected a valid course yet or if they want to sync with faculty
      // But user requested: Search Course -> Get Instructor. So Course is primary.
      // We might NOT want to overwrite courseName here if it's already set.
      // However, if they pick a faculty first, we SHOULD set the course.
      courseName: selectedFaculty ? selectedFaculty.courseName : prev.courseName,
      instructorName: selectedFaculty ? selectedFaculty.instructorName : prev.instructorName,
      duration: selectedFaculty ? selectedFaculty.duration : prev.duration
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB");
        return;
      }
      setPaymentFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (students.some(student => student.regNo === formData.regNo)) {
      setMessage('Registration number already exists.');
      return;
    }

    if (!paymentFile) {
      setMessage('Please upload a payment screenshot.');
      return;
    }

    const selectedFaculty = filteredFaculties.find(faculty => faculty.facultyName === formData.facultyName);

    if (!formData.facultyName) {
      setMessage('Please select a faculty.');
      return;
    }

    if (selectedFaculty && selectedFaculty.count >= selectedFaculty.max) {
      setMessage('The selected faculty is already full.');
      return;
    }

    setLoading(true);

    const submissionData = new FormData();
    Object.keys(formData).forEach(key => submissionData.append(key, formData[key]));
    submissionData.append('paymentScreenshot', paymentFile);

    try {
      const response = await fetch('http://127.0.0.1:5000/enroll-student', {
        method: 'POST',
        body: submissionData,
        // Do NOT set Content-Type header when sending FormData; browser sets it automatically with boundary
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Student enrolled:', data);

        // Update local state (Optimistic UI update)
        setStudents(prevStudents => [...prevStudents, { ...formData, paymentStatus: 'Pending' }]);

        setFormData({
          name: '',
          regNo: '',
          year: '',
          email: '',
          courseName: '',
          duration: '',
          instructorName: '',
          facultyName: ''
        });
        setPaymentFile(null);
        setPreviewUrl(null);
        setMessage('Enrolled successfully! Payment verification pending.');

      } else {
        setMessage(data.message || 'Error enrolling student.');
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
      setMessage('Error enrolling student.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="bg-[#800000] p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">Course Enrollment</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="font-bold text-white mb-1">Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Student Name"
                  className="px-3 py-2 border border-gray-300 rounded bg-white text-gray-700 font-bold"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="font-bold text-white mb-1">Reg No:</label>
                <input
                  type="text"
                  name="regNo"
                  value={formData.regNo}
                  onChange={handleChange}
                  placeholder="Registration Number"
                  className="px-3 py-2 border border-gray-300 rounded bg-white text-gray-700 font-bold"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="font-bold text-white mb-1">Year:</label>
                <input
                  type="text"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  placeholder="Year"
                  className="px-3 py-2 border border-gray-300 rounded bg-white text-gray-700 font-bold"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="font-bold text-white mb-1">Email ID:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email ID"
                  className="px-3 py-2 border border-gray-300 rounded bg-white text-gray-700 font-bold"
                  required
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
                  value={formData.courseName}
                  onChange={handleChange}
                  placeholder="Course Name"
                  list="courseAvailable"
                  className="px-3 py-2 border border-gray-300 rounded bg-white text-gray-700 font-bold"
                  required
                />
                <datalist id="courseAvailable">
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
                  value={formData.instructorName}
                  onChange={handleChange}
                  placeholder="Instructor Name"
                  className="px-3 py-2 border border-gray-300 rounded bg-white text-gray-700 font-bold"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="font-bold text-white mb-1">Duration:</label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="px-3 py-2 border border-gray-300 rounded bg-white text-gray-700 font-bold"
                  required
                >
                  <option value="">Select Duration</option>
                  <option value="4 weeks">4 weeks</option>
                  <option value="8 weeks">8 weeks</option>
                  <option value="12 weeks">12 weeks</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="font-bold text-white mb-1">Faculty Name:</label>
                <select
                  name="facultyName"
                  value={formData.facultyName}
                  onChange={handleFacultyChange}
                  className="px-3 py-2 border border-gray-300 rounded bg-white text-gray-700 font-bold"
                  required
                >
                  <option value="">Select Faculty</option>
                  {filteredFaculties.length > 0 ? (
                    filteredFaculties.map(faculty => (
                      <option key={faculty.facultyName} value={faculty.facultyName} disabled={faculty.count >= faculty.max}>
                        {faculty.facultyName} ({faculty.count}/{faculty.max}) {faculty.count >= faculty.max ? '- Full' : ''}
                      </option>
                    ))
                  ) : (
                    <option value="">No faculties available</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="font-bold text-white mb-1">Payment Screenshot (Max 5MB):</label>
            <div className="w-full flex items-center justify-center bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                required
              />
              {!previewUrl ? (
                <span className="text-gray-500 font-bold">Click or Drag & Drop to Upload Screenshot</span>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-green-600 font-bold mb-2">File Selected: {paymentFile.name}</span>
                  {paymentFile.type.startsWith('image/') && (
                    <img src={previewUrl} alt="Preview" className="h-32 object-contain border rounded" />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className={`text-white px-6 py-3 rounded font-bold ${loading ? 'bg-gray-500' : 'bg-blue-800 hover:bg-blue-900'}`}
            >
              {loading ? 'Enrolling...' : 'Enroll'}
            </button>
          </div>
        </form>

        {message && (
          <div className={`mt-4 text-center font-bold ${message.includes('Error') || message.includes('already exists') || message.includes('full') ? 'text-red-500' : 'text-green-400'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Students;