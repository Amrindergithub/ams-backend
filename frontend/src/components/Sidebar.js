import React from "react";
import { NavLink, useLocation } from "react-router-dom";

const Sidebar = ({ isOpen, role }) => {
  const location = useLocation();
  if (!isOpen) return null;

  const adminLinks = [
    { to: "/admin",              icon: "\u25A3", label: "Dashboard" },
    { to: "/admin/sessions",     icon: "\u25C9", label: "Live Session", live: true },
    { to: "/admin/students",     icon: "\u25CE", label: "Students" },
    { to: "/admin/certificates", icon: "\u25C6", label: "Certificates" },
    { to: "/admin/transactions", icon: "\u25AD", label: "Transactions" },
    { to: "/admin/analytics",    icon: "\u25A4", label: "Analytics" },
    { to: "/admin/verify",       icon: "\u2713", label: "Verify" },
    { to: "/admin/check-in",     icon: "\u271A", label: "Manual check-in" },
  ];

  const studentLinks = [
    { to: "/student",              icon: "\u25A3", label: "My Attendance" },
    { to: "/student/scan",         icon: "\u2B1A", label: "Scan QR" },
    { to: "/student/certificates", icon: "\u25C6", label: "My Certificates" },
    { to: "/student/verify",       icon: "\u2713", label: "Verify Record" },
  ];

  const links = role === "admin" ? adminLinks : studentLinks;
  const isAdmin = role === "admin";
  const sectionLabel = isAdmin ? "Admin" : "Student";

  const contractAddr = process.env.REACT_APP_NFT_CONTRACT_ADDRESS || "0x5FbDB2…9F0C";

  return (
    <aside className={`sidebar ${isAdmin ? "sidebar-admin" : "sidebar-student"}`}>
      <div className="sidebar-logo-block">
        <div className="sidebar-logo-row">
          <div className={`sidebar-logo-icon ${isAdmin ? "icon-admin" : "icon-student"}`}>A</div>
          <div>
            <h1 className="sidebar-wordmark">AMS<span className="grad-text">·DApp</span></h1>
            <span className="sidebar-sub">UEL · CN6035</span>
          </div>
        </div>
      </div>

      <div className="sidebar-section-label">{sectionLabel}</div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={`sidebar-link ${location.pathname === link.to ? "active" : ""}`}
            end={link.to === "/admin" || link.to === "/student"}
          >
            <span className="sidebar-link-icon">{link.icon}</span>
            <span className="sidebar-link-label">{link.label}</span>
            {link.live && <span className="sidebar-live-badge"><span className="pulse-dot" /> LIVE</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="contract-pill">
          <div className="contract-pill-row">
            <span className="pulse-dot" />
            <span className="contract-pill-name">AttendanceNFT.sol</span>
          </div>
          <div className="contract-pill-row">
            <span className="contract-pill-chain">Ganache · chainId 1337</span>
          </div>
          <div className="contract-pill-row">
            <span className="mono contract-pill-addr">{contractAddr.slice(0, 10)}…{contractAddr.slice(-4)}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
