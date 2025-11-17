// --------------------------------------
// AddWorkoutPage.jsx
// --------------------------------------
// Supports:
//  - Create: /workouts/new
//  - Edit:   /workouts/:id/edit
// Includes numeric validation + category selection.
// Updates user's streak in Firestore (profiles/{uid}) on NEW workout.
// --------------------------------------

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

import {
  db,
  addDoc,
  collection,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
  setDoc,
} from "../firebase";

// Helper: format Date -> "YYYY-MM-DD"
function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

// Helper: update streak for user in profiles collection
async function updateStreakForUser(userId) {
  const profileRef = doc(db, "profiles", userId);
  const snap = await getDoc(profileRef);

  const today = new Date();
  const todayKey = dateKey(today);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = dateKey(yesterday);

  let newStreak = 1;
  let newLongestStreak = 1;

  if (snap.exists()) {
    const data = snap.data();
    const lastWorkoutDate = data.lastWorkoutDate || null;
    const prevStreak = data.streak || 0;
    const prevLongest = data.longestStreak || 0;

    if (!lastWorkoutDate) {
      // first time we set it
      newStreak = 1;
    } else if (lastWorkoutDate === todayKey) {
      // already logged today → keep streak, don't increment
      newStreak = prevStreak || 1;
    } else if (lastWorkoutDate === yesterdayKey) {
      // continued streak
      newStreak = prevStreak + 1;
    } else {
      // gap → reset
      newStreak = 1;
    }

    newLongestStreak = Math.max(prevLongest, newStreak);
  } else {
    // no profile doc yet → create minimal profile with streak fields
    newStreak = 1;
    newLongestStreak = 1;
  }

  await setDoc(
    profileRef,
    {
      lastWorkoutDate: todayKey,
      streak: newStreak,
      longestStreak: newLongestStreak,
    },
    { merge: true }
  );
}

export default function AddWorkoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Read :id from URL; if present → edit mode
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState({
    category: "Full Body",
    exercise: "",
    sets: "",
    reps: "",
    weight: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [loadingWorkout, setLoadingWorkout] = useState(isEditMode);

  // Load existing workout in edit mode
  useEffect(() => {
    if (!isEditMode) {
      setLoadingWorkout(false);
      return;
    }

    const loadWorkout = async () => {
      try {
        const ref = doc(db, "workouts", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          alert("Workout not found.");
          navigate("/workouts");
          return;
        }

        const data = snap.data();

        // Only allow editing own workouts
        if (data.userId !== user?.uid) {
          alert("You are not allowed to edit this workout.");
          navigate("/workouts");
          return;
        }

        setForm({
          category: data.category || "Full Body",
          exercise: data.exercise || "",
          sets: data.sets != null ? String(data.sets) : "",
          reps: data.reps != null ? String(data.reps) : "",
          weight: data.weight != null ? String(data.weight) : "",
          notes: data.notes || "",
        });
      } catch (err) {
        console.error("Error loading workout:", err);
        alert("Could not load workout.");
        navigate("/workouts");
      } finally {
        setLoadingWorkout(false);
      }
    };

    loadWorkout();
  }, [id, isEditMode, navigate, user]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("You must be logged in.");
      return;
    }

    if (!form.exercise.trim()) {
      alert("Exercise name is required.");
      return;
    }

    // Convert to numbers and validate
    const setsNum = Number(form.sets);
    const repsNum = Number(form.reps);
    const weightNum = Number(form.weight);

    if (
      !Number.isFinite(setsNum) ||
      setsNum < 1 ||
      !Number.isFinite(repsNum) ||
      repsNum < 1 ||
      !Number.isFinite(weightNum) ||
      weightNum < 0
    ) {
      alert(
        "Please enter valid numbers:\n- Sets ≥ 1\n- Reps ≥ 1\n- Weight ≥ 0"
      );
      return;
    }

    const category = form.category || "Other";

    setSaving(true);

    try {
      const payload = {
        userId: user.uid,
        category,
        exercise: form.exercise.trim(),
        sets: setsNum,
        reps: repsNum,
        weight: weightNum,
        notes: form.notes.trim(),
      };

      if (isEditMode) {
        // EDIT: do NOT change streak on edit
        const ref = doc(db, "workouts", id);
        await updateDoc(ref, payload);
      } else {
        // CREATE: add workout + update streak
        await addDoc(collection(db, "workouts"), {
          ...payload,
          createdAt: serverTimestamp(),
        });

        // Update streak in profile doc
        await updateStreakForUser(user.uid);
      }

      navigate("/workouts");
    } catch (err) {
      console.error("Error saving workout:", err);
      alert("Could not save workout.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingWorkout) {
    return (
      <main className="page">
        <h2>Edit Workout</h2>
        <p style={{ color: "#64748b" }}>Loading workout...</p>
      </main>
    );
  }

  return (
    <main className="page">
      <h2>{isEditMode ? "Edit Workout" : "Add Workout"}</h2>

      <form
        onSubmit={handleSubmit}
        className="form-card"
        style={{ maxWidth: "500px" }}
      >
        <label>
          Category
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            style={{
              marginTop: "4px",
              padding: "8px 10px",
              borderRadius: "8px",
              border: "1px solid #1f2937",
              background: "#030712",
              color: "#f9fafb",
              fontSize: "0.9rem",
            }}
          >
            <option value="Full Body">Full Body</option>
            <option value="Chest">Chest</option>
            <option value="Back">Back</option>
            <option value="Shoulders">Shoulders</option>
            <option value="Arms">Arms</option>
            <option value="Legs">Legs</option>
            <option value="Core">Core</option>
            <option value="Cardio">Cardio</option>
            <option value="Other">Other</option>
          </select>
        </label>

        <label>
          Exercise
          <input
            type="text"
            name="exercise"
            value={form.exercise}
            onChange={handleChange}
            placeholder="Bench Press, Squat, Deadlift..."
            required
          />
        </label>

        <label>
          Sets
          <input
            type="number"
            name="sets"
            value={form.sets}
            onChange={handleChange}
            min="1"
            placeholder="3"
            required
          />
        </label>

        <label>
          Reps
          <input
            type="number"
            name="reps"
            value={form.reps}
            onChange={handleChange}
            min="1"
            placeholder="8"
            required
          />
        </label>

        <label>
          Weight (kg)
          <input
            type="number"
            name="weight"
            value={form.weight}
            onChange={handleChange}
            min="0"
            placeholder="40"
            required
          />
        </label>

        <label>
          Notes (optional)
          <input
            type="text"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Felt strong today..."
          />
        </label>

        <button
          type="submit"
          className="primary-btn"
          style={{ marginTop: "15px" }}
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : isEditMode
            ? "Save Changes"
            : "Save Workout"}
        </button>
      </form>
    </main>
  );
}
