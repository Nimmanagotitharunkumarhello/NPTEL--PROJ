import React, { useState, useEffect } from "react";
import {useLocation, useNavigate } from 'react-router-dom'; // Correct import
import axios from "axios";

export default function ResetPassword() {
  const location = useLocation();
  const history = useNavigate();
  const [token, setToken] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenFromUrl = params.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError(true);
      setMessage("Invalid or missing token.");
    }
  }, [location]);

  const handlePasswordReset = async (event) => {
    event.preventDefault();
    setMessage("");
    setError(false);

    if (!newPassword) {
      setError(true);
      setMessage("Password cannot be empty");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/reset-password", {
        token: token,
        new_password: newPassword,
      });

      if (response.data.success) {
        setMessage("Password reset successful!");
        history.push("/login");
      } else {
        setMessage(response.data.message || "An error occurred.");
        setError(true);
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
      setError(true);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#800000",
        color: "white",
        padding: "2rem",
        borderRadius: "0.5rem",
        width: "90%",
        maxWidth: "600px",
        margin: "2rem auto",
        textAlign: "center",
        boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
      }}
    >
      <h2 style={{ marginBottom: "1rem", fontWeight: "bold" }}>Reset Password</h2>
      {message && (
        <div
          style={{
            marginTop: "1rem",
            color: error ? "red" : "green",
            fontWeight: "bold",
          }}
        >
          {message}
        </div>
      )}
      <form onSubmit={handlePasswordReset}>
        <div>
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{
              padding: "0.5rem",
              margin: "1rem 0",
              color: "black",
              width: "100%",
              borderRadius: "0.25rem",
              border: "1px solid #ccc",
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#004080",
            color: "white",
            border: "none",
            borderRadius: "0.25rem",
            cursor: "pointer",
          }}
        >
          Reset Password
        </button>
      </form>
    </div>
  );
}
