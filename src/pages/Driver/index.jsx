import { useState, useEffect } from "react";
import DriverLogin from "./DriverLogin";
import DriverDashboard from "./DriverDashboard";

export default function DriverApp() {
  const [busId, setBusId] = useState(null);
  const [token, setToken] = useState(null);

  // Load from localStorage when component mounts
  useEffect(() => {
    const storedBusId = localStorage.getItem("busId");
    const storedToken = localStorage.getItem("driverToken");
    if (storedBusId && storedToken) {
      setBusId(storedBusId);
      setToken(storedToken);
    }
  }, []);

  // Handle login success
  const handleLogin = (id, token) => {
    localStorage.setItem("busId", id);
    localStorage.setItem("driverToken", token);
    setBusId(id);
    setToken(token);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("busId");
    localStorage.removeItem("driverToken");
    setBusId(null);
    setToken(null);
  };

  return (
    <div>
      {busId && token ? (
        <DriverDashboard busId={busId} token={token} onLogout={handleLogout} />
      ) : (
        <DriverLogin onLogin={handleLogin} />
      )}
    </div>
  );
}
