import React from "react";

/*
 * Shimmer-animated placeholder block. Use in place of raw "Loading…"
 * text while data is being fetched. Ship a generic `<Skeleton />` plus
 * a few common arrangements (card, row, text-line).
 *
 *   <Skeleton w="60%" h={18} />
 *   <SkeletonRow count={5} />
 *   <SkeletonCard />
 */

export const Skeleton = ({ w = "100%", h = 14, radius = 8, style }) => (
  <span
    className="skeleton"
    style={{ width: w, height: h, borderRadius: radius, ...style }}
    aria-hidden="true"
  />
);

export const SkeletonCard = ({ h = 120 }) => (
  <div className="skeleton-card" style={{ height: h }} aria-hidden="true">
    <Skeleton w="40%" h={12} />
    <Skeleton w="70%" h={26} />
    <Skeleton w="30%" h={10} />
  </div>
);

export const SkeletonRow = ({ count = 4 }) => (
  <div className="skeleton-rows" aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton-row">
        <Skeleton w={32} h={32} radius={8} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <Skeleton w="55%" h={12} />
          <Skeleton w="35%" h={10} />
        </div>
        <Skeleton w={70} h={22} radius={6} />
      </div>
    ))}
  </div>
);

// Simple full-page placeholder used by list-style routes while the
// first API call is in flight. Matches the dashboard's KPI + list layout.
export const PageSkeleton = ({ title = "Loading", cards = 3, rows = 5 }) => (
  <div className="dash">
    <div className="dash-header">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span className="eyebrow">{title}</span>
        <div className="skeleton" style={{ width: 260, height: 30, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 180, height: 12, borderRadius: 6 }} />
      </div>
    </div>
    {cards > 0 && (
      <div className="kpi-grid" style={{ marginTop: 20 }}>
        {Array.from({ length: cards }).map((_, i) => (
          <SkeletonCard key={i} h={120} />
        ))}
      </div>
    )}
    <div style={{ marginTop: 24 }}>
      <SkeletonRow count={rows} />
    </div>
  </div>
);

export default Skeleton;
