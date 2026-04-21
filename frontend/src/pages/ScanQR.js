import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Link } from "react-router-dom";
import { getSessionByQR, sessionCheckIn, sessionCheckOut } from "../utils/api";

// Student scan flow (design #04). Three stages: scan → confirm → success.
// Crypto-native dark shell, big targeting reticle, receipt-style success.

const ScanQR = ({ walletAddress }) => {
  const [scannedToken, setScannedToken] = useState("");
  const [sessionInfo, setSessionInfo] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("idle"); // idle | scanned | checkedin
  const [copied, setCopied] = useState(null);
  const scannerRef = useRef(null);
  const studentId = localStorage.getItem("studentId");

  useEffect(() => {
    if (mode !== "idle") return;
    const scanner = new Html5QrcodeScanner("qr-reader", {
      fps: 10,
      qrbox: { width: 260, height: 260 },
      rememberLastUsedCamera: true,
    });
    scanner.render(
      (decodedText) => {
        setScannedToken(decodedText);
        try { scanner.clear(); } catch (e) {}
        handleTokenScanned(decodedText);
      },
      () => {}
    );
    scannerRef.current = scanner;
    return () => { try { scanner.clear(); } catch (e) {} };
  }, [mode]);

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
    } catch (err) {
      setError(err.response?.data?.message || "Check-out failed");
    }
    setLoading(false);
  };

  const handleManualToken = (e) => {
    e.preventDefault();
    if (scannedToken) handleTokenScanned(scannedToken);
  };

  const reset = () => {
    setMode("idle");
    setScannedToken("");
    setSessionInfo(null);
    setResult(null);
    setError(null);
  };

  const copy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <div className="dash">
      <div className="dash-header">
        <div>
          <span className="eyebrow">Scan QR</span>
          <h1 className="dash-title">
            {mode === "idle"      && <>Point your camera at the <span className="grad-text">projector</span></>}
            {mode === "scanned"   && <>Confirm your <span className="grad-text">check-in</span></>}
            {mode === "checkedin" && <>Signed on <span className="grad-text">chain</span></>}
          </h1>
          <p className="dash-subtitle">
            {mode === "idle"      && "Your lecturer's QR code contains a one-time session token."}
            {mode === "scanned"   && "Session detected. Review details and commit."}
            {mode === "checkedin" && "Attendance recorded and immutably stored on Ganache."}
          </p>
        </div>
        {mode !== "idle" && (
          <div className="dash-actions">
            <button className="btn-ghost" onClick={reset}>← Scan again</button>
          </div>
        )}
      </div>

      {/* Stage: idle — camera */}
      {mode === "idle" && (
        <div className="scan-split">
          <div className="panel scan-panel">
            <div className="scan-reticle">
              <div id="qr-reader" className="scan-reader" />
              <div className="scan-corners">
                <span /><span /><span /><span />
              </div>
              <div className="scan-laser" />
            </div>
            <p className="scan-hint">
              <span className="pulse-dot" /> Camera active — hold steady on QR code
            </p>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <h2>Manual token</h2>
                <span className="panel-sub">Can't scan? Paste the token below.</span>
              </div>
            </div>
            <form onSubmit={handleManualToken} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                type="text"
                className="form-input mono"
                value={scannedToken}
                onChange={(e) => setScannedToken(e.target.value)}
                placeholder="Paste QR token here…"
              />
              <button type="submit" className="btn-grad" disabled={loading}>
                {loading ? "Verifying…" : "Verify token →"}
              </button>
            </form>

            <div className="nudge-card" style={{ marginTop: "20px" }}>
              <div className="nudge-icon">i</div>
              <div>
                <strong>Your session</strong>
                <p>Student ID: <span className="mono" style={{ color: "var(--text-primary)" }}>{studentId}</span></p>
                <p>Wallet: <span className="mono" style={{ color: "var(--text-primary)" }}>
                  {walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : "not connected"}
                </span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage: scanned — confirm */}
      {mode === "scanned" && sessionInfo && (
        <div className="panel confirm-panel">
          <div className="confirm-hero">
            <div className="confirm-icon">📚</div>
            <div>
              <h2 style={{ fontSize: "24px", color: "var(--text-primary)" }}>{sessionInfo.courseName}</h2>
              <span className="module-pill" style={{ marginTop: "6px" }}>{sessionInfo.courseId}</span>
            </div>
          </div>

          <div className="verify-receipt">
            <ReceiptRow label="Date"         value={sessionInfo.date} />
            <ReceiptRow label="Time"         value={`${sessionInfo.startTime} – ${sessionInfo.endTime}`} />
            <ReceiptRow label="Checked in"   value={`${sessionInfo.totalCheckIns} students`} />
            <ReceiptRow label="Your ID"      value={studentId} />
            <ReceiptRow label="Your wallet"  value={walletAddress || "—"} mono />
          </div>

          <button onClick={handleCheckIn} className="btn-grad" disabled={loading} style={{ width: "100%", marginTop: "24px", padding: "14px" }}>
            {loading ? "Committing on-chain…" : "Sign & check in →"}
          </button>
        </div>
      )}

      {/* Stage: checkedin — success */}
      {mode === "checkedin" && result && (
        <>
          <div className="verify-result ok">
            <div className="verify-result-head">
              <div className="verify-verdict-icon ok">✓</div>
              <div>
                <div className="verify-verdict">You're checked in</div>
                <div className="verify-verdict-sub">Attendance signed by your wallet and committed to Ganache.</div>
              </div>
              <div className="verify-seal grad-text">ON-CHAIN</div>
            </div>

            <div className="verify-receipt">
              <ReceiptRow label="Module"       value={result.courseName} />
              <ReceiptRow label="Check-in at"  value={new Date(result.checkInTime).toLocaleTimeString()} />
              {result.txHash && (
                <ReceiptRow label="Tx hash" value={result.txHash} mono copyable onCopy={copy} k="tx" copied={copied} />
              )}
              {result.blockNumber && (
                <ReceiptRow label="Block" value={`#${result.blockNumber}`} mono />
              )}
            </div>
          </div>

          <div className="panel" style={{ marginTop: 0 }}>
            <div className="panel-head">
              <div>
                <h2>Stay for full credit</h2>
                <span className="panel-sub">Check out at end of lecture to record duration</span>
              </div>
            </div>
            <button onClick={handleCheckOut} className="btn-ghost" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Checking out…" : "Check out (end of lecture)"}
            </button>

            {result.durationMinutes && (
              <div className="verify-result ok" style={{ marginTop: "16px" }}>
                <div className="verify-result-head">
                  <div className="verify-verdict-icon ok">✓</div>
                  <div>
                    <div className="verify-verdict" style={{ fontSize: "16px" }}>Checked out</div>
                    <div className="verify-verdict-sub">Attended {result.durationMinutes} minutes.</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="dash-actions" style={{ justifyContent: "center", marginTop: "8px" }}>
            <Link to="/student" className="btn-ghost">Back to portal</Link>
          </div>
        </>
      )}

      {error && (
        <div className="verify-result fail">
          <div className="verify-result-head">
            <div className="verify-verdict-icon fail">✗</div>
            <div>
              <div className="verify-verdict">Error</div>
              <div className="verify-verdict-sub">{error}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReceiptRow = ({ label, value, mono, copyable, onCopy, k, copied }) => (
  <div className="receipt-row">
    <span className="receipt-label">{label}</span>
    <span
      className={`receipt-value ${mono ? "mono" : ""} ${copyable ? "copyable" : ""}`}
      onClick={copyable ? () => onCopy(value, k) : undefined}
      title={copyable ? "Click to copy" : undefined}
    >
      {value}
      {copyable && <span className="receipt-copy">{copied === k ? "✓" : "⎘"}</span>}
    </span>
  </div>
);

export default ScanQR;
