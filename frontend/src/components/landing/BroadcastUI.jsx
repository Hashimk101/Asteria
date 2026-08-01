// Analog mission-control widgets — signal bars, radar, coordinates

function SignalBars({ strength = 4, max = 5 }) {
  return (
    <div style={{ display: "flex", gap: "2px", alignItems: "flex-end" }}>
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} style={{
          width:        "4px",
          height:       `${7 + i * 4}px`,
          background:   i < strength
            ? `rgba(196, 150, 80, ${0.5 + i * 0.1})`
            : "rgba(196, 140, 64, 0.12)",
          borderRadius: "1px",
        }} />
      ))}
    </div>
  );
}

function AnalogMeter({ label, value, max = 100 }) {
  const pct = Math.round((value / max) * 10);
  return (
    <div style={{ marginTop: "7px" }}>
      <div className="mono" style={{
        fontSize:      "10px",
        color:         "#8a7060",
        letterSpacing: "0.15em",
        marginBottom:  "4px",
      }}>
        {label}
      </div>
      <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{
            width:        "7px",
            height:       "9px",
            background:   i < pct
              ? `rgba(196, 150, 80, ${0.4 + i * 0.06})`
              : "rgba(196, 140, 64, 0.1)",
            borderRadius: "1px",
          }} />
        ))}
        <span className="mono" style={{
          fontSize:   "10px",
          color:      "#c4844a",
          marginLeft: "5px",
        }}>
          {value}%
        </span>
      </div>
    </div>
  );
}

function RadarDot() {
  return (
    <div style={{ position: "relative", width: "22px", height: "22px", flexShrink: 0 }}>
      {[0, 0.7, 1.4].map((delay, i) => (
        <div key={i} style={{
          position:     "absolute",
          inset:        0,
          borderRadius: "50%",
          border:       "1px solid rgba(196,150,80,0.5)",
          animation:    `signal-blink 2s ease-out ${delay}s infinite`,
          opacity:      0,
        }} />
      ))}
      <div style={{
        position:     "absolute",
        inset:        "7px",
        borderRadius: "50%",
        background:   "rgba(196,150,80,0.7)",
        boxShadow:    "0 0 6px rgba(196,150,80,0.5)",
      }} />
    </div>
  );
}

// ── Left telemetry panel ──────────────────────────────────
export function TelemetryBlock() {
  return (
    <div className="mono" style={{
      position:       "absolute",
      bottom:         "52%",
      left:           "20px",
      zIndex:         25,
      pointerEvents:  "none",
      padding:        "12px 14px",
      background:     "rgba(8, 5, 0, 0.65)",
      backdropFilter: "blur(6px)",
      border:         "1px solid rgba(196, 140, 64, 0.18)",
      borderRadius:   "4px",
      minWidth:       "150px",
    }}>

      {/* Header */}
      <div style={{
        display:       "flex",
        alignItems:    "center",
        gap:           "7px",
        marginBottom:  "10px",
        paddingBottom: "8px",
        borderBottom:  "1px solid rgba(196,140,64,0.15)",
      }}>
        <div style={{
          width:        "6px",
          height:       "6px",
          borderRadius: "50%",
          background:   "rgba(196,150,80,0.9)",
          boxShadow:    "0 0 5px rgba(196,150,80,0.6)",
          animation:    "signal-blink 1.8s ease-in-out infinite",
        }} />
        <span style={{
          fontSize:      "10px",
          letterSpacing: "0.2em",
          color:         "#d4944a",
        }}>
          SIGNAL DETECTED
        </span>
      </div>

      {/* Coordinates */}
      {[
        ["RA",   "14h 29m 43.0s"],
        ["DEC",  "+13° 47′ 32″"],
        ["DIST", "1.2 AU"],
        ["VEL",  "28.4 km/s"],
      ].map(([k, v]) => (
        <div key={k} style={{
          display:        "flex",
          justifyContent: "space-between",
          gap:            "14px",
          marginBottom:   "4px",
        }}>
          <span style={{
            fontSize:      "10px",
            color:         "#7a6a50",
            letterSpacing: "0.1em",
          }}>
            {k}
          </span>
          <span style={{
            fontSize:      "10px",
            color:         "#c4844a",
            letterSpacing: "0.05em",
          }}>
            {v}
          </span>
        </div>
      ))}

      {/* Meters */}
      <div style={{
        marginTop:  "10px",
        paddingTop: "8px",
        borderTop:  "1px solid rgba(196,140,64,0.15)",
      }}>
        <AnalogMeter label="SIGNAL STR" value={87} />
        <AnalogMeter label="NOISE LVL"  value={23} />
      </div>

      {/* Signal bars */}
      <div style={{
        marginTop:  "10px",
        display:    "flex",
        alignItems: "center",
        gap:        "8px",
      }}>
        <SignalBars strength={4} />
        <span style={{
          fontSize:      "10px",
          color:         "#8a7060",
          letterSpacing: "0.1em",
        }}>
          CH 03
        </span>
      </div>
    </div>
  );
}

