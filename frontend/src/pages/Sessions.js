import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { createSession, getAllSessions, endSession } from "../utils/api";

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeQR, setActiveQR] = useState(null);
  const [form, setForm] = useState({
    courseId: "CN6035",
    courseName: "Mobile and Distributed Systems",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "11:00",
    adminEmail: localStorage.getItem("userEmail") || "admin",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState(null);

  const courses = [
    { id: "CN6000", name: "Mental Wealth: Professional Life 3" },
    { id: "CN6003", name: "Computer and Network Security" },
    { id: "CN6005", name: "Artificial Intelligence" },
    { id: "CN6008", name: "Advanced Topics in Computer Science" },
    { id: "CN6035", name: "Mobile and Distributed Systems" },
  ];

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await getAllSessions();
      setSessions(res.data.data.sessions);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCourseChange = (e) => {
    const selected = courses.find((c) => c.id === e.target.value);
    setForm({ ...form, courseId: selected.id, courseName: selected.name });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setError(null);
    try {
      const res = await createSession(form);
      setActiveQR(res.data.data);
      setShowCreate(false);
      fetchSessions();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create session");
    }
    setCreateLoading(false);
  };

  const handleEnd = async (id) => {
    try {
      await endSession(id);
      fetchSessions();
      if (activeQR?.sessionId === id) setActiveQR(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div>Loading sessions...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Lecture Sessions</h1>
        <p>Create sessions and generate QR codes for student attendance</p>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <button className="btn btn-primary" style={{ width: "auto", padding: "10px 24px" }} onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "+ Create Session"}
        </button>
      </div>

      {showCreate && (
        <div className="form-card" style={{ marginBottom: "24px" }}>
          <h3 style={{ marginBottom: "20px", fontSize: "16px" }}>New Lecture Session</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Module</label>
              <select className="form-input" value={form.courseId} onChange={handleCourseChange}>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.id} - {c.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input type="time" className="form-input" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input type="time" className="form-input" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={createLoading}>
              {createLoading ? "Creating..." : "Create & Generate QR"}
            </button>
          </form>
          {error && <div className="result-card error" style={{ marginTop: "16px" }}><p style={{ color: "var(--danger)", margin: 0 }}>{error}</p></div>}
        </div>
      )}

      {activeQR && (
        <div className="data-table-wrapper" style={{ padding: "32px", textAlign: "center", marginBottom: "24px" }}>
          <h3 style={{ marginBottom: "8px" }}>Session QR Code</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
            {activeQR.courseName} &middot; {activeQR.date} &middot; {activeQR.startTime} - {activeQR.endTime}
          </p>
          <div style={{ background: "#fff", display: "inline-block", padding: "24px", borderRadius: "16px", marginBottom: "20px" }}>
            <QRCodeSVG value={activeQR.qrToken} size={280} level="H" />
          </div>
          <p className="mono" style={{ fontSize: "12px", color: "var(--text-muted)", wordBreak: "break-all", maxWidth: "400px", margin: "0 auto" }}>
            Token: {activeQR.qrToken.slice(0, 24)}...
          </p>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "12px" }}>
            Display this QR code on the projector for students to scan
          </p>
        </div>
      )}

      <div className="data-table-wrapper">
        <div className="data-table-header">
          <h2>All Sessions ({sessions.length})</h2>
        </div>
        {sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{"\uD83D\uDCC5"}</div>
            <p>No sessions yet. Create one above.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Date</th>
                <th>Time</th>
                <th>Attendees</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s._id}>
                  <td><strong>{s.courseId}</strong><br /><span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{s.courseName}</span></td>
                  <td>{s.date}</td>
                  <td className="mono">{s.startTime} - {s.endTime}</td>
                  <td className="mono">{s.checkIns?.length || 0}</td>
                  <td>
                    <span className={`badge ${s.isActive ? "badge-success" : "badge-pending"}`}>
                      {s.isActive ? "\u2713 Active" : "Ended"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {s.isActive && (
                        <>
                          <button
                            onClick={() => setActiveQR({ qrToken: s.qrToken, courseName: s.courseName, date: s.date, startTime: s.startTime, endTime: s.endTime, sessionId: s._id })}
                            style={{ background: "var(--accent-glow)", color: "var(--accent-light)", border: "1px solid var(--accent)", padding: "4px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                          >
                            Show QR
                          </button>
                          <button
                            onClick={() => handleEnd(s._id)}
                            style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid rgba(225,112,85,0.3)", padding: "4px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                          >
                            End
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Sessions;