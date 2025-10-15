import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../config";

export default function DriverDashboard({ busId, token, onLogout }) {
  const [schedules, setSchedules] = useState([]);

  const fetchSchedules = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/schedules?busId=${busId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSchedules(res.data || []);
    } catch (err) {
      console.error("Error fetching schedules:", err);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const updateStatus = async (id, type) => {
    try {
      const url =
        type === "start"
          ? `${BASE_URL}/schedules/${id}/start`
          : `${BASE_URL}/schedules/${id}/end`;

      await axios.put(url, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchSchedules();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return "-";
    const diffMs = new Date(end) - new Date(start);
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return hrs > 0 ? `${hrs}h ${remMins}m` : `${remMins}m`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📋 Driver Dashboard</h2>
        <button style={styles.logoutBtn} onClick={onLogout}>
          Logout
        </button>
      </div>

      {schedules.length === 0 ? (
        <p style={styles.noTrips}>No schedules found</p>
      ) : (
        <div style={styles.cardsContainer}>
          {schedules.map((s) => (
            <div key={s._id} style={styles.card}>
              <h3 style={styles.route}>
                🚍 Route {s.routeId?.routeNo || "-"}  
              </h3>
              <p>
                <strong>Date:</strong> {s.date?.substring(0, 10)}
              </p>
              <p>
                <strong>From:</strong> {s.routeId?.startPoint} →{" "}
                <strong>To:</strong> {s.routeId?.endPoint}
              </p>
              <p>
                <strong>Slot:</strong> {s.slot}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span style={{ color: "#2563eb", fontWeight: "600" }}>
                  {s.status}
                </span>
              </p>
              <p>
                ⏱ <strong>Start:</strong>{" "}
                {s.startTime ? new Date(s.startTime).toLocaleTimeString() : "-"}
              </p>
              <p>
                ⏱ <strong>End:</strong>{" "}
                {s.endTime ? new Date(s.endTime).toLocaleTimeString() : "-"}
              </p>
              <p>
                <strong>Total:</strong>{" "}
                {calculateDuration(s.startTime, s.endTime)}
              </p>

              <div style={styles.actions}>
                {(s.status === "Scheduled" || s.status === "Active") && (
                  <button
                    style={{ ...styles.actionBtn, background: "#16a34a" }}
                    onClick={() => updateStatus(s._id, "start")}
                  >
                    ▶ Start Trip
                  </button>
                )}
                {s.status === "Trip Started" && (
                  <button
                    style={{ ...styles.actionBtn, background: "#dc2626" }}
                    onClick={() => updateStatus(s._id, "end")}
                  >
                    ⏹ End Trip
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "16px",
    fontFamily: "system-ui, sans-serif",
    background: "#f9fafb",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  title: { margin: 0, color: "#1e3a8a" },
  logoutBtn: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  noTrips: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: "40px",
  },
  cardsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "white",
    borderRadius: "12px",
    padding: "16px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  route: { marginTop: 0, color: "#2563eb" },
  actions: { marginTop: "12px" },
  actionBtn: {
    width: "100%",
    padding: "10px",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
  },
};
