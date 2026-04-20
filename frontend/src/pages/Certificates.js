import React, { useState, useEffect } from "react";
import { getAllStudents } from "../utils/api";
import API from "../utils/api";

const TIERS = [
  { name: "Bronze", threshold: 5, color: "#cd7f32", emoji: "\uD83E\uDD49" },
  { name: "Silver", threshold: 15, color: "#c0c0c0", emoji: "\uD83E\uDD48" },
  { name: "Gold", threshold: 30, color: "#ffd700", emoji: "\uD83E\uDD47" },
  { name: "Platinum", threshold: 50, color: "#e5e4e2", emoji: "\uD83D\uDC8E" },
];

const Certificates = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [totalMinted, setTotalMinted] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, tiersRes] = await Promise.all([
        getAllStudents(),
        API.get("/nft/tiers"),
      ]);
      setStudents(studentsRes.data.data.students);
      setTotalMinted(tiersRes.data.data.totalMinted);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const getEligibleTier = (checkIns) => {
    let eligible = null;
    for (const tier of TIERS) {
      if (checkIns >= tier.threshold) eligible = tier;
    }
    return eligible;
  };

  const getNextTier = (checkIns) => {
    for (const tier of TIERS) {
      if (checkIns < tier.threshold) return tier;
    }
    return null;
  };

  const handleMint = async (student) => {
    setMinting(student.studentId);
    setError(null);
    setResult(null);

    try {
      const res = await API.post("/nft/mint", {
        studentId: student.studentId,
      });
      setResult({ studentId: student.studentId, ...res.data.data });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Minting failed");
    }
    setMinting(null);
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div>Loading certificates...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>NFT Attendance Certificates</h1>
        <p>Mint blockchain certificates for students who reach attendance milestones</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: "32px" }}>
        {TIERS.map((tier) => (
          <div className="stat-card" key={tier.name} style={{ borderLeft: `3px solid ${tier.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="stat-card-label">{tier.name}</div>
                <div className="stat-card-value" style={{ color: tier.color, fontSize: "28px" }}>
                  {tier.threshold}+
                </div>
                <div className="stat-card-footer">sessions required</div>
              </div>
              <span style={{ fontSize: "40px" }}>{tier.emoji}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="data-table-wrapper" style={{ padding: "24px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "15px" }}>Total NFTs Minted</h3>
          <span className="mono" style={{ fontSize: "24px", color: "var(--accent-light)", fontWeight: 700 }}>{totalMinted}</span>
        </div>
      </div>

      {result && (
        <div className="result-card success" style={{ marginBottom: "24px" }}>
          <h3>{"\u2713"} {result.tier} Certificate Minted!</h3>
          <div className="result-row">
            <span className="label">Student</span>
            <span className="value">{result.studentId}</span>
          </div>
          <div className="result-row">
            <span className="label">Wallet</span>
            <span
              className="value mono"
              title="Click to copy"
              onClick={() => result.walletAddress && navigator.clipboard.writeText(result.walletAddress)}
              style={{ wordBreak: "break-all", fontSize: "12px", cursor: "pointer" }}
            >
              {result.walletAddress}
            </span>
          </div>
          <div className="result-row">
            <span className="label">Token ID</span>
            <span
              className="value mono"
              title="Click to copy"
              onClick={() => result.tokenId && navigator.clipboard.writeText(String(result.tokenId))}
              style={{ cursor: "pointer" }}
            >
              #{result.tokenId}
            </span>
          </div>
          <div className="result-row">
            <span className="label">Tx Hash</span>
            <span
              className="value mono"
              title="Click to copy"
              onClick={() => result.txHash && navigator.clipboard.writeText(result.txHash)}
              style={{ wordBreak: "break-all", fontSize: "12px", cursor: "pointer" }}
            >
              {result.txHash}
            </span>
          </div>
          <div className="result-row">
            <span className="label">Block</span>
            <span className="value">{result.blockNumber}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="result-card error" style={{ marginBottom: "24px" }}>
          <h3>{"\u2717"} {error}</h3>
        </div>
      )}

      <div className="data-table-wrapper">
        <div className="data-table-header">
          <h2>Student Eligibility</h2>
        </div>
        {students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{"\uD83C\uDF93"}</div>
            <p>No registered students</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Check-Ins</th>
                <th>Wallet</th>
                <th>Eligible Tier</th>
                <th>Progress to Next</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const eligible = getEligibleTier(s.totalCheckIns);
                const next = getNextTier(s.totalCheckIns);
                const progress = next ? Math.round((s.totalCheckIns / next.threshold) * 100) : 100;
                const hasWallet = !!s.walletAddress;

                return (
                  <tr key={s._id}>
                    <td><strong>{s.studentId}</strong></td>
                    <td>{s.name}</td>
                    <td className="mono">{s.totalCheckIns}</td>
                    <td>
                      {hasWallet ? (
                        <span className="mono" style={{ fontSize: "12px", color: "var(--success)" }}>
                          {s.walletAddress.slice(0, 8)}...
                        </span>
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--danger)" }}>Not linked</span>
                      )}
                    </td>
                    <td>
                      {eligible ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <span>{TIERS.find(t => t.name === eligible.name)?.emoji}</span>
                          <span style={{ color: eligible.color, fontWeight: 600 }}>{eligible.name}</span>
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>Not yet eligible</span>
                      )}
                    </td>
                    <td style={{ width: "180px" }}>
                      {next ? (
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.totalCheckIns}/{next.threshold}</span>
                            <span style={{ fontSize: "11px", color: next.color }}>{next.name}</span>
                          </div>
                          <div style={{ height: "6px", background: "var(--bg-secondary)", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{
                              height: "100%",
                              width: `${progress}%`,
                              background: `linear-gradient(90deg, ${eligible?.color || "var(--accent)"}, ${next.color})`,
                              borderRadius: "3px",
                            }} />
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--success)" }}>Max tier reached</span>
                      )}
                    </td>
                    <td>
                      {eligible && hasWallet ? (
                        <button
                          onClick={() => handleMint(s)}
                          disabled={minting === s.studentId}
                          style={{
                            background: `linear-gradient(135deg, ${eligible.color}, ${eligible.color}cc)`,
                            color: eligible.name === "Silver" || eligible.name === "Platinum" ? "#1a1a2e" : "#fff",
                            border: "none",
                            padding: "6px 14px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: 600,
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          {minting === s.studentId ? "Minting..." : `Mint ${eligible.name}`}
                        </button>
                      ) : eligible && !hasWallet ? (
                        <span style={{ fontSize: "12px", color: "var(--danger)" }}>No wallet</span>
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Certificates;