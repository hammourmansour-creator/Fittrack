import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { login } = useAuth();
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
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError("Incorrect email or password.");
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  return (
    <main className="app-main">
      <div className="form-card">
        <h2>Login</h2>
        <p style={{ color: "#6b7280", marginBottom: 12 }}>
          Welcome back. Log in to see your workouts and dashboard.
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
            Login
          </button>
        </form>

        <p style={{ marginTop: 14, fontSize: "0.9rem" }}>
          Don’t have an account?{" "}
          <Link to="/register" className="auth-link">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
