import { useEffect, useState } from "react";
import axios from "axios";

export default function ScheduleDashboard() {
  const [schedules, setSchedules] = useState([]);

  // 🕐 Helper: Convert UTC date to IST display format
  const formatIST = (utcDate) =>
    new Date(utcDate).toLocaleDateString("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const fetchSchedules = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/schedules");
      setSchedules(
        Array.isArray(res.data)
          ? res.data
          : res.data.schedules || res.data.data || []
      );
    } catch (err) {
      console.error("Error fetching schedules:", err);
    }
  };

  useEffect(() => {
    fetchSchedules(); // first load
    const interval = setInterval(fetchSchedules, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>📊 Route Dashboard</h2>

      <table
        border="1"
        cellPadding="8"
        style={{
          borderCollapse: "collapse",
          width: "100%",
          textAlign: "center",
          marginTop: "12px",
        }}
      >
        <thead>
          <tr style={{ background: "#f8f8f8" }}>
            <th>Date</th>
            <th>Route No</th>
            <th>From</th>
            <th>To</th>
            <th>Time</th>
            <th>Bus No</th>
            <th>Total Seats</th>
            <th>Booked</th>
            <th>Status</th>
            <th>Start Time</th>
            <th>End Time</th>
          </tr>
        </thead>

        <tbody>
          {schedules.length === 0 ? (
            <tr>
              <td colSpan="11">No schedules available</td>
            </tr>
          ) : (
            schedules.map((s, idx) => (
              <tr key={idx}>
                <td>{s.date ? formatIST(s.date) : "-"}</td>
                <td>{s.routeId?.routeNo || "N/A"}</td>
                <td>{s.routeId?.startPoint || "N/A"}</td>
                <td>{s.routeId?.endPoint || "N/A"}</td>
                <td>{s.slot || "N/A"}</td>
                <td>{s.busId?.regNumber || "N/A"}</td>
                <td>{s.totalSeats}</td>
                <td>{s.booked}</td>
                <td>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      color: "white",
                      backgroundColor:
                        s.status?.toLowerCase() === "active" ? "green" : "grey",
                    }}
                  >
                    {s.status}
                  </span>
                </td>
                <td>
                  {s.startTime
                    ? new Date(s.startTime).toLocaleTimeString("en-GB", {
                        timeZone: "Asia/Kolkata",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </td>
                <td>
                  {s.endTime
                    ? new Date(s.endTime).toLocaleTimeString("en-GB", {
                        timeZone: "Asia/Kolkata",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
