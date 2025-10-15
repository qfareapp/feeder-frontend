import { useEffect, useState } from "react";
import axios from "axios";
const API = axios.create({
  baseURL: "http://127.0.0.1:5000/api",   // not localhost:5173
});

export default function DailySchedule() {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [date, setDate] = useState("");

  // Track all schedules for the selected date
 const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    API.get("/buses").then(res => {
      setBuses(res.data || []);
    });
    API.get("/routes").then(res => {
      setRoutes(Array.isArray(res.data) ? res.data : res.data.data || []);
    });
    API.get("/societies").then(res => {
      setSocieties(Array.isArray(res.data) ? res.data : res.data.data || []);
    });
  }, []);
useEffect(() => {
  if (!date) return;
  
  Promise.all(
    routes.map((r) =>
      API.get(`/schedules?date=${date}&routeId=${r._id}`)
        .then((res) => ({ routeId: r._id, data: res.data.schedules || [] }))
    )
  ).then((results) => {
    const merged = results.flatMap(r => r.data);
    setSchedules(merged);
  });
}, [date, routes]);

  const handleAssign = async (societyId, routeId, tripSchedule, busId, tripType) => {
  if (!date || !busId) {
    alert("⚠️ Please select date and bus");
    return;
  }

  const payload = { date, societyId, routeId, slot: tripSchedule, busId, tripType };

  try {
    await API.post("/schedules", payload);
    const { data } = await API.get(`/schedules?date=${date}&routeId=${routeId}`);
setSchedules(data.schedules || data || []);
    alert(`✅ Assigned bus ${busId} for ${tripSchedule} (${tripType})`);
  } catch (err) {
    console.error("❌ handleAssign failed:", err.response?.data || err.message);
    alert("❌ Failed to assign bus");
  }
};

  const handleActivate = async (routeId, slot, tripType) => {
  try {
    console.log("🔍 Trying to activate", { routeId, slot, tripType });
    console.log("Available schedules:", schedules);

    const match = schedules.find((s) => {
  const rid = typeof s.routeId === "object" ? s.routeId._id : s.routeId;
  return (
    rid?.toString() === routeId?.toString() &&
    s.slot?.toLowerCase().trim() === slot?.toLowerCase().trim() &&
    s.tripType?.toLowerCase() === tripType?.toLowerCase()
  );
});

    if (!match) {
      alert("❌ Schedule not found, assign bus first");
      return;
    }

    await API.patch(`/schedules/${match._id}/activate`);
    const { data } = await API.get(`/schedules?date=${date}&routeId=${routeId}`);
setSchedules(data.schedules || data || []);

    alert("✅ Route Activated");
  } catch (err) {
    console.error("Activation failed:", err);
    alert("❌ Failed to activate route");
  }
};

  return (
    <div style={{ padding: "20px" }}>
      <h2>Daily Schedule Assignment</h2>

      {/* Select Date */}
      <div style={{ marginBottom: "20px" }}>
        <label><b>Select Date:</b></label>{" "}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <table
        border="1"
        cellPadding="8"
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <thead>
          <tr>
            <th>Society</th>
            <th>Route</th>
            <th>Trip Schedule</th>
            <th>Assign Bus</th>
            <th>Activate</th>
          </tr>
        </thead>
        <tbody>
          {societies.map(society => {
            const societyRoutes = routes.filter(
              r => r.startPoint?.toLowerCase().trim() === society.name?.toLowerCase().trim()
            );

            if (societyRoutes.length === 0) {
              return (
                <tr key={society._id}>
                  <td>{society.name}</td>
                  <td colSpan="4">No routes found</td>
                </tr>
              );
            }

            return societyRoutes.map(route => {
              if (!Array.isArray(route.tripSchedules) || route.tripSchedules.length === 0) {
                return (
                  <tr key={route._id}>
                    <td>{society.name}</td>
                    <td>{route.routeNo || route._id}</td>
                    <td colSpan="3">No trip schedules</td>
                  </tr>
                );
              }

              return route.tripSchedules.map((schedule, idx) => {
  const scheduleKey =
    typeof schedule === "string"
      ? schedule
      : schedule._id || schedule.slot || idx;

  const key = `${route._id}-${scheduleKey}`;

  const slotValue = typeof schedule === "object" ? schedule.slot : schedule;
const tripType = typeof schedule === "object" ? schedule.tripType?.toLowerCase() : "pickup";

  const match = schedules.find(
    (s) =>
      s.routeId?._id === route._id &&
      s.slot === (schedule.slot || schedule) &&
      s.tripType === tripType
  );

  const isActive = match?.status?.toLowerCase() === "active";

  return (
    <tr key={key}>
      {idx === 0 && (
        <td rowSpan={route.tripSchedules.length}>{society.name}</td>
      )}
      {idx === 0 && (
        <td rowSpan={route.tripSchedules.length}>
          {route.routeNo} <br />
          <small>
            {route.startPoint} ➝ {route.endPoint}
          </small>
        </td>
      )}
      <td>
        {slotValue} <br />
        <small style={{ color: "#555" }}>{tripType}</small>
      </td>
      <td>
        <select
          value={match?.busId?._id || ""}
          onChange={(e) =>
  handleAssign(society._id, route._id, slotValue, e.target.value, tripType)
}

        >
          <option value="">Select Bus</option>
          {buses.map((b) => (
            <option key={b._id} value={b._id}>
              {b.regNumber} ({b.seatingCapacity} seats)
            </option>
          ))}
        </select>
      </td>
      <td>
        <button
  onClick={() =>
    handleActivate(
      route._id,
      slotValue,
      (schedule.tripType || "pickup").toLowerCase()
    )
  }
  style={{
    backgroundColor: isActive ? "green" : "#ccc",
    color: "white",
    padding: "6px 12px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  }}
>
  {isActive ? "Active" : "Activate Route"}
</button>

      </td>
    </tr>
  );
});

            });
          })}
        </tbody>
      </table>
    </div>
  );
}
