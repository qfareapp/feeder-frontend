import { useState } from "react";
import axios from "axios";
import { BASE_URL } from "../../config";

export default function DriverLogin({ onLogin }) {
  const [regNumber, setRegNumber] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${BASE_URL}/driver/login`, {
        regNumber,
        password,
      });
      localStorage.setItem("driverToken", res.data.token);
      onLogin(res.data.busId);
    } catch (err) {
      alert("Login failed");
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
        />
        <br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
