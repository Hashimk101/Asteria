import { useMemo } from "react";
import GridFloor     from "./GridFloor";
import CRTOverlay    from "./CRTOverlay";
import MeteorStreaks from "./MeteorStreak";
import { TelemetryBlock, BroadcastStatus } from "./BroadcastUI";
import heroImg from "../../assets/HeroIcon.png";

/* ── Stars ── */
function useStars(count = 200) {
  return useMemo(() => Array.from({ length: count }, (_, i) => {
    const seed = (i * 9.1) % 1;
    return {
      id:       i,
      size:     (((seed * 73)  % 1) * 3.0 + 0.6),
      top:      (((seed * 97)  % 1) * 100),
      left:     (((seed * 113) % 1) * 100),
      opacity:  (((seed * 131) % 1) * 0.75 + 0.15),
      delay:    (((seed * 149) % 1) * 7),
      duration: (((seed * 167) % 1) * 4 + 2),
    };
  }), [count]);
}

function SideStars({ stars }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3 }}>
      {stars.map(s => {
        if (s.left >= 28 && s.left <= 72) return null;
        return (
          <div key={s.id} className="star-twinkle" style={{
            position:          "absolute",
            width:             `${s.size}px`,
            height:            `${s.size}px`,
            borderRadius:      "50%",
            background:        s.size > 2.4 ? "rgba(255,240,180,0.95)" : "white",
            top:               `${s.top}%`,
            left:              `${s.left}%`,
            opacity:           s.opacity,
            animationDelay:    `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            boxShadow:         s.size > 2.4
              ? `0 0 ${s.size * 2}px rgba(255,220,120,0.7), 0 0 ${s.size * 4}px rgba(200,160,60,0.3)`
              : "none",
          }} />
        );
      })}
    </div>
  );
}





/* ── Nebula ── */
function NebulaClouds() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 4 }}>
      <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "55vw", height: "70vh", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(160,100,10,0.5) 0%, rgba(100,60,5,0.22) 40%, transparent 70%)", filter: "blur(50px)", transform: "rotate(-15deg)" }} />
      <div style={{ position: "absolute", top: "5%", right: "-10%", width: "50vw", height: "65vh", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(200,130,15,0.42) 0%, rgba(130,80,8,0.2) 40%, transparent 70%)", filter: "blur(55px)", transform: "rotate(12deg)" }} />
      <div style={{ position: "absolute", top: "15%", left: "50%", width: "60vw", height: "50vh", transform: "translateX(-50%)", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(110,65,5,0.55) 0%, rgba(60,35,3,0.28) 45%, transparent 70%)", filter: "blur(70px)" }} />
      <div style={{ position: "absolute", bottom: "0%", left: "5%", width: "40vw", height: "40vh", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(180,110,10,0.35) 0%, transparent 65%)", filter: "blur(75px)" }} />
      <div style={{ position: "absolute", bottom: "5%", right: "5%", width: "35vw", height: "35vh", borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(140,85,8,0.32) 0%, transparent 65%)", filter: "blur(65px)" }} />
    </div>
  );
}

/* ── Orbit rings ── */
function OrbitRing() {
  return (
    <svg
      style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%) rotateX(72deg)", pointerEvents: "none", overflow: "visible" }}
      width="680" height="200" viewBox="0 0 680 200"
    >
      <ellipse cx="340" cy="100" rx="330" ry="92" fill="none" stroke="rgba(196,140,64,0.15)" strokeWidth="1" strokeDasharray="2 12" />
      <ellipse cx="340" cy="100" rx="300" ry="82" fill="none" stroke="rgba(220,160,64,0.5)"  strokeWidth="1.5" strokeDasharray="6 8"  style={{ animation: "orbit-rotate 18s linear infinite" }} />
      <ellipse cx="340" cy="100" rx="240" ry="66" fill="none" stroke="rgba(196,140,64,0.2)"  strokeWidth="1"   strokeDasharray="3 14" style={{ animation: "orbit-rotate 28s linear infinite reverse" }} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
        const rad = (angle * Math.PI) / 180;
        const x   = 340 + 300 * Math.cos(rad);
        const y   = 100 + 82  * Math.sin(rad);
        return (
          <circle key={angle} cx={x} cy={y}
            r={angle % 90 === 0 ? 3 : 1.5}
            fill={angle % 90 === 0 ? "rgba(220,170,80,0.7)" : "rgba(196,140,64,0.4)"} />
        );
      })}
    </svg>
  );
}

/* ── Glitch title ── */
function GlitchTitle() {
  const base = {
    fontSize:      "clamp(64px, 10.5vw, 100px)",
    fontWeight:    900,
    textTransform: "uppercase",
    lineHeight:    1,
    letterSpacing: "0.1em",
    whiteSpace:    "nowrap",
    margin:        0,
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Base */}
      <h1 className="orbitron" style={{
        ...base,
        color:            "#f0dfa0",
        WebkitTextStroke: "1px rgba(220,185,70,0.6)",
        textShadow: `
          0 0  3px rgba(255,250,210,0.85),
          0 0 12px rgba(230,180,70,0.65),
          0 0 30px rgba(196,130,30,0.4),
          0 0 65px rgba(150,95,10,0.18)
        `,
        position: "relative",
        zIndex:   1,
      }}>
        ASTERIA
      </h1>

      {/* Glitch layer — red */}
      <h1 aria-hidden="true" className="orbitron" style={{
        ...base,
        position:  "absolute",
        top:       0,
        left:      0,
        color:     "rgba(255,50,50,0.8)",
        zIndex:    2,
        animation: "glitch-trigger 7s infinite, glitch-1 7s infinite",
        pointerEvents: "none",
      }}>
        ASTERIA
      </h1>

      {/* Glitch layer — cyan */}
      <h1 aria-hidden="true" className="orbitron" style={{
        ...base,
        position:  "absolute",
        top:       0,
        left:      0,
        color:     "rgba(40,200,255,0.7)",
        zIndex:    2,
        animation: "glitch-trigger 7s 0.35s infinite, glitch-2 7s 0.35s infinite",
        pointerEvents: "none",
      }}>
        ASTERIA
      </h1>
    </div>
  );
}

const ASTEROID_CLIP = `polygon(
  48% 0%, 63% 3%, 76% 9%, 86% 18%, 93% 29%,
  98% 42%, 100% 55%, 96% 67%, 89% 77%, 79% 85%,
  66% 91%, 53% 95%, 39% 93%, 27% 87%, 17% 78%,
  9% 67%, 3% 54%, 0% 41%, 3% 28%, 10% 17%,
  20% 9%, 33% 3%
)`;

/* ── Asteroid + title block ── */
function AsteroidWithTitle() {
  return (
    <div style={{
      position:       "relative",
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      justifyContent: "center",
      width:          "min(90vw, 680px)",
      zIndex:         20,
    }}>

      {/* TRANSMISSION INCOMING */}
      <div className="mono crt-flicker" style={{
        fontSize:      "10px",
        letterSpacing: "0.45em",
        textTransform: "uppercase",
        color:         "rgba(220,170,80,0.8)",
        marginBottom:  "12px",
        zIndex:        25,
        position:      "relative",
      }}>
        ── TRANSMISSION INCOMING ──
      </div>

      {/* Rock wrapper */}
      <div className="float" style={{
        position:       "relative",
        width:          "490px",
        height:         "490px",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
      }}>
        {/* Atmospheric haze */}
        <div style={{
          position:      "absolute",
          width:         "580px",
          height:        "580px",
          borderRadius:  "50%",
          background:    "radial-gradient(circle, rgba(180,120,20,0.2) 0%, rgba(100,60,5,0.1) 40%, transparent 70%)",
          filter:        "blur(40px)",
          pointerEvents: "none",
        }} />

        {/* Asteroid */}
        <div style={{
          position: "absolute",
          width:    "490px",
          height:   "490px",
          clipPath: ASTEROID_CLIP,
          overflow: "hidden",
          filter:   "drop-shadow(0 0 30px rgba(150,100,20,0.3)) drop-shadow(0 0 60px rgba(80,50,5,0.15))",
        }}>
          <img
            src={heroImg}
            alt="Asteroid"
            style={{
              width:     "100%",
              height:    "100%",
              objectFit: "cover",
              filter:    "brightness(0.65) contrast(1.3) saturate(0.7) sepia(0.4) saturate(1.4)",
              transform: "scale(1.1)",
            }}
            onError={e => {
              e.target.style.display = "none";
              e.target.parentElement.style.background =
                "radial-gradient(circle at 35% 35%, #3a2a0a, #140a00 70%)";
            }}
          />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, transparent 28%, rgba(8,5,0,0.82) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 82% 48%, rgba(196,140,64,0.18) 0%, transparent 38%), radial-gradient(ellipse at 18% 82%, rgba(140,90,20,0.12) 0%, transparent 32%)` }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 40% 35%, rgba(200,170,100,0.06), transparent 55%)", filter: "blur(8px)" }} />
        </div>

        <OrbitRing />
      </div>

      {/* ASTERIA glitch title */}
      <div style={{ marginTop: "-150px", zIndex: 25, position: "relative", textAlign: "center" }}>
        <GlitchTitle />

        {/* STATUS: TRACKING */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginTop: "12px" }}>
          <div style={{ height: "1px", width: "50px", background: "linear-gradient(to right, transparent, rgba(220,170,64,0.5))" }} />
          <span className="mono" style={{ fontSize: "10px", letterSpacing: "0.3em", color: "rgba(230,190,100,0.5)", fontWeight: "bold" }}>
            STATUS: TRACKING
          </span>
          <div style={{ height: "1px", width: "50px", background: "linear-gradient(to left, transparent, rgba(220,170,64,0.5))" }} />
        </div>
      </div>
    </div>
  );
}

/* ── Hero section ── */
export default function HeroSection({onLaunch}) {
  const stars = useStars(200);

  return (
    <section id="hero" style={{
      position:       "relative",
      width:          "100%",
      minHeight:      "100vh",
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      justifyContent: "center",
      overflow:       "hidden",
      background:     "#080500",
    }}>

      <NebulaClouds />
      <SideStars stars={stars} />
      <CRTOverlay />

      <div className="scanlines" style={{ position: "absolute", inset: 0, zIndex: 6, opacity: 0.25 }} />

      <MeteorStreaks />
      <TelemetryBlock />
      <BroadcastStatus />

      {/* Tagline */}
      <p className="mono crt-flicker" style={{
        position:      "relative",
        zIndex:        20,
        fontSize:      "9px",
        letterSpacing: "0.45em",
        textTransform: "uppercase",
        marginBottom:  "8px",
        color:         "#3a2a18",
      }}>
        NEAR-EARTH OBJECT&nbsp;&nbsp;
        <span style={{ color: "#c4844a" }}>BROADCAST SYSTEM</span>
      </p>

      <div style={{ position: "relative", zIndex: 20 }}>
        <AsteroidWithTitle />
      </div>

      {/* Subtitle */}
      <p className="space-grotesk" style={{
        position:      "relative",
        zIndex:        20,
        marginTop:     "6px",
        fontSize:      "clamp(11px, 1.3vw, 13px)",
        fontWeight:    300,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        textAlign:     "center",
        maxWidth:      "420px",
        color:         "#6a5a3a",
        lineHeight:    1.8,
      }}>
        Real-time Near-Earth Object Tracking &amp; Impact Simulation
      </p>

  <button
    onClick={onLaunch}
    className="mono"
    style={{
      position:       "relative",
      zIndex:         20,
      marginTop:      "28px",
      padding:        "14px 44px",
      fontSize:       "11px",
      letterSpacing:  "0.3em",
      textTransform:  "uppercase",
      border:         "1px solid rgba(196,140,64,0.5)",
      borderRadius:   "4px",
      color:          "#f0d4a0",
      background:     "rgba(196,140,64,0.08)",
      display:        "inline-flex",
      alignItems:     "center",
      gap:            "12px",
      animation:      "pulse-soft 4s ease-in-out infinite",
      transition:     "all 0.25s ease",
      cursor:         "pointer",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background  = "rgba(196,140,64,0.18)";
      e.currentTarget.style.borderColor = "rgba(196,140,64,0.8)";
      e.currentTarget.style.boxShadow   = "0 0 30px rgba(196,140,64,0.2)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background  = "rgba(196,140,64,0.08)";
      e.currentTarget.style.borderColor = "rgba(196,140,64,0.5)";
      e.currentTarget.style.boxShadow   = "none";
    }}
  >
    <span style={{
      width: "6px", height: "6px", borderRadius: "50%",
      background: "#f0b878", flexShrink: 0,
      animation: "signal-blink 1.2s ease-in-out infinite",
    }} />
    LAUNCH VISUALIZER
    <span style={{ opacity: 0.5 }}>→</span>
  </button>
      <GridFloor />
    </section>
  );
}
