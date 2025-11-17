// --------------------------------------
// CoachPage.jsx
// --------------------------------------
// "AI" Workout Coach (rule-based planner)
// Generates a weekly program based on:
//  - goal
//  - days per week
//  - experience
//  - equipment
// Can also SAVE the generated plan to Firestore.
// --------------------------------------

import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { db, addDoc, collection, serverTimestamp } from "../firebase";

function generatePlan({ goal, daysPerWeek, experience, equipment }) {
  const days = Math.max(2, Math.min(daysPerWeek || 3, 6)); // clamp 2–6

  // Choose split
  let splitType;
  if (days >= 5) splitType = "PPL+UL"; // push/pull/legs + upper/lower
  else if (days === 4) splitType = "Upper/Lower";
  else if (days === 3) splitType = "Full Body 3x";
  else splitType = "Full Body 2x";

  const isBeginner = experience === "beginner";
  const isAdvanced = experience === "advanced";

  const repRange =
    goal === "strength"
      ? "4–6 reps"
      : goal === "fat-loss"
      ? "10–15 reps"
      : "8–12 reps";

  const volumeMain = isBeginner ? 3 : isAdvanced ? 5 : 4; // sets per main lift

  const usesMachines = equipment === "gym";
  const limitedEquipment = equipment === "dumbbells";
  const bodyweightOnly = equipment === "home";

  const ex = {
    chest: usesMachines
      ? "Bench Press"
      : limitedEquipment
      ? "Dumbbell Bench Press"
      : "Push-Ups",
    back: usesMachines
      ? "Lat Pulldown"
      : limitedEquipment
      ? "One-Arm Dumbbell Row"
      : "Inverted Row",
    legs: usesMachines
      ? "Barbell Squat"
      : limitedEquipment
      ? "Goblet Squat"
      : "Bodyweight Squat",
    shoulders: usesMachines
      ? "Overhead Press"
      : limitedEquipment
      ? "Dumbbell Shoulder Press"
      : "Pike Push-Up",
    biceps:
      limitedEquipment || usesMachines ? "Dumbbell Curl" : "Bodyweight Curl Variation",
    triceps:
      limitedEquipment || usesMachines ? "Tricep Dips" : "Diamond Push-Ups",
    core: "Plank",
    hinge: usesMachines
      ? "Romanian Deadlift"
      : limitedEquipment
      ? "Dumbbell Romanian Deadlift"
      : "Hip Hinge Good Morning",
    glutes: usesMachines || limitedEquipment ? "Hip Thrust" : "Glute Bridge",
    cardio:
      goal === "fat-loss"
        ? "10–20 min brisk walk / incline treadmill"
        : "5–10 min light cardio warm-up",
  };

  // Helper to build exercise entry
  const E = (name, sets = volumeMain, reps = repRange, note = "") => ({
    name,
    sets,
    reps,
    note,
  });

  const planDays = [];

  if (splitType === "PPL+UL") {
    planDays.push({
      title: "Day 1 — Push (Chest, Shoulders, Triceps)",
      focus: "Push",
      exercises: [
        E(ex.chest),
        E(ex.shoulders),
        E(ex.triceps, volumeMain - 1),
        E("Lateral Raises", volumeMain - 1, "12–15 reps"),
        E(ex.core, 3, "30–45 sec", "Slow, controlled."),
      ],
    });
    planDays.push({
      title: "Day 2 — Pull (Back, Biceps)",
      focus: "Pull",
      exercises: [
        E(ex.back),
        E("Horizontal Row (Machine or Dumbbell)", volumeMain, repRange),
        E(ex.biceps, volumeMain - 1),
        E("Face Pulls or Rear Delt Raises", volumeMain - 1, "12–15 reps"),
        E(ex.core, 3, "30–45 sec"),
      ],
    });
    planDays.push({
      title: "Day 3 — Legs (Quads, Hamstrings, Glutes)",
      focus: "Legs",
      exercises: [
        E(ex.legs),
        E(ex.hinge),
        E(ex.glutes, volumeMain - 1),
        E("Calf Raises", 3, "12–20 reps"),
        E(ex.core, 3, "30–45 sec"),
      ],
    });
    planDays.push({
      title: "Day 4 — Upper (All upper body)",
      focus: "Upper",
      exercises: [
        E(ex.chest, volumeMain - 1),
        E(ex.back, volumeMain - 1),
        E(ex.shoulders, volumeMain - 1),
        E(ex.biceps, 3),
        E(ex.triceps, 3),
      ],
    });
    planDays.push({
      title: "Day 5 — Lower (Legs + Core)",
      focus: "Lower",
      exercises: [
        E(ex.legs, volumeMain - 1),
        E(ex.hinge, volumeMain - 1),
        E(ex.glutes, 3),
        E("Calf Raises", 3, "12–20 reps"),
        E(ex.core, 3, "30–60 sec"),
      ],
    });
  } else if (splitType === "Upper/Lower") {
    planDays.push({
      title: "Day 1 — Upper Body",
      focus: "Upper",
      exercises: [
        E(ex.chest),
        E(ex.back),
        E(ex.shoulders),
        E(ex.biceps, 3),
        E(ex.triceps, 3),
        E(ex.core, 3, "30–45 sec"),
      ],
    });
    planDays.push({
      title: "Day 2 — Lower Body",
      focus: "Lower",
      exercises: [
        E(ex.legs),
        E(ex.hinge),
        E(ex.glutes, volumeMain - 1),
        E("Calf Raises", 3, "12–20 reps"),
        E(ex.core, 3, "30–45 sec"),
      ],
    });
    planDays.push({
      title: "Day 3 — Upper Body (Variation)",
      focus: "Upper",
      exercises: [
        E(ex.chest, volumeMain - 1),
        E(ex.back, volumeMain - 1),
        E(ex.shoulders, volumeMain - 1),
        E("Row Variation", 3, repRange),
        E("Chest Fly (Machine or DB)", 3, "10–15 reps"),
      ],
    });
    planDays.push({
      title: "Day 4 — Lower Body (Variation)",
      focus: "Lower",
      exercises: [
        E(ex.legs, volumeMain - 1),
        E(ex.hinge, volumeMain - 1),
        E(ex.glutes, 3),
        E("Lunge or Split Squat", 3, "8–12 reps / leg"),
        E(ex.core, 3, "30–60 sec"),
      ],
    });
  } else if (splitType === "Full Body 3x") {
    for (let i = 1; i <= 3; i++) {
      planDays.push({
        title: `Day ${i} — Full Body`,
        focus: "Full Body",
        exercises: [
          E(ex.legs),
          E(ex.chest),
          E(ex.back),
          E(ex.shoulders, volumeMain - 1),
          E(ex.core, 3, "30–45 sec"),
        ],
      });
    }
  } else {
    // Full Body 2x
    for (let i = 1; i <= 2; i++) {
      planDays.push({
        title: `Day ${i} — Full Body`,
        focus: "Full Body",
        exercises: [
          E(ex.legs),
          E(ex.chest),
          E(ex.back),
          E(ex.core, 3, "30–45 sec"),
        ],
      });
    }
  }

  // Trim to requested number of days
  const finalDays = planDays.slice(0, days);

  const summary = {
    splitType,
    daysPerWeek: days,
    repRange,
    notes: [
      goal === "strength"
        ? "Prioritize progressive overload on main lifts (increase weight over time with good form)."
        : goal === "fat-loss"
        ? "Keep rest times shorter (45–75s) and add 10–20 minutes of cardio after strength work."
        : "Focus on controlled tempo and staying 1–3 reps away from failure on each set.",
      isBeginner
        ? "Since you selected beginner, keep 1–2 sets in reserve and focus on perfect technique."
        : isAdvanced
        ? "As advanced, you can use higher volume and occasional intensity techniques (drop sets, rest-pause) once consistent."
        : "As an intermediate lifter, prioritize consistency and small improvements each week.",
      bodyweightOnly
        ? "Since you only have bodyweight, push closer to failure and slow down the negative (eccentric) phase."
        : limitedEquipment
        ? "With dumbbells, use unilateral work (one side at a time) to make light weights feel heavier."
        : "With access to machines and barbells, rotate variations every 6–8 weeks to avoid plateaus.",
    ],
    cardio: ex.cardio,
  };

  return { summary, days: finalDays };
}

