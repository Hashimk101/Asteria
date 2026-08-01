import { useState }        from "react";
import { useScrollReveal } from "./useScrollReveal";

// ── Images ────────────────────────────────────────────────
import card1 from "../../assets/feature_cards/card_1.jpg";
import card2 from "../../assets/feature_cards/card_2.png";
import card3 from "../../assets/feature_cards/card_3.png";
import card4 from "../../assets/feature_cards/card_4.png";

const FEATURES = [
  {
    id:     "earth-view",
    image:  card1,
    tag:    "VIEW MODE 01",
    title:  "Earth-Centered Radar",
    desc:   "Earth locked at origin. All NEOs plotted relative to us in real-time geocentric coordinates from JPL Horizons. The threat radar you actually need.",
    detail: "Every object is rendered at its true geocentric distance using live JPL Horizons ephemeris data. Positions update hourly. Threat vectors are color-coded by miss distance.",
    stat:   { label: "Update Freq", value: "Hourly" },
    stats:  [
      { label: "Data Source",  value: "JPL Horizons" },
      { label: "Coord System", value: "Geocentric"   },
      { label: "Update Freq",  value: "Hourly"       },
    ],
    accent: "#60b0f0",
    border: "rgba(80,160,220,0.35)",
    color:  "rgba(80,160,220,0.08)",
  },
  {
    id:     "solar-view",
    image:  card2,
    tag:    "VIEW MODE 02",
    title:  "Solar System View",
    desc:   "Sun at origin. Watch Earth and NEOs trace their real orbital paths simultaneously. Heliocentric coordinates, true scale, live positions.",
    detail: "Orbital paths are computed from real Keplerian elements. Watch asteroids sweep through their ellipses in accelerated time. Toggle between real-time and 30-day forecast.",
    stat:   { label: "Objects Shown", value: "All NEOs" },
    stats:  [
      { label: "Coord System", value: "Heliocentric" },
      { label: "Objects",      value: "All NEOs"     },
      { label: "Time Mode",    value: "Live + Forecast" },
    ],
    accent: "#f0c040",
    border: "rgba(220,170,60,0.35)",
    color:  "rgba(220,170,60,0.08)",
  },
  {
    id:     "risk",
    image:  card3,
    tag:    "IMPACT ENGINE",
    title:  "Risk & Impact Calc",
    desc:   "Kinetic energy, crater diameter, blast radius and fireball size — computed from real diameter + velocity data. Torino & Palermo scales from JPL Sentry.",
    detail: "Impact parameters are derived from the Collins et al. impact effects model. Crater scaling uses Pi-group scaling laws. All values are probabilistic ranges, not point estimates.",
    stat:   { label: "Data Source", value: "JPL Sentry" },
    stats:  [
      { label: "Scale",       value: "Torino + Palermo" },
      { label: "Model",       value: "Collins et al."   },
      { label: "Data Source", value: "JPL Sentry"       },
    ],
    accent: "#f06050",
    border: "rgba(220,80,60,0.35)",
    color:  "rgba(220,80,60,0.08)",
  },
  {
    id:     "live",
    image:  card4,
    tag:    "LIVE FEED",
    title:  "Live NASA Data",
    desc:   "NeoWs + SBDB + Horizons + Sentry stitched into one unified object per asteroid. Today's close approaches, orbital elements, and trajectory vectors.",
    detail: "Four NASA APIs are queried, deduplicated by SPK-ID, and merged into a single canonical object. Latency from NASA to your screen is under 2 seconds on cache miss.",
    stat:   { label: "Source", value: "NASA NeoWs" },
    stats:  [
      { label: "APIs",    value: "NeoWs · SBDB · Horizons" },
      { label: "Latency", value: "< 2s"                    },
      { label: "Key",     value: "SPK-ID Dedup"            },
    ],
    accent: "#50e090",
    border: "rgba(80,220,140,0.35)",
    color:  "rgba(80,220,140,0.08)",
  },
];

