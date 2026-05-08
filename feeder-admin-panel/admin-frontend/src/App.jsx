import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import ScheduleDashboard from "./pages/ScheduleDashboard";
import BusOnboardingForm from "./pages/BusOnboardingForm";
import DailySchedule from "./pages/DailySchedule";
import SocietyForm from "./pages/SocietyForm";
import RouteForm from "./pages/RouteForm";
import AdminSocietyList from "./pages/AdminSocietyList";
import SocietyDetail from "./pages/SocietyDetail";
import RouteListPage from "./pages/RouteListPage";
import SocietyRoutes from "./pages/SocietyRoutes";
import DriverPasswordReset from "./pages/Driver/DriverPasswordReset";

import DriverApp from "./pages/Driver";
import "./App.css";

const Shell = () => {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-container">
      <aside className={`sidebar ${navOpen ? "open" : ""}`}>
        <div className="sidebar__header">
          <h2>Menu</h2>
          <button className="close-btn" onClick={() => setNavOpen(false)}>
            ✕
          </button>
        </div>
        <ul>
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/">Daily Schedule</Link></li>
          <li><Link to="/society-form">Society Form</Link></li>
          <li><Link to="/route-form">Route Form</Link></li>
          <li><Link to="/bus-onboarding">Bus Onboarding</Link></li>
          <li><Link to="/admin/societies">Society List</Link></li>
          <li><Link to="/admin/routes">Manage Routes</Link></li>
          {/* <li><Link to="/driver">Driver</Link></li> */}
        </ul>
      </aside>

      <div className={`nav-overlay ${navOpen ? "show" : ""}`} onClick={() => setNavOpen(false)} />

      <main className="main-content">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setNavOpen(true)}>
            ☰
          </button>
          <h1>Feeder Admin</h1>
        </header>

        <div className="main-inner">
          <Routes>
            {/* Admin pages */}
            <Route path="/dashboard" element={<ScheduleDashboard />} />
            <Route path="/" element={<DailySchedule />} />
            <Route path="/society-form" element={<SocietyForm />} />
            <Route path="/route-form" element={<RouteForm />} />
            <Route path="/bus-onboarding" element={<BusOnboardingForm />} />
            <Route path="/admin/societies" element={<AdminSocietyList />} />
            <Route path="/societies/:id" element={<SocietyDetail />} />
            <Route path="/admin/routes" element={<RouteListPage />} />
            <Route path="/societies/:id/routes" element={<SocietyRoutes />} />

            {/* Driver pages */}
            <Route path="/driver" element={<DriverApp />} />
            <Route path="/driver-password-reset" element={<DriverPasswordReset />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}

export default App;
