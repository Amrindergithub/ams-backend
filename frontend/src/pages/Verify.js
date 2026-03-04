import React, { useState } from "react";
import { verifyAttendance } from "../utils/api";

const Verify = () => {
  const [hash, setHash] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await verifyAttendance(hash);
      setResult(res.data.data);
    } catch (err) {
      setError("Failed to verify attendance");
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h1>Verify Attendance</h1>
      <form onSubmit={handleVerify} style={styles.form}>
        <div style={styles.field}>
          <label>Attendance Hash</label>
          <input
            type="text"
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            placeholder="0x..."
            style={styles.input}
            required
          />
        </div>
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Verifying..." : "Verify on Blockchain"}
        </button>
      </form>

      {result && (
        <div style={result.onChain.exists ? styles.verified : styles.notFound}>
          <h3>{result.onChain.exists ? "Attendance Verified" : "Not Found on Blockchain"}</h3>
          {result.onChain.exists && (
            <>
              <p><strong>Wallet:</strong> {result.onChain.student}</p>
              <p><strong>Timestamp:</strong> {new Date(result.onChain.timestamp * 1000).toLocaleString()}</p>
            </>
          )}
          {result.offChain && (
            <>
              <p><strong>Student ID:</strong> {result.offChain.studentId}</p>
              <p><strong>Course:</strong> {result.offChain.courseId}</p>
              <p><strong>Date:</strong> {result.offChain.date}</p>
              <p><strong>Tx Hash:</strong> {result.offChain.txHash}</p>
            </>
          )}
        </div>
      )}

      {error && <div style={styles.notFound}><p>{error}</p></div>}
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
  verified: {
    marginTop: "20px",
    padding: "15px",
    backgroundColor: "#d4edda",
    borderRadius: "8px",
    wordBreak: "break-all",
  },
  notFound: {
    marginTop: "20px",
    padding: "15px",
    backgroundColor: "#f8d7da",
    borderRadius: "8px",
  },
};

export default Verify;