import NavBar          from "../components/landing/NavBar";
import HeroSection     from "../components/landing/HeroSection";
import StatsBar        from "../components/landing/StatsBar";
import FeatureCarousel from "../components/landing/FeatureCarousel";
import GalaxyDust      from "../components/ui/GalaxyDust";

export default function LandingPage({ onLaunch }) {
  return (
    <>
      <GalaxyDust count={280} />

      <div style={{
        minHeight:  "100vh",
        color:      "#e8ddd0",
        overflowX:  "hidden",
        position:   "relative",
        zIndex:     2,
      }}>
        <NavBar onLaunch={onLaunch} />
        <HeroSection onLaunch={onLaunch} />

        <section id="stats" style={{
          position:  "relative",
          zIndex:    10,
          borderTop: "1px solid rgba(196,140,64,0.1)",
        }}>
          <StatsBar />
        </section>

        <section id="features" style={{ position: "relative", zIndex: 10 }}>
          <FeatureCarousel />
        </section>

        {/* Visualizer teaser — clicking launches the page */}
        <section id="visualizer" style={{
          position:  "relative",
          zIndex:    10,
          padding:   "96px 24px",
          textAlign: "center",
        }}>
          <div style={{
            maxWidth: "960px",
            margin:   "0 auto",
          }}>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", justifyContent: "center", marginBottom: "32px" }}>
              <div style={{ height: "1px", flex: 1, maxWidth: "120px", background: "linear-gradient(to right, transparent, rgba(196,140,64,0.25))" }} />
              <span className="mono" style={{ fontSize: "10px", letterSpacing: "0.3em", color: "#5a4a30" }}>
                ◉ TRANSMISSION CONTINUES ◉
              </span>
              <div style={{ height: "1px", flex: 1, maxWidth: "120px", background: "linear-gradient(to left, transparent, rgba(196,140,64,0.25))" }} />
            </div>

            <p className="mono" style={{ fontSize: "10px", letterSpacing: "0.4em", textTransform: "uppercase", color: "#6a5a3a", marginBottom: "14px" }}>
              ── Ready to Launch ──
            </p>

            <h2 className="orbitron" style={{
              fontSize:      "clamp(20px, 3.5vw, 38px)",
              fontWeight:    900,
              textTransform: "uppercase",
              color:         "#e0b880",
              textShadow:    "0 0 20px rgba(196,140,64,0.25)",
              marginBottom:  "16px",
            }}>
              3D Visualizer
            </h2>

            <p className="space-grotesk" style={{
              color:         "#8a7060",
              fontSize:      "15px",
              fontWeight:    300,
              lineHeight:    2,
              maxWidth:      "480px",
              margin:        "0 auto 40px",
              letterSpacing: "0.04em",
            }}>
              Earth-centered radar view, solar system orbital paths,
              impact energy calculator and live NEO trajectory animation.
            </p>

            {/* Big launch button */}
            <button
              onClick={onLaunch}
              className="mono"
              style={{
                padding:       "18px 56px",
                fontSize:      "12px",
                letterSpacing: "0.35em",
                textTransform: "uppercase",
                background:    "rgba(196,140,64,0.08)",
                color:         "#f0d4a0",
                border:        "1px solid rgba(196,140,64,0.5)",
                borderRadius:  "4px",
                cursor:        "pointer",
                display:       "inline-flex",
                alignItems:    "center",
                gap:           "14px",
                animation:     "pulse-soft 4s ease-in-out infinite",
                transition:    "all 0.25s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background  = "rgba(196,140,64,0.18)";
                e.currentTarget.style.borderColor = "rgba(196,140,64,0.8)";
                e.currentTarget.style.boxShadow   = "0 0 40px rgba(196,140,64,0.25)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background  = "rgba(196,140,64,0.08)";
                e.currentTarget.style.borderColor = "rgba(196,140,64,0.5)";
                e.currentTarget.style.boxShadow   = "none";
              }}
            >
              <span style={{
                width: "7px", height: "7px", borderRadius: "50%",
                background: "#f0b878",
                animation:  "signal-blink 1.2s ease-in-out infinite",
              }} />
              LAUNCH VISUALIZER
              <span style={{ opacity: 0.5, fontSize: "16px" }}>→</span>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", justifyContent: "center", marginTop: "64px" }}>
              <div style={{ height: "1px", flex: 1, maxWidth: "80px", background: "linear-gradient(to right, transparent, rgba(196,140,64,0.2))" }} />
              <span className="mono" style={{ fontSize: "10px", color: "#4a3a20", letterSpacing: "0.3em" }}>◉ END ◉</span>
              <div style={{ height: "1px", flex: 1, maxWidth: "80px", background: "linear-gradient(to left, transparent, rgba(196,140,64,0.2))" }} />
            </div>

          </div>
        </section>
      </div>
    </>
  );
}
