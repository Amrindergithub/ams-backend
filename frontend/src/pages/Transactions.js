import React, { useEffect, useState } from "react";
import { getRecords } from "../utils/api";

const Transactions = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

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

  const filtered = records.filter(
    (r) =>
      r.studentId.toLowerCase().includes(filter.toLowerCase()) ||
      r.courseId.toLowerCase().includes(filter.toLowerCase()) ||
      r.txHash?.toLowerCase().includes(filter.toLowerCase()) ||
      r.date.includes(filter)
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        Loading transactions...
      </div>
    );
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const hashCellStyle = {
    maxWidth: "220px",
    wordBreak: "break-all",
    fontSize: "11px",
    lineHeight: "1.4",
    cursor: "pointer",
  };

  return (
    <div>
      <div className="page-header">
        <h1>Transaction History</h1>
        <p>All blockchain transactions from the smart contract</p>
      </div>

      <div className="data-table-wrapper" style={{ overflowX: "auto" }}>
        <div className="data-table-header">
          <h2>Transactions ({filtered.length})</h2>
          <input
            type="text"
            className="form-input"
            placeholder="Search by student, course, hash, or date..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ maxWidth: "320px", padding: "8px 14px", fontSize: "13px" }}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{"\uD83D\uDD0D"}</div>
            <p>No transactions found.</p>
          </div>
        ) : (
          <table className="data-table" style={{ minWidth: "900px" }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Student ID</th>
                <th>Course</th>
                <th>Date</th>
                <th>Block</th>
                <th>Transaction Hash</th>
                <th>Attendance Hash</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r._id}>
                  <td className="mono">{i + 1}</td>
                  <td><strong>{r.studentId}</strong></td>
                  <td>{r.courseId}</td>
                  <td>{r.date}</td>
                  <td className="mono">{r.blockNumber || "\u2014"}</td>
                  <td
                    className="mono"
                    style={hashCellStyle}
                    title="Click to copy"
                    onClick={() => r.txHash && copyToClipboard(r.txHash)}
                  >
                    {r.txHash || "N/A"}
                  </td>
                  <td
                    className="mono"
                    style={hashCellStyle}
                    title="Click to copy"
                    onClick={() => r.attendanceHash && copyToClipboard(r.attendanceHash)}
                  >
                    {r.attendanceHash || "N/A"}
                  </td>
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

export default Transactions;