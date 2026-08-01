import { useEffect, useRef, useState } from "react";

const MESSAGES = [
  "CALIBRATING ORBITAL MECHANICS...",
  "LOADING EARTH SURFACE DATA...",
  "SYNCING NASA HORIZONS...",
  "INITIALIZING RENDER ENGINE...",
  "PLOTTING GEOCENTRIC COORDINATES...",
  "ESTABLISHING TRANSMISSION...",
];

export default function LoadingScreen({ ready }) {
  const [progress,  setProgress]  = useState(0);
  const [msgIndex,  setMsgIndex]  = useState(0);
  const [visible,   setVisible]   = useState(true);
  const intervalRef = useRef(null);

  // Message cycler
  useEffect(() => {
    const t = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length);
    }, 700);
    return () => clearInterval(t);
  }, []);

  // Progress logic
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 92 && !ready) return p;          // soft stall at 92, not 85
        if (ready)             return 100;         // jump straight to 100
        // Accelerate naturally: fast early, slow near stall
        const step = p < 40 ? 8
                   : p < 70 ? 5
                   : p < 88 ? 2
                   :           0.5;
        return Math.min(p + step * Math.random(), 92);
      });
    }, 80);                                        // 80ms ticks = snappier

    return () => clearInterval(intervalRef.current);
  }, [ready]);

  // Stop interval + fade out when done
  useEffect(() => {
    if (progress >= 100) {
      clearInterval(intervalRef.current);
      const t = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(t);
    }
  }, [progress]);

  if (!visible) return null;

  const done = progress >= 100;

  return (
    <div style={{
      position:       "fixed",
      inset:          0,
      zIndex:         999,
      background:     "#010205",
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      justifyContent: "center",
      gap:            "32px",
      opacity:        done ? 0 : 1,
      transition:     "opacity 0.5s ease",
      pointerEvents:  done ? "none" : "all",
    }}>

      {/* Spinning arc */}
      <div style={{ position: "relative", width: "120px", height: "120px" }}>
        <div style={{
          position: "absolute", inset: 0,
          borderRadius: "50%",
          border: "1px solid rgba(196,140,64,0.12)",
          animation: "spin-slow 8s linear infinite",
        }} />
        <div style={{
          position: "absolute", inset: "14px",
          borderRadius: "50%",
          border: "1px solid rgba(196,140,64,0.07)",
          animation: "spin-slow 5s linear infinite reverse",
        }} />
        <svg
          style={{ position: "absolute", inset: 0, animation: "spin-slow 1.8s linear infinite" }}
          viewBox="0 0 120 120"
        >
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="rgba(196,140,64,0.75)"
            strokeWidth="1.5"
            strokeDasharray="55 285"
            strokeLinecap="round"
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: "#d4944a",
            boxShadow: "0 0 16px rgba(196,140,64,0.8)",
            animation: "signal-blink 1.4s ease-in-out infinite",
          }} />
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: "center" }}>
        <div className="orbitron" style={{
          fontSize: "18px", fontWeight: 900,
          letterSpacing: "0.4em", color: "#d4944a",
          textTransform: "uppercase",
          textShadow: "0 0 30px rgba(196,140,64,0.4)",
          marginBottom: "6px",
        }}>
          ASTERIA
        </div>
        <div className="mono" style={{
          fontSize: "9px", letterSpacing: "0.3em", color: "#5a4030",
        }}>
          3D VISUALIZER
        </div>
      </div>

      {/* Progress */}
      <div style={{ width: "260px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {/* Bar track */}
        <div style={{
          width: "100%", height: "1px",
          background: "rgba(196,140,64,0.08)",
          borderRadius: "1px", overflow: "hidden",
          position: "relative",
        }}>
          <div style={{
            height: "100%",
            width:  `${progress}%`,
            background: "linear-gradient(to right, rgba(196,140,64,0.3), #d4944a)",
            boxShadow:  "0 0 10px rgba(196,140,64,0.7)",
            transition: "width 0.08s linear",
          }} />
        </div>

        {/* Message + percent on same row */}
        <div style={{
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "center",
        }}>
          <div className="mono" style={{
            fontSize: "8px", letterSpacing: "0.2em",
            color: "rgba(196,140,64,0.4)",
            overflow: "hidden", whiteSpace: "nowrap",
            textOverflow: "ellipsis", maxWidth: "200px",
          }}>
            {MESSAGES[msgIndex]}
          </div>
          <div className="mono" style={{
            fontSize: "9px", letterSpacing: "0.15em",
            color: "rgba(196,140,64,0.5)",
            flexShrink: 0,
          }}>
            {Math.floor(progress)}%
          </div>
        </div>
      </div>

      {/* Subtle grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(rgba(196,140,64,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(196,140,64,0.015) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }} />
    </div>
  );
}

