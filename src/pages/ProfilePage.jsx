// --------------------------------------
// ProfilePage.jsx
// --------------------------------------
// Stores per-user profile in Firestore:
//   profiles/{user.uid}
//
// Fields:
//  - weight
//  - goalWeight
//  - dailyCalories
//  - dailySteps
//  - weeklyGoalDays
// Includes validation to prevent negative values.
// --------------------------------------

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { db, doc, getDoc, setDoc } from "../firebase";

export default function ProfilePage() {
  const { user } = useAuth();

  const [profile, setProfile] = useState({
    weight: "",
    goalWeight: "",
    dailyCalories: "",
    dailySteps: "",
    weeklyGoalDays: "4",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      try {
        const ref = doc(db, "profiles", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();

          setProfile({
            weight:
              data.weight != null ? String(data.weight) : "",
            goalWeight:
              data.goalWeight != null ? String(data.goalWeight) : "",
            dailyCalories:
              data.dailyCalories != null
                ? String(data.dailyCalories)
                : "",
            dailySteps:
              data.dailySteps != null ? String(data.dailySteps) : "",
            weeklyGoalDays:
              data.weeklyGoalDays != null
                ? String(data.weeklyGoalDays)
                : "4",
          });
        } else {
          setProfile((prev) => ({
            ...prev,
            weeklyGoalDays: "4",
          }));
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        alert("Could not load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    // Convert to numbers
    const weightNum = profile.weight
      ? Number(profile.weight)
      : null;
    const goalWeightNum = profile.goalWeight
      ? Number(profile.goalWeight)
      : null;
    const caloriesNum = profile.dailyCalories
      ? Number(profile.dailyCalories)
      : null;
    const stepsNum = profile.dailySteps
      ? Number(profile.dailySteps)
      : null;
    const weeklyGoalNum = profile.weeklyGoalDays
      ? Number(profile.weeklyGoalDays)
      : 4;

    // Validation
    if (weightNum !== null && weightNum <= 0) {
      alert("Current weight must be positive.");
      return;
    }

    if (goalWeightNum !== null && goalWeightNum <= 0) {
      alert("Goal weight must be positive.");
      return;
    }

    if (caloriesNum !== null && caloriesNum < 0) {
      alert("Calories cannot be negative.");
      return;
    }

    if (stepsNum !== null && stepsNum < 0) {
      alert("Steps cannot be negative.");
      return;
    }

    if (weeklyGoalNum < 1 || weeklyGoalNum > 7) {
      alert("Weekly goal must be between 1 and 7 days.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        weight: weightNum,
        goalWeight: goalWeightNum,
        dailyCalories: caloriesNum,
        dailySteps: stepsNum,
        weeklyGoalDays: weeklyGoalNum,
      };

      const ref = doc(db, "profiles", user.uid);
      await setDoc(ref, payload, { merge: true });

      alert("Profile saved.");
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="page">
        <h2>Profile</h2>
        <p style={{ color: "#64748b" }}>Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="page">
      <h2>Profile</h2>

      <form
        onSubmit={handleSubmit}
        className="form-card"
        style={{ maxWidth: "500px" }}
      >
        <label>
          Current Weight (kg)
          <input
            type="number"
            name="weight"
            value={profile.weight}
            onChange={handleChange}
            placeholder="e.g., 98"
            min="1"
          />
        </label>

        <label>
          Goal Weight (kg)
          <input
            type="number"
            name="goalWeight"
            value={profile.goalWeight}
            onChange={handleChange}
            placeholder="e.g., 92"
            min="1"
          />
        </label>

        <label>
          Daily Calorie Target
          <input
            type="number"
            name="dailyCalories"
            value={profile.dailyCalories}
            onChange={handleChange}
            placeholder="e.g., 2400"
            min="0"
          />
        </label>

        <label>
          Daily Steps Target
          <input
            type="number"
            name="dailySteps"
            value={profile.dailySteps}
            onChange={handleChange}
            placeholder="e.g., 15000"
            min="0"
          />
        </label>

        <label>
          Weekly Training Goal (days)
          <input
            type="number"
            name="weeklyGoalDays"
            value={profile.weeklyGoalDays}
            onChange={handleChange}
            min="1"
            max="7"
            placeholder="e.g., 4"
            required
          />
        </label>

        <button
          className="primary-btn"
          type="submit"
          style={{ marginTop: "15px" }}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </main>
  );
}

