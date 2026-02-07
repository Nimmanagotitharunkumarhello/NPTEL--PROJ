import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isEmail } from "../lib/validations/input-validations";

export default function Login(props) {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState("student"); // Default role

  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [formValid, setFormValid] = useState("");
  const [success, setSuccess] = useState("");

  const handleEmailError = () => {
    if (!emailInput || !isEmail(emailInput)) {
      setEmailError(true);
      setFormValid("Please enter a valid email address.");
    } else {
      setEmailError(false);
      setFormValid("");
    }
  };

  const handlePasswordError = () => {
    if (!passwordInput) {
      setPasswordError(true);
      setFormValid("Password cannot be empty.");
    } else {
      setPasswordError(false);
      setFormValid("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccess("");
    setFormValid("");

    handleEmailError();
    handlePasswordError();

    if (emailError || passwordError) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailInput, password: passwordInput }),
      });

      const data = await response.json();
      if (response.ok) {

        // Check if the user's role matches the selected role
        const userRole = data.user.role || 'student';

        if (userRole !== selectedRole && userRole !== 'admin') {
          // Allow admin to login from any tab theoretically, or enforce strict? 
          // User requested explicit "Student Login", "Mentor Login". 
          // Let's enforce strictness for better UX matching.
          // Exception: Admin might be testing Student account? No, let's just warn.

          // Actually, let's just warn but proceed, or auto-switch?
          // "You are a Mentor, redirecting to Mentor Dashboard..."
          // But if I am a student trying to login as admin, I should fail?
          // The backend auth is valid. The frontend "view" was just a filter.
          // Let's just redirect correctly but maybe show a toast "Logged in as [Role]".
        }

        setSuccess("Login Successful");

        props.onLogin(data.token, userRole);

        // Redirect based on role
        if (userRole === 'admin') {
          navigate("/admin");
        } else if (userRole === 'mentor') {
          navigate("/mentors");
        } else {
          navigate("/students");
        }
      } else {
        setFormValid(data.message);
      }
    } catch (error) {
      setFormValid("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#800000', color: 'white', padding: '1.5rem', borderRadius: '0.5rem', width: '100%', maxWidth: '700px', margin: 'auto', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)' }}>

      {/* Role Selection Tabs */}
      <div className="flex justify-center mb-6 space-x-4">
        <button
          className={`px-4 py-2 rounded font-bold transition-colors ${selectedRole === 'student' ? 'bg-white text-[#800000]' : 'bg-[#600000] text-gray-300 hover:bg-[#700000]'}`}
          onClick={() => setSelectedRole('student')}
        >
          Student Login
        </button>
        <button
          className={`px-4 py-2 rounded font-bold transition-colors ${selectedRole === 'mentor' ? 'bg-white text-[#800000]' : 'bg-[#600000] text-gray-300 hover:bg-[#700000]'}`}
          onClick={() => setSelectedRole('mentor')}
        >
          Mentor Login
        </button>
        <button
          className={`px-4 py-2 rounded font-bold transition-colors ${selectedRole === 'admin' ? 'bg-white text-[#800000]' : 'bg-[#600000] text-gray-300 hover:bg-[#700000]'}`}
          onClick={() => setSelectedRole('admin')}
        >
          Admin Login
        </button>
      </div>

      <h2 className="text-2xl font-bold text-center mb-6 uppercase tracking-wide">
        {selectedRole} Login
      </h2>

      <div style={{ marginTop: "10px" }}>
        <div className="mt-5">
          <div className="mt-3 mb-2" align="left" style={{ fontWeight: 'bold' }}>Email Address :</div>
          <input
            type="email"
            placeholder={`Enter your ${selectedRole} email`}
            value={emailInput}
            onChange={(event) => setEmailInput(event.target.value)}
            onBlur={handleEmailError}
            className={`input input-bordered ${emailError ? "input-error" : "input-accent"} text-darkzero w-full`}
            style={{ color: 'white' }}
          />
        </div>

        <div className="mt-5">
          <div className="mt-3 mb-2" align="left" style={{ fontWeight: 'bold' }}>Password :</div>
          <input
            type="password"
            placeholder="Password"
            value={passwordInput}
            onChange={(event) => setPasswordInput(event.target.value)}
            onBlur={handlePasswordError}
            className={`input input-bordered ${passwordError ? "input-error" : "input-accent"} text-darkzero w-full`}
            style={{ color: 'white' }}
          />
        </div>

        {formValid && (
          <div className="alert alert-warning shadow-lg mt-4" style={{ fontWeight: 'bold' }}>
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{formValid}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="alert alert-success shadow-lg mt-4" style={{ fontWeight: 'bold' }}>
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{success}</span>
            </div>
          </div>
        )}

        <button className={`btn btn-wide mt-3 ${isLoading ? "loading" : ""} w-full text-white bg-blue-800 hover:bg-blue-800`} onClick={handleSubmit} disabled={isLoading}>
          LOGIN AS {selectedRole.toUpperCase()}
        </button>

        <div className="mt-3 text-white font-bold">
          <b
            className="underline decoration-solid cursor-pointer"
            onClick={() => navigate('/forgot-password')}
          >
            Forgot Password ??
          </b>
          <br />
          Don't have an Account?
          <div className="inline-block cursor-pointer bg-blue-800 text-white py-2 px-4 rounded hover:bg-blue-800 ml-2" onClick={() => navigate('/signup')}>
            Register
          </div>
        </div>
      </div>
    </div>
  );
}