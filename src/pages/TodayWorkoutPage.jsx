// -----------------------------------
// TodayWorkoutPage.jsx
// -----------------------------------
// Executes today's workout based on active plan
// Saves completion + updates streak + next day
// -----------------------------------

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  db,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "../firebase";

export default function TodayWorkoutPage() {
  const { user } = useAuth();
  const [today, setToday] = useState(null);
  const [checked, setChecked] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load today's workout from active plan
  useEffect(() => {
    if (!user) return;

    const loadToday = async () => {
      try {
        setLoading(true);

        const profileRef = doc(db, "profiles", user.uid);
        const profileSnap = await getDoc(profileRef);
        if (!profileSnap.exists()) {
          setToday(null);
          return;
        }

        const profileData = profileSnap.data();
        const currentPlanId = profileData.currentPlanId;
        const planDayIndex = profileData.planDayIndex ?? 0;

        if (!currentPlanId) {
          setToday(null);
          return;
        }

        const planRef = doc(db, "plans", currentPlanId);
        const planSnap = await getDoc(planRef);
        if (!planSnap.exists()) {
          setToday(null);
          return;
        }

        const plan = planSnap.data();
        const days = Array.isArray(plan.days) ? plan.days : [];

        if (days.length === 0) {
          setToday(null);
          return;
        }

        const safeIndex =
          planDayIndex >= 0 && planDayIndex < days.length
            ? planDayIndex
            : 0;

        const todayWorkout = days[safeIndex];

        const exercises = Array.isArray(todayWorkout.exercises)
          ? todayWorkout.exercises
          : [];

        setToday({
          planId: currentPlanId,
          index: safeIndex,
          totalDays: days.length,
          title: todayWorkout.title || `Day ${safeIndex + 1}`,
          focus: todayWorkout.focus || "",
          exercises,
        });

        const initChecks = {};
        exercises.forEach((_, i) => {
          initChecks[i] = false;
        });
        setChecked(initChecks);
      } catch (err) {
        console.error("Error loading today's workout:", err);
        setToday(null);
      } finally {
        setLoading(false);
      }
    };

    loadToday();
  }, [user]);

  const toggle = (i) => {
    setChecked((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  // Helper for YYYY-MM-DD string in local time
  const formatDateKey = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const handleComplete = async () => {
    if (!user || !today) return;

    try {
      setSaving(true);

      // 1. Save a workout document (summary)
      await addDoc(collection(db, "workouts"), {
        userId: user.uid,
        createdAt: serverTimestamp(),
        type: "plan",
        planId: today.planId,
        dayIndex: today.index,
        completedExercises: checked,
      });

      // 2. Update streak + lastWorkoutDate + planDayIndex
      const profileRef = doc(db, "profiles", user.uid);
      const profileSnap = await getDoc(profileRef);

      let streak = 0;
      let lastWorkoutDate = null;
      let longestStreak = 0;

      if (profileSnap.exists()) {
        const data = profileSnap.data();
        streak = Number(data.streak) || 0;
        longestStreak = Number(data.longestStreak) || 0;
        lastWorkoutDate = data.lastWorkoutDate || null;
      }

      const todayKey = formatDateKey(new Date());
      const yesterdayKey = formatDateKey(
        new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      let newStreak;

      if (!lastWorkoutDate) {
        // first ever logged workout
        newStreak = 1;
      } else if (lastWorkoutDate === todayKey) {
        // already logged today → don't change streak
        newStreak = streak || 1;
      } else if (lastWorkoutDate === yesterdayKey) {
        // continues streak
        newStreak = (streak || 0) + 1;
      } else {
        // gap → reset
        newStreak = 1;
      }

      const newLongestStreak = Math.max(longestStreak, newStreak);

      // advance to next day in plan
      const nextIndex =
        today.totalDays > 0
          ? (today.index + 1) % today.totalDays
          : today.index;

      await updateDoc(profileRef, {
        streak: newStreak,
        longestStreak: newLongestStreak,
        lastWorkoutDate: todayKey,
        planDayIndex: nextIndex,
      });

      alert("Workout completed! Great job.");
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Error completing workout:", err);
      alert("Something went wrong saving your workout.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="page">
        <h2>Today's Workout</h2>
        <p style={{ color: "#9ca3af" }}>Loading…</p>
      </main>
    );
  }

  if (!today) {
    return (
      <main className="page">
        <h2>Today's Workout</h2>
        <p style={{ color: "#9ca3af" }}>
          No active plan or no workout found for today.
        </p>
      </main>
    );
  }

  return (
    <main className="page">
      <h2>{today.title}</h2>
      <p
        style={{
          color: "#9ca3af",
          marginBottom: "6px",
          fontSize: "0.9rem",
        }}
      >
        Day {today.index + 1} of {today.totalDays}
        {today.focus ? ` • Focus: ${today.focus}` : ""}
      </p>
      <p style={{ color: "#94a3b8", marginBottom: "14px", fontSize: "0.85rem" }}>
        Tick each exercise as you complete it, then hit{" "}
        <strong>Complete Workout</strong>.
      </p>

      {today.exercises.map((ex, i) => (
  <div key={i} className="card exercise-row" style={{ marginBottom: "10px" }}>
    <div>
      <div className="exercise-text-title">{ex.name}</div>
      <p className="exercise-text-sub">
        {ex.sets} × {ex.reps}
        {ex.note ? ` • ${ex.note}` : ""}
      </p>
    </div>

    <label className="exercise-checkbox">
      <input
        type="checkbox"
        checked={!!checked[i]}
        onChange={() => toggle(i)}
      />
      <span />
    </label>
  </div>
))}


      <button
        className="primary-btn"
        style={{ marginTop: "20px" }}
        disabled={saving}
        onClick={handleComplete}
      >
        {saving ? "Saving..." : "Complete Workout"}
      </button>
    </main>
  );
}
