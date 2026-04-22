import React, { useEffect, useMemo, useState } from "react";
import { getRecords, getAllStudents } from "../utils/api";
import { PageSkeleton } from "../components/Skeleton";

// Analytics screen (design #09) — gradient header, KPI row, line chart
// (attendance over last 14 days), module distribution list, leaderboard.

const Analytics = () => {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const { series, byCourse, byStudent, verified, days } = useMemo(() => {
    const DAYS = 14;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (DAYS - 1 - i));
      return d;
    });
    const series = days.map(() => 0);
    records.forEach((r) => {
      const t = r.createdAt ? new Date(r.createdAt) : new Date(r.date);
      if (isNaN(t.getTime())) return;
      t.setHours(0, 0, 0, 0);
      const idx = Math.round((t - days[0]) / (1000 * 60 * 60 * 24));
      if (idx >= 0 && idx < DAYS) series[idx] += 1;
    });

    const byCourse = {};
    records.forEach((r) => { byCourse[r.courseId] = (byCourse[r.courseId] || 0) + 1; });
    const byStudent = {};
    records.forEach((r) => { byStudent[r.studentId] = (byStudent[r.studentId] || 0) + 1; });

    const verified = records.filter((r) => r.verified).length;
    return { series, byCourse, byStudent, verified, days };
  }, [records]);

  const verificationRate = records.length ? Math.round((verified / records.length) * 100) : 0;
  const courseEntries = Object.entries(byCourse).sort((a, b) => b[1] - a[1]);
  const studentEntries = Object.entries(byStudent).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxSeries = Math.max(...series, 1);
  const peakDay = series.indexOf(Math.max(...series));

  if (loading) {
    return <PageSkeleton title="Analytics" cards={3} rows={6} />;
  }

  return (
    <div className="dash">
      <div className="dash-header">
        <div>
          <span className="eyebrow">Insights</span>
          <h1 className="dash-title">
            Attendance <span className="grad-text">analytics</span>
          </h1>
          <p className="dash-subtitle">
            14-day rolling window <span className="dot-sep">&middot;</span> {records.length} total commits
          </p>
        </div>
      </div>

      {/* KPI */}
      <div className="kpi-grid">
        <KpiCard label="Total check-ins" value={records.length} delta="last 14 days" accent="#7c5cff" />
        <KpiCard label="Verification rate" value={`${verificationRate}%`} delta={`${verified} verified`} accent="#00d4a8" />
        <KpiCard label="Active students" value={Object.keys(byStudent).length} delta={`of ${students.length} registered`} accent="#ffb84d" />
        <KpiCard label="Active modules" value={Object.keys(byCourse).length} delta="in session" accent="#ff5577" />
      </div>

      {/* Line chart + module distribution */}
      <div className="dash-split">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Attendance trend</h2>
              <span className="panel-sub">Daily commits &middot; last 14 days</span>
            </div>
            <span className="chip-btn">Peak: {series[peakDay]} on {days[peakDay].toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
          </div>
          <LineChart values={series} days={days} max={maxSeries} />
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h2>Module distribution</h2>
              <span className="panel-sub">{courseEntries.length} modules</span>
            </div>
          </div>
          {courseEntries.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No data yet.</p>
          ) : (
            <div className="tier-list">
              {courseEntries.map(([course, count], i) => {
                const max = courseEntries[0][1];
                const pct = Math.round((count / max) * 100);
                const grads = [
                  "linear-gradient(90deg, #7c5cff, #a88dff)",
                  "linear-gradient(90deg, #00d4a8, #55efc4)",
                  "linear-gradient(90deg, #ffb84d, #ffd76b)",
                  "linear-gradient(90deg, #ff5577, #ff8fa4)",
                ];
                return (
                  <div key={course} className="tier-row">
                    <div className="tier-row-top">
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span className="tier-swatch" style={{ background: grads[i % grads.length] }} />
                        <strong style={{ color: "var(--text-primary)" }}>{course}</strong>
                      </div>
                      <div className="mono" style={{ fontSize: "13px" }}>
                        {count}
                        <span style={{ color: "var(--text-muted)", marginLeft: "6px" }}>({Math.round((count / records.length) * 100)}%)</span>
                      </div>
                    </div>
                    <div className="tier-track">
                      <div className="tier-fill" style={{ width: `${pct}%`, background: grads[i % grads.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="panel">
        <div className="panel-head">
          <div>
            <h2>Top students <span className="on-chain-tag">&middot; leaderboard</span></h2>
            <span className="panel-sub">Ranked by total commits</span>
          </div>
        </div>
        {studentEntries.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No data yet.</p>
        ) : (
          <table className="data-table dash-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student</th>
                <th>Module</th>
                <th>Check-ins</th>
                <th>Activity</th>
              </tr>
            </thead>
            <tbody>
              {studentEntries.map(([sid, count], i) => {
                const s = studentMap[sid];
                const max = studentEntries[0][1];
                const pct = Math.round((count / max) * 100);
                const rankBadge = ["#ffd76b", "#dde4ef", "#c97a3b"][i] || "var(--text-muted)";
                return (
                  <tr key={sid}>
                    <td>
                      <span className="rank-badge" style={{ background: i < 3 ? rankBadge : "transparent", color: i < 3 ? "#07070d" : "var(--text-muted)", border: i < 3 ? "none" : "1px solid var(--border-soft)" }}>
                        {i + 1}
                      </span>
                    </td>
                    <td>
                      <div className="student-cell">
                        <div className="avatar">{(s?.name || sid).slice(0, 2).toUpperCase()}</div>
                        <div>
                          <div className="student-name">{s?.name || "Unknown"}</div>
                          <div className="student-id">{sid}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="module-pill">{s?.course || "—"}</span></td>
                    <td className="mono">{count}</td>
                    <td style={{ width: "32%" }}>
                      <div className="tier-track">
                        <div className="tier-fill" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #7c5cff, #00d4a8)" }} />
                      </div>
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

// Inline SVG line chart with gradient fill.
const LineChart = ({ values, days, max }) => {
  const w = 640, h = 200, padX = 16, padY = 20;
  if (values.length < 2) return null;
  const step = (w - padX * 2) / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = padX + i * step;
    const y = h - padY - (v / max) * (h - padY * 2);
    return [x, y];
  });
  const linePath = "M " + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L ");
  const areaPath = `${linePath} L ${pts[pts.length - 1][0]},${h - padY} L ${pts[0][0]},${h - padY} Z`;
  const gridLines = 4;
  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: "block", minHeight: "200px" }}>
        <defs>
          <linearGradient id="lg-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7c5cff" />
            <stop offset="100%" stopColor="#00d4a8" />
          </linearGradient>
          <linearGradient id="lg-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(124,92,255,0.35)" />
            <stop offset="100%" stopColor="rgba(0,212,168,0.02)" />
          </linearGradient>
        </defs>
        {Array.from({ length: gridLines }).map((_, i) => {
          const y = padY + ((h - padY * 2) * i) / (gridLines - 1);
          return <line key={i} x1={padX} x2={w - padX} y1={y} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 4" />;
        })}
        <path d={areaPath} fill="url(#lg-fill)" />
        <path d={linePath} fill="none" stroke="url(#lg-stroke)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.5" fill="#0a0a12" stroke="url(#lg-stroke)" strokeWidth="1.5" />
        ))}
        {/* x-axis date marks (every 3rd day) */}
        {days.map((d, i) => (
          i % 3 === 0 ? (
            <text key={i} x={padX + i * step} y={h - 4} fill="var(--text-muted)" fontSize="9" textAnchor="middle" style={{ fontFamily: "var(--font-mono)" }}>
              {d.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
            </text>
          ) : null
        ))}
      </svg>
    </div>
  );
};

const KpiCard = ({ label, value, delta, accent }) => (
  <div className="kpi-card">
    <div className="kpi-top">
      <span className="kpi-label">{label}</span>
      <span className="kpi-delta">{delta}</span>
    </div>
    <div className="kpi-body">
      <div className="kpi-value" style={{ color: accent }}>{value}</div>
    </div>
  </div>
);

export default Analytics;
