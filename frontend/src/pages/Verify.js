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
      setError("Failed to verify attendance on blockchain");
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Verify Attendance</h1>
        <p>Check if an attendance record exists on the blockchain</p>
      </div>

      <div className="form-card">
        <form onSubmit={handleVerify}>
          <div className="form-group">
            <label className="form-label">Attendance Hash</label>
            <input
              type="text"
              className="form-input mono"
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              placeholder="0x..."
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Verifying..." : "Verify on Blockchain"}
          </button>
        </form>

        {result && (
          <div className={`result-card ${result.onChain.exists ? "success" : "error"}`}>
            <h3>
              {result.onChain.exists ? "\u2713 Attendance Verified" : "\u2717 Not Found on Blockchain"}
            </h3>
            {result.onChain.exists && (
              <>
                <div className="result-row">
                  <span className="label">Wallet Address</span>
                  <span className="value">{result.onChain.student}</span>
                </div>
                <div className="result-row">
                  <span className="label">Block Timestamp</span>
                  <span className="value">
                    {new Date(result.onChain.timestamp * 1000).toLocaleString()}
                  </span>
                </div>
              </>
            )}
            {result.offChain && (
              <>
                <div className="result-row">
                  <span className="label">Student ID</span>
                  <span className="value">{result.offChain.studentId}</span>
                </div>
                <div className="result-row">
                  <span className="label">Course</span>
                  <span className="value">{result.offChain.courseId}</span>
                </div>
                <div className="result-row">
                  <span className="label">Date</span>
                  <span className="value">{result.offChain.date}</span>
                </div>
                <div className="result-row">
                  <span className="label">Transaction Hash</span>
                  <span className="value">{result.offChain.txHash}</span>
                </div>
              </>
            )}
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

export default Verify;