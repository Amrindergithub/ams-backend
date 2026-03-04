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

  if (loading) return <div style={styles.container}><p>Loading...</p></div>;

  return (
    <div style={styles.container}>
      <h1>Attendance Dashboard</h1>
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <h3>Off-Chain Records</h3>
          <p style={styles.statNumber}>{records.length}</p>
        </div>
        <div style={styles.statCard}>
          <h3>On-Chain Records</h3>
          <p style={styles.statNumber}>{onChainCount}</p>
        </div>
      </div>

      <h2>Recent Records</h2>
      {records.length === 0 ? (
        <p>No attendance records yet.</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Student ID</th>
              <th style={styles.th}>Course</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Tx Hash</th>
              <th style={styles.th}>Verified</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r._id}>
                <td style={styles.td}>{r.studentId}</td>
                <td style={styles.td}>{r.courseId}</td>
                <td style={styles.td}>{r.date}</td>
                <td style={styles.td}>{r.txHash ? `${r.txHash.slice(0, 10)}...` : "N/A"}</td>
                <td style={styles.td}>{r.verified ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const styles = {
  container: { padding: "30px", maxWidth: "900px", margin: "0 auto" },
  statsRow: { display: "flex", gap: "20px", marginBottom: "30px" },
  statCard: {
    flex: 1,
    backgroundColor: "#16213e",
    color: "#fff",
    padding: "20px",
    borderRadius: "10px",
    textAlign: "center",
  },
  statNumber: { fontSize: "36px", margin: "10px 0" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: "10px" },
  th: {
    textAlign: "left",
    padding: "12px",
    backgroundColor: "#1a1a2e",
    color: "#fff",
    borderBottom: "2px solid #ddd",
  },
  td: { padding: "12px", borderBottom: "1px solid #eee" },
};

export default Dashboard;