import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const AdminSocietyList = () => {
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/societies");
        setSocieties(res.data || []);
      } catch (err) {
        console.error("❌ Error fetching societies:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSocieties();
  }, []);

  if (loading) return <p>Loading societies...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>🏢 Onboarded Housing Societies</h1>
      <table border="1" cellPadding="10" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Logo</th>
            <th>Society Name</th>
            <th>Contact Person</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Flats</th>
            <th>Commuters</th>
            <th>Pickup Point</th>
            <th>Parking</th>
            <th>Charging</th>
            <th>Created At</th>
            <th>Routes</th> {/* ✅ New column */}
          </tr>
        </thead>
        <tbody>
          {societies.length === 0 ? (
            <tr>
              <td colSpan="12">No societies onboarded yet.</td>
            </tr>
          ) : (
            societies.map((s) => (
              <tr key={s._id}>
                <td>
                  {s.logo ? (
                    <Link to={`/societies/${s._id}`}>
                      <img src={s.logo} alt={s.name} width="60" />
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{s.name}</td>
                <td>{s.contactPerson}</td>
                <td>{s.phone}</td>
                <td>{s.email}</td>
                <td>{s.flats}</td>
                <td>{s.commuters}</td>
                <td>{s.pickupPoint}</td>
                <td>{s.parkingAvailable}</td>
                <td>{s.chargingAvailable}</td>
                <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                <td>
                  <Link to={`/societies/${s._id}/routes`}>View Routes</Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminSocietyList;
