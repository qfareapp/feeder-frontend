import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../config";

const SocietyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSociety = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/societies/${id}`);
        setFormData(res.data);
      } catch (err) {
        console.error("❌ Error fetching society:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSociety();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${BASE_URL}/societies/${id}`, formData);
      alert("✅ Society updated successfully!");
      navigate("/admin/societies");
    } catch (err) {
      alert("❌ Failed to update society");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!formData) return <p>Society not found</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Edit Society: {formData.name}</h1>
      <form onSubmit={handleUpdate}>
        <input
          type="text"
          name="name"
          value={formData.name || ""}
          onChange={handleChange}
          placeholder="Society Name"
        />
        <input
          type="text"
          name="contactPerson"
          value={formData.contactPerson || ""}
          onChange={handleChange}
          placeholder="Contact Person"
        />
        <input
          type="text"
          name="phone"
          value={formData.phone || ""}
          onChange={handleChange}
          placeholder="Phone"
        />
        <input
          type="email"
          name="email"
          value={formData.email || ""}
          onChange={handleChange}
          placeholder="Email"
        />
        {/* 🔽 Add rest of fields as needed */}
        <br />
        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
};

export default SocietyDetail;
