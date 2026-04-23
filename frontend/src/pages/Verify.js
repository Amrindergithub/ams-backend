import React, { useState } from "react";
import { verifyAttendance } from "../utils/api";

// Public verifier (design #10). Hero input, big success/fail verdict,
// metadata card laid out like a crypto wallet receipt.

const Verify = () => {
  const [hash, setHash] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);

  // Accept either a 64-char hex attendance hash (AMS ledger key) or a
  // 0x-prefixed 66-char Ethereum tx hash. Token-id lookups are numeric.
  const isValidHash = (raw) => {
    const v = raw.trim();
    if (!v) return false;
    if (/^[0-9]+$/.test(v)) return true; // numeric token id
    if (/^[a-fA-F0-9]{64}$/.test(v)) return true; // raw 32-byte hash
    if (/^0x[a-fA-F0-9]{64}$/.test(v)) return true; // 0x-prefixed
    return false;
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const trimmed = hash.trim();
    if (!trimmed) return;
    if (!isValidHash(trimmed)) {
      setResult(null);
      setError(
        "That doesn't look like a valid attendance hash. Expected a 64-character hex string, a 0x-prefixed tx hash, or a numeric token id."
      );
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await verifyAttendance(trimmed);
      setResult(res.data.data);
    } catch (err) {
      setError("Failed to verify attendance on blockchain. Hash not found or backend unreachable.");
    }
    setLoading(false);
  };

  const copy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1200);
  };

  const onChain = result?.onChain?.exists;
  const offChainOnly = !onChain && !!result?.offChain;

  return (
    <div className="dash">
      <div className="dash-header">
        <div>
          <span className="eyebrow">Public Verifier</span>
          <h1 className="dash-title">
            Verify a <span className="grad-text">credential</span>
          </h1>
          <p className="dash-subtitle">
            Paste any attendance hash to confirm it was committed to the AMS ledger.
          </p>
        </div>
      </div>

      {/* Hero input */}
      <div className="verify-hero">
        <div className="verify-hero-glow" />
        <form onSubmit={handleVerify} className="verify-form">
          <div className="verify-input-wrap">
            <span className="verify-input-icon" aria-hidden="true">&#9906;</span>
            <label htmlFor="verify-hash" className="visually-hidden">
              Attendance hash or tx id
            </label>
            <input
              id="verify-hash"
              className="verify-input mono"
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              placeholder="0x… attendance hash, tx hash, or token id"
              autoFocus
            />
            {hash && (
              <button
                type="button"
                className="verify-clear"
                onClick={() => setHash("")}
                aria-label="Clear input"
              >
                &times;
              </button>
            )}
          </div>
          <button type="submit" className="btn-grad" disabled={loading}>
            {loading ? "Verifying…" : "Verify on-chain →"}
          </button>
        </form>
        <div className="verify-hero-chips">
          <span className="chip-btn">chainId 1337</span>
          <span className="chip-btn">AttendanceNFT.sol</span>
          <span className="chip-btn"><span className="pulse-dot" /> Live</span>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`verify-result ${onChain ? "ok" : offChainOnly ? "warn" : "fail"}`}>
          <div className="verify-result-head">
            <div className={`verify-verdict-icon ${onChain ? "ok" : offChainOnly ? "warn" : "fail"}`}>
              {onChain ? "✓" : offChainOnly ? "!" : "✗"}
            </div>
            <div>
              <div className="verify-verdict">
                {onChain
                  ? "Credential verified"
                  : offChainOnly
                    ? "Off-chain match only"
                    : "Not found on-chain"}
              </div>
              <div className="verify-verdict-sub">
                {onChain
                  ? "This record was committed to the AMS ledger and has not been tampered with."
                  : offChainOnly
                    ? "Found in the Mongo mirror, but no matching hash on-chain. Usually this means the chain was reset (e.g. `truffle migrate --reset`) after this record was committed."
                    : "No matching record in the attendance contract. Double-check the hash."}
              </div>
            </div>
            {onChain && <div className="verify-seal grad-text">SIGNED</div>}
          </div>

          {(onChain || offChainOnly) && (
            <div className="verify-receipt">
              {onChain && (
                <>
                  <ReceiptRow label="Wallet" value={result.onChain.student} mono copyable onCopy={copy} k="wallet" copied={copied} />
                  <ReceiptRow
                    label="Committed at"
                    value={new Date(result.onChain.timestamp * 1000).toLocaleString()}
                  />
                </>
              )}
              {result.offChain && (
                <>
                  <ReceiptRow label="Student ID" value={result.offChain.studentId} />
                  <ReceiptRow label="Module"     value={result.offChain.courseId} />
                  <ReceiptRow label="Date"       value={result.offChain.date} />
                  {result.offChain.txHash && (
                    <ReceiptRow label="Tx hash" value={result.offChain.txHash} mono copyable onCopy={copy} k="tx" copied={copied} />
                  )}
                  {result.offChain.blockNumber && (
                    <ReceiptRow label="Block" value={`#${result.offChain.blockNumber}`} mono />
                  )}
                </>
              )}
            </div>
          )}
        </div>
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

export default Verify;
