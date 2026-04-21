import React, { useState, useEffect } from "react";
import API from "../utils/api";

// Certificate gallery (design #07). Holographic tier cards with shine
// effect, token id + block data, click for big detail overlay (#06).

const TIER_STYLES = {
  Bronze:   { color: "#c97a3b", emoji: "🥉", grad: "linear-gradient(135deg, #7a4520 0%, #c97a3b 100%)", glow: "rgba(201,122,59,0.35)" },
  Silver:   { color: "#c9d1e0", emoji: "🥈", grad: "linear-gradient(135deg, #8a93a6 0%, #dde4ef 100%)", glow: "rgba(221,228,239,0.25)" },
  Gold:     { color: "#ffd76b", emoji: "🥇", grad: "linear-gradient(135deg, #b88a1a 0%, #ffd76b 100%)", glow: "rgba(255,215,107,0.35)" },
  Platinum: { color: "#e8f4ff", emoji: "💎", grad: "linear-gradient(135deg, #7f8faf 0%, #e8f4ff 100%)", glow: "rgba(232,244,255,0.3)" },
};

const MyCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState(null);
  const [selected, setSelected] = useState(null);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    const fetchWallet = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            fetchCerts(accounts[0]);
            return;
          }
        } catch (e) {}
      }
      setLoading(false);
    };
    fetchWallet();
  }, []);

  const fetchCerts = async (address) => {
    try {
      const res = await API.get(`/nft/student/${address}`);
      setCertificates(res.data.data.certificates || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const copy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1200);
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner" />Loading certificates...</div>;
  }

  if (!walletAddress) {
    return (
      <div className="dash">
        <div className="dash-header">
          <div>
            <span className="eyebrow">My Credentials</span>
            <h1 className="dash-title">Wallet <span className="grad-text">not connected</span></h1>
            <p className="dash-subtitle">Connect MetaMask to view your NFT certificates.</p>
          </div>
        </div>
        <div className="verify-result fail">
          <div className="verify-result-head">
            <div className="verify-verdict-icon fail">✗</div>
            <div>
              <div className="verify-verdict">MetaMask required</div>
              <div className="verify-verdict-sub">Your certificates are bound to your wallet address. Connect MetaMask using the navbar button.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dash">
      <div className="dash-header">
        <div>
          <span className="eyebrow">My Credentials</span>
          <h1 className="dash-title">
            Certificate <span className="grad-text">gallery</span>
          </h1>
          <p className="dash-subtitle">
            {certificates.length} NFT{certificates.length === 1 ? "" : "s"} in wallet {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
          </p>
        </div>
      </div>

      {certificates.length === 0 ? (
        <div className="panel" style={{ padding: "60px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px", opacity: 0.3 }}>🏆</div>
          <h3 style={{ color: "var(--text-primary)", marginBottom: "8px" }}>No certificates yet</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "24px" }}>
            Keep attending lectures to earn your first NFT.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            {Object.entries(TIER_STYLES).map(([tier, style]) => (
              <div key={tier} className="chip-btn" style={{ color: style.color, borderColor: "var(--border-soft)" }}>
                <span>{style.emoji}</span> {tier}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="cert-gallery">
          {certificates.map((cert) => {
            const style = TIER_STYLES[cert.tier] || TIER_STYLES.Bronze;
            return (
              <div key={cert.tokenId} className="cert-card" onClick={() => setSelected(cert)} style={{ "--tier-glow": style.glow }}>
                <div className="cert-card-bg" style={{ background: style.grad }} />
                <div className="cert-card-shine" />
                <div className="cert-card-inner">
                  <div className="cert-card-top">
                    <div className="cert-token">#{cert.tokenId}</div>
                    <div className="cert-chain-chip">chainId 1337</div>
                  </div>
                  <div className="cert-medal" style={{ textShadow: `0 0 40px ${style.glow}` }}>{style.emoji}</div>
                  <div className="cert-tier-name" style={{ color: style.color }}>{cert.tier}</div>
                  <div className="cert-subtitle">Attendance achievement</div>

                  <div className="cert-meta">
                    <div className="cert-meta-row">
                      <span className="cert-meta-label">Sessions</span>
                      <span className="cert-meta-value mono">{cert.sessionsAttended}</span>
                    </div>
                    <div className="cert-meta-row">
                      <span className="cert-meta-label">Issued</span>
                      <span className="cert-meta-value">{new Date(parseInt(cert.issuedAt) * 1000).toLocaleDateString()}</span>
                    </div>
                    <div className="cert-meta-row">
                      <span className="cert-meta-label">Student</span>
                      <span className="cert-meta-value mono">{cert.studentId}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail overlay — design #06 */}
      {selected && (
        <div className="cert-overlay" onClick={() => setSelected(null)}>
          <div className="cert-overlay-card" onClick={(e) => e.stopPropagation()}>
            <button className="cert-overlay-close" onClick={() => setSelected(null)}>&times;</button>
            <div className="cert-overlay-grid">
              <div className="cert-overlay-medal" style={{ background: TIER_STYLES[selected.tier]?.grad }}>
                <div className="cert-overlay-emoji">{TIER_STYLES[selected.tier]?.emoji}</div>
                <div className="cert-overlay-shine" />
              </div>
              <div>
                <span className="eyebrow">Credential detail</span>
                <h2 className="dash-title" style={{ fontSize: "28px", marginTop: "6px" }}>
                  <span style={{ color: TIER_STYLES[selected.tier]?.color }}>{selected.tier}</span> certificate
                </h2>
                <p className="dash-subtitle" style={{ marginBottom: "20px" }}>
                  Token #{selected.tokenId} <span className="dot-sep">&middot;</span> Signed by AttendanceNFT.sol
                </p>

                <div className="verify-receipt">
                  <ReceiptRow label="Token ID" value={`#${selected.tokenId}`} mono />
                  <ReceiptRow label="Tier" value={selected.tier} />
                  <ReceiptRow label="Student ID" value={selected.studentId} />
                  <ReceiptRow label="Sessions attended" value={selected.sessionsAttended} mono />
                  <ReceiptRow label="Issued" value={new Date(parseInt(selected.issuedAt) * 1000).toLocaleString()} />
                  <ReceiptRow label="Wallet" value={selected.student} mono copyable onCopy={copy} k="wallet" copied={copied} />
                </div>

                <div className="cert-overlay-actions">
                  <button className="btn-grad" onClick={() => copy(`Token #${selected.tokenId} · ${selected.tier} · ${selected.student}`, "share")}>
                    {copied === "share" ? "Copied ✓" : "Copy credential"}
                  </button>
                  <a className="btn-ghost" href={`/admin/verify?hash=${selected.student}`} onClick={(e) => e.preventDefault()}>View on explorer</a>
                </div>
              </div>
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

export default MyCertificates;
