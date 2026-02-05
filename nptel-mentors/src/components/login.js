import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isEmail } from "../lib/validations/input-validations";

export default function Login(props) {
  const navigate = useNavigate();

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
        // No token storage for now, just navigate
        setSuccess("Login Successful");
        navigate("/courses"); // Navigate to the Courses page
        props.onLogin();
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
    <div style={{ marginTop: "10px" }}>
      <div className="mt-5">
        <div className="mt-3 mb-2" align="left" style={{ fontWeight: 'bold' }}>Email Address :</div>
        <input
          type="email"
          placeholder="Email Address"
          value={emailInput}
          onChange={(event) => setEmailInput(event.target.value)}
          onBlur={handleEmailError}
          className={`input input-bordered ${emailError ? "input-error" : "input-accent"} text-darkzero w-full`} 
          style={{ color: 'white' }} // Enforcing white color for the text
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
          style={{ color: 'white' }} // Enforcing white color for the text
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
        LOGIN TO YOUR ACCOUNT
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