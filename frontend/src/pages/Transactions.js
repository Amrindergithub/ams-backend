import React, { useEffect, useMemo, useState } from "react";
import { getRecords, getAllStudents } from "../utils/api";
import { PageSkeleton } from "../components/Skeleton";

// Block explorer screen (design #08). Shows every on-chain attendance record
// as a row, Etherscan-style, with filter chips + search.

const FILTERS = [
  { key: "all",      label: "All" },
  { key: "verified", label: "Verified" },
  { key: "pending",  label: "Pending" },
];

const Transactions = () => {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [r, s] = await Promise.all([
          getRecords(),
          getAllStudents().catch(() => ({ data: { data: { students: [] } } })),
        ]);
        setRecords(r.data.data.records || []);
        setStudents(s.data.data.students || []);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const studentMap = useMemo(() => {
    const m = {};
    students.forEach((s) => { m[s.studentId] = s; });
    return m;
  }, [students]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const q = filter.toLowerCase();
      const matches =
        !q ||
        r.studentId?.toLowerCase().includes(q) ||
        r.courseId?.toLowerCase().includes(q) ||
        r.txHash?.toLowerCase().includes(q) ||
        r.attendanceHash?.toLowerCase().includes(q) ||
        String(r.blockNumber || "").includes(q) ||
        (r.date || "").includes(q);
      const verified = !!r.verified;
      const statusOk =
        activeFilter === "all" ||
        (activeFilter === "verified" && verified) ||
        (activeFilter === "pending" && !verified);
      return matches && statusOk;
    });
  }, [records, filter, activeFilter]);

  const copy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1200);
  };

  const verifiedCount = records.filter((r) => r.verified).length;
  const latestBlock = records.reduce((max, r) => Math.max(max, r.blockNumber || 0), 0);

  if (loading) {
    return <PageSkeleton title="Block Explorer" cards={0} rows={8} />;
  }

  return (
    <div className="dash">
      <div className="dash-header">
        <div>
          <span className="eyebrow">Block Explorer</span>
          <h1 className="dash-title">
            On-chain <span className="grad-text">transactions</span>
          </h1>
          <p className="dash-subtitle">
            Every attendance commit, traced on Ganache <span className="dot-sep">&middot;</span> chainId 1337
          </p>
        </div>
      </div>

      {/* KPI row */}
      <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(4, minmax(0,1fr))" }}>
        <MiniStat label="Transactions" value={records.length} hint="total commits" />
        <MiniStat label="Verified on-chain" value={verifiedCount} hint={`${records.length ? Math.round(verifiedCount / records.length * 100) : 0}% of total`} accent="var(--success)" />
        <MiniStat label="Latest block" value={`#${latestBlock || "—"}`} hint="highest seen" accent="var(--accent-light)" />
        <MiniStat label="Unique students" value={new Set(records.map(r => r.studentId)).size} hint="distinct wallets" accent="var(--warning)" />
      </div>

      {/* Filter toolbar */}
      <div className="panel" style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
          <div className="filter-chips">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                className={`filter-chip ${activeFilter === f.key ? "active" : ""}`}
                onClick={() => setActiveFilter(f.key)}
              >
                {f.label}
                {f.key === "all" && <span className="chip-count">{records.length}</span>}
                {f.key === "verified" && <span className="chip-count">{verifiedCount}</span>}
                {f.key === "pending" && <span className="chip-count">{records.length - verifiedCount}</span>}
              </button>
            ))}
          </div>
          <div className="explorer-search">
            <span className="explorer-search-icon">&#9906;</span>
            <input
              className="explorer-search-input"
              placeholder="Search tx hash, block, student, module..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tx list */}
      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: "48px 20px" }}>
            <p style={{ color: "var(--text-muted)" }}>No transactions match your filters.</p>
          </div>
        ) : (
          <div className="tx-list">
            {filtered.map((r) => {
              const s = studentMap[r.studentId];
              const time = r.createdAt ? new Date(r.createdAt) : null;
              return (
                <div className="tx-row" key={r._id}>
                  <div className="tx-method">
                    <span className="tx-method-pill">check-in</span>
                    <span className={`tx-status-dot ${r.verified ? "ok" : "pending"}`} />
                  </div>

                  <div className="tx-hash-col">
                    <div className="tx-hash-label">Tx hash</div>
                    <button className="hash-pill" onClick={() => copy(r.txHash, r._id + "-tx")} title="Click to copy">
                      <span className="mono">{r.txHash ? `${r.txHash.slice(0, 12)}…${r.txHash.slice(-6)}` : "—"}</span>
                      <span className="hash-copy">{copied === r._id + "-tx" ? "✓" : "⎘"}</span>
                    </button>
                  </div>

                  <div className="tx-meta-col">
                    <div className="tx-meta-label">Block</div>
                    <div className="mono tx-meta-value">#{r.blockNumber || "—"}</div>
                  </div>

                  <div className="tx-meta-col">
                    <div className="tx-meta-label">Student</div>
                    <div className="tx-student-cell">
                      <div className="avatar avatar-sm">{(s?.name || r.studentId).slice(0, 2).toUpperCase()}</div>
                      <div>
                        <div className="student-name" style={{ fontSize: "12px" }}>{s?.name || r.studentId}</div>
                        <div className="student-id" style={{ fontSize: "10.5px" }}>{r.studentId}</div>
                      </div>
                    </div>
                  </div>

                  <div className="tx-meta-col">
                    <div className="tx-meta-label">Module</div>
                    <span className="module-pill">{r.courseId}</span>
                  </div>

                  <div className="tx-meta-col">
                    <div className="tx-meta-label">Age</div>
                    <div className="tx-meta-value" style={{ fontSize: "12px" }}>
                      {time ? relTime(time) : r.date}
                    </div>
                  </div>

                  <div className="tx-status-col">
                    <span className={`badge ${r.verified ? "badge-success" : "badge-pending"}`}>
                      {r.verified ? "✓ Verified" : "Pending"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const MiniStat = ({ label, value, hint, accent }) => (
  <div className="kpi-card">
    <div className="kpi-top">
      <span className="kpi-label">{label}</span>
    </div>
    <div className="kpi-body">
      <div className="kpi-value" style={{ color: accent || undefined, fontSize: "28px" }}>{value}</div>
      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{hint}</span>
    </div>
  </div>
);

const relTime = (d) => {
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)    return `${Math.floor(diff)}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default Transactions;
