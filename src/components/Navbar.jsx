// --------------------------------------
// Navbar.jsx
// --------------------------------------

import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user } = useAuth();

  const linkClass = ({ isActive }) =>
    "nav-link" + (isActive ? " nav-link-active" : "");

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="nav-left">
          <Link to="/" className="nav-brand">
            <div className="nav-brand-logo">
              <span>FT</span>
            </div>
            <span className="nav-brand-text">FitTrack</span>
          </Link>
        </div>

        <div className="nav-right">
          {user ? (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/workouts" className={linkClass}>
                Workouts
              </NavLink>
              <NavLink to="/today" className={linkClass}>
                Today
              </NavLink>
              <NavLink to="/coach" className={linkClass}>
                Coach
              </NavLink>
              <NavLink to="/plans" className={linkClass}>
                Plans
              </NavLink>
              <NavLink to="/profile" className={linkClass}>
                Profile
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Log in
              </NavLink>
              <NavLink to="/register" className={linkClass}>
                Sign up
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
