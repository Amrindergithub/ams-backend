import React, { useState } from "react";
import { checkIn } from "../utils/api";

const CheckIn = ({ walletAddress }) => {
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await checkIn(studentId, courseId, date, walletAddress);
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record attendance");
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Check In</h1>
        <p>Record student attendance on the blockchain</p>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Student ID</label>
            <input
              type="text"
              className="form-input"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. 2414204"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Course ID</label>
            <input
              type="text"
              className="form-input"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              placeholder="e.g. CN6035"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Recording on Blockchain..." : "Record Attendance"}
          </button>
        </form>

        {result && (
          <div className="result-card success">
            <h3>&#10003; Attendance Recorded Successfully</h3>
            <div className="result-row">
              <span className="label">Attendance Hash</span>
              <span className="value">{result.attendanceHash}</span>
            </div>
            <div className="result-row">
              <span className="label">Transaction Hash</span>
              <span className="value">{result.txHash}</span>
            </div>
            <div className="result-row">
              <span className="label">Block Number</span>
              <span className="value">{result.blockNumber}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="result-card error">
            <h3>&#10007; Error</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckIn;