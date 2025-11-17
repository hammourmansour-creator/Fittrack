// --------------------------------------
// MyPlansPage.jsx
// --------------------------------------
// Lists saved workout plans for the current user
// (AI Coach + custom plans) and allows setting
// one as the "active" plan in profiles/{uid}.
// --------------------------------------

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  db,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from "../firebase";

export default function MyPlansPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const [savingActive, setSavingActive] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        setLoading(true);
        setMessage("");

        // 1) Load all plans for this user
        const plansRef = collection(db, "plans");
        const q = query(plansRef, where("userId", "==", user.uid));
        const snap = await getDocs(q);

        let loadedPlans = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
          };
        });

        // Sort by createdAt desc if present
        loadedPlans.sort((a, b) => {
          const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tb - ta;
        });

        setPlans(loadedPlans);

        // 2) Load current active plan from profile
        const profileRef = doc(db, "profiles", user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          if (data.currentPlanId) {
            setActivePlanId(data.currentPlanId);
          }
        }
      } catch (err) {
        console.error("Error loading plans:", err);
        setMessage("Could not load plans.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const handleSetActive = async (planId) => {
    if (!user) return;

    try {
      setSavingActive(true);
      setMessage("");

      const profileRef = doc(db, "profiles", user.uid);
      await setDoc(
        profileRef,
        {
          currentPlanId: planId,
          // do not touch planDayIndex here; Today page will advance it
        },
        { merge: true }
      );

      setActivePlanId(planId);
      setMessage("Active plan updated.");
    } catch (err) {
      console.error("Error setting active plan:", err);
      setMessage("Could not update active plan.");
    } finally {
      setSavingActive(false);
    }
  };

  const toggleExpand = (planId) => {
    setExpandedPlanId((prev) => (prev === planId ? null : planId));
  };

  if (!user) {
    return (
      <main className="page">
        <h2>My Plans</h2>
        <p style={{ color: "#374151" }}>
          You need to be logged in to view your plans.
        </p>
      </main>
    );
  }

  return (
    <main className="page">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "center",
          marginBottom: "6px",
          flexWrap: "wrap",
        }}
      >
        <h2>My Plans</h2>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Link to="/plans/new" className="primary-btn">
            + Create custom plan
          </Link>
        </div>
      </div>

      <p style={{ color: "#374151", marginBottom: "16px", fontSize: "0.9rem" }}>
        These are the workout plans you've saved (AI Coach and custom). Set one
        as your active plan to power the Today page and streak tracking.
      </p>

      {loading && (
        <p style={{ color: "#374151" }}>Loading plans...</p>
      )}

      {!loading && message && (
        <p
          style={{
            color: message.includes("updated") ? "#16a34a" : "#b91c1c",
            fontSize: "0.85rem",
            marginBottom: "10px",
          }}
        >
          {message}
        </p>
      )}

      {!loading && plans.length === 0 && (
        <div className="card">
          <p style={{ color: "#374151", fontSize: "0.9rem" }}>
            You have no saved plans yet.
          </p>
          <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>
            Use the <strong>Coach</strong> to generate a plan, or click{" "}
            <strong>“Create custom plan”</strong> to build your own.
          </p>
        </div>
      )}

      {!loading &&
        plans.map((plan) => {
          const createdDate =
            plan.createdAt && plan.createdAt.toDate
              ? plan.createdAt.toDate().toLocaleDateString()
              : "Unknown date";

          const isActive = plan.id === activePlanId;
          const isExpanded = plan.id === expandedPlanId;

          const settings = plan.settings || {};
          const summary = plan.summary || {};
          const days = Array.isArray(plan.days) ? plan.days : [];

          const sourceLabel =
            plan.source === "custom"
              ? "Custom plan"
              : summary.splitType || plan.name || "Saved plan";

          const daysPerWeek =
            summary.daysPerWeek ||
            settings.daysPerWeek ||
            (days.length > 0 ? days.length : null);

          const goalLabel =
            settings.goal === "muscle"
              ? "Build muscle"
              : settings.goal === "fat-loss"
              ? "Fat loss / recomposition"
              : settings.goal === "strength"
              ? "Strength"
              : settings.goal || (plan.source === "custom" ? "Custom plan" : "Unknown");

          const equipmentLabel =
            settings.equipment === "gym"
              ? "Full gym"
              : settings.equipment === "dumbbells"
              ? "Dumbbells only"
              : settings.equipment === "home"
              ? "Home / bodyweight"
              : settings.equipment || (plan.source === "custom" ? "Not specified" : "Unknown");

          return (
            <div
              className="card"
              key={plan.id}
              style={{ marginBottom: "12px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h3 style={{ marginTop: 0, marginBottom: 4 }}>
                    {sourceLabel}
                  </h3>
                  {plan.name && (
                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "#6b7280",
                        marginBottom: "4px",
                      }}
                    >
                      Name: <strong>{plan.name}</strong>
                    </p>
                  )}
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#374151",
                      marginBottom: "4px",
                    }}
                  >
                    Goal:{" "}
                    <strong>
                      {goalLabel}
                    </strong>{" "}
                    {daysPerWeek && (
                      <>
                        • {daysPerWeek} day
                        {daysPerWeek === 1 ? "" : "s"} per week
                      </>
                    )}{" "}
                    {summary.repRange && (
                      <>
                        • Target reps:{" "}
                        <strong>{summary.repRange}</strong>
                      </>
                    )}
                  </p>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "#6b7280",
                      marginBottom: "4px",
                    }}
                  >
                    Equipment: {equipmentLabel} • Created: {createdDate}
                  </p>
                  {summary.cardio && (
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "#6b7280",
                        marginBottom: "4px",
                      }}
                    >
                      Cardio guideline: {summary.cardio}
                    </p>
                  )}
                  {isActive && (
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "4px",
                        fontSize: "0.75rem",
                        padding: "4px 8px",
                        borderRadius: "999px",
                        border: "1px solid #22c55e",
                        color: "#15803d",
                        background: "#ecfdf3",
                      }}
                    >
                      Active plan
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    alignItems: "flex-end",
                  }}
                >
                  <button
                    onClick={() => toggleExpand(plan.id)}
                    className="secondary-btn"
                    style={{ fontSize: "0.85rem" }}
                  >
                    {isExpanded ? "Hide details" : "View details"}
                  </button>

                  <button
                    onClick={() => handleSetActive(plan.id)}
                    className="primary-btn"
                    disabled={savingActive || isActive}
                    style={{ fontSize: "0.85rem" }}
                  >
                    {isActive
                      ? "Currently active"
                      : savingActive
                      ? "Updating..."
                      : "Set as active"}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: "10px" }}>
                  {summary.notes && Array.isArray(summary.notes) && (
                    <ul
                      style={{
                        marginTop: "4px",
                        paddingLeft: "18px",
                        fontSize: "0.8rem",
                        color: "#6b7280",
                      }}
                    >
                      {summary.notes.map((n, idx) => (
                        <li key={idx}>{n}</li>
                      ))}
                    </ul>
                  )}

                  {days.map((day, idx) => (
                    <div
                      key={idx}
                      style={{
                        marginTop: "10px",
                        paddingTop: "6px",
                        borderTop: "1px solid #e5e7eb",
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "0.95rem",
                          marginBottom: "4px",
                        }}
                      >
                        {day.title || `Day ${idx + 1}`}
                      </h4>
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "#6b7280",
                          marginBottom: "4px",
                        }}
                      >
                        Focus: {day.focus || "N/A"}
                      </p>
                      {day.exercises && Array.isArray(day.exercises) && (
                        <div className="table-wrap" style={{ marginTop: 4 }}>
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
                                  <td
                                    style={{
                                      fontSize: "0.8rem",
                                      color: "#6b7280",
                                    }}
                                  >
                                    {ex.note || "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
    </main>
  );
}
