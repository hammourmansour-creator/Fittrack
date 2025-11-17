// --------------------------------------
// DashboardPage.jsx
// --------------------------------------
// Overview + weekly goal + goal-weight banner
// --------------------------------------

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  db,
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "../firebase";
import WeeklyBarChart from "../components/WeeklyBarChart.jsx";
import MusclePieChart from "../components/MusclePieChart.jsx";

export default function DashboardPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    lastWorkoutDate: null,
    activeDays7d: 0,
    totalVolume: 0,
    weeklyGoalDays: 4,
    weeklyLabels: [],
    weeklyData: [],
    topCategory: null,
    topCategoryCount: 0,
    streak: 0,
    longestStreak: 0,
    todaysWorkouts: 0,
    todaysVolume: 0,
    muscleLabels: [],
    muscleData: [],
    prs: [],
    weight: null,
    goalWeight: null,
  });

  const [todayPlan, setTodayPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  // --------------------------------------------------
  // Load workouts + profile stats
  // --------------------------------------------------
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const workoutsRef = collection(db, "workouts");
        const q = query(workoutsRef, where("userId", "==", user.uid));
        const snapshot = await getDocs(q);

        const items = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        let totalWorkouts = items.length;
        let lastWorkoutDate = null;
        let activeDays7d = 0;
        let totalVolume = 0;

        const now = new Date();
        const todayLocal = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        const daysArray = [];
        const countsMap = {};
        const categoryCounts = {};
        const prMap = {};

        let todaysWorkouts = 0;
        let todaysVolume = 0;

        // last 7 local calendar days
        for (let i = 6; i >= 0; i--) {
          const d = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - i
          );
          const key = d.toISOString().slice(0, 10);
          const label = d.toLocaleDateString(undefined, {
            weekday: "short",
          });
          daysArray.push({ key, label });
          countsMap[key] = 0;
        }

        if (items.length > 0) {
          items.sort((a, b) => {
            const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return tb - ta;
          });

          const startWindowDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() - 6
          );

          const uniqueDaysSet = new Set();

          items.forEach((w) => {
            let createdDate = w.createdAt?.toDate
              ? w.createdAt.toDate()
              : new Date();

            const createdDay = new Date(
              createdDate.getFullYear(),
              createdDate.getMonth(),
              createdDate.getDate()
            );

            const createdKey = createdDay.toISOString().slice(0, 10);

            const sets = Number(w.sets) || 0;
            const reps = Number(w.reps) || 0;
            const weight = Number(w.weight) || 0;
            const workoutVolume = sets * reps * weight;

            if (createdDay.getTime() === todayLocal.getTime()) {
              todaysWorkouts += 1;
              todaysVolume += workoutVolume;
            }

            totalVolume += workoutVolume;

            if (createdDay >= startWindowDate && createdDay <= now) {
              uniqueDaysSet.add(createdKey);
              if (countsMap[createdKey] != null) {
                countsMap[createdKey] += 1;
              }

              const cat = w.category || "Other";
              categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            }

            const exerciseName = (w.exercise || "").trim();
            if (exerciseName && weight > 0) {
              const existing = prMap[exerciseName];
              if (!existing || weight > existing.weight) {
                prMap[exerciseName] = {
                  weight,
                  date: createdDate,
                };
              }
            }
          });

          activeDays7d = uniqueDaysSet.size;

          const newest = items[0];
          lastWorkoutDate =
            newest.createdAt && newest.createdAt.toDate
              ? newest.createdAt.toDate()
              : null;
        }

        const weeklyLabels = daysArray.map((d) => d.label);
        const weeklyData = daysArray.map((d) => countsMap[d.key]);

        let topCategory = null;
        let topCategoryCount = 0;
        Object.entries(categoryCounts).forEach(([cat, count]) => {
          if (count > topCategoryCount) {
            topCategory = cat;
            topCategoryCount = count;
          }
        });

        const muscleLabels = Object.keys(categoryCounts);
        const muscleData = muscleLabels.map((label) => categoryCounts[label]);

        const prs = Object.entries(prMap)
          .map(([exercise, info]) => ({
            exercise,
            weight: info.weight,
            date: info.date,
          }))
          .sort((a, b) => b.weight - a.weight)
          .slice(0, 5);

        // profile
        let weeklyGoalDays = 4;
        let streak = 0;
        let longestStreak = 0;
        let weight = null;
        let goalWeight = null;

        const profileRef = doc(db, "profiles", user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          if (data.weeklyGoalDays != null) {
            weeklyGoalDays = Number(data.weeklyGoalDays) || 4;
          }
          if (data.streak != null) {
            streak = Number(data.streak) || 0;
          }
          if (data.longestStreak != null) {
            longestStreak = Number(data.longestStreak) || 0;
          }
          if (data.weight != null) {
            weight = Number(data.weight);
          }
          if (data.goalWeight != null) {
            goalWeight = Number(data.goalWeight);
          }
        }

        setStats({
          totalWorkouts,
          lastWorkoutDate,
          activeDays7d,
          totalVolume,
          weeklyGoalDays,
          weeklyLabels,
          weeklyData,
          topCategory,
          topCategoryCount,
          streak,
          longestStreak,
          todaysWorkouts,
          todaysVolume,
          muscleLabels,
          muscleData,
          prs,
          weight,
          goalWeight,
        });
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // --------------------------------------------------
  // Load today's workout from active plan
  // --------------------------------------------------
  useEffect(() => {
    if (!user) return;

    const loadTodayPlan = async () => {
      try {
        setLoadingPlan(true);

        const profileRef = doc(db, "profiles", user.uid);
        const profileSnap = await getDoc(profileRef);

        if (!profileSnap.exists()) {
          setTodayPlan(null);
          return;
        }

        const data = profileSnap.data();
        const currentPlanId = data.currentPlanId;
        const planDayIndex = data.planDayIndex ?? 0;

        if (!currentPlanId) {
          setTodayPlan(null);
          return;
        }

        const planRef = doc(db, "plans", currentPlanId);
        const planSnap = await getDoc(planRef);

        if (!planSnap.exists()) {
          setTodayPlan(null);
          return;
        }

        const plan = planSnap.data();
        const days = Array.isArray(plan.days) ? plan.days : [];

        if (days.length === 0) {
          setTodayPlan(null);
          return;
        }

        const safeIndex =
          planDayIndex >= 0 && planDayIndex < days.length
            ? planDayIndex
            : 0;

        const todayDay = days[safeIndex];

        setTodayPlan({
          planId: currentPlanId,
          dayIndex: safeIndex,
          totalDays: days.length,
          title: todayDay.title || `Day ${safeIndex + 1}`,
          focus: todayDay.focus || "",
          exercises: Array.isArray(todayDay.exercises)
            ? todayDay.exercises
            : [],
        });
      } catch (err) {
        console.error("Error loading today's plan:", err);
        setTodayPlan(null);
      } finally {
        setLoadingPlan(false);
      }
    };

    loadTodayPlan();
  }, [user]);

  // --------------------------------------------------
  // Derived values
  // --------------------------------------------------

  const {
    totalWorkouts,
    lastWorkoutDate,
    activeDays7d,
    totalVolume,
    weeklyGoalDays,
    weeklyLabels,
    weeklyData,
    topCategory,
    topCategoryCount,
    streak,
    longestStreak,
    todaysWorkouts,
    todaysVolume,
    muscleLabels,
    muscleData,
    prs,
    weight,
    goalWeight,
  } = stats;

  const formattedLastDate = lastWorkoutDate
    ? lastWorkoutDate.toLocaleDateString()
    : "No workouts yet";

  const goal = Math.max(1, weeklyGoalDays || 1);
  const progress = Math.min(activeDays7d / goal, 1);
  const percentage = Math.round(progress * 100);

  const goalText =
    activeDays7d >= goal
      ? "Weekly training goal completed. Huge win."
      : `${Math.max(goal - activeDays7d, 0)} more day(s) to hit your weekly goal.`;

  const topCategoryLabel =
    topCategory && topCategoryCount > 0 ? topCategory : "No data yet";

  const topCategorySubtitle =
    topCategory && topCategoryCount > 0
      ? `${topCategoryCount} workout${
          topCategoryCount === 1 ? "" : "s"
        } in the last 7 days`
      : "Train and categorize your workouts to see this.";

  const todayDone = todaysWorkouts > 0;
  const todayTitle = todayDone ? "Workout completed" : "No workout logged yet";
  const todaySubtitle = todayDone
    ? `You logged ${todaysWorkouts} workout${
        todaysWorkouts === 1 ? "" : "s"
      } today (${todaysVolume.toLocaleString()} kg total volume).`
    : "Hit the gym and log your first session for today.";

  // Big goal-weight banner sentence
  let goalWeightMessage = "";
  if (weight != null && goalWeight != null) {
    const diff = weight - goalWeight;
    const absDiff = Math.abs(diff);

    if (absDiff < 0.5) {
      goalWeightMessage = `You’re basically at your goal weight (${weight} kg vs target ${goalWeight} kg). Maintain this and focus on performance now.`;
    } else if (diff > 0) {
      goalWeightMessage = `You’re ${absDiff.toFixed(
        1
      )} kg away from your goal of ${goalWeight} kg. Stay locked in—every session is pulling you closer.`;
    } else {
      goalWeightMessage = `You are already ${absDiff.toFixed(
        1
      )} kg under your goal (${weight} kg vs ${goalWeight} kg). That’s huge—decide your next target.`;
    }
  }

  return (
    <main className="page">
      <h2>Dashboard</h2>
      <p style={{ color: "#4b5563", marginBottom: "12px" }}>
        Overview of your recent training and progress.
      </p>

      {/* Goal weight banner – very visible, near the top */}
      {goalWeightMessage && (
        <div
          className="card"
          style={{
            marginBottom: "18px",
            borderLeft: "4px solid #22c55e",
            background: "#ecfdf3",
          }}
        >
          <p
            style={{
              margin: 0,
              fontWeight: 650,
              fontSize: "1rem",
              color: "#166534",
            }}
          >
            {goalWeightMessage}
          </p>
        </div>
      )}

      {loading && <p style={{ color: "#64748b" }}>Loading stats...</p>}

      {!loading && (
        <>
          {/* Today widget card (based on logged workouts) */}
          <div className="card" style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "#6b7280",
                    marginBottom: "4px",
                  }}
                >
                  Today
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    marginBottom: "2px",
                    color: "#111827",
                  }}
                >
                  {todayTitle}
                </div>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#4b5563",
                    marginBottom: "4px",
                  }}
                >
                  {todaySubtitle}
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#2563eb",
                    marginTop: "4px",
                  }}
                >
                  🔥 Streak:{" "}
                  <strong>
                    {streak} day{streak === 1 ? "" : "s"}
                  </strong>{" "}
                  {longestStreak > 0
                    ? `(Best: ${longestStreak} day${
                        longestStreak === 1 ? "" : "s"
                      })`
                    : ""}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {todayDone ? (
                  <span
                    style={{
                      fontSize: "0.8rem",
                      padding: "6px 10px",
                      borderRadius: "999px",
                      border: "1px solid #22c55e",
                      color: "#15803d",
                      background: "#ecfdf3",
                    }}
                  >
                    ✅ Logged for today
                  </span>
                ) : (
                  <Link to="/workouts/new" className="primary-btn">
                    + Add workout
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Today's workout from active plan */}
          <div className="card" style={{ marginBottom: "16px" }}>
            <h3>Today's Workout (Plan)</h3>

            {loadingPlan && (
              <p style={{ color: "#4b5563" }}>Loading active plan…</p>
            )}

            {!loadingPlan && !todayPlan && (
              <p style={{ color: "#4b5563" }}>
                No active plan. Go to <strong>Plans</strong> and set one as
                active.
              </p>
            )}

            {!loadingPlan && todayPlan && (
              <>
                <p style={{ color: "#111827", marginBottom: "4px" }}>
                  <strong>{todayPlan.title}</strong>{" "}
                  <span style={{ fontSize: "0.8rem", color: "#4b5563" }}>
                    (Day {todayPlan.dayIndex + 1} of {todayPlan.totalDays})
                  </span>
                </p>
                {todayPlan.focus && (
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "#4b5563",
                      marginBottom: "4px",
                    }}
                  >
                    Focus: {todayPlan.focus}
                  </p>
                )}

                <ul
                  style={{
                    paddingLeft: "18px",
                    fontSize: "0.9rem",
                    color: "#111827",
                  }}
                >
                  {todayPlan.exercises.slice(0, 4).map((ex, i) => (
                    <li key={i}>
                      {ex.name}{" "}
                      <span style={{ color: "#4b5563", fontSize: "0.8rem" }}>
                        ({ex.sets} × {ex.reps})
                      </span>
                    </li>
                  ))}
                  {todayPlan.exercises.length > 4 && <li>…</li>}
                </ul>

                <Link
                  to="/today"
                  className="primary-btn"
                  style={{ marginTop: "10px" }}
                >
                  Start workout
                </Link>
              </>
            )}
          </div>

          {/* Top stats */}
          <div className="stats-grid">
            <div className="stat-card card">
              <h3>Total Workouts</h3>
              <p className="stat-value">{totalWorkouts}</p>
              <p className="stat-sub">All time sessions</p>
            </div>

            <div className="stat-card card">
              <h3>Last Workout</h3>
              <p className="stat-value">{formattedLastDate}</p>
              <p className="stat-sub">Most recent logged session</p>
            </div>

            <div className="stat-card card">
              <h3>Active Days (7d)</h3>
              <p className="stat-value">{activeDays7d}</p>
              <p className="stat-sub">Unique training days this week</p>
            </div>

            <div className="stat-card card">
              <h3>Total Volume</h3>
              <p className="stat-value">
                {totalVolume.toLocaleString()} kg
              </p>
              <p className="stat-sub">Sum of sets × reps × weight</p>
            </div>

            <div className="stat-card card">
              <h3>🔥 Streak</h3>
              <p className="stat-value">{streak}</p>
              <p className="stat-sub">
                Current consecutive training days
                {longestStreak > 0
                  ? ` (Best: ${longestStreak} days)`
                  : ""}
              </p>
            </div>

            <div className="stat-card card">
              <h3>Top Focus</h3>
              <p className="stat-value">{topCategoryLabel}</p>
              <p className="stat-sub">{topCategorySubtitle}</p>
            </div>
          </div>

          {/* Weekly bar chart */}
          <div className="card" style={{ marginTop: "20px" }}>
            <h3>Workouts in the Last 7 Days</h3>
            <div className="chart-container">
              <WeeklyBarChart labels={weeklyLabels} data={weeklyData} />
            </div>
          </div>

          {/* Muscle group pie chart */}
          <div className="card" style={{ marginTop: "20px" }}>
            <h3>Muscle Group Focus (Last 7 Days)</h3>
            <div className="chart-container">
              <MusclePieChart labels={muscleLabels} data={muscleData} />
            </div>
          </div>

          {/* PR card */}
          <div className="card" style={{ marginTop: "20px" }}>
            <h3>Top Personal Records</h3>
            {prs.length === 0 ? (
              <p style={{ color: "#4b5563", marginTop: "6px" }}>
                Log workouts with weight to see your personal records.
              </p>
            ) : (
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  marginTop: "8px",
                  fontSize: "0.9rem",
                }}
              >
                {prs.map((pr) => (
                  <li
                    key={pr.exercise}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <span>
                      <strong>{pr.exercise}</strong>
                    </span>
                    <span style={{ color: "#111827", fontSize: "0.9rem" }}>
                      {pr.weight} kg{" "}
                      <span style={{ color: "#4b5563", fontSize: "0.8rem" }}>
                        (
                        {pr.date
                          ? pr.date.toLocaleDateString()
                          : "unknown date"}
                        )
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Weekly goal ring */}
          <div className="card goal-card" style={{ marginTop: "20px" }}>
            <h3>Weekly Activity Goal</h3>

            <div className="goal-ring-wrapper">
              <div
                className="goal-ring"
                style={{
                  background: `conic-gradient(#22c55e ${percentage}%, #e5e7eb 0)`,
                }}
              >
                <div className="goal-ring-inner">
                  <div className="goal-ring-value">
                    {activeDays7d}/{goal}
                  </div>
                  <div className="goal-ring-label">days this week</div>
                </div>
              </div>
            </div>

            <p
              className="stat-sub"
              style={{ textAlign: "center", color: "#4b5563" }}
            >
              {goalText}
            </p>
          </div>
        </>
      )}

      {!loading && totalWorkouts === 0 && (
        <p style={{ color: "#64748b", marginTop: "16px" }}>
          Log your first workout to see stats here.
        </p>
      )}
    </main>
  );
}
