import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate hook for navigation

// Validations
import { isEmail } from "../lib/validations/input-validations";

export default function Signup() {
  // Inputs
  const [nameInput, setNameInput] = useState(""); // Add state for nameInput
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Loading
  const [isLoading, setIsLoading] = useState(false);

  // Error States
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // Form Validity
  const [formValid, setFormValid] = useState("");

  // Success
  const [success, setSuccess] = useState("");

  const navigate = useNavigate(); // Hook for navigation

  // Handle onBlur Email Address Error
  const handleEmailError = () => {
    if (!emailInput || !isEmail(emailInput)) {
      setEmailError(true);
      return;
    }
    setEmailError(false);
  };

  // Handle onBlur Confirm Password
  const handlePasswordError = () => {
    if (confirmPassword !== passwordInput) {
      setPasswordError(true);
      return;
    }
    setPasswordError(false);
  };

  // Handle form submit
  const handleSubmit = (event) => {
    event.preventDefault();

    setSuccess("");
    setFormValid("");

    // Check for Validation
    if (!emailInput || emailError) {
      setFormValid("Invalid Email Address. Please retry.");
      setEmailError(true);
      return;
    }

    if (passwordInput !== confirmPassword) {
      setFormValid("Passwords do not match.");
      setPasswordError(true);
      return;
    }

    // Submit Form
    setIsLoading(true);

    fetch("http://127.0.0.1:5000/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: nameInput,
        email: emailInput,
        password: passwordInput,
        confirmPassword: confirmPassword, // Include confirmPassword in the payload
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error in Signup");
        }
        return response.json();
      })
      .then((data) => {
        setIsLoading(false);
        setSuccess("Registration Successful!");
        navigate("/login");
      })
      .catch((error) => {
        setIsLoading(false);
        setFormValid("An error occurred. Please try again.");
        console.error(error);
      });
  };

  return (
    <div
      style={{
        backgroundColor: "#800000", // Red-maroon background
        color: "white",
        padding: "2rem", // Increased padding
        borderRadius: "0.5rem",
        width: "100%",
        maxWidth: "700px", // Increased width
        margin: "auto",
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
      }}
    >
      <div style={{ marginTop: "10px" }}>
        <div className="mt-5">
          <div className="mt-3 mb-2" align="left" style={{ fontWeight: "bold" }}>
            Full Name:
          </div>
          <input
            type="text"
            placeholder="Full Name"
            onChange={(event) => setNameInput(event.target.value)} // Update the state with user input
            value={nameInput} // Bind the input value to the state
            className="input input-bordered input-accent w-full text-white" // Make text visible
          />
        </div>

        <div className="mt-5">
          <div className="mt-3 mb-2" align="left" style={{ fontWeight: "bold" }}>
            Email Address:
          </div>
          <input
            type="email"
            placeholder="Email Address"
            onBlur={handleEmailError}
            onChange={(event) => setEmailInput(event.target.value)}
            className={`input input-bordered ${emailError ? "input-error" : "input-accent"
              } text-white w-full`}
          />
        </div>

        <div className="mt-5">
          <div className="mt-3 mb-2" align="left" style={{ fontWeight: "bold" }}>
            Password:
          </div>
          <input
            type="password"
            placeholder="Password"
            onChange={(event) => setPasswordInput(event.target.value)}
            className="input input-bordered input-accent w-full text-white"
          />
        </div>

        <div className="mt-5">
          <div className="mt-3 mb-2" align="left" style={{ fontWeight: "bold" }}>
            Confirm Password:
          </div>
          <input
            type="password"
            placeholder="Confirm Password"
            onChange={(event) => setConfirmPassword(event.target.value)}
            onBlur={handlePasswordError}
            className={`input input-bordered ${passwordError ? "input-error" : "input-accent"
              } text-white w-full`}
          />
        </div>

        {formValid && (
          <div className="alert alert-warning shadow-lg mt-4">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current flex-shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{formValid}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="alert alert-info shadow-lg mt-4">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current flex-shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{success}</span>
            </div>
          </div>
        )}

        <button
          className={`btn btn-wide mt-3 ${isLoading ? "loading" : ""} w-full text-white bg-blue-800 hover:bg-blue-800`}
          onClick={handleSubmit} // Attach the handleSubmit function here
        >
          REGISTER YOUR ACCOUNT
        </button>

        <div className="mt-3 text-center font-bold">
          Already signed up?
          <button
            className="mx-2 cursor-pointer bg-blue-800 text-white py-2 px-4 rounded"
            onClick={() => navigate("/login")} // Navigate to login page
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