// ── Right broadcast panel ─────────────────────────────────
export function BroadcastStatus() {
  return (
    <div className="mono" style={{
      position:       "absolute",
      bottom:         "52%",
      right:          "20px",
      zIndex:         25,
      pointerEvents:  "none",
      padding:        "12px 14px",
      background:     "rgba(8, 5, 0, 0.65)",
      backdropFilter: "blur(6px)",
      border:         "1px solid rgba(196, 140, 64, 0.18)",
      borderRadius:   "4px",
      minWidth:       "150px",
      textAlign:      "right",
    }}>

      {/* Header */}
      <div style={{
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "flex-end",
        gap:             "7px",
        marginBottom:    "10px",
        paddingBottom:   "8px",
        borderBottom:    "1px solid rgba(196,140,64,0.15)",
      }}>
        <span style={{
          fontSize:      "10px",
          letterSpacing: "0.2em",
          color:         "#d4944a",
          animation:     "signal-blink 1.4s ease-in-out infinite",
        }}>
          BROADCAST LIVE
        </span>
        <div style={{
          width:        "6px",
          height:       "6px",
          borderRadius: "50%",
          background:   "rgba(196,150,80,0.9)",
          boxShadow:    "0 0 5px rgba(196,150,80,0.6)",
          animation:    "signal-blink 1.4s ease-in-out infinite",
        }} />
      </div>

      {/* Data rows */}
      {[
        ["FREQ", "433.92 MHz"],
        ["LAT",  "28.5° N"],
        ["LON",  "80.6° W"],
        ["CHAN", "08"],
      ].map(([k, v]) => (
        <div key={k} style={{
          display:        "flex",
          justifyContent: "flex-end",
          gap:            "14px",
          marginBottom:   "4px",
        }}>
          <span style={{
            fontSize:      "10px",
            color:         "#7a6a50",
            letterSpacing: "0.1em",
          }}>
            {k}
          </span>
          <span style={{
            fontSize: "10px",
            color:    "#c4844a",
          }}>
            {v}
          </span>
        </div>
      ))}

      {/* Meters */}
      <div style={{
        marginTop:  "10px",
        paddingTop: "8px",
        borderTop:  "1px solid rgba(196,140,64,0.15)",
      }}>
        <AnalogMeter label="TRACKING" value={91} />
        <AnalogMeter label="LOCK STR" value={78} />
      </div>

      {/* Radar */}
      <div style={{
        marginTop:      "10px",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "flex-end",
        gap:            "8px",
      }}>
        <span style={{
          fontSize:      "10px",
          color:         "#8a7060",
          letterSpacing: "0.1em",
        }}>
          SCANNING
        </span>
        <RadarDot />
      </div>
    </div>
  );
}

// ── Top chyron ────────────────────────────────────────────
export function BroadcastLabel() {
  return (
    <div className="mono" style={{
      position:      "absolute",
      top:           "68px",
      left:          "50%",
      transform:     "translateX(-50%)",
      zIndex:        25,
      pointerEvents: "none",
      whiteSpace:    "nowrap",
      textAlign:     "center",
    }}>
      <span style={{
        fontSize:      "10px",
        letterSpacing: "0.4em",
        color:         "#5a4a30",
      }}>
        ── TRANSMISSION INCOMING ──
      </span>
    </div>
  );
}
