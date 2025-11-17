// --------------------------------------
// RegisterPage.jsx
// --------------------------------------
// Sign up with email + password (Firebase Auth)
// After successful signup → redirect to /dashboard
// --------------------------------------

import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const { signup } = useAuth(); // wrapper around Firebase createUserWithEmailAndPassword
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await signup(email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error("Signup error:", err);

      let msg = "Could not create account. Please try again.";

      if (err?.code === "auth/email-already-in-use") {
        msg = "This email is already in use. Try logging in instead.";
      } else if (err?.code === "auth/invalid-email") {
        msg = "This email address is not valid.";
      } else if (err?.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters.";
      } else if (err?.code === "auth/operation-not-allowed") {
        msg = "Email/password sign up is not enabled in Firebase.";
      } else if (err?.code === "auth/network-request-failed") {
        msg = "Network error. Check your connection and try again.";
      } else if (err?.code === "auth/unauthorized-domain") {
        msg = "Sign up is not allowed from this domain (Firebase settings).";
      }

      setError(msg);
      setShake(true);
      setTimeout(() => setShake(false), 350);
    } finally {
      setIsSubmitting(false);
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
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <label htmlFor="register-password">Password</label>
          <div className="input-with-icon">
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
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
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Sign up"}
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
