//src/components/landing/StatsBar.jsx
import { useNeoStats, MOCK_STATS } from "../../lib/api/neo";

function StatItem({ label, value, unit, highlight = false }) {
  return (
    <div style={{
      display:       "flex",
      flexDirection: "column",
      alignItems:    "center",
      gap:           "4px",
      padding:       "12px 24px",
      borderRight:   "1px solid rgba(196,140,64,0.15)",
    }}>
      <span className="orbitron" style={{
        fontSize:           "clamp(16px, 2.5vw, 24px)",
        fontWeight:         900,
        color:              highlight ? "#d4944a" : "#a07840",
        fontVariantNumeric: "tabular-nums",
      }}>
        {typeof value === "number" ? value.toLocaleString() : value}
        {unit && <span style={{ fontSize: "10px", marginLeft: "4px", opacity: 0.6 }}>{unit}</span>}
      </span>
      <span style={{
        fontSize:      "9px",
        letterSpacing: "0.3em",
        textTransform: "uppercase",
        color:         "#5a4030",
      }}>
        {label}
      </span>
    </div>
  );
}

export default function StatsBar() {
  const { data, isLoading, isError } = useNeoStats();
  const stats = data ?? (isError ? MOCK_STATS : null);

  if (isLoading && !stats) {
    return (
      <div style={{ textAlign: "center", padding: "16px", color: "#a07840", fontSize: "11px", letterSpacing: "0.3em" }}>
        <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>◌</span>
        {" "}LOADING LIVE NEO DATA...
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div style={{
      position:   "relative",
      width:      "100%",
      overflow:   "hidden",
      borderTop:  "1px solid rgba(196,140,64,0.12)",
      borderBottom: "1px solid rgba(196,140,64,0.12)",
      background: "linear-gradient(to right, transparent, rgba(196,140,64,0.06), transparent)",
    }}>
      <div style={{
        position:   "absolute",
        inset:      0,
        pointerEvents: "none",
        background: "linear-gradient(to bottom, transparent 45%, rgba(196,140,64,0.03) 50%, transparent 55%)",
        animation:  "scanline 4s linear infinite",
      }} />

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
        <StatItem label="NEOs Tracked"           value={stats.total_neos_tracked}    highlight />
        <StatItem label="Potentially Hazardous"  value={stats.potentially_hazardous} highlight />
        <StatItem label="Close Approaches Today" value={stats.close_approaches_today} />
        <StatItem label="Closest Miss"           value={Math.round(stats.closest_approach_km / 1000)} unit="K km" />
        <StatItem label="Largest Tracked"        value={stats.largest_diameter_km.toFixed(1)} unit="km" />
      </div>

      {isError && (
        <p style={{ textAlign: "center", fontSize: "9px", color: "rgba(196,140,64,0.4)", paddingBottom: "4px", letterSpacing: "0.2em" }}>
          ⚠ LIVE DATA UNAVAILABLE — SHOWING CACHED VALUES
        </p>
      )}
    </div>
  );
}
