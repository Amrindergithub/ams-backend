import React, { useState, useEffect } from "react";
import { getAllStudents } from "../utils/api";
import { PageSkeleton } from "../components/Skeleton";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [threshold, setThreshold] = useState(75);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getAllStudents();
        setStudents(res.data.data.students);
        setFlaggedCount(res.data.data.flaggedCount);
        setThreshold(res.data.data.threshold);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.studentId.toLowerCase().includes(filter.toLowerCase()) ||
      s.name.toLowerCase().includes(filter.toLowerCase()) ||
      s.course.toLowerCase().includes(filter.toLowerCase());
    const matchesFlag = showFlaggedOnly ? s.flagged : true;
    return matchesSearch && matchesFlag;
  });

  if (loading) {
    return <PageSkeleton title="Students" cards={2} rows={6} />;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Students</h1>
        <p>Registered students and attendance monitoring</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">Total Students</div>
          <div className="stat-card-value accent">{students.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Flagged Students</div>
          <div className="stat-card-value" style={{ color: flaggedCount > 0 ? "var(--danger)" : "var(--success)" }}>{flaggedCount}</div>
          <div className="stat-card-footer">Below {threshold}% attendance</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Average Rate</div>
          <div className="stat-card-value success">
            {students.length > 0 ? Math.round(students.reduce((a, s) => a + s.attendanceRate, 0) / students.length) : 0}%
          </div>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-header">
          <h2>Student List ({filtered.length})</h2>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              onClick={() => setShowFlaggedOnly(!showFlaggedOnly)}
              style={{
                background: showFlaggedOnly ? "var(--danger-bg)" : "var(--bg-secondary)",
                color: showFlaggedOnly ? "var(--danger)" : "var(--text-secondary)",
                border: `1px solid ${showFlaggedOnly ? "rgba(225,112,85,0.3)" : "var(--border-color)"}`,
                padding: "6px 14px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
                fontFamily: "var(--font-sans)",
              }}
            >
              {showFlaggedOnly ? "\u26A0 Flagged Only" : "Show Flagged"}
            </button>
            <input
              type="text"
              className="form-input"
              placeholder="Search students..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ maxWidth: "240px", padding: "8px 14px", fontSize: "13px" }}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{"\uD83C\uDF93"}</div>
            <p>No students found</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Course</th>
                <th>Check-Ins</th>
                <th>Attendance Rate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s._id}>
                  <td><strong>{s.studentId}</strong></td>
                  <td>{s.name}</td>
                  <td style={{ fontSize: "13px", color: "var(--text-muted)" }}>{s.email}</td>
                  <td className="mono">{s.course}</td>
                  <td className="mono">{s.totalCheckIns}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "80px", height: "6px", background: "var(--bg-secondary)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${s.attendanceRate}%`,
                          background: s.attendanceRate >= threshold ? "var(--success)" : "var(--danger)",
                          borderRadius: "3px",
                        }} />
                      </div>
                      <span className="mono" style={{ fontSize: "13px", color: s.attendanceRate >= threshold ? "var(--success)" : "var(--danger)" }}>
                        {s.attendanceRate}%
                      </span>
                    </div>
                  </td>
                  <td>
                    {s.flagged ? (
                      <span className="badge" style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid rgba(225,112,85,0.3)" }}>
                        {"\u26A0"} Low Attendance
                      </span>
                    ) : (
                      <span className="badge badge-success">{"\u2713"} Good</span>
                    )}
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

export default Students;