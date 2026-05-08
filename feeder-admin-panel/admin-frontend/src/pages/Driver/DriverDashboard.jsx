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
      console.log("Driver schedules API response:", res.data);
      setSchedules(res.data?.schedules || []);
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
    <div style={styles.page}>
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
                <div style={styles.cardHeader}>
                  <div>
                    <p style={styles.chip}>{s.tripType?.toUpperCase() || "TRIP"}</p>
                    <h3 style={styles.route}>🚍 Route {s.routeId?.routeNo || "-"}</h3>
                    <p style={styles.subtle}>
                      {s.routeId?.startPoint} → {s.routeId?.endPoint}
                    </p>
                  </div>
                  <div style={styles.statusPill(s.status)}>{s.status}</div>
                </div>

                <div style={styles.metaGrid}>
                  <div>
                    <p style={styles.metaLabel}>Date</p>
                    <p style={styles.metaValue}>
                      {s.date
                        ? new Date(s.date).toLocaleDateString("en-GB", {
                            timeZone: "Asia/Kolkata",
                          })
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p style={styles.metaLabel}>Slot</p>
                    <p style={styles.metaValue}>{s.slot}</p>
                  </div>
                  <div>
                    <p style={styles.metaLabel}>Start</p>
                    <p style={styles.metaValue}>
                      {s.startTime
                        ? new Date(s.startTime).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p style={styles.metaLabel}>End</p>
                    <p style={styles.metaValue}>
                      {s.endTime
                        ? new Date(s.endTime).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p style={styles.metaLabel}>Total</p>
                    <p style={styles.metaValue}>{calculateDuration(s.startTime, s.endTime)}</p>
                  </div>
                </div>

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
    </div>
  );
}

const styles = {
  page: {
    background: "#f9fafb",
    minHeight: "100vh",
    width: "100%",
  },
  container: {
    padding: "16px",
    fontFamily: "system-ui, sans-serif",
    margin: "0 auto",
    maxWidth: "1100px",
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
    fontSize: "15px",
  },
  cardsContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "12px",
  },
  card: {
    background: "white",
    borderRadius: "12px",
    padding: "16px",
    boxShadow: "0 6px 18px rgba(15, 23, 42, 0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    minHeight: "220px",
  },
  route: { marginTop: 0, color: "#2563eb", marginBottom: 4 },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "flex-start",
  },
  chip: {
    display: "inline-block",
    padding: "4px 10px",
    background: "#e0f2fe",
    color: "#0369a1",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
    marginBottom: "6px",
  },
  subtle: { margin: 0, color: "#475569", fontSize: "13px" },
  statusPill: (status) => ({
    padding: "6px 12px",
    borderRadius: "999px",
    background:
      status === "Trip Started"
        ? "#dcfce7"
        : status === "Active"
        ? "#dbeafe"
        : status === "Trip Completed"
        ? "#fee2e2"
        : "#e2e8f0",
    color:
      status === "Trip Started"
        ? "#15803d"
        : status === "Active"
        ? "#1d4ed8"
        : status === "Trip Completed"
        ? "#b91c1c"
        : "#475569",
    fontWeight: 700,
    fontSize: "12px",
    whiteSpace: "nowrap",
  }),
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "8px 12px",
  },
  metaLabel: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  metaValue: { margin: 0, color: "#0f172a", fontWeight: 700, fontSize: "14px" },
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
