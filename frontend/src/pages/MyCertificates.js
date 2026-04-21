import React, { useState, useEffect } from "react";
import API from "../utils/api";

const TIER_STYLES = {
  Bronze: { color: "#cd7f32", emoji: "\uD83E\uDD49", bg: "rgba(205, 127, 50, 0.1)", border: "rgba(205, 127, 50, 0.3)" },
  Silver: { color: "#c0c0c0", emoji: "\uD83E\uDD48", bg: "rgba(192, 192, 192, 0.1)", border: "rgba(192, 192, 192, 0.3)" },
  Gold: { color: "#ffd700", emoji: "\uD83E\uDD47", bg: "rgba(255, 215, 0, 0.1)", border: "rgba(255, 215, 0, 0.3)" },
  Platinum: { color: "#e5e4e2", emoji: "\uD83D\uDC8E", bg: "rgba(229, 228, 226, 0.1)", border: "rgba(229, 228, 226, 0.3)" },
};

const MyCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState(null);

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
      setCertificates(res.data.data.certificates);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div>Loading certificates...</div>;
  }

  if (!walletAddress) {
    return (
      <div>
        <div className="page-header">
          <h1>My Certificates</h1>
          <p>Connect your MetaMask wallet to view your NFT certificates</p>
        </div>
        <div className="result-card error">
          <h3>Wallet not connected</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Please connect MetaMask to view your certificates.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>My Certificates</h1>
        <p>Your blockchain-verified attendance achievement NFTs</p>
      </div>

      {certificates.length === 0 ? (
        <div className="data-table-wrapper" style={{ padding: "60px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px", opacity: 0.3 }}>{"\uD83C\uDFC6"}</div>
          <h3 style={{ marginBottom: "8px", color: "var(--text-secondary)" }}>No Certificates Yet</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Keep attending lectures to earn your first NFT certificate!</p>
          <div style={{ marginTop: "24px", display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            {Object.entries(TIER_STYLES).map(([tier, style]) => (
              <div key={tier} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: style.color }}>
                <span>{style.emoji}</span> {tier}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {certificates.map((cert) => {
            const style = TIER_STYLES[cert.tier] || TIER_STYLES.Bronze;
            return (
              <div
                key={cert.tokenId}
                style={{
                  background: style.bg,
                  border: `1px solid ${style.border}`,
                  borderRadius: "16px",
                  padding: "32px 24px",
                  textAlign: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{
                  position: "absolute",
                  top: "-20px",
                  right: "-20px",
                  fontSize: "120px",
                  opacity: 0.08,
                }}>
                  {style.emoji}
                </div>

                <div style={{ fontSize: "56px", marginBottom: "16px" }}>{style.emoji}</div>
                <h2 style={{ color: style.color, fontSize: "24px", marginBottom: "4px" }}>{cert.tier} Certificate</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "24px" }}>Attendance Achievement NFT</p>

                <div style={{ textAlign: "left", fontSize: "13px" }}>
                  <div className="result-row">
                    <span className="label">Token ID</span>
                    <span className="value" style={{ fontFamily: "var(--font-mono)" }}>#{cert.tokenId}</span>
                  </div>
                  <div className="result-row">
                    <span className="label">Student ID</span>
                    <span className="value">{cert.studentId}</span>
                  </div>
                  <div className="result-row">
                    <span className="label">Sessions</span>
                    <span className="value">{cert.sessionsAttended}</span>
                  </div>
                  <div className="result-row" style={{ borderBottom: "none" }}>
                    <span className="label">Issued</span>
                    <span className="value">{new Date(parseInt(cert.issuedAt) * 1000).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyCertificates;