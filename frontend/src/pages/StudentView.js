import React, { useState, useEffect } from "react";
import { getStudentProfile } from "../utils/api";
import API from "../utils/api";

const StudentView = () => {
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({ totalSessions: 0, attendedSessions: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletSaved, setWalletSaved] = useState(false);
  const studentId = localStorage.getItem("studentId");

  useEffect(() => {
    const fetch = async () => {
      if (!studentId) {
        setError("Student ID not found. Please log in again.");
        setLoading(false);
        return;
      }
      try {
        const res = await getStudentProfile(studentId);
        setStudent(res.data.data.student);
        setAttendance(res.data.data.recentAttendance);
        setStats({
          totalSessions: res.data.data.totalSessions,
          attendedSessions: res.data.data.attendedSessions,
        });

        // Auto-save wallet address if connected and not saved yet
        const savedStudent = res.data.data.student;
        if (window.ethereum) {
          try {
            const accounts = await window.ethereum.request({ method: "eth_accounts" });
            if (accounts.length > 0 && accounts[0] !== savedStudent.walletAddress) {
              await API.patch(`/students/wallet/${studentId}`, {
                walletAddress: accounts[0],
              });
              savedStudent.walletAddress = accounts[0];
              setStudent({ ...savedStudent });
              setWalletSaved(true);
            }
          } catch (e) {
            console.log("Wallet sync skipped:", e.message);
          }
        }
      } catch (err) {
        setError("Failed to load profile. Make sure you are registered.");
      }
      setLoading(false);
    };
    fetch();
  }, [studentId]);

  if (loading) return <div className="loading-container"><div className="spinner"></div>Loading your profile...</div>;

  if (error) {
    return (
      <div>
        <div className="page-header"><h1>My Attendance</h1></div>
        <div className="result-card error"><h3>{"\u2717"} {error}</h3></div>
      </div>
    );
  }

  const threshold = 75;

  return (
    <div>
      <div className="page-header">
        <h1>Welcome, {student.name}</h1>
        <p>Student ID: {student.studentId} &middot; Course: {student.course}</p>
      </div>

      {walletSaved && (
        <div className="result-card success" style={{ marginBottom: "24px" }}>
          <p style={{ color: "var(--success)", fontSize: "14px", margin: 0 }}>{"\u2713"} Wallet address synced: {student.walletAddress?.slice(0, 10)}...</p>
        </div>
      )}

      {student.flagged && (
        <div className="result-card error" style={{ marginBottom: "24px" }}>
          <h3>{"\u26A0"} Low Attendance Warning</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>
            {student.flagReason}. Please ensure you attend upcoming lectures to avoid academic penalties.
          </p>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">Attendance Rate</div>
          <div className="stat-card-value" style={{ color: student.attendanceRate >= threshold ? "var(--success)" : "var(--danger)" }}>
            {student.attendanceRate}%
          </div>
          <div className="stat-card-footer">{student.attendanceRate >= threshold ? "You're on track" : "Below 75% threshold"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Sessions Attended</div>
          <div className="stat-card-value accent">{stats.attendedSessions}</div>
          <div className="stat-card-footer">Out of {stats.totalSessions} total</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Total Check-Ins</div>
          <div className="stat-card-value success">{student.totalCheckIns}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Total Check-Outs</div>
          <div className="stat-card-value warning">{student.totalCheckOuts}</div>
        </div>
      </div>

      <div className="data-table-wrapper" style={{ padding: "24px", marginBottom: "24px" }}>
        <h3 style={{ fontSize: "15px", marginBottom: "16px" }}>Attendance Progress</h3>
        <div style={{ height: "12px", background: "var(--bg-secondary)", borderRadius: "6px", overflow: "hidden", marginBottom: "8px" }}>
          <div style={{
            height: "100%",
            width: `${student.attendanceRate}%`,
            background: student.attendanceRate >= threshold
              ? "linear-gradient(90deg, var(--success), #55efc4)"
              : "linear-gradient(90deg, var(--danger), #fab1a0)",
            borderRadius: "6px",
            transition: "width 0.5s ease",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)" }}>
          <span>0%</span>
          <span style={{ color: "var(--danger)" }}>75% threshold</span>
          <span>100%</span>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-header">
          <h2>Recent Attendance Records</h2>
        </div>
        {attendance.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{"\uD83D\uDCCB"}</div>
            <p>No attendance records yet. Scan a QR code to check in.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Date</th>
                <th>Tx Hash</th>
                <th>Block</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((r) => (
                <tr key={r._id}>
                  <td><strong>{r.courseId}</strong></td>
                  <td>{r.date}</td>
                  <td className="mono">{r.txHash ? `${r.txHash.slice(0, 18)}...` : "—"}</td>
                  <td className="mono">{r.blockNumber || "—"}</td>
                  <td>
                    <span className={`badge ${r.verified ? "badge-success" : "badge-pending"}`}>
                      {r.verified ? "\u2713 Verified" : "Pending"}
                    </span>
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

export default StudentView;