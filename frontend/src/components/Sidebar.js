import React from "react";
import { NavLink, useLocation } from "react-router-dom";

const Sidebar = ({ isOpen, role }) => {
  const location = useLocation();
  if (!isOpen) return null;

  const adminLinks = [
    { to: "/admin", icon: "\u2302", label: "Dashboard" },
    { to: "/admin/sessions", icon: "\u23F2", label: "Sessions" },
    { to: "/admin/students", icon: "\u263A", label: "Students" },
    { to: "/admin/certificates", icon: "\uD83C\uDFC6", label: "NFT Certificates" },
    { to: "/admin/check-in", icon: "\u2713", label: "Manual Check In" },
    { to: "/admin/verify", icon: "\u2263", label: "Verify" },
    { to: "/admin/transactions", icon: "\u21C4", label: "Transactions" },
    { to: "/admin/analytics", icon: "\u2261", label: "Analytics" },
  ];

  const studentLinks = [
    { to: "/student", icon: "\u2302", label: "My Attendance" },
    { to: "/student/scan", icon: "\u2B1A", label: "Scan QR" },
    { to: "/student/certificates", icon: "\uD83C\uDFC6", label: "My Certificates" },
    { to: "/student/verify", icon: "\u2263", label: "Verify Record" },
  ];

  const links = role === "admin" ? adminLinks : studentLinks;
  const isAdmin = role === "admin";

  return (
    <aside className={`sidebar ${isAdmin ? "sidebar-admin" : "sidebar-student"}`}>
      <div className="sidebar-logo">
        <div className={`sidebar-logo-icon ${isAdmin ? "icon-admin" : "icon-student"}`}>
          {isAdmin ? "A" : "S"}
        </div>
        <div>
          <h1>AMS</h1>
          <span>{isAdmin ? "Admin Panel" : "Student Portal"}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={`sidebar-link ${location.pathname === link.to ? "active" : ""}`}
            end={link.to === "/admin" || link.to === "/student"}
          >
            <span className="sidebar-link-icon">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>UEL 2025/26</p>
      </div>
    </aside>
  );
};

export default Sidebar;