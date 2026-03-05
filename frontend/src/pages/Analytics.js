import React, { useEffect, useState } from "react";
import { getRecords } from "../utils/api";

const Analytics = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await getRecords();
        setRecords(res.data.data.records);
      } catch (err) {
        console.error("Failed to fetch:", err);
      }
      setLoading(false);
    };
    fetchRecords();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        Loading analytics...
      </div>
    );
  }

  // Group by date
  const byDate = {};
  records.forEach((r) => {
    byDate[r.date] = (byDate[r.date] || 0) + 1;
  });
  const dateEntries = Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0]));
  const maxByDate = Math.max(...Object.values(byDate), 1);

  // Group by course
  const byCourse = {};
  records.forEach((r) => {
    byCourse[r.courseId] = (byCourse[r.courseId] || 0) + 1;
  });
  const courseEntries = Object.entries(byCourse).sort((a, b) => b[1] - a[1]);
  const maxByCourse = Math.max(...Object.values(byCourse), 1);

  // Group by student
  const byStudent = {};
  records.forEach((r) => {
    byStudent[r.studentId] = (byStudent[r.studentId] || 0) + 1;
  });
  const studentEntries = Object.entries(byStudent).sort((a, b) => b[1] - a[1]);
  const maxByStudent = Math.max(...Object.values(byStudent), 1);

  // Verification rate
  const verifiedCount = records.filter((r) => r.verified).length;
  const verificationRate = records.length > 0 ? Math.round((verifiedCount / records.length) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Attendance insights and blockchain verification statistics</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">Total Check-Ins</div>
          <div className="stat-card-value accent">{records.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Verification Rate</div>
          <div className="stat-card-value success">{verificationRate}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Active Students</div>
          <div className="stat-card-value warning">{Object.keys(byStudent).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Active Courses</div>
          <div className="stat-card-value accent">{Object.keys(byCourse).length}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
        {/* Attendance by Date */}
        <div className="data-table-wrapper" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "15px", marginBottom: "20px", fontWeight: 600 }}>Attendance by Date</h3>
          {dateEntries.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No data yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {dateEntries.map(([date, count]) => (
                <div key={date}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{date}</span>
                    <span className="mono" style={{ fontSize: "13px", color: "var(--text-primary)" }}>{count}</span>
                  </div>
                  <div style={{ height: "8px", background: "var(--bg-secondary)", borderRadius: "4px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${(count / maxByDate) * 100}%`,
                        background: "linear-gradient(90deg, var(--accent), var(--accent-light))",
                        borderRadius: "4px",
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance by Course */}
        <div className="data-table-wrapper" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "15px", marginBottom: "20px", fontWeight: 600 }}>Attendance by Course</h3>
          {courseEntries.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No data yet</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {courseEntries.map(([course, count]) => (
                <div key={course}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{course}</span>
                    <span className="mono" style={{ fontSize: "13px", color: "var(--text-primary)" }}>{count}</span>
                  </div>
                  <div style={{ height: "8px", background: "var(--bg-secondary)", borderRadius: "4px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${(count / maxByCourse) * 100}%`,
                        background: "linear-gradient(90deg, var(--success), #55efc4)",
                        borderRadius: "4px",
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Students */}
      <div className="data-table-wrapper">
        <div className="data-table-header">
          <h2>Student Attendance Leaderboard</h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Student ID</th>
              <th>Check-Ins</th>
              <th>Activity</th>
            </tr>
          </thead>
          <tbody>
            {studentEntries.map(([student, count], i) => (
              <tr key={student}>
                <td className="mono">{i + 1}</td>
                <td><strong>{student}</strong></td>
                <td className="mono">{count}</td>
                <td style={{ width: "40%" }}>
                  <div style={{ height: "8px", background: "var(--bg-secondary)", borderRadius: "4px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${(count / maxByStudent) * 100}%`,
                        background: "linear-gradient(90deg, var(--warning), #ffeaa7)",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Analytics;