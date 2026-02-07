import React, { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setMessage("");
    setError(false);

    if (!email) {
      setError(true);
      setMessage("Please enter your email address.");
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("A reset link has been sent to your email.");
      } else {
        setMessage(data.message || "An error occurred.");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div style={{
      backgroundColor: "#800000",
      color: "white",
      padding: "2rem",
      borderRadius: "0.5rem",
      width: "90%",
      maxWidth: "600px",
      margin: "2rem auto",
      textAlign: "center",
      boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)"
    }}>
      <h2 style={{ marginBottom: "1rem", fontWeight: "bold" }}>Forgot Password</h2>
      <form onSubmit={handleForgotPassword}>
        <div>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              padding: "0.5rem",
              margin: "1rem 0",
              color:"black",
              width: "100%",
              borderRadius: "0.25rem",
              border: "1px solid #ccc"
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
            cursor: "pointer"
          }}
        >
          Send Reset Link
        </button>
      </form>
      {message && (
        <div style={{
          marginTop: "1rem",
          color: error ? "red" : "green",
          fontWeight: "bold"
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
