// --------------------------------------
// DeleteModal.jsx
// --------------------------------------

export default function DeleteModal({ visible, onCancel, onConfirm }) {
    if (!visible) return null;
  
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(2px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}
      >
        <div
          className="card"
          style={{
            width: "320px",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <h3 style={{ margin: "0 0 12px" }}>Delete Workout?</h3>
          <p style={{ color: "#9ca3af", marginBottom: "20px" }}>
            This action cannot be undone.
          </p>
  
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            <button
              className="secondary-btn"
              onClick={onCancel}
              style={{ padding: "6px 14px" }}
            >
              Cancel
            </button>
  
            <button
              className="primary-btn"
              onClick={onConfirm}
              style={{
                padding: "6px 14px",
                background: "linear-gradient(135deg, #ef4444, #f87171)",
                boxShadow: "0 8px 25px rgba(239,68,68,0.35)",
                color: "#fff",
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }
  