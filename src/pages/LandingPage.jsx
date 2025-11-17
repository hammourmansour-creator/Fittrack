// --------------------------------------
// LandingPage.jsx
// --------------------------------------
// This is the first page a user sees.
// It explains what the app does and gives
// buttons to Login or Register.
// --------------------------------------

import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";


export default function LandingPage() {
  const { user } = useAuth(); // check if user is logged in

  return (
    <main className="landing">
      <section className="hero">
        <h1>Track your workouts. See your progress.</h1>

        <p>
          A simple fitness tracker to log workouts, visualize your progress, 
          and stay consistent.
        </p>

        <div className="hero-actions">
          {/* If user is logged in → show dashboard button */}
          {user ? (
            <Link to="/dashboard" className="primary-btn">
              Go to Dashboard
            </Link>
          ) : (
            <>
              {/* If NOT logged in → show signup + login */}
              <Link to="/register" className="primary-btn">
                Get Started
              </Link>
              <Link to="/login" className="secondary-btn">
                Login
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
