import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config";

const SocietyRoutes = () => {
  const { id } = useParams(); // society ID
  const [routes, setRoutes] = useState([]);
  const [society, setSociety] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const societyRes = await axios.get(`${BASE_URL}/societies/${id}`);
        setSociety(societyRes.data);

        const routeRes = await axios.get(`${BASE_URL}/routes?societyId=${id}`);
        setRoutes(routeRes.data || []);
      } catch (err) {
        console.error("❌ Error fetching society routes:", err.message);
      }
    };
    fetchData();
  }, [id]);

  return (
    <div style={{ padding: "20px" }}>
      {society && <h2>🚍 Routes for {society.name}</h2>}

      {routes.length === 0 ? (
        <p>No routes found for this society.</p>
      ) : (
        <table border="1" cellPadding="10" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Route No</th>
              <th>Start</th>
              <th>End</th>
              <th>Stops</th>
              <th>Schedules</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => (
              <tr key={r._id}>
                <td>{r.routeNo}</td>
                <td>{r.startPoint}</td>
                <td>{r.endPoint}</td>
                <td>{(r.stops || []).join(", ")}</td>
                <td>
                  {(r.tripSchedules || []).map((s, i) => (
                    <div key={i}>
                      {s.slot} ({s.tripType}) – {s.seats} seats
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <br />
      <Link to="/admin/societies">⬅ Back to Societies</Link>
    </div>
  );
};

export default SocietyRoutes;
