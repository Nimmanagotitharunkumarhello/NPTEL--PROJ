import React, { useState, useEffect } from 'react';

const AdminPaymentDashboard = () => {
    const [pendingPayments, setPendingPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

    const [mentors, setMentors] = useState([]);

    const fetchPendingPayments = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/admin/pending-payments');
            if (response.ok) {
                const data = await response.json();
                setPendingPayments(data);
            } else {
                console.error("Failed to fetch pending payments");
            }
        } catch (error) {
            console.error("Error fetching pending payments:", error);
        }
    };

    const fetchMentors = async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/get-faculties');
            if (response.ok) {
                const data = await response.json();
                setMentors(data.faculties);
            }
        } catch (error) {
            console.error("Error fetching mentors:", error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchPendingPayments(), fetchMentors()]);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAction = async (regNo, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this payment?`)) return;

        try {
            const response = await fetch('http://127.0.0.1:5000/api/admin/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ regNo, action })
            });

            if (response.ok) {
                alert(`Payment ${action}d successfully`);
                fetchPendingPayments(); // Refresh list
                setSelectedImage(null);
            } else {
                alert("Failed to update status");
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleDeleteMentor = async (mentorId) => {
        if (!window.confirm("Are you sure you want to DELETE this mentor? This action cannot be undone.")) return;

        try {
            const response = await fetch(`http://127.0.0.1:5000/api/admin/delete-mentor/${mentorId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert("Mentor deleted successfully");
                fetchMentors();
            } else {
                alert("Failed to delete mentor");
            }
        } catch (error) {
            console.error("Error deleting mentor:", error);
        }
    };

    // Helper to view image (Using a simple window open for now as a workaround for no static route)
    const viewImage = (path) => {
        // Ideally, backend should serve this.
        alert(`Image Path: ${path}\n\n(Ensure backend static serving is configured to view this)`);
    };

    return (
        <div className="container mx-auto p-6 space-y-12">

            const [paymentSearch, setPaymentSearch] = useState("");
            const [mentorSearch, setMentorSearch] = useState("");

    // ... existing loadData ...

    // Filter Logic
    const filteredPayments = pendingPayments.filter(student =>
            (student.studentName?.toLowerCase() || "").includes(paymentSearch.toLowerCase()) ||
            (student.regNo?.toLowerCase() || "").includes(paymentSearch.toLowerCase())
            );

    const filteredMentors = mentors.filter(mentor =>
            (mentor.facultyName?.toLowerCase() || "").includes(mentorSearch.toLowerCase()) ||
            (mentor.courseName?.toLowerCase() || "").includes(mentorSearch.toLowerCase())
            );

            return (
            <div className="container mx-auto p-6 space-y-12">

                {/* Payment Verification Section */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-[#800000]">Admin Dashboard</h1>
                            <h2 className="text-2xl font-bold mt-2">Payment Verification</h2>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by Name or Reg No..."
                            className="input input-bordered w-full max-w-xs"
                            value={paymentSearch}
                            onChange={(e) => setPaymentSearch(e.target.value)}
                        />
                    </div>

                    {loading ? <p>Loading...</p> : (
                        <div className="overflow-x-auto text-gray-900">
                            <table className="min-w-full bg-white border border-gray-300 shadow-md rounded">
                                <thead>
                                    <tr className="bg-gray-100 border-b">
                                        <th className="p-4 text-left">Reg No</th>
                                        <th className="p-4 text-left">Name</th>
                                        <th className="p-4 text-left">Course</th>
                                        <th className="p-4 text-center">Screenshot</th>
                                        <th className="p-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPayments.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-6 text-center text-gray-500">No pending payments found</td>
                                        </tr>
                                    ) : (
                                        filteredPayments.map(student => (
                                            <tr key={student.regNo} className="border-b hover:bg-gray-50">
                                                <td className="p-4">{student.regNo}</td>
                                                <td className="p-4">{student.studentName}</td>
                                                <td className="p-4">{student.courseName}</td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => viewImage(student.paymentScreenshot)}
                                                        className="text-blue-500 underline"
                                                    >
                                                        View Image
                                                    </button>
                                                </td>
                                                <td className="p-4 flex justify-center gap-2">
                                                    <button
                                                        onClick={() => handleAction(student.regNo, 'Approve')}
                                                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(student.regNo, 'Reject')}
                                                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                                    >
                                                        Reject
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* Mentor Management Section */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold">Manage Mentors</h2>
                        <input
                            type="text"
                            placeholder="Search by Faculty or Course..."
                            className="input input-bordered w-full max-w-xs"
                            value={mentorSearch}
                            onChange={(e) => setMentorSearch(e.target.value)}
                        />
                    </div>
                    <div className="overflow-x-auto text-gray-900">
                        <table className="min-w-full bg-white border border-gray-300 shadow-md rounded">
                            <thead>
                                <tr className="bg-gray-100 border-b">
                                    <th className="p-4 text-left">Faculty Name</th>
                                    <th className="p-4 text-left">Course</th>
                                    <th className="p-4 text-left">Email</th>
                                    <th className="p-4 text-center">Students</th>
                                    <th className="p-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMentors.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-6 text-center text-gray-500">No mentors found</td>
                                    </tr>
                                ) : (
                                    filteredMentors.map(mentor => (
                                        <tr key={mentor._id} className="border-b hover:bg-gray-50">
                                            <td className="p-4 font-bold">{mentor.facultyName}</td>
                                            <td className="p-4">{mentor.courseName}</td>
                                            <td className="p-4">{mentor.emailId}</td>
                                            <td className="p-4 text-center">
                                                {mentor.currentStudentCount || 0} / {mentor.maxStudents || 25}
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => handleDeleteMentor(mentor._id)}
                                                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 font-bold"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
            );
};

            export default AdminPaymentDashboard;
