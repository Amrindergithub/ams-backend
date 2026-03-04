import React from "react";
import { Link } from "react-router-dom";

const Navbar = ({ walletAddress }) => {
  return (
    <nav style={styles.nav}>
      <h2 style={styles.logo}>AMS DApp</h2>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>Dashboard</Link>
        <Link to="/check-in" style={styles.link}>Check In</Link>
        <Link to="/verify" style={styles.link}>Verify</Link>
      </div>
      <div style={styles.wallet}>
        {walletAddress
          ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
          : "Not Connected"}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 30px",
    backgroundColor: "#1a1a2e",
    color: "#fff",
  },
  logo: { margin: 0, fontSize: "20px" },
  links: { display: "flex", gap: "20px" },
  link: { color: "#e0e0e0", textDecoration: "none", fontSize: "16px" },
  wallet: {
    backgroundColor: "#16213e",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "14px",
  },
};

export default Navbar;