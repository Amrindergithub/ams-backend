import React from "react";
import { Link } from "react-router-dom";

/*
 * Branded 404 page. The logged-in app has catch-all routes that
 * redirect back to the role-scoped dashboard, but the public-facing
 * tree (`/`, `/admin/login`, `/verify`, etc.) should show a proper
 * 404 rather than silently redirecting to the landing page — makes
 * typos easier to notice during the demo.
 */
const NotFound = ({ homePath = "/" }) => (
  <div
    className="landing-page ambient-bg"
    style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}
  >
    <div className="grid-overlay" />
    <div className="landing-container" style={{ textAlign: "center", padding: "40px 20px" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "24px",
          padding: "6px 14px",
          background: "var(--bg-glass)",
          border: "1px solid var(--border-color)",
          borderRadius: "999px",
          backdropFilter: "blur(12px)",
        }}
      >
        <span className="pulse-dot" style={{ background: "var(--danger)" }} />
        <span
          style={{
            fontSize: "11px",
            color: "var(--text-secondary)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontFamily: "var(--font-mono)",
          }}
        >
          Route not found
        </span>
      </div>
      <h1
        className="grad-text"
        style={{ fontSize: "96px", lineHeight: 1, margin: "0 0 12px", letterSpacing: "-0.05em" }}
      >
        404
      </h1>
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "15px",
          marginBottom: "32px",
          maxWidth: "420px",
          margin: "0 auto 32px",
        }}
      >
        The page you are looking for doesn't exist, or it was moved. The AMS ledger
        is fine — this is just a UI miss.
      </p>
      <Link to={homePath} className="landing-btn landing-btn-admin">
        Back to home
      </Link>
    </div>
  </div>
);

export default NotFound;
