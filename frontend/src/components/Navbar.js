import React from "react";

const Navbar = ({ walletAddress, onConnect, onToggleSidebar, user, onLogout }) => {
  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="navbar-toggle" onClick={onToggleSidebar}>
          &#9776;
        </button>
        <span className="navbar-title">Blockchain Attendance Management</span>
      </div>
      <div className="navbar-right">
        <div className="chain-pill" title="Ganache local chain heartbeat">
          <span className="pulse-dot"></span>
          <span style={{ letterSpacing: "0.06em" }}>GANACHE &middot; LOCAL</span>
        </div>
        {walletAddress ? (
          <button className="wallet-btn">
            <span className="wallet-identicon"></span>
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </button>
        ) : (
          <button className="wallet-btn wallet-btn-connect" onClick={onConnect}>
            Connect Wallet
          </button>
        )}
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              {user.name || user.email}
            </span>
            <button
              onClick={onLogout}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                color: "var(--text-secondary)",
                padding: "6px 14px",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                fontSize: "12px",
                fontFamily: "var(--font-sans)",
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;