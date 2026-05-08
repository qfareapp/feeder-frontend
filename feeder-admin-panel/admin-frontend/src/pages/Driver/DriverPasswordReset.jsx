import { useState } from "react";
import { API } from "../../config";   // <-- correct path for Driver folder

export default function DriverPasswordReset() {
  const [regNumber, setRegNumber] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/driver/reset/reset-password", {
        regNumber,
        newPassword,
      });

      setMsg(res.data.message);
      setRegNumber("");
      setNewPassword("");
    } catch (err) {
      setMsg(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div style={styles.container}>
      <h2>🔐 Reset Driver Password</h2>

      <form onSubmit={handleReset} style={styles.form}>
        <input
          type="text"
          placeholder="Bus Reg Number (e.g., WB06P1111)"
          value={regNumber}
          onChange={(e) => setRegNumber(e.target.value)}
          required
          style={styles.input}
        />

        <input
          type="text"
          placeholder="New Password (e.g., 1111@bus)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          style={styles.input}
        />

        <button type="submit" style={styles.button}>
          Reset Password
        </button>
      </form>

      {msg && <p style={styles.message}>{msg}</p>}
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    maxWidth: "400px",
    margin: "auto",
    border: "1px solid #ddd",
    borderRadius: "10px",
    marginTop: "40px",
    background: "#fafafa",
  },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  input: {
    padding: "10px",
    fontSize: "16px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "12px",
    background: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
  },
  message: {
    marginTop: "15px",
    fontWeight: "bold",
    color: "green",
  },
};
