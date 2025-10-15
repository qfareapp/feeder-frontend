import React, { useState, useEffect } from "react";
import axios from "axios";

const RouteForm = () => {
  const [societies, setSocieties] = useState([]); // ✅ store societies

  const [formData, setFormData] = useState({
    routeNo: "",
    startPoint: "",
    endPoint: "",
    distanceKm: "",
    passAmount15: "",
    passAmount30: "",
    stops: [""],
    tripSchedules: [{ slot: "", tripType: "pickup", seats: "" }],
  });

  // fetch societies on mount
  useEffect(() => {
    axios.get("http://localhost:5000/api/societies")
      .then(res => setSocieties(res.data))
      .catch(err => console.error("Error fetching societies:", err));
  }, []);

  // handle simple fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // handle dynamic stops
  const handleStopChange = (i, value) => {
    const updated = [...formData.stops];
    updated[i] = value;
    setFormData({ ...formData, stops: updated });
  };

  const addStop = () => {
    setFormData({ ...formData, stops: [...formData.stops, ""] });
  };

  // handle dynamic schedules
  const handleScheduleChange = (i, field, value) => {
  const updated = [...formData.tripSchedules];
  updated[i][field] = value;
  setFormData({ ...formData, tripSchedules: updated });
};

const addSchedule = () => {
  setFormData({
    ...formData,
    tripSchedules: [...formData.tripSchedules, { slot: "", tripType: "pickup", seats: "" }],
  });
};

  // submit form
  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await axios.post("http://localhost:5000/api/routes", formData);
    alert("✅ Route added successfully!");
    setFormData({
      routeNo: "",
      startPoint: "",
      endPoint: "",
      distanceKm: "",
      stops: [""],
      tripSchedules: [{ slot: "", tripType: "pickup" }], // ✅ fix
    });
  } catch (err) {
    console.error(err);
    alert("❌ Error adding route");
  }
};

  return (
    <div style={{ padding: "20px" }}>
      <h1>Route Onboarding Form – Feeder Service</h1>
      <form onSubmit={handleSubmit}>
        {/* ✅ Route Number field */}
        <input
          type="text"
          name="routeNo"
          placeholder="Route No"
          value={formData.routeNo}
          onChange={handleChange}
        />

        {/* ✅ Dropdown for Start Point */}
        <select
          name="startPoint"
          value={formData.startPoint}
          onChange={handleChange}
        >
          <option value="">Select Start Society</option>
          {Array.isArray(societies) &&
            societies.map((society) => (
              <option key={society._id} value={society.name}>
                {society.name}
              </option>
            ))}
        </select>

        {/* ✅ End Point free text */}
        <input
          type="text"
          name="endPoint"
          placeholder="End Point"
          value={formData.endPoint}
          onChange={handleChange}
        />

        <input
          type="number"
          name="distanceKm"
          placeholder="Distance (km)"
          value={formData.distanceKm}
          onChange={handleChange}
        />
        {/* ✅ Pass Amounts */}
        <h3>Pass Amounts</h3>
        <input
          type="number"
          name="passAmount15"
          placeholder="Pass Amount (15 days)"
          value={formData.passAmount15}
          onChange={handleChange}
        />
        <input
          type="number"
          name="passAmount30"
          placeholder="Pass Amount (30 days)"
          value={formData.passAmount30}
          onChange={handleChange}
        />
        
        <h3>Via Stops</h3>
        {formData.stops.map((stop, i) => (
          <div key={i}>
            <input
              type="text"
              placeholder={`Stop ${i + 1}`}
              value={stop}
              onChange={(e) => handleStopChange(i, e.target.value)}
            />
          </div>
        ))}
        <button type="button" onClick={addStop}>+ Add Stop</button>

        <h3>Trip Schedules</h3>
{formData.tripSchedules.map((schedule, i) => (
  <div key={i}>
    {/* Time slot */}
    <input
      type="time"
      value={schedule.slot}
      onChange={(e) => handleScheduleChange(i, "slot", e.target.value)}
      required
    />

    {/* Trip type (pickup/drop) */}
    <select
      value={schedule.tripType}
      onChange={(e) => handleScheduleChange(i, "tripType", e.target.value)}
    >
      <option value="pickup">Pickup</option>
      <option value="drop">Drop</option>
    </select>

    {/* ✅ Seats per schedule */}
    <input
      type="number"
      placeholder="Seats"
      value={schedule.seats}
      onChange={(e) => handleScheduleChange(i, "seats", e.target.value)}
      required
    />
  </div>
))}
<button type="button" onClick={addSchedule}>+ Add Schedule</button>


        <br /><br />
        <button type="submit">Submit Route</button>
      </form>
    </div>
  );
};

export default RouteForm;
