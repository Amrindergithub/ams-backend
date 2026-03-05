import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login, register, registerStudent } from "../utils/api";

const ADMIN_KEY = "UEL-AMS-2026";

const Login = ({ onLogin }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isStudentRoute = location.pathname.startsWith("/student");
  const role = isAdminRoute ? "admin" : "student";

  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentId, setStudentId] = useState("");
  const [course, setCourse] = useState("CN6035");
  const [walletAddress, setWalletAddress] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const courses = [
    { id: "CN6000", name: "Mental Wealth: Professional Life 3" },
    { id: "CN6003", name: "Computer and Network Security" },
    { id: "CN6005", name: "Artificial Intelligence" },
    { id: "CN6008", name: "Advanced Topics in Computer Science" },
    { id: "CN6035", name: "Mobile and Distributed Systems" },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login(email, password);
      const token = res.data.data?.accessToken || res.data.data?.token;
      if (token) localStorage.setItem("accessToken", token);
      localStorage.setItem("userEmail", email);
      localStorage.setItem("userName", name || email.split("@")[0]);
      localStorage.setItem("userRole", role);
      if (role === "student") localStorage.setItem("studentId", studentId || email);
      onLogin({ email, name: name || email.split("@")[0], role });
      navigate(role === "admin" ? "/admin" : "/student");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Check your credentials.");
    }
    setLoading(false);
  };

  const handleAdminRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (adminKey !== ADMIN_KEY) {
      setError("Invalid admin registration key. Contact your department head.");
      setLoading(false);
      return;
    }

    try {
      await register(name, email, password);
      setSuccess("Admin account created. You can now sign in.");
      setMode("login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
    setLoading(false);
  };

  const handleStudentRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      try {
        await register(name, email, password);
      } catch (err) {
        if (!err.response?.data?.message?.includes("already")) throw err;
      }
      await registerStudent({ studentId, name, email, course, walletAddress: walletAddress || null });
      setSuccess("Student registered! You can now sign in.");
      setMode("login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
    setLoading(false);
  };

  return (
    <div className={`login-page ${isAdminRoute ? "login-admin" : "login-student"}`}>
      <div className="login-container">
        <div className={`login-left ${isAdminRoute ? "login-left-admin" : "login-left-student"}`}>
          <div className="login-brand">
            <div className={`login-brand-icon ${isAdminRoute ? "icon-admin" : "icon-student"}`}>
              {isAdminRoute ? "A" : "S"}
            </div>
            <h1>AMS DApp</h1>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
              {isAdminRoute ? "Admin Portal" : "Student Portal"}
            </p>
            <p>Blockchain-Verified Attendance Management System</p>
          </div>
          <div className="login-features">
            {isAdminRoute ? (
              <>
                <div className="login-feature">
                  <span className="login-feature-icon">{"\u23F2"}</span>
                  <div><strong>Session Management</strong><p>Create lectures & generate QR codes</p></div>
                </div>
                <div className="login-feature">
                  <span className="login-feature-icon">{"\u2261"}</span>
                  <div><strong>Analytics & Flags</strong><p>Monitor attendance & flag low students</p></div>
                </div>
                <div className="login-feature">
                  <span className="login-feature-icon">{"\u26D3"}</span>
                  <div><strong>Blockchain Verified</strong><p>Immutable records on Ganache</p></div>
                </div>
              </>
            ) : (
              <>
                <div className="login-feature">
                  <span className="login-feature-icon">{"\u2B1A"}</span>
                  <div><strong>Scan QR to Check In</strong><p>Quick attendance via QR code</p></div>
                </div>
                <div className="login-feature">
                  <span className="login-feature-icon">{"\u2713"}</span>
                  <div><strong>Check-In & Check-Out</strong><p>Prove full lecture attendance</p></div>
                </div>
                <div className="login-feature">
                  <span className="login-feature-icon">{"\u2302"}</span>
                  <div><strong>View Your Records</strong><p>See your attendance history</p></div>
                </div>
              </>
            )}
          </div>

          <div style={{ marginTop: "auto", paddingTop: "24px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              {isAdminRoute ? "Are you a student? " : "Are you an admin/lecturer? "}
              <span
                onClick={() => navigate(isAdminRoute ? "/student/login" : "/admin/login")}
                style={{ color: isAdminRoute ? "var(--accent-light)" : "#55efc4", cursor: "pointer", fontWeight: 600 }}
              >
                {isAdminRoute ? "Go to Student Portal" : "Go to Admin Portal"}
              </span>
            </p>
          </div>
        </div>

        <div className="login-right">
          <div style={{ maxWidth: "100%" }}>
            <h2 style={{ fontSize: "24px", marginBottom: "8px" }}>
              {mode === "login"
                ? "Welcome Back"
                : isAdminRoute
                ? "Admin Registration"
                : "Student Registration"}
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "24px", fontSize: "14px" }}>
              {mode === "login"
                ? `Sign in to the ${isAdminRoute ? "admin" : "student"} portal`
                : isAdminRoute
                ? "Create an admin account with registration key"
                : "Register with your student details"}
            </p>

            {mode === "login" && (
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={isAdminRoute ? "lecturer@uel.ac.uk" : "u2414204@uel.ac.uk"} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} />
                </div>
                {!isAdminRoute && (
                  <div className="form-group">
                    <label className="form-label">Student ID</label>
                    <input type="text" className="form-input" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="e.g. 2414204" required />
                  </div>
                )}
                <button type="submit" className={`btn ${isAdminRoute ? "btn-primary" : "btn-student"}`} disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            )}

            {mode === "register" && isAdminRoute && (
              <form onSubmit={handleAdminRegister}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. John Smith" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="lecturer@uel.ac.uk" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} />
                </div>
                <div className="form-group">
                  <label className="form-label">Admin Registration Key</label>
                  <input type="password" className="form-input" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} placeholder="Enter key provided by department" required />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Creating..." : "Create Admin Account"}
                </button>
              </form>
            )}

            {mode === "register" && !isAdminRoute && (
              <form onSubmit={handleStudentRegister}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Amrinder Singh" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Student ID</label>
                  <input type="text" className="form-input" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="2414204" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="u2414204@uel.ac.uk" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} />
                </div>
                <div className="form-group">
                  <label className="form-label">Course</label>
                  <select className="form-input" value={course} onChange={(e) => setCourse(e.target.value)}>
                    {courses.map((c) => (<option key={c.id} value={c.id}>{c.id} - {c.name}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Wallet Address (Optional)</label>
                  <input type="text" className="form-input mono" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="0x..." />
                </div>
                <button type="submit" className="btn btn-student" disabled={loading}>
                  {loading ? "Registering..." : "Register as Student"}
                </button>
              </form>
            )}

            {error && <div className="result-card error" style={{ marginTop: "16px" }}><p style={{ color: "var(--danger)", fontSize: "14px", margin: 0 }}>{error}</p></div>}
            {success && <div className="result-card success" style={{ marginTop: "16px" }}><p style={{ color: "var(--success)", fontSize: "14px", margin: 0 }}>{success}</p></div>}

            <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "var(--text-secondary)" }}>
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <span
                onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); setSuccess(null); }}
                style={{ color: isAdminRoute ? "var(--accent-light)" : "#55efc4", cursor: "pointer", fontWeight: 600 }}
              >
                {mode === "login" ? "Register" : "Sign In"}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;