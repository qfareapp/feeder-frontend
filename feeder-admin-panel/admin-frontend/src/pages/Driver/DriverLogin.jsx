import { useState } from "react";
import { API } from "../../config"; // use API instance
import { useNavigate } from "react-router-dom";

export default function DriverLogin({ onLogin }) {
  const [regNumber, setRegNumber] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/driver/auth/login", {
        regNumber,
        password,
      });

      localStorage.setItem("driverToken", res.data.token);
      localStorage.setItem("busId", res.data.busId);

      onLogin(res.data.busId, res.data.token);
    } catch (err) {
      console.error("Driver login error:", err.response?.data || err);
      alert(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>🚌 Driver Login</h2>

      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Bus Reg No"
          value={regNumber}
          onChange={(e) => setRegNumber(e.target.value)}
          required
        />

        <br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <br />

        <button type="submit">Login</button>
      </form>

      {/* ➕ Reset Password Button */}
      <button
        onClick={() => navigate("/driver-password-reset")}
        style={{
          marginTop: "12px",
          background: "transparent",
          border: "none",
          color: "#007bff",
          cursor: "pointer",
          textDecoration: "underline",
          fontSize: "14px",
        }}
      >
        Reset Driver Password
      </button>
    </div>
  );
}
