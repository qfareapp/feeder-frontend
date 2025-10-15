import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ScheduleDashboard from "./pages/ScheduleDashboard";
import BusOnboardingForm from "./pages/BusOnboardingForm";
import DailySchedule from "./pages/DailySchedule";
import SocietyForm from "./pages/SocietyForm";
import RouteForm from "./pages/RouteForm";
import AdminSocietyList from "./pages/AdminSocietyList";
import SocietyDetail from "./pages/SocietyDetail";
import RouteListPage from "./pages/RouteListPage";
import SocietyRoutes from "./pages/SocietyRoutes";

import DriverApp from "./pages/Driver";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        {/* Sidebar only for admin part */}
        <aside className="sidebar fixed-sidebar">
          <h2>Menu</h2>
          <ul>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/">DailySchedule</Link></li>
            <li><Link to="/society-form">Society Form</Link></li>
            <li><Link to="/route-form">Route Form</Link></li>
            <li><Link to="/bus-onboarding">Bus Onboarding</Link></li>
            <li><Link to="/admin/societies">Society List</Link></li>
            <li><Link to="/admin/routes">Manage Routes</Link></li>
            {/* Optional: don’t expose driver link here, but you can add if needed */}
            {/* <li><Link to="/driver">Driver</Link></li> */}
          </ul>
        </aside>

        <main className="main-content">
          <Routes>
  {/* Admin pages */}
  <Route path="/dashboard" element={<ScheduleDashboard />} />
  <Route path="/" element={<DailySchedule />} />
  <Route path="/society-form" element={<SocietyForm />} />
  <Route path="/route-form" element={<RouteForm />} />
  <Route path="/bus-onboarding" element={<BusOnboardingForm />} />
  <Route path="/admin/societies" element={<AdminSocietyList />} /> {/* ✅ fixed */}
  <Route path="/societies/:id" element={<SocietyDetail />} />
  <Route path="/admin/routes" element={<RouteListPage />} />
  <Route path="/societies/:id/routes" element={<SocietyRoutes />} />

  {/* Driver pages */}
  <Route path="/driver" element={<DriverApp />} />
</Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
