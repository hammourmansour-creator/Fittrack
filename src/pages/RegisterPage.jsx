// --------------------------------------
// RegisterPage.jsx
// --------------------------------------
// This page lets a new user create an account.
// Uses Firebase Authentication (email + password)
// After successful signup → redirect to dashboard.
// --------------------------------------

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";


export default function RegisterPage() {
  const { register } = useAuth(); // Firebase register function
  const navigate = useNavigate();

  // Form state
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  // Update form fields
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Submit signup form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Create account with Firebase
      await register(form.email, form.password);

      // Redirect after successful registration
      navigate("/dashboard");
    } catch (err) {
      setError("Could not create account.");
      console.error("Register error:", err);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Create Account</h2>

        {error && <div className="error">{error}</div>}

        {/* Email input */}
        <label>
          Email
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        {/* Password input */}
        <label>
          Password (min 6 characters)
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
          />
        </label>

        <button className="primary-btn" type="submit">
          Sign Up
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </main>
  );
}
