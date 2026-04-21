import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API, { getRecords, getAllStudents, exportCSV } from "../utils/api";

const TIER_META = {
  Bronze:   { color: "#c97a3b", threshold: 5,  grad: "linear-gradient(90deg, #7a4520, #c97a3b)" },
  Silver:   { color: "#c9d1e0", threshold: 15, grad: "linear-gradient(90deg, #8a93a6, #dde4ef)" },
  Gold:     { color: "#ffd76b", threshold: 30, grad: "linear-gradient(90deg, #b88a1a, #ffd76b)" },
  Platinum: { color: "#e8f4ff", threshold: 50, grad: "linear-gradient(90deg, #7f8faf, #e8f4ff)" },
};

// Tiny inline SVG sparkline. `values` is a small array of numbers.
const Sparkline = ({ values, stroke = "var(--accent-light)", fill = "rgba(0,212,168,0.15)" }) => {
  if (!values || values.length < 2) return null;
  const w = 120, h = 32, pad = 2;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const step = (w - pad * 2) / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = pad + i * step;
    const y = h - pad - ((v - min) / span) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linePath = `M ${pts.join(" L ")}`;
  const areaPath = `${linePath} L ${pad + (values.length - 1) * step},${h - pad} L ${pad},${h - pad} Z`;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <path d={areaPath} fill={fill} stroke="none" />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

// Build a 7-day moving series from a list of ISO-ish date strings.
const buildDailySeries = (dates, windowDays = 7) => {
  const today = new Date();
  const buckets = Array(windowDays).fill(0);
  const start = new Date(today);
  start.setDate(start.getDate() - (windowDays - 1));
  start.setHours(0, 0, 0, 0);
  dates.forEach((d) => {
    const t = new Date(d);
    if (isNaN(t.getTime())) return;
    const idx = Math.floor((t - start) / (1000 * 60 * 60 * 24));
    if (idx >= 0 && idx < windowDays) buckets[idx] += 1;
  });
  return buckets;
};

const Dashboard = () => {
  const [records, setRecords] = useState([]);
  const [onChainCount, setOnChainCount] = useState(0);
  const [students, setStudents] = useState([]);
  const [tierStats, setTierStats] = useState({ total: 0, counts: { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 } });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);

  const userName = localStorage.getItem("userName") || "Lecturer";
  const userModulesRaw = localStorage.getItem("userModules");
  const userModules = userModulesRaw ? JSON.parse(userModulesRaw) : [];
  const primaryModule = userModules[0] || "CN6035";

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [recRes, studRes, tierRes] = await Promise.all([
          getRecords(),
          getAllStudents().catch(() => ({ data: { data: { students: [] } } })),
          API.get("/nft/tier-stats").catch(() => ({
            data: { data: { total: 0, counts: { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 } } },
          })),
        ]);
        setRecords(recRes.data.data.records || []);
        setOnChainCount(recRes.data.data.onChainCount || 0);
        setStudents(studRes.data.data.students || []);
        setTierStats(tierRes.data.data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const studentMap = useMemo(() => {
    const m = {};
    students.forEach((s) => { m[s.studentId] = s; });
    return m;
  }, [students]);

  const stats = useMemo(() => {
    const uniqueStudents = new Set(records.map((r) => r.studentId)).size;
    const dates = records.map((r) => r.createdAt || r.date);
    const checkInSeries = buildDailySeries(dates);
    const onChainSeries = buildDailySeries(records.filter((r) => r.verified).map((r) => r.createdAt || r.date));
    return {
      totalCheckIns: records.length,
      onChainCount,
      uniqueStudents,
      checkInSeries,
      onChainSeries,
    };
  }, [records, onChainCount]);

  const tierPercents = useMemo(() => {
    const total = tierStats.total || 0;
    const { counts } = tierStats;
    const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);
    return {
      Bronze:   pct(counts.Bronze),
      Silver:   pct(counts.Silver),
      Gold:     pct(counts.Gold),
      Platinum: pct(counts.Platinum),
    };
  }, [tierStats]);

  const copy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1200);
  };

  const handleExport = async () => {
    try {
      const res = await exportCSV();
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="spinner" />Loading dashboard...</div>;
  }

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
  const firstName = userName.split(" ")[0];
  const recent = records.slice(0, 8);

  return (
    <div className="dash">
      {/* Header */}
      <div className="dash-header">
        <div>
          <span className="eyebrow">Overview</span>
          <h1 className="dash-title">
            Welcome back, <span className="grad-text">Dr. {firstName}</span>
          </h1>
          <p className="dash-subtitle">
            {primaryModule} <span className="dot-sep">&middot;</span> Blockchain Attendance <span className="dot-sep">&middot;</span> {today}
          </p>
        </div>
        <div className="dash-actions">
          <button className="btn-ghost" onClick={handleExport}>Export CSV</button>
          <Link to="/admin/sessions" className="btn-grad">
            <span style={{ fontSize: "12px" }}>&#9679;</span> Start session
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="kpi-grid">
        <KpiCard
          label="Total check-ins"
          value={stats.totalCheckIns}
          delta="+12 today"
          deltaPositive
          series={stats.checkInSeries}
          stroke="#7c5cff"
          fill="rgba(124,92,255,0.18)"
        />
        <KpiCard
          label="On-chain records"
          value={stats.onChainCount}
          delta="Ganache · 7545"
          series={stats.onChainSeries}
          stroke="#00d4a8"
          fill="rgba(0,212,168,0.18)"
        />
        <KpiCard
          label="Active students"
          value={stats.uniqueStudents}
          delta={`of ${students.length} registered`}
          series={stats.checkInSeries}
          stroke="#ffb84d"
          fill="rgba(255,184,77,0.15)"
        />
        <KpiCard
          label="NFTs minted"
          value={tierStats.total}
          delta={`${tierStats.counts.Gold + tierStats.counts.Platinum} premium`}
          series={stats.onChainSeries}
          stroke="#ff5577"
          fill="rgba(255,85,119,0.15)"
        />
      </div>

      {/* Two-column section */}
      <div className="dash-split">
        {/* Recent attendance */}
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Recent attendance <span className="on-chain-tag">&middot; on-chain</span></h2>
              <span className="panel-sub">Latest {recent.length} of {records.length} records</span>
            </div>
            <div className="panel-head-actions">
              <button className="chip-btn">Filter</button>
              <button className="chip-btn chip-live"><span className="pulse-dot" /> Live</button>
            </div>
          </div>
          {recent.length === 0 ? (
            <div className="empty-state">
              <p style={{ color: "var(--text-muted)" }}>No records yet. Start a session to begin.</p>
            </div>
          ) : (
            <table className="data-table dash-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Module</th>
                  <th>Time</th>
                  <th>Tx hash</th>
                  <th>Block</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => {
                  const s = studentMap[r.studentId];
                  const initials = (s?.name || r.studentId).slice(0, 2).toUpperCase();
                  const time = r.createdAt
                    ? new Date(r.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
                    : r.date;
                  return (
                    <tr key={r._id}>
                      <td>
                        <div className="student-cell">
                          <div className="avatar">{initials}</div>
                          <div>
                            <div className="student-name">{s?.name || "Unknown"}</div>
                            <div className="student-id">{r.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="module-pill">{r.courseId}</span></td>
                      <td className="mono" style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{time}</td>
                      <td>
                        {r.txHash ? (
                          <button
                            className="hash-pill"
                            onClick={() => copy(r.txHash, r._id)}
                            title="Click to copy"
                          >
                            <span className="mono">{r.txHash.slice(0, 6)}…{r.txHash.slice(-4)}</span>
                            <span className="hash-copy">{copied === r._id ? "✓" : "⎘"}</span>
                          </button>
                        ) : (
                          <span className="mono" style={{ color: "var(--text-muted)", fontSize: "12px" }}>—</span>
                        )}
                      </td>
                      <td className="mono" style={{ fontSize: "12px" }}>#{r.blockNumber || "—"}</td>
                      <td>
                        <span className={`badge ${r.verified ? "badge-success" : "badge-pending"}`}>
                          {r.verified ? "✓ Verified" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* NFT tier distribution */}
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>NFT tier distribution</h2>
              <span className="panel-sub">{tierStats.total} total minted</span>
            </div>
          </div>
          <div className="tier-list">
            {Object.entries(TIER_META).map(([name, meta]) => {
              const count = tierStats.counts[name] || 0;
              const pct = tierPercents[name];
              return (
                <div key={name} className="tier-row">
                  <div className="tier-row-top">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="tier-swatch" style={{ background: meta.grad }} />
                      <strong style={{ color: meta.color }}>{name}</strong>
                      <span className="tier-threshold">≥ {meta.threshold} sessions</span>
                    </div>
                    <div className="mono" style={{ fontSize: "13px" }}>
                      {count}
                      <span style={{ color: "var(--text-muted)", marginLeft: "6px" }}>({pct}%)</span>
                    </div>
                  </div>
                  <div className="tier-track">
                    <div className="tier-fill" style={{ width: `${pct}%`, background: meta.grad }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="nudge-card">
            <div className="nudge-icon">✦</div>
            <div>
              <strong>Ready to mint?</strong>
              <p>Students hitting a tier threshold appear on the Certificates page.</p>
              <Link to="/admin/certificates" className="nudge-link">Go to certificates →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ label, value, delta, deltaPositive, series, stroke, fill }) => (
  <div className="kpi-card glass">
    <div className="kpi-top">
      <span className="kpi-label">{label}</span>
      <span className={`kpi-delta ${deltaPositive ? "pos" : ""}`}>{delta}</span>
    </div>
    <div className="kpi-body">
      <div className="kpi-value">{value}</div>
      <Sparkline values={series} stroke={stroke} fill={fill} />
    </div>
  </div>
);

export default Dashboard;
