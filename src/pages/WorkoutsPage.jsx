// --------------------------------------
// WorkoutsPage.jsx
// --------------------------------------
// Features:
//  - Load workouts for logged-in user from Firestore
//  - Show Date, Category, Exercise, Sets, Reps, Weight, Notes
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
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Workouts</h2>

        <Link to="/workouts/new" className="primary-btn">
          + Add Workout
        </Link>
      </div>

      <p style={{ color: "#9ca3af", marginBottom: "16px" }}>
        View and manage all workouts you have logged.
      </p>

      {loading && (
        <p style={{ color: "#64748b" }}>Loading workouts...</p>
      )}

      {!loading && workouts.length === 0 && (
        <div className="card" style={{ marginTop: "8px" }}>
          <p style={{ color: "#64748b" }}>
            No workouts yet. Add your first one!
          </p>
        </div>
      )}

      {!loading && workouts.length > 0 && (
        <div
          style={{
            marginTop: "8px",
            border: "1px solid #1f2937",
            borderRadius: "12px",
            overflowX: "auto",
          }}
        >
          <table>
            <thead>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Exercise</th>
                <th style={thStyle}>Sets</th>
                <th style={thStyle}>Reps</th>
                <th style={thStyle}>Weight (kg)</th>
                <th style={thStyle}>Notes</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workouts.map((w) => (
                <tr key={w.id}>
                  <td style={tdStyle}>{formatDate(w.createdAt)}</td>
                  <td style={tdStyle}>{w.category || "Other"}</td>
                  <td style={tdStyle}>{w.exercise}</td>
                  <td style={tdStyle}>{w.sets}</td>
                  <td style={tdStyle}>{w.reps}</td>
                  <td style={tdStyle}>{w.weight}</td>
                  <td style={tdStyle}>{w.notes}</td>
                  <td style={tdStyle}>
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
                        marginLeft: "6px",
                        borderColor: "#f97373",
                        color: "#fecaca",
                      }}
                      onClick={() => requestDelete(w.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

const thStyle = {
  textAlign: "left",
  padding: "8px 10px",
  fontSize: "0.85rem",
  borderBottom: "1px solid #1f2937",
  color: "#d1d5db",
};

const tdStyle = {
  padding: "8px 10px",
  fontSize: "0.85rem",
  borderBottom: "1px solid #020617",
  color: "#e5e7eb",
};