export default function CoachPage() {
  const { user } = useAuth();
  const [goal, setGoal] = useState("muscle");
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [experience, setExperience] = useState("intermediate");
  const [equipment, setEquipment] = useState("gym");
  const [plan, setPlan] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedDays = Number(daysPerWeek) || 3;
    const result = generatePlan({
      goal,
      daysPerWeek: parsedDays,
      experience,
      equipment,
    });
    setPlan(result);
    setSaveMessage("");
  };

  const handleSave = async () => {
    if (!user) {
      alert("You must be logged in to save a plan.");
      return;
    }
    if (!plan) {
      alert("Generate a plan first.");
      return;
    }

    try {
      setSaving(true);
      setSaveMessage("");

      await addDoc(collection(db, "plans"), {
        userId: user.uid,
        createdAt: serverTimestamp(),
        settings: {
          goal,
          daysPerWeek: Number(daysPerWeek) || 3,
          experience,
          equipment,
        },
        summary: plan.summary,
        days: plan.days,
      });

      setSaveMessage("Plan saved successfully.");
    } catch (err) {
      console.error("Error saving plan:", err);
      setSaveMessage("Could not save plan. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page">
      <h2>AI Workout Coach</h2>
      <p style={{ color: "#9ca3af", marginBottom: "16px" }}>
        Generate a structured weekly training plan based on your goal and
        schedule.
      </p>

      <form
        onSubmit={handleSubmit}
        className="form-card"
        style={{ maxWidth: "520px", marginBottom: "20px" }}
      >
        <label>
          Goal
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          >
            <option value="muscle">Build muscle</option>
            <option value="fat-loss">Fat loss / recomposition</option>
            <option value="strength">Strength focused</option>
          </select>
        </label>

        <label>
          Days per week you can train
          <input
            type="number"
            min="2"
            max="7"
            value={daysPerWeek}
            onChange={(e) => setDaysPerWeek(e.target.value)}
          />
        </label>

        <label>
          Experience level
          <select
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
          >
            <option value="beginner">Beginner (0–6 months)</option>
            <option value="intermediate">Intermediate (6–24 months)</option>
            <option value="advanced">Advanced (2+ years)</option>
          </select>
        </label>

        <label>
          Available equipment
          <select
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
          >
            <option value="gym">Full gym (machines + barbells)</option>
            <option value="dumbbells">Dumbbells only</option>
            <option value="home">Home / bodyweight</option>
          </select>
        </label>

        <button
          type="submit"
          className="primary-btn"
          style={{ marginTop: "14px" }}
        >
          Generate plan
        </button>
      </form>

      {plan && (
        <>
          {/* Summary card */}
          <div className="card" style={{ marginBottom: "12px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h3 style={{ marginTop: 0 }}>Plan Summary</h3>
                <p style={{ fontSize: "0.9rem", marginTop: "6px" }}>
                  Split: <strong>{plan.summary.splitType}</strong> •{" "}
                  <strong>{plan.summary.daysPerWeek}</strong> day
                  {plan.summary.daysPerWeek === 1 ? "" : "s"} per week • Target
                  rep range: <strong>{plan.summary.repRange}</strong>
                </p>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "#9ca3af",
                    marginTop: "6px",
                  }}
                >
                  Cardio guideline: {plan.summary.cardio}
                </p>
              </div>

              <div>
                <button
                  onClick={handleSave}
                  className="primary-btn"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save this plan"}
                </button>
                {saveMessage && (
                  <p
                    style={{
                      fontSize: "0.8rem",
                      marginTop: "4px",
                      color: saveMessage.includes("successfully")
                        ? "#4ade80"
                        : "#f97373",
                    }}
                  >
                    {saveMessage}
                  </p>
                )}
              </div>
            </div>

            <ul
              style={{
                marginTop: "6px",
                paddingLeft: "18px",
                fontSize: "0.85rem",
                color: "#9ca3af",
              }}
            >
              {plan.summary.notes.map((n, idx) => (
                <li key={idx}>{n}</li>
              ))}
            </ul>
          </div>

          {/* Day-by-day plan */}
          {plan.days.map((day, idx) => (
            <div className="card" key={idx} style={{ marginBottom: "12px" }}>
              <h3>{day.title}</h3>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#9ca3af",
                  marginBottom: "6px",
                }}
              >
                Focus: {day.focus}
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Exercise</th>
                    <th>Sets</th>
                    <th>Reps</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {day.exercises.map((ex, i) => (
                    <tr key={i}>
                      <td>{ex.name}</td>
                      <td>{ex.sets}</td>
                      <td>{ex.reps}</td>
                      <td style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                        {ex.note || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </>
      )}
    </main>
  );
}
