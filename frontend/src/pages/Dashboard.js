import React, { useEffect, useState } from "react";
import { getRecords } from "../utils/api";

const Dashboard = () => {
  const [records, setRecords] = useState([]);
  const [onChainCount, setOnChainCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await getRecords();
        setRecords(res.data.data.records);
        setOnChainCount(res.data.data.onChainCount);
      } catch (err) {
        console.error("Failed to fetch records:", err);
      }
      setLoading(false);
    };
    fetchRecords();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        Loading records...
      </div>
    );
  }

  const uniqueStudents = [...new Set(records.map((r) => r.studentId))].length;
  const uniqueCourses = [...new Set(records.map((r) => r.courseId))].length;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of all blockchain-verified attendance records</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">Total Records</div>
          <div className="stat-card-value accent">{records.length}</div>
          <div className="stat-card-footer">Stored in MongoDB</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">On-Chain Records</div>
          <div className="stat-card-value success">{onChainCount}</div>
          <div className="stat-card-footer">Verified on Ganache</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Unique Students</div>
          <div className="stat-card-value warning">{uniqueStudents}</div>
          <div className="stat-card-footer">Distinct student IDs</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Courses Tracked</div>
          <div className="stat-card-value accent">{uniqueCourses}</div>
          <div className="stat-card-footer">Active modules</div>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-header">
          <h2>Recent Attendance Records</h2>
        </div>
        {records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">&#128203;</div>
            <p>No attendance records yet. Use Check In to add one.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Course</th>
                <th>Date</th>
                <th>Tx Hash</th>
                <th>Block</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id}>
                  <td><strong>{r.studentId}</strong></td>
                  <td>{r.courseId}</td>
                  <td>{r.date}</td>
                  <td className="mono">
                    {r.txHash ? `${r.txHash.slice(0, 14)}...` : "N/A"}
                  </td>
                  <td className="mono">{r.blockNumber || "N/A"}</td>
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

export default Dashboard;