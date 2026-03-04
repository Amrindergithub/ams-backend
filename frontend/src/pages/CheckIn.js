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
    <div style={styles.container}>
      <h1>Check In</h1>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label>Student ID</label>
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="e.g. 2414204"
            style={styles.input}
            required
          />
        </div>
        <div style={styles.field}>
          <label>Course ID</label>
          <input
            type="text"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            placeholder="e.g. CN6035"
            style={styles.input}
            required
          />
        </div>
        <div style={styles.field}>
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={styles.input}
            required
          />
        </div>
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Recording on Blockchain..." : "Record Attendance"}
        </button>
      </form>

      {result && (
        <div style={styles.success}>
          <h3>Attendance Recorded Successfully</h3>
          <p><strong>Hash:</strong> {result.attendanceHash}</p>
          <p><strong>Tx Hash:</strong> {result.txHash}</p>
          <p><strong>Block:</strong> {result.blockNumber}</p>
        </div>
      )}

      {error && <div style={styles.error}><p>{error}</p></div>}
    </div>
  );
};

const styles = {
  container: { padding: "30px", maxWidth: "600px", margin: "0 auto" },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  field: { display: "flex", flexDirection: "column", gap: "5px" },
  input: {
    padding: "10px",
    fontSize: "16px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "12px",
    fontSize: "16px",
    backgroundColor: "#1a1a2e",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginTop: "10px",
  },
  success: {
    marginTop: "20px",
    padding: "15px",
    backgroundColor: "#d4edda",
    borderRadius: "8px",
    wordBreak: "break-all",
  },
  error: {
    marginTop: "20px",
    padding: "15px",
    backgroundColor: "#f8d7da",
    borderRadius: "8px",
  },
};

export default CheckIn;