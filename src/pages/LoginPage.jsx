// --------------------------------------
// LoginPage.jsx
// --------------------------------------
// This page lets users log in using Firebase auth.
// Form → email + password
// On success → redirect to dashboard
// On error → show simple message
// --------------------------------------

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";


export default function LoginPage() {
  const { login } = useAuth(); // from AuthContext
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  // Update form fields
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Submit login form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Firebase login
      await login(form.email, form.password);

      // Redirect to dashboard if login succeeds
      navigate("/dashboard");
    } catch (err) {
      // If wrong info → show error
      setError("Invalid email or password.");
      console.error("Login error:", err);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Login</h2>

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
          Password
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>

        <button className="primary-btn" type="submit">
          Sign In
        </button>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </main>
  );
}
