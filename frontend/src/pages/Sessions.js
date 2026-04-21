import React, { useState, useEffect, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { createSession, getAllSessions, endSession } from "../utils/api";
import { COURSES, ROLES } from "../utils/constants";

// Live Session screen (design #03). Big projector-friendly QR on the left
// with live check-in counter, session metadata + live feed on the right.

const Sessions = () => {
  const courses = useMemo(() => {
    const backendRole = localStorage.getItem("userBackendRole");
    let userModules = [];
    try {
      userModules = JSON.parse(localStorage.getItem("userModules") || "[]");
    } catch (e) { userModules = []; }
    if (backendRole === ROLES.SUPER_ADMIN || userModules.length === 0) return COURSES;
    return COURSES.filter((c) => userModules.includes(c.id));
  }, []);

  const defaultCourse = courses[0] || COURSES[0];

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeQR, setActiveQR] = useState(null);
  const [form, setForm] = useState({
    courseId:   defaultCourse.id,
    courseName: defaultCourse.name,
    date:       new Date().toISOString().split("T")[0],
    startTime:  "09:00",
    endTime:    "11:00",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { fetchSessions(); }, []);

  // Poll for live check-in updates while a QR is displayed
  useEffect(() => {
    if (!activeQR?.sessionId) return;
    const id = setInterval(fetchSessions, 5000);
    return () => clearInterval(id);
  }, [activeQR?.sessionId]);

  const fetchSessions = async () => {
    try {
      const res = await getAllSessions();
      setSessions(res.data.data.sessions || []);
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
    return <div className="loading-container"><div className="spinner" />Loading sessions...</div>;
  }

  const liveSession = activeQR?.sessionId
    ? sessions.find((s) => s._id === activeQR.sessionId)
    : null;
  const liveCheckIns = liveSession?.checkIns || [];

  return (
    <div className="dash">
      <div className="dash-header">
        <div>
          <span className="eyebrow">Sessions</span>
          <h1 className="dash-title">
            {activeQR ? <>Live <span className="grad-text">session</span></> : <>Lecture <span className="grad-text">sessions</span></>}
          </h1>
          <p className="dash-subtitle">
            {activeQR ? "Display the QR on the projector — students scan to commit on-chain." : "Create sessions and broadcast QR codes to students."}
          </p>
        </div>
        <div className="dash-actions">
          {activeQR && (
            <button className="btn-ghost" onClick={() => setActiveQR(null)}>Close QR</button>
          )}
          <button className="btn-grad" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? "Cancel" : "+ New session"}
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="panel">
          <div className="panel-head">
            <h2>New lecture session</h2>
          </div>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Module</label>
              <select className="form-input" value={form.courseId} onChange={handleCourseChange}>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.id} — {c.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Start</label>
                <input type="time" className="form-input" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">End</label>
                <input type="time" className="form-input" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
              </div>
            </div>
            <button type="submit" className="btn-grad" disabled={createLoading} style={{ marginTop: "8px" }}>
              {createLoading ? "Creating..." : "Create & generate QR"}
            </button>
            {error && <p style={{ color: "var(--danger)", marginTop: "12px", fontSize: "13px" }}>{error}</p>}
          </form>
        </div>
      )}

      {/* Live QR broadcast view */}
      {activeQR && (
        <div className="live-qr-split">
          <div className="panel live-qr-panel">
            <div className="live-qr-head">
              <span className="live-chip"><span className="pulse-dot" /> LIVE</span>
              <span className="live-module">{activeQR.courseId}</span>
            </div>
            <h2 className="live-title">{activeQR.courseName}</h2>
            <p className="live-sub">{activeQR.date} · {activeQR.startTime}–{activeQR.endTime}</p>

            <div className="live-qr-frame">
              <QRCodeSVG value={activeQR.qrToken} size={320} level="H" bgColor="#ffffff" fgColor="#050509" />
              <div className="live-qr-frame-corners">
                <span /><span /><span /><span />
              </div>
            </div>

            <p
              className="mono live-token"
              title="Click to copy"
              onClick={() => navigator.clipboard.writeText(activeQR.qrToken)}
            >
              {activeQR.qrToken.slice(0, 18)}…{activeQR.qrToken.slice(-8)}
            </p>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <h2>Check-in feed <span className="on-chain-tag">&middot; live</span></h2>
                <span className="panel-sub">{liveCheckIns.length} students committed</span>
              </div>
              <span className="chip-btn chip-live"><span className="pulse-dot" /> Polling 5s</span>
            </div>

            <div className="live-counter">
              <div className="live-counter-value grad-text">{liveCheckIns.length}</div>
              <div className="live-counter-label">checked in so far</div>
            </div>

            {liveCheckIns.length === 0 ? (
              <div className="empty-state" style={{ padding: "24px" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Waiting for first check-in…</p>
              </div>
            ) : (
              <div className="live-feed">
                {[...liveCheckIns].reverse().slice(0, 10).map((c, i) => (
                  <div key={i} className="live-feed-row">
                    <div className="avatar avatar-sm">{(c.studentId || "??").slice(0, 2).toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div className="student-name" style={{ fontSize: "13px" }}>{c.studentId}</div>
                      <div className="student-id">{new Date(c.checkInTime || c.timestamp).toLocaleTimeString()}</div>
                    </div>
                    <span className="badge badge-success">✓</span>
                  </div>
                ))}
              </div>
            )}

            <button className="btn-ghost" style={{ marginTop: "16px", width: "100%" }} onClick={() => handleEnd(activeQR.sessionId)}>
              End session
            </button>
          </div>
        </div>
      )}

      {/* All sessions list */}
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>All sessions</h2>
            <span className="panel-sub">{sessions.length} total</span>
          </div>
        </div>
        {sessions.length === 0 ? (
          <div className="empty-state" style={{ padding: "40px 20px" }}>
            <p style={{ color: "var(--text-muted)" }}>No sessions yet. Create one above.</p>
          </div>
        ) : (
          <table className="data-table dash-table">
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
                  <td>
                    <div>
                      <strong style={{ color: "var(--text-primary)" }}>{s.courseId}</strong>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.courseName}</div>
                    </div>
                  </td>
                  <td style={{ fontSize: "12px" }}>{s.date}</td>
                  <td className="mono" style={{ fontSize: "12px" }}>{s.startTime}–{s.endTime}</td>
                  <td className="mono">{s.checkIns?.length || 0}</td>
                  <td>
                    <span className={`badge ${s.isActive ? "badge-success" : "badge-pending"}`}>
                      {s.isActive ? "✓ Active" : "Ended"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {s.isActive && (
                        <>
                          <button
                            className="chip-btn"
                            onClick={() => setActiveQR({
                              qrToken:    s.qrToken,
                              courseId:   s.courseId,
                              courseName: s.courseName,
                              date:       s.date,
                              startTime:  s.startTime,
                              endTime:    s.endTime,
                              sessionId:  s._id,
                            })}
                          >
                            Show QR
                          </button>
                          <button className="chip-btn" style={{ color: "var(--danger)", borderColor: "rgba(255,85,119,0.3)" }} onClick={() => handleEnd(s._id)}>
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
