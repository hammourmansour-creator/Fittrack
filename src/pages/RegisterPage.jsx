// --------------------------------------
// RegisterPage.jsx
// --------------------------------------
// This page lets a new user create an account.
// Uses Firebase Authentication (email + password)
// After successful signup → redirect to dashboard.
// --------------------------------------

// src/pages/RegisterPage.jsx

import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";

export default function RegisterPage() {
  // If your AuthContext uses "register" instead of "signup",
  // change this line to: const { register } = useAuth();
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      await signup(email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Could not create account. Try a different email.");
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  return (
    <main className="app-main">
      <div className="form-card">
        <h2>Sign up</h2>
        <p style={{ color: "#6b7280", marginBottom: 12 }}>
          Create your FitTrack account and start logging your workouts.
        </p>

        {error && <p className="error-text">{error}</p>}

        <form onSubmit={handleSubmit} className={shake ? "shake" : ""}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <div className="input-with-icon">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="input-icon-button"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            className="primary-btn"
            style={{ marginTop: 12 }}
          >
            Sign up
          </button>
        </form>

        <p style={{ marginTop: 12 }}>
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
