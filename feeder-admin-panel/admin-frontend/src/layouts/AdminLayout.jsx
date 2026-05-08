import React from "react";
import { Link } from "react-router-dom";
import "./AdminLayout.css"; // optional CSS

const AdminLayout = ({ children }) => {
  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">Feeder Admin</h2>
        <nav>
          <ul>
            <li><Link to="/">DailySchedule</Link></li>
            <li><Link to="/society-form">Add Society</Link></li>
            <li><Link to="/route-form">Add Route</Link></li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main">{children}</main>
    </div>
  );
};

export default AdminLayout;