// ── Single card ───────────────────────────────────────────
function FeatureCard({ feature, isActive, onClick, index }) {
  const { image, tag, title, desc, accent, border, color } = feature;

  return (
    <div
      onClick={onClick}
      style={{
        flex:          "0 0 260px",
        borderRadius:  "0px",                        // sharp — design system
        border:        `1px solid ${isActive ? border : "rgba(196,140,64,0.10)"}`,
        background:    isActive ? color : "rgba(8,5,0,0.55)",
        cursor:        "pointer",
        transition:    "all 0.35s cubic-bezier(0.4,0,0.2,1)",
        transform:     isActive ? "translateY(-8px)" : "translateY(0)",
        backdropFilter:"blur(12px)",
        position:      "relative",
        overflow:      "hidden",
        display:       "flex",
        flexDirection: "column",
        boxShadow:     isActive
          ? `0 0 32px ${accent}22, 0 8px 32px rgba(0,0,0,0.4)`
          : "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      {/* Top glow bar */}
      {isActive && (
        <div style={{
          position:   "absolute",
          top:        0, left: 0, right: 0,
          height:     "1px",
          background: `linear-gradient(to right, transparent, ${accent}cc, transparent)`,
          zIndex:     2,
        }} />
      )}

      {/* Image area */}
      <div style={{
        position:   "relative",
        width:      "100%",
        height:     "160px",
        overflow:   "hidden",
        flexShrink: 0,
      }}>
        <img
          src={image}
          alt={title}
          style={{
            width:      "100%",
            height:     "100%",
            objectFit:  "cover",
            transition: "transform 0.6s ease, filter 0.4s ease",
            filter:     isActive
              ? "brightness(0.95) saturate(1.1)"
              : "brightness(0.55) saturate(0.7) sepia(0.2)",
            transform:  isActive ? "scale(1.04)" : "scale(1.0)",
          }}
        />

        {/* Image overlay gradient — always present */}
        <div style={{
          position:   "absolute",
          inset:      0,
          background: isActive
            ? `linear-gradient(to bottom, ${accent}18 0%, rgba(8,5,0,0.5) 100%)`
            : "linear-gradient(to bottom, rgba(8,5,0,0.3) 0%, rgba(8,5,0,0.75) 100%)",
          transition: "background 0.4s ease",
        }} />

        {/* Tag badge — top left */}
        <div className="mono" style={{
          position:      "absolute",
          top:           "10px",
          left:          "10px",
          fontSize:      "7px",
          letterSpacing: "0.3em",
          color:         isActive ? accent : "rgba(196,140,64,0.6)",
          background:    "rgba(8,5,0,0.75)",
          border:        `1px solid ${isActive ? accent + "55" : "rgba(196,140,64,0.15)"}`,
          padding:       "3px 8px",
          transition:    "all 0.3s",
          backdropFilter:"blur(4px)",
        }}>
          {tag}
        </div>

        {/* Index number — bottom right */}
        <div className="mono" style={{
          position:      "absolute",
          bottom:        "10px",
          right:         "10px",
          fontSize:      "28px",
          fontWeight:    900,
          color:         isActive ? `${accent}33` : "rgba(196,140,64,0.08)",
          lineHeight:    1,
          transition:    "color 0.3s",
          userSelect:    "none",
        }}>
          {String(index + 1).padStart(2, "0")}
        </div>
      </div>

      {/* Text content */}
      <div style={{ padding: "18px 20px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 className="orbitron" style={{
          fontSize:      "12px",
          fontWeight:    700,
          letterSpacing: "0.1em",
          color:         isActive ? "#f0dfa0" : "#6a5040",
          marginBottom:  "8px",
          transition:    "color 0.3s",
          textTransform: "uppercase",
        }}>
          {title}
        </h3>

        <p className="space-grotesk" style={{
          fontSize:   "11.5px",
          lineHeight: 1.65,
          color:      isActive ? "rgba(237,225,201,0.72)" : "rgba(140,112,96,0.55)",
          transition: "color 0.3s",
          flex:       1,
        }}>
          {desc}
        </p>

        {/* Bottom stat row */}
        <div style={{
          marginTop:      "14px",
          paddingTop:     "10px",
          borderTop:      `1px solid ${isActive ? border : "rgba(196,140,64,0.07)"}`,
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "center",
          transition:     "border-color 0.3s",
        }}>
          <span className="mono" style={{
            fontSize:      "7px",
            letterSpacing: "0.25em",
            color:         "rgba(196,140,64,0.35)",
            textTransform: "uppercase",
          }}>
            {feature.stat.label}
          </span>
          <span className="mono" style={{
            fontSize:      "8px",
            letterSpacing: "0.15em",
            color:         isActive ? accent : "rgba(196,140,64,0.4)",
            fontWeight:    "bold",
            transition:    "color 0.3s",
          }}>
            {feature.stat.value}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Expanded detail panel ─────────────────────────────────
function DetailPanel({ feature }) {
  const { image, tag, title, detail, stats, accent, border, color } = feature;

  return (
    <div
      key={feature.id}
      style={{
        maxWidth:      "1120px",
        width:         "100%",
        marginTop:     "24px",
        border:        `1px solid ${border}`,
        background:    color,
        backdropFilter:"blur(16px)",
        display:       "flex",
        gap:           "0",
        overflow:      "hidden",
        animation:     "panel-in 0.35s cubic-bezier(0.4,0,0.2,1)",
        position:      "relative",
      }}
    >
      {/* Left accent bar */}
      <div style={{
        width:      "2px",
        flexShrink: 0,
        background: `linear-gradient(to bottom, transparent, ${accent}, transparent)`,
      }} />

      {/* Image strip */}
      <div style={{
        width:    "220px",
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
      }}>
        <img
          src={image}
          alt={title}
          style={{
            width:     "100%",
            height:    "100%",
            objectFit: "cover",
            filter:    "brightness(0.7) saturate(0.85)",
          }}
        />
        <div style={{
          position:   "absolute",
          inset:      0,
          background: `linear-gradient(to right, rgba(8,5,0,0) 60%, rgba(8,5,0,0.9) 100%)`,
        }} />
      </div>

      {/* Content */}
      <div style={{ padding: "24px 28px", flex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <div className="mono" style={{
            fontSize:      "7px",
            letterSpacing: "0.35em",
            color:         accent,
            border:        `1px solid ${accent}44`,
            padding:       "3px 8px",
          }}>
            {tag}
          </div>
          <div style={{ flex: 1, height: "1px", background: `linear-gradient(to right, ${accent}44, transparent)` }} />
        </div>

        <h3 className="orbitron" style={{
          fontSize:      "15px",
          fontWeight:    700,
          letterSpacing: "0.1em",
          color:         "#f0dfa0",
          marginBottom:  "10px",
        }}>
          {title}
        </h3>

        <p className="space-grotesk" style={{
          fontSize:    "13px",
          lineHeight:  1.7,
          color:       "rgba(237,225,201,0.65)",
          maxWidth:    "520px",
          marginBottom:"20px",
        }}>
          {detail}
        </p>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
          {stats.map(s => (
            <div key={s.label} style={{
              display:       "flex",
              flexDirection: "column",
              gap:           "4px",
              padding:       "10px 16px",
              border:        `1px solid ${border}`,
              background:    "rgba(8,5,0,0.4)",
              minWidth:      "100px",
            }}>
              <span className="mono" style={{
                fontSize:      "7px",
                letterSpacing: "0.3em",
                color:         "rgba(196,140,64,0.4)",
                textTransform: "uppercase",
              }}>
                {s.label}
              </span>
              <span className="mono" style={{
                fontSize:      "11px",
                letterSpacing: "0.1em",
                color:         accent,
                fontWeight:    "bold",
              }}>
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────
export default function FeatureCarousel() {
  const [active, setActive]   = useState("earth-view");
  const [ref, visible]        = useScrollReveal();
  const activeFeature         = FEATURES.find(f => f.id === active);

  return (
    <>
      {/* Inject panel-in keyframe once */}
      <style>{`
        @keyframes panel-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>

      <section
        id="features"
        ref={ref}
        style={{
          position:      "relative",
          width:         "100%",
          padding:       "100px 24px",
          display:       "flex",
          flexDirection: "column",
          alignItems:    "center",
          opacity:       visible ? 1 : 0,
          transform:     visible ? "translateY(0)" : "translateY(40px)",
          transition:    "opacity 0.8s ease, transform 0.8s ease",
        }}
      >
        {/* Section header */}
        <div className="mono" style={{
          fontSize:      "9px",
          letterSpacing: "0.45em",
          color:         "rgba(196,140,64,0.5)",
          marginBottom:  "12px",
          textTransform: "uppercase",
        }}>
          ── SYSTEM CAPABILITIES ──
        </div>

        <h2 className="orbitron" style={{
          fontSize:      "clamp(24px, 4vw, 40px)",
          fontWeight:    900,
          color:         "#f0dfa0",
          letterSpacing: "0.08em",
          textAlign:     "center",
          marginBottom:  "8px",
          textShadow:    "0 0 30px rgba(196,130,30,0.3)",
        }}>
          WHAT ASTERIA DOES
        </h2>

        <p className="space-grotesk" style={{
          fontSize:      "13px",
          color:         "#6a5a3a",
          letterSpacing: "0.1em",
          marginBottom:  "52px",
          textAlign:     "center",
        }}>
          Four integrated NASA data sources. One unified view.
        </p>

        {/* Cards row */}
        <div style={{
          display:        "flex",
          gap:            "14px",
          overflowX:      "auto",
          maxWidth:       "1120px",
          width:          "100%",
          paddingBottom:  "4px",
          scrollbarWidth: "none",
        }}>
          {FEATURES.map((f, i) => (
            <FeatureCard
              key={f.id}
              feature={f}
              index={i}
              isActive={active === f.id}
              onClick={() => setActive(f.id)}
            />
          ))}
        </div>

        {/* Expanded detail panel */}
        <DetailPanel feature={activeFeature} />

        {/* Dot indicators */}
        <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
          {FEATURES.map(f => (
            <div
              key={f.id}
              onClick={() => setActive(f.id)}
              style={{
                width:        active === f.id ? "20px" : "6px",
                height:       "6px",
                borderRadius: "3px",
                background:   active === f.id
                  ? FEATURES.find(x => x.id === active).accent
                  : "rgba(196,140,64,0.2)",
                cursor:       "pointer",
                transition:   "all 0.3s ease",
              }}
            />
          ))}
        </div>
      </section>
    </>
  );
}
