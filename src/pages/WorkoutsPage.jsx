// --------------------------------------
// WorkoutsPage.jsx
// --------------------------------------
// Features:
//  - Load workouts for logged-in user from Firestore
//  - Show all fields in responsive cards (no horizontal scroll)
//  - Edit button -> /workouts/:id/edit
//  - Delete button with custom confirmation modal
// --------------------------------------

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

import {
  db,
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
} from "../firebase";

import DeleteModal from "../components/DeleteModal.jsx";

export default function WorkoutsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // For delete modal
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Load workouts for this user
  useEffect(() => {
    if (!user) return;

    const fetchWorkouts = async () => {
      try {
        const workoutsRef = collection(db, "workouts");
        const q = query(workoutsRef, where("userId", "==", user.uid));
        const snapshot = await getDocs(q);

        let items = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        // Sort by createdAt (newest first)
        items.sort((a, b) => {
          const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tb - ta;
        });

        setWorkouts(items);
      } catch (error) {
        console.error("Error loading workouts:", error);
        alert("Could not load workouts.");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, [user]);

  // Format Firestore timestamp
  const formatDate = (ts) => {
    if (!ts || !ts.toDate) return "";
    const d = ts.toDate();
    return d.toLocaleDateString();
  };

  // Open delete modal
  const requestDelete = (id) => {
    setDeleteId(id);
    setShowDelete(true);
  };

  // Confirm delete from modal
  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, "workouts", deleteId));
      setWorkouts((prev) => prev.filter((w) => w.id !== deleteId));
    } catch (err) {
      console.error("Error deleting workout:", err);
      alert("Could not delete workout.");
    } finally {
      setShowDelete(false);
      setDeleteId(null);
    }
  };

  // Navigate to edit page
  const handleEdit = (id) => {
    navigate(`/workouts/${id}/edit`);
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
        <h2>Workouts</h2>

        <Link to="/workouts/new" className="primary-btn">
          + Add Workout
        </Link>
      </div>

      <p style={{ color: "#374151", marginBottom: "16px", fontSize: "0.9rem" }}>
        View and manage all workouts you have logged.
      </p>

      {loading && (
        <p style={{ color: "#374151" }}>Loading workouts...</p>
      )}

      {!loading && workouts.length === 0 && (
        <div className="card" style={{ marginTop: "8px" }}>
          <p style={{ color: "#374151" }}>
            No workouts yet. Add your first one!
          </p>
        </div>
      )}

      {!loading && workouts.length > 0 && (
        <div className="workouts-grid">
          {workouts.map((w) => (
            <div key={w.id} className="workout-card">
              <div className="workout-card-header">
                <span className="workout-date">
                  {formatDate(w.createdAt)}
                </span>
                <span className="workout-category">
                  {w.category || "Other"}
                </span>
              </div>

              <div className="workout-field-row">
                <span className="workout-label">Exercise</span>
                <span className="workout-value">{w.exercise}</span>
              </div>
              <div className="workout-field-row">
                <span className="workout-label">Sets</span>
                <span className="workout-value">{w.sets}</span>
              </div>
              <div className="workout-field-row">
                <span className="workout-label">Reps</span>
                <span className="workout-value">{w.reps}</span>
              </div>
              <div className="workout-field-row">
                <span className="workout-label">Weight (kg)</span>
                <span className="workout-value">{w.weight}</span>
              </div>

              {w.notes && w.notes.trim() !== "" && (
                <div className="workout-notes-row">
                  <span className="workout-label">Notes</span>
                  <span className="workout-notes">{w.notes}</span>
                </div>
              )}

              <div className="workout-actions">
                <button
                  className="secondary-btn"
                  style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                  onClick={() => handleEdit(w.id)}
                >
                  Edit
                </button>
                <button
                  className="secondary-btn"
                  style={{
                    padding: "4px 10px",
                    fontSize: "0.8rem",
                    borderColor: "#fecaca",
                    color: "#b91c1c",
                    background: "#fef2f2",
                  }}
                  onClick={() => requestDelete(w.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      <DeleteModal
        visible={showDelete}
        onCancel={() => setShowDelete(false)}
        onConfirm={confirmDelete}
      />
    </main>
  );
}
