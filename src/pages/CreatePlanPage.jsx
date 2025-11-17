// --------------------------------------
// CreatePlanPage.jsx
// --------------------------------------
// Let user build their own multi-day plan
// Structure matches AI-generated plans, so
// TodayWorkoutPage + Dashboard work the same.
// --------------------------------------

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  db,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
} from "../firebase";

const createDay = (index) => ({
  title: `Day ${index + 1}`,
  focus: "",
  exercises: [
    {
      name: "",
      sets: "",
      reps: "",
      note: "",
    },
  ],
});

export default function CreatePlanPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [planName, setPlanName] = useState("My Custom Plan");
  const [daysCount, setDaysCount] = useState(4);
  const [days, setDays] = useState(() =>
    Array.from({ length: 4 }, (_, i) => createDay(i))
  );
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <main className="page">
        <h2>Create Plan</h2>
        <p style={{ color: "#374151" }}>
          You need to be logged in to create a plan.
        </p>
      </main>
    );
  }

  const handleDaysCountChange = (value) => {
    const n = Math.min(Math.max(Number(value) || 1, 1), 7); // 1–7 days
    setDaysCount(n);

    setDays((prev) => {
      const next = [...prev];
      if (n > prev.length) {
        for (let i = prev.length; i < n; i++) {
          next.push(createDay(i));
        }
      } else if (n < prev.length) {
        next.length = n;
      }
      return next;
    });
  };

  const updateDayField = (dayIndex, field, value) => {
    setDays((prev) =>
      prev.map((day, i) =>
        i === dayIndex ? { ...day, [field]: value } : day
      )
    );
  };

  const updateExerciseField = (dayIndex, exIndex, field, value) => {
    setDays((prev) =>
      prev.map((day, i) => {
        if (i !== dayIndex) return day;
        const exercises = day.exercises.map((ex, j) =>
          j === exIndex ? { ...ex, [field]: value } : ex
        );
        return { ...day, exercises };
      })
    );
  };

  const addExercise = (dayIndex) => {
    setDays((prev) =>
      prev.map((day, i) => {
        if (i !== dayIndex) return day;
        return {
          ...day,
          exercises: [
            ...day.exercises,
            { name: "", sets: "", reps: "", note: "" },
          ],
        };
      })
    );
  };

  const removeExercise = (dayIndex, exIndex) => {
    setDays((prev) =>
      prev.map((day, i) => {
        if (i !== dayIndex) return day;
        const next = day.exercises.filter((_, j) => j !== exIndex);
        return { ...day, exercises: next.length ? next : [{ name: "", sets: "", reps: "", note: "" }] };
      })
    );
  };

  const buildCleanPayload = () => {
    const trimmedName = planName.trim();
    if (!trimmedName) {
      alert("Give your plan a name.");
      return null;
    }

    const cleanedDays = days
      .map((day, index) => {
        const exercises = day.exercises
          .filter((ex) => ex.name.trim())
          .map((ex) => ({
            name: ex.name.trim(),
            sets: ex.sets.trim(),
            reps: ex.reps.trim(),
            note: ex.note.trim(),
          }));

        if (exercises.length === 0) return null;

        return {
          title: day.title.trim() || `Day ${index + 1}`,
          focus: day.focus.trim(),
          exercises,
        };
      })
      .filter(Boolean);

    if (cleanedDays.length === 0) {
      alert("Add at least one exercise in at least one day.");
      return null;
    }

    return {
      name: trimmedName,
      days: cleanedDays,
    };
  };

  const savePlan = async (setActive = false) => {
    const payload = buildCleanPayload();
    if (!payload) return;

    try {
      setSaving(true);

      const planDocRef = await addDoc(collection(db, "plans"), {
        userId: user.uid,
        name: payload.name,
        days: payload.days,
        source: "custom",
        createdAt: serverTimestamp(),
      });

      if (setActive) {
        const profileRef = doc(db, "profiles", user.uid);
        await updateDoc(profileRef, {
          currentPlanId: planDocRef.id,
          planDayIndex: 0,
        });
      }

      alert(setActive ? "Plan saved and set as active." : "Plan saved.");
      navigate("/plans");
    } catch (err) {
      console.error("Error saving plan:", err);
      alert("Could not save plan. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "center",
          marginBottom: "6px",
        }}
      >
        <h2>Create Custom Plan</h2>
      </div>

      <p style={{ color: "#374151", marginBottom: "16px", fontSize: "0.9rem" }}>
        Build your own multi-day plan. Once saved, you can use it just like
        the AI coach plans.
      </p>

      <div className="card" style={{ marginBottom: "14px" }}>
        <label>Plan name</label>
        <input
          type="text"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
        />

        <label style={{ marginTop: "10px" }}>Training days per week</label>
        <select
          value={daysCount}
          onChange={(e) => handleDaysCountChange(e.target.value)}
        >
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <option key={n} value={n}>
              {n} day{n > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="plan-days-grid">
        {days.map((day, dayIndex) => (
          <div key={dayIndex} className="card plan-day-card">
            <div className="plan-day-header">
              <h3>Day {dayIndex + 1}</h3>
            </div>

            <label>Day title</label>
            <input
              type="text"
              placeholder={`e.g. Push, Lower Body, Pull`}
              value={day.title}
              onChange={(e) =>
                updateDayField(dayIndex, "title", e.target.value)
              }
            />

            <label style={{ marginTop: "8px" }}>Focus (optional)</label>
            <input
              type="text"
              placeholder="e.g. Chest/Shoulders/Triceps"
              value={day.focus}
              onChange={(e) =>
                updateDayField(dayIndex, "focus", e.target.value)
              }
            />

            <div className="plan-day-exercises">
              {day.exercises.map((ex, exIndex) => (
                <div key={exIndex} className="plan-exercise-row">
                  <div className="plan-exercise-main">
                    <label>Exercise</label>
                    <input
                      type="text"
                      placeholder="Bench Press"
                      value={ex.name}
                      onChange={(e) =>
                        updateExerciseField(
                          dayIndex,
                          exIndex,
                          "name",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="plan-exercise-meta">
                    <div>
                      <label>Sets</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={ex.sets}
                        onChange={(e) =>
                          updateExerciseField(
                            dayIndex,
                            exIndex,
                            "sets",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label>Reps</label>
                      <input
                        type="text"
                        placeholder="8–12"
                        value={ex.reps}
                        onChange={(e) =>
                          updateExerciseField(
                            dayIndex,
                            exIndex,
                            "reps",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="plan-exercise-note-row">
                    <div style={{ flex: 1 }}>
                      <label>Notes (optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. RPE 8, slow negatives"
                        value={ex.note}
                        onChange={(e) =>
                          updateExerciseField(
                            dayIndex,
                            exIndex,
                            "note",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <button
                      type="button"
                      className="secondary-btn"
                      style={{
                        padding: "4px 8px",
                        fontSize: "0.75rem",
                        alignSelf: "flex-end",
                      }}
                      onClick={() => removeExercise(dayIndex, exIndex)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="secondary-btn"
              style={{ marginTop: "8px", fontSize: "0.8rem" }}
              onClick={() => addExercise(dayIndex)}
            >
              + Add exercise
            </button>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: "16px",
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <button
          type="button"
          className="secondary-btn"
          disabled={saving}
          onClick={() => savePlan(false)}
        >
          {saving ? "Saving..." : "Save plan"}
        </button>
        <button
          type="button"
          className="primary-btn"
          disabled={saving}
          onClick={() => savePlan(true)}
        >
          {saving ? "Saving..." : "Save & set active"}
        </button>
      </div>
    </main>
  );
}
