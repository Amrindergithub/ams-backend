import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getStudentProfile } from "../utils/api";
import API from "../utils/api";
import { PageSkeleton } from "../components/Skeleton";

// Student portal dashboard (design #05). Ring gauge for attendance rate,
// tier progress card, next-action CTA, recent check-ins list.

const TIERS = [
  { name: "Bronze",   threshold: 5,  color: "#c97a3b", grad: "linear-gradient(90deg, #7a4520, #c97a3b)" },
  { name: "Silver",   threshold: 15, color: "#c9d1e0", grad: "linear-gradient(90deg, #8a93a6, #dde4ef)" },
  { name: "Gold",     threshold: 30, color: "#ffd76b", grad: "linear-gradient(90deg, #b88a1a, #ffd76b)" },
  { name: "Platinum", threshold: 50, color: "#e8f4ff", grad: "linear-gradient(90deg, #7f8faf, #e8f4ff)" },
];

const StudentView = () => {
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({ totalSessions: 0, attendedSessions: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletSaved, setWalletSaved] = useState(false);
  const [copied, setCopied] = useState(null);
  const studentId = localStorage.getItem("studentId");

  useEffect(() => {
    const fetch = async () => {
      if (!studentId) {
        setError("Student ID not found. Please log in again.");
        setLoading(false);
        return;
      }
      try {
        const res = await getStudentProfile(studentId);
        setStudent(res.data.data.student);
        setAttendance(res.data.data.recentAttendance || []);
        setStats({
          totalSessions:    res.data.data.totalSessions,
          attendedSessions: res.data.data.attendedSessions,
        });

        // Auto-sync wallet
        const savedStudent = res.data.data.student;
        if (window.ethereum) {
          try {
            const accounts = await window.ethereum.request({ method: "eth_accounts" });
            if (accounts.length > 0 && accounts[0] !== savedStudent.walletAddress) {
              await API.patch(`/students/wallet/${studentId}`, { walletAddress: accounts[0] });
              savedStudent.walletAddress = accounts[0];
              setStudent({ ...savedStudent });
              setWalletSaved(true);
            }
          } catch (e) {
            // Wallet sync is best-effort — silently swallow if MetaMask
            // is locked or the account permission prompt is dismissed.
          }
        }
      } catch (err) {
        setError("Failed to load profile. Make sure you are registered.");
      }
      setLoading(false);
    };
    fetch();
  }, [studentId]);

  const copy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1200);
  };

  if (loading) return <PageSkeleton title="Student Portal" cards={3} rows={4} />;

  if (error) {
    return (
      <div className="dash">
        <div className="dash-header"><h1 className="dash-title">My Attendance</h1></div>
        <div className="verify-result fail">
          <div className="verify-result-head">
            <div className="verify-verdict-icon fail">✗</div>
            <div><div className="verify-verdict">{error}</div></div>
          </div>
        </div>
      </div>
    );
  }

  const threshold = 75;
  const rate = student.attendanceRate || 0;
  const onTrack = rate >= threshold;

  const currentTier = TIERS.filter((t) => student.totalCheckIns >= t.threshold).pop();
  const nextTier = TIERS.find((t) => student.totalCheckIns < t.threshold);

  return (
    <div className="dash">
      {/* Header */}
      <div className="dash-header">
        <div>
          <span className="eyebrow">Student Portal</span>
          <h1 className="dash-title">
            Hey <span className="grad-text">{student.name.split(" ")[0]}</span>
          </h1>
          <p className="dash-subtitle">
            {student.studentId} <span className="dot-sep">&middot;</span> {student.course} <span className="dot-sep">&middot;</span> {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}
          </p>
        </div>
        <div className="dash-actions">
          <Link to="/student/scan" className="btn-grad">
            <span style={{ fontSize: "14px" }}>⎘</span> Scan QR
          </Link>
        </div>
      </div>

      {walletSaved && (
        <div className="verify-result ok" style={{ padding: "14px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="verify-verdict-icon ok" style={{ width: "28px", height: "28px", fontSize: "14px" }}>✓</span>
            <span style={{ fontSize: "13px", color: "var(--success)" }}>Wallet synced · {student.walletAddress?.slice(0, 10)}…</span>
          </div>
        </div>
      )}

      {student.flagged && (
        <div className="verify-result fail" style={{ padding: "16px 20px" }}>
          <div className="verify-result-head" style={{ marginBottom: 0 }}>
            <div className="verify-verdict-icon fail">!</div>
            <div>
              <div className="verify-verdict" style={{ fontSize: "16px" }}>Low attendance warning</div>
              <div className="verify-verdict-sub">{student.flagReason}. Attend upcoming lectures to avoid penalties.</div>
            </div>
          </div>
        </div>
      )}

      {/* Hero: rate ring + tier card */}
      <div className="dash-split">
        <div className="panel student-hero">
          <div className="student-hero-content">
            <div className="student-hero-text">
              <span className="panel-sub" style={{ marginTop: 0 }}>Attendance rate</span>
              <div className="student-hero-value" style={{ color: onTrack ? "var(--success)" : "var(--danger)" }}>
                {rate}%
              </div>
              <div className="student-hero-sub">
                {onTrack ? "On track · 75% threshold cleared" : "Below 75% threshold"}
              </div>
              <div className="student-hero-meta">
                <div>
                  <div className="student-hero-meta-label">Attended</div>
                  <div className="student-hero-meta-value">{stats.attendedSessions}<span className="muted">/{stats.totalSessions}</span></div>
                </div>
                <div>
                  <div className="student-hero-meta-label">Check-ins</div>
                  <div className="student-hero-meta-value">{student.totalCheckIns}</div>
                </div>
                <div>
                  <div className="student-hero-meta-label">Check-outs</div>
                  <div className="student-hero-meta-value">{student.totalCheckOuts}</div>
                </div>
              </div>
            </div>
            <RateRing pct={rate} onTrack={onTrack} />
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>NFT progress</h2>
              <span className="panel-sub">
                {currentTier ? `Current: ${currentTier.name}` : "Earn your first tier"}
              </span>
            </div>
            {currentTier && <span style={{ fontSize: "28px" }}>{currentTier.name === "Bronze" ? "🥉" : currentTier.name === "Silver" ? "🥈" : currentTier.name === "Gold" ? "🥇" : "💎"}</span>}
          </div>
          <div className="tier-list">
            {TIERS.map((t) => {
              const earned = student.totalCheckIns >= t.threshold;
              const pct = Math.min(100, Math.round((student.totalCheckIns / t.threshold) * 100));
              return (
                <div key={t.name} className="tier-row">
                  <div className="tier-row-top">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="tier-swatch" style={{ background: t.grad }} />
                      <strong style={{ color: t.color }}>{t.name}</strong>
                      <span className="tier-threshold">≥ {t.threshold}</span>
                      {earned && <span className="badge badge-success" style={{ fontSize: "10px", padding: "2px 8px" }}>✓</span>}
                    </div>
                    <div className="mono" style={{ fontSize: "12px" }}>
                      {Math.min(student.totalCheckIns, t.threshold)}/{t.threshold}
                    </div>
                  </div>
                  <div className="tier-track">
                    <div className="tier-fill" style={{ width: `${pct}%`, background: t.grad }} />
                  </div>
                </div>
              );
            })}
          </div>
          {nextTier && (
            <div className="nudge-card">
              <div className="nudge-icon">✦</div>
              <div>
                <strong>{nextTier.threshold - student.totalCheckIns} sessions to {nextTier.name}</strong>
                <p>Keep attending to unlock your next certificate tier.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent attendance */}
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Recent check-ins <span className="on-chain-tag">&middot; on-chain</span></h2>
            <span className="panel-sub">{attendance.length} recent commits</span>
          </div>
        </div>
        {attendance.length === 0 ? (
          <div className="empty-state" style={{ padding: "40px 20px" }}>
            <p style={{ color: "var(--text-muted)" }}>No check-ins yet. Scan a QR to record one.</p>
          </div>
        ) : (
          <table className="data-table dash-table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Date</th>
                <th>Tx hash</th>
                <th>Attendance hash</th>
                <th>Block</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((r) => (
                <tr key={r._id}>
                  <td><span className="module-pill">{r.courseId}</span></td>
                  <td style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{r.date}</td>
                  <td>
                    {r.txHash ? (
                      <button className="hash-pill" onClick={() => copy(r.txHash, r._id + "-tx")} title="Click to copy tx hash">
                        <span className="mono">{r.txHash.slice(0, 10)}…{r.txHash.slice(-4)}</span>
                        <span className="hash-copy">{copied === r._id + "-tx" ? "✓" : "⎘"}</span>
                      </button>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>—</span>
                    )}
                  </td>
                  <td>
                    {r.attendanceHash ? (
                      <button
                        className="hash-pill hash-pill-alt"
                        onClick={() => copy(r.attendanceHash, r._id + "-att")}
                        title="Click to copy attendance hash (paste into Verifier)"
                      >
                        <span className="mono">{r.attendanceHash.slice(0, 10)}…{r.attendanceHash.slice(-4)}</span>
                        <span className="hash-copy">{copied === r._id + "-att" ? "✓" : "⎘"}</span>
                      </button>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>—</span>
                    )}
                  </td>
                  <td className="mono" style={{ fontSize: "12px" }}>#{r.blockNumber || "—"}</td>
                  <td>
                    <span className={`badge ${r.verified ? "badge-success" : "badge-pending"}`}>
                      {r.verified ? "✓ Verified" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// SVG rate ring with gradient stroke.
const RateRing = ({ pct, onTrack }) => {
  const size = 180, stroke = 14, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <svg width={size} height={size} className="rate-ring">
      <defs>
        <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor={onTrack ? "#00d4a8" : "#ff5577"} />
          <stop offset="100%" stopColor={onTrack ? "#7c5cff" : "#ffb84d"} />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="url(#ring-grad)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%" y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="var(--text-primary)"
        fontSize="28"
        fontWeight="600"
        style={{ fontFamily: "var(--font-sans)", letterSpacing: "-0.02em" }}
      >
        {pct}%
      </text>
    </svg>
  );
};

export default StudentView;
