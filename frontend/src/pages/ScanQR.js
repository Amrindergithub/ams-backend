import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { getSessionByQR, sessionCheckIn, sessionCheckOut } from "../utils/api";

const ScanQR = ({ walletAddress }) => {
  const [scannedToken, setScannedToken] = useState("");
  const [sessionInfo, setSessionInfo] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("idle"); // idle, scanned, checkedin
  const scannerRef = useRef(null);
  const studentId = localStorage.getItem("studentId");

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("qr-reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
    });

    scanner.render(
      (decodedText) => {
        setScannedToken(decodedText);
        scanner.clear();
        handleTokenScanned(decodedText);
      },
      (err) => {}
    );

    scannerRef.current = scanner;

    return () => {
      try { scanner.clear(); } catch (e) {}
    };
  }, []);

  const handleTokenScanned = async (token) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSessionByQR(token);
      setSessionInfo(res.data.data);
      setMode("scanned");
    } catch (err) {
      setError("Invalid or expired QR code");
    }
    setLoading(false);
  };

  const handleCheckIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sessionCheckIn(scannedToken, studentId, walletAddress);
      setResult(res.data.data);
      setMode("checkedin");
    } catch (err) {
      setError(err.response?.data?.message || "Check-in failed");
    }
    setLoading(false);
  };

  const handleCheckOut = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sessionCheckOut(scannedToken, studentId);
      setResult({ ...result, ...res.data.data });
      setMode("idle");
      setSessionInfo(null);
      setScannedToken("");
    } catch (err) {
      setError(err.response?.data?.message || "Check-out failed");
    }
    setLoading(false);
  };

  const handleManualToken = async (e) => {
    e.preventDefault();
    if (scannedToken) handleTokenScanned(scannedToken);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Scan QR Code</h1>
        <p>Scan the QR code displayed by your lecturer to check in</p>
      </div>

      {mode === "idle" && (
        <>
          <div className="form-card" style={{ maxWidth: "500px", marginBottom: "24px" }}>
            <div id="qr-reader" style={{ width: "100%", borderRadius: "8px", overflow: "hidden" }}></div>
          </div>

          <div className="form-card" style={{ maxWidth: "500px" }}>
            <h3 style={{ fontSize: "14px", marginBottom: "12px", color: "var(--text-secondary)" }}>Or enter token manually</h3>
            <form onSubmit={handleManualToken} style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                className="form-input mono"
                value={scannedToken}
                onChange={(e) => setScannedToken(e.target.value)}
                placeholder="Paste QR token here..."
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" style={{ width: "auto", padding: "10px 20px" }} disabled={loading}>
                Go
              </button>
            </form>
          </div>
        </>
      )}

      {mode === "scanned" && sessionInfo && (
        <div className="form-card" style={{ maxWidth: "500px" }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>{"\uD83D\uDCDA"}</div>
            <h2 style={{ fontSize: "20px", marginBottom: "8px" }}>{sessionInfo.courseName}</h2>
            <p className="mono" style={{ color: "var(--text-secondary)" }}>{sessionInfo.courseId}</p>
          </div>

          <div style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-sm)", padding: "16px", marginBottom: "20px" }}>
            <div className="result-row">
              <span className="label">Date</span>
              <span className="value">{sessionInfo.date}</span>
            </div>
            <div className="result-row">
              <span className="label">Time</span>
              <span className="value">{sessionInfo.startTime} - {sessionInfo.endTime}</span>
            </div>
            <div className="result-row">
              <span className="label">Already Checked In</span>
              <span className="value">{sessionInfo.totalCheckIns} students</span>
            </div>
            <div className="result-row" style={{ borderBottom: "none" }}>
              <span className="label">Your Student ID</span>
              <span className="value">{studentId}</span>
            </div>
          </div>

          <button onClick={handleCheckIn} className="btn btn-primary" disabled={loading}>
            {loading ? "Checking in..." : "Confirm Check-In"}
          </button>
        </div>
      )}

      {mode === "checkedin" && result && (
        <div className="form-card" style={{ maxWidth: "500px" }}>
          <div className="result-card success">
            <h3>{"\u2713"} You're Checked In!</h3>
            <div className="result-row">
              <span className="label">Course</span>
              <span className="value">{result.courseName}</span>
            </div>
            <div className="result-row">
              <span className="label">Check-In Time</span>
              <span className="value">{new Date(result.checkInTime).toLocaleTimeString()}</span>
            </div>
            {result.txHash && (
              <div className="result-row">
                <span className="label">Tx Hash</span>
                <span
                  className="value mono"
                  title="Click to copy"
                  onClick={() => navigator.clipboard.writeText(result.txHash)}
                  style={{ wordBreak: "break-all", fontSize: "12px", cursor: "pointer" }}
                >
                  {result.txHash}
                </span>
              </div>
            )}
            {result.blockNumber && (
              <div className="result-row">
                <span className="label">Block</span>
                <span className="value">{result.blockNumber}</span>
              </div>
            )}
          </div>

          <button onClick={handleCheckOut} className="btn btn-primary" style={{ marginTop: "20px", background: "linear-gradient(135deg, var(--success), #55efc4)" }} disabled={loading}>
            {loading ? "Checking out..." : "Check Out (End of Lecture)"}
          </button>

          {result.durationMinutes && (
            <div className="result-card success" style={{ marginTop: "16px" }}>
              <h3>{"\u2713"} Checked Out</h3>
              <p style={{ color: "var(--text-secondary)" }}>Duration: {result.durationMinutes} minutes</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="result-card error" style={{ maxWidth: "500px", marginTop: "16px" }}>
          <h3>{"\u2717"} Error</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>{error}</p>
        </div>
      )}
    </div>
  );
};

export default ScanQR;