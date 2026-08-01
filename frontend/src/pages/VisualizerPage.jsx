import Scene from "../components/visualizer/Scene";

function BackButton({ onBack }) {
  return (
    <button
      onClick={onBack}
      className="mono"
      style={{
        position:             "fixed",
        top:                  "20px",
        left:                 "20px",
        zIndex:               200,
        display:              "flex",
        alignItems:           "center",
        gap:                  "10px",
        padding:              "10px 18px",
        background:           "rgba(8,5,0,0.85)",
        border:               "1px solid rgba(196,140,64,0.35)",
        borderRadius:         "4px",
        color:                "#d4944a",
        fontSize:             "10px",
        letterSpacing:        "0.2em",
        textTransform:        "uppercase",
        cursor:               "pointer",
        backdropFilter:       "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transition:           "all 0.25s ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background  = "rgba(196,140,64,0.12)";
        e.currentTarget.style.borderColor = "rgba(196,140,64,0.6)";
        e.currentTarget.style.color       = "#f0d4a0";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background  = "rgba(8,5,0,0.85)";
        e.currentTarget.style.borderColor = "rgba(196,140,64,0.35)";
        e.currentTarget.style.color       = "#d4944a";
      }}
    >
      <span style={{ fontSize: "14px", lineHeight: 1 }}>←</span>
      BACK TO ASTERIA
    </button>
  );
}

function StatusBadge() {
  return (
    <div
      className="mono"
      style={{
        position:             "fixed",
        top:                  "20px",
        right:                "20px",
        zIndex:               200,
        display:              "flex",
        alignItems:           "center",
        gap:                  "8px",
        padding:              "10px 16px",
        background:           "rgba(8,5,0,0.85)",
        border:               "1px solid rgba(196,140,64,0.2)",
        borderRadius:         "4px",
        backdropFilter:       "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <span style={{
        width:        "6px",
        height:       "6px",
        borderRadius: "50%",
        background:   "#50e090",
        boxShadow:    "0 0 8px rgba(80,224,144,0.8)",
        animation:    "signal-blink 2s ease-in-out infinite",
        flexShrink:   0,
      }} />
      <span style={{ fontSize: "9px", letterSpacing: "0.25em", color: "#8a7060" }}>
        VISUALIZER
      </span>
      <span style={{ fontSize: "9px", letterSpacing: "0.15em", color: "#d4944a" }}>
        ONLINE
      </span>
    </div>
  );
}

export default function VisualizerPage({ onBack }) {
  return (
    <div style={{
      position:   "fixed",
      inset:      0,
      background: "#010205",
      zIndex:     50,
    }}>
      <BackButton  onBack={onBack} />
      <StatusBadge />
      <Scene />
    </div>
  );
}
