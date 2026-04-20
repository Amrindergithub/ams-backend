import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getSession } from "../utils/api";

const SessionDetail = () => {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getSession(id);
        setSession(res.data.data.session);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <div className="loading-container"><div className="spinner"></div>Loading...</div>;
  if (!session) return <div className="empty-state"><p>Session not found</p></div>;

  const checkedOut = session.checkIns.filter((c) => c.status === "checked-out").length;
  const checkedIn = session.checkIns.filter((c) => c.status === "checked-in").length;

  return (
    <div>
      <div className="page-header">
        <h1>{session.courseId} - {session.courseName}</h1>
        <p>{session.date} &middot; {session.startTime} - {session.endTime} &middot; <span className={`badge ${session.isActive ? "badge-success" : "badge-pending"}`}>{session.isActive ? "Active" : "Ended"}</span></p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">Total Attendees</div>
          <div className="stat-card-value accent">{session.checkIns.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Checked In</div>
          <div className="stat-card-value warning">{checkedIn}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Checked Out</div>
          <div className="stat-card-value success">{checkedOut}</div>
        </div>
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-header">
          <h2>Attendance List</h2>
        </div>
        {session.checkIns.length === 0 ? (
          <div className="empty-state"><p>No students checked in yet</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Duration</th>
                <th>Tx Hash</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {session.checkIns.map((c, i) => {
                const duration = c.checkOutTime
                  ? Math.round((new Date(c.checkOutTime) - new Date(c.checkInTime)) / 60000)
                  : null;
                return (
                  <tr key={i}>
                    <td className="mono">{i + 1}</td>
                    <td><strong>{c.studentId}</strong></td>
                    <td>{c.studentName || "—"}</td>
                    <td className="mono">{new Date(c.checkInTime).toLocaleTimeString()}</td>
                    <td className="mono">{c.checkOutTime ? new Date(c.checkOutTime).toLocaleTimeString() : "—"}</td>
                    <td className="mono">{duration ? `${duration} min` : "—"}</td>
                    <td
                      className="mono"
                      style={{ maxWidth: "220px", wordBreak: "break-all", fontSize: "11px", lineHeight: "1.4", cursor: c.txHash ? "pointer" : "default" }}
                      title={c.txHash ? "Click to copy" : undefined}
                      onClick={() => c.txHash && navigator.clipboard.writeText(c.txHash)}
                    >
                      {c.txHash || "—"}
                    </td>
                    <td>
                      <span className={`badge ${c.status === "checked-out" ? "badge-success" : "badge-pending"}`}>
                        {c.status === "checked-out" ? "\u2713 Complete" : "\u23F2 In Lecture"}
                      </span>
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

export default SessionDetail;