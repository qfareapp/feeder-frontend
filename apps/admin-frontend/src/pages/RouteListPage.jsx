import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../config";

const RouteListPage = () => {
  const [routes, setRoutes] = useState([]);
  const [editingRoute, setEditingRoute] = useState(null);

  // fetch all routes on mount
  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/routes`);
      setRoutes(res.data || []);
    } catch (err) {
      console.error("Error fetching routes:", err);
    }
  };

  // delete route
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this route?")) return;
    try {
      await axios.delete(`${BASE_URL}/routes/${id}`);
      alert("✅ Route deleted!");
      fetchRoutes();
    } catch (err) {
      console.error(err);
      alert("❌ Error deleting route");
    }
  };

  // save edited route
  const handleSaveEdit = async () => {
    try {
      await axios.put(
        `${BASE_URL}/routes/${editingRoute._id}`,
        editingRoute
      );
      alert("✅ Route updated!");
      setEditingRoute(null);
      fetchRoutes();
    } catch (err) {
      console.error(err);
      alert("❌ Error updating route");
    }
  };

  // handle simple field changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingRoute({ ...editingRoute, [name]: value });
  };

  // handle stop change
  const handleStopChange = (i, value) => {
    const updated = [...editingRoute.stops];
    updated[i] = value;
    setEditingRoute({ ...editingRoute, stops: updated });
  };

  const addStop = () => {
    setEditingRoute({
      ...editingRoute,
      stops: [...(editingRoute.stops || []), ""],
    });
  };

  const removeStop = (i) => {
    const updated = [...editingRoute.stops];
    updated.splice(i, 1);
    setEditingRoute({ ...editingRoute, stops: updated });
  };

  // handle trip schedule change
  const handleScheduleChange = (i, field, value) => {
    const updated = [...editingRoute.tripSchedules];
    updated[i][field] = value;
    setEditingRoute({ ...editingRoute, tripSchedules: updated });
  };

  const addSchedule = () => {
    setEditingRoute({
      ...editingRoute,
      tripSchedules: [
        ...(editingRoute.tripSchedules || []),
        { slot: "", tripType: "pickup", seats: "" },
      ],
    });
  };

  const removeSchedule = (i) => {
    const updated = [...editingRoute.tripSchedules];
    updated.splice(i, 1);
    setEditingRoute({ ...editingRoute, tripSchedules: updated });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>All Routes – Admin Panel</h1>

      {/* Editing Mode */}
      {editingRoute && (
        <div style={{ marginBottom: "20px", border: "1px solid #ddd", padding: "15px" }}>
          <h3>Edit Route {editingRoute.routeNo}</h3>
          <input
            type="text"
            name="routeNo"
            value={editingRoute.routeNo}
            onChange={handleEditChange}
            placeholder="Route No"
          />
          <input
            type="text"
            name="startPoint"
            value={editingRoute.startPoint}
            onChange={handleEditChange}
            placeholder="Start Point"
          />
          <input
            type="text"
            name="endPoint"
            value={editingRoute.endPoint}
            onChange={handleEditChange}
            placeholder="End Point"
          />
          <input
            type="number"
            name="distanceKm"
            value={editingRoute.distanceKm}
            onChange={handleEditChange}
            placeholder="Distance (km)"
          />
          <input
            type="number"
            name="passAmount15"
            value={editingRoute.passAmount15}
            onChange={handleEditChange}
            placeholder="Pass 15 days"
          />
          <input
            type="number"
            name="passAmount30"
            value={editingRoute.passAmount30}
            onChange={handleEditChange}
            placeholder="Pass 30 days"
          />

          {/* Stops */}
          <h4>Stops</h4>
          {(editingRoute.stops || []).map((stop, i) => (
            <div key={i} style={{ marginBottom: "5px" }}>
              <input
                type="text"
                value={stop}
                onChange={(e) => handleStopChange(i, e.target.value)}
                placeholder={`Stop ${i + 1}`}
              />
              <button type="button" onClick={() => removeStop(i)}>❌</button>
            </div>
          ))}
          <button type="button" onClick={addStop}>+ Add Stop</button>

          {/* Trip Schedules */}
          <h4>Trip Schedules</h4>
          {(editingRoute.tripSchedules || []).map((s, i) => (
            <div key={i} style={{ marginBottom: "5px" }}>
              <input
                type="time"
                value={s.slot}
                onChange={(e) => handleScheduleChange(i, "slot", e.target.value)}
              />
              <select
                value={s.tripType}
                onChange={(e) => handleScheduleChange(i, "tripType", e.target.value)}
              >
                <option value="pickup">Pickup</option>
                <option value="drop">Drop</option>
              </select>
              <input
                type="number"
                placeholder="Seats"
                value={s.seats}
                onChange={(e) => handleScheduleChange(i, "seats", e.target.value)}
              />
              <button type="button" onClick={() => removeSchedule(i)}>❌</button>
            </div>
          ))}
          <button type="button" onClick={addSchedule}>+ Add Schedule</button>

          <br />
          <br />
          <button onClick={handleSaveEdit}>💾 Save</button>
          <button onClick={() => setEditingRoute(null)}>❌ Cancel</button>
        </div>
      )}

      {/* Routes Table */}
      <table border="1" cellPadding="10" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Route No</th>
            <th>Start</th>
            <th>End</th>
            <th>Distance</th>
            <th>Pass 15</th>
            <th>Pass 30</th>
            <th>Stops</th>
            <th>Schedules</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {routes.map((r) => (
            <tr key={r._id}>
              <td>{r.routeNo}</td>
              <td>{r.startPoint}</td>
              <td>{r.endPoint}</td>
              <td>{r.distanceKm}</td>
              <td>{r.passAmount15}</td>
              <td>{r.passAmount30}</td>
              <td>{(r.stops || []).join(", ")}</td>
              <td>
                {(r.tripSchedules || []).map((s, i) => (
                  <div key={i}>
                    {s.slot} ({s.tripType}) – {s.seats} seats
                  </div>
                ))}
              </td>
              <td>
                <button onClick={() => setEditingRoute(r)}>✏️ Edit</button>
                <button onClick={() => handleDelete(r._id)}>🗑 Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RouteListPage;
