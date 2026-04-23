import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import CheckIn from "./pages/CheckIn";
import Verify from "./pages/Verify";
import Transactions from "./pages/Transactions";
import Analytics from "./pages/Analytics";
import Login from "./pages/Login";
import Sessions from "./pages/Sessions";
import ScanQR from "./pages/ScanQR";
import Students from "./pages/Students";
import StudentView from "./pages/StudentView";
import Certificates from "./pages/Certificates";
import MyCertificates from "./pages/MyCertificates";
import { connectWallet, isWalletConnected } from "./utils/wallet";
import { ToastProvider } from "./context/ToastContext";
import NotFound from "./components/NotFound";
import "./App.css";

function AppInner() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem("userEmail");
    const savedName = localStorage.getItem("userName");
    const savedRole = localStorage.getItem("userRole");
    if (savedEmail) {
      setUser({ email: savedEmail, name: savedName, role: savedRole || "admin" });
    }

    const checkWallet = async () => {
      const connected = await isWalletConnected();
      if (connected && window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        setWalletAddress(accounts[0]);
      }
    };
    checkWallet();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        setWalletAddress(accounts[0] || null);
      });
    }
  }, []);

  const handleConnect = async () => {
    const wallet = await connectWallet();
    if (wallet) setWalletAddress(wallet.address);
  };

  const handleLogin = (userData) => setUser(userData);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userBackendRole");
    localStorage.removeItem("userModules");
    localStorage.removeItem("studentId");
    // Skip setUser(null) — React would re-render the unauthenticated tree
    // on the current role-scoped URL and flash the 404 before the browser
    // nav kicks in. Hard-replace straight to / so the next paint is the
    // landing page with a clean React state.
    if (typeof window !== "undefined") {
      window.location.replace("/");
    } else {
      setUser(null);
    }
  };

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/admin/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/admin/register" element={<Login onLogin={handleLogin} />} />
          <Route path="/student/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/student/register" element={<Login onLogin={handleLogin} />} />
          <Route path="/" element={
            <div className="landing-page ambient-bg">
              <div className="grid-overlay" />
              <div className="landing-container">
                <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "20px", padding: "6px 14px", background: "var(--bg-glass)", border: "1px solid var(--border-color)", borderRadius: "999px", backdropFilter: "blur(12px)" }}>
                  <span className="pulse-dot" />
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Ganache &middot; on-chain</span>
                </div>
                <div className="login-brand-icon" style={{ width: "64px", height: "64px", fontSize: "28px", margin: "0 auto 24px" }}>A</div>
                <h1 className="grad-text" style={{ fontSize: "52px", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: "16px" }}>AMS DApp</h1>
                <p style={{ color: "var(--text-secondary)", fontSize: "16px", marginBottom: "48px", lineHeight: 1.55, maxWidth: "520px", margin: "0 auto 48px" }}>Blockchain-verified attendance management. Every lecture signed on-chain, every certificate a collectible NFT.</p>
                <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
                  <a href="/admin/login" className="landing-btn landing-btn-admin">Admin / Lecturer Portal</a>
                  <a href="/student/login" className="landing-btn landing-btn-student">Student Portal</a>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "40px" }}>University of East London &middot; 2025/26</p>
              </div>
            </div>
          } />
          <Route path="*" element={<NotFound homePath="/" />} />
        </Routes>
      </Router>
    );
  }

  const isAdmin = user.role === "admin";

  return (
    <Router>
      <div className={`app-layout ${isAdmin ? "theme-admin" : "theme-student"}`}>
        <Sidebar isOpen={sidebarOpen} role={user.role} />
        <div className={`main-area ${sidebarOpen ? "" : "sidebar-closed"}`}>
          <Navbar
            walletAddress={walletAddress}
            onConnect={handleConnect}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            user={user}
            onLogout={handleLogout}
          />
          <main className="content">
            <Routes>
              {isAdmin ? (
                <>
                  <Route path="/" element={<Navigate to="/admin" />} />
                  <Route path="/admin" element={<Dashboard />} />
                  <Route path="/admin/sessions" element={<Sessions />} />
                  <Route path="/admin/students" element={<Students />} />
                  <Route path="/admin/certificates" element={<Certificates />} />
                  <Route path="/admin/check-in" element={<CheckIn walletAddress={walletAddress} />} />
                  <Route path="/admin/verify" element={<Verify />} />
                  <Route path="/admin/transactions" element={<Transactions />} />
                  <Route path="/admin/analytics" element={<Analytics />} />
                  <Route path="*" element={<Navigate to="/admin" />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<Navigate to="/student" />} />
                  <Route path="/student" element={<StudentView />} />
                  <Route path="/student/scan" element={<ScanQR walletAddress={walletAddress} />} />
                  <Route path="/student/certificates" element={<MyCertificates />} />
                  <Route path="/student/verify" element={<Verify />} />
                  <Route path="*" element={<Navigate to="/student" />} />
                </>
              )}
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}

export default App;