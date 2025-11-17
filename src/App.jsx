// --------------------------------------
// App.jsx
// --------------------------------------
// This file defines the main structure of the app.
// It decides:
// - Which page shows for which URL (route)
// - Which pages require the user to be logged in
// - Shows the Navbar at the top
// --------------------------------------

// --------------------------------------
// App.jsx
// --------------------------------------

import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";

import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import WorkoutsPage from "./pages/WorkoutsPage.jsx";
import AddWorkoutPage from "./pages/AddWorkoutPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import CoachPage from "./pages/CoachPage.jsx";
import MyPlansPage from "./pages/MyPlansPage.jsx";
import TodayWorkoutPage from "./pages/TodayWorkoutPage.jsx";
import CreatePlanPage from "./pages/CreatePlanPage.jsx";



import { useAuth } from "./context/AuthContext.jsx";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workouts"
            element={
              <ProtectedRoute>
                <WorkoutsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workouts/new"
            element={
              <ProtectedRoute>
                <AddWorkoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workouts/:id/edit"
            element={
              <ProtectedRoute>
                <AddWorkoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach"
            element={
              <ProtectedRoute>
                <CoachPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plans"
            element={
              <ProtectedRoute>
                <MyPlansPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/today"
            element={
              <ProtectedRoute>
                <TodayWorkoutPage />
              </ProtectedRoute>
            }
          />
          <Route
           path="/plans/new" 
           element={
           <CreatePlanPage />
           } 
          />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
