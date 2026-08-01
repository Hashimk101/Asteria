import { useState, useEffect } from "react";

const MeteorIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M9 3L14 2L19 5L22 10L21 15L17 19L12 21L7 20L3 16L2 11L4 6Z" fill="currentColor" opacity="0.7" />
    <circle cx="8"  cy="8"  r="1.3" fill="rgba(0,0,0,0.4)" />
    <circle cx="15" cy="13" r="0.8" fill="rgba(0,0,0,0.3)" />
    <path d="M2 22L5 19"   stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.45" />
    <path d="M1 18L3.5 16" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.3"  />
  </svg>
);

const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="3" y1="6"  x2="21" y2="6"  />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="18" y1="6"  x2="6"  y2="18" />
    <line x1="6"  y1="6"  x2="18" y2="18" />
  </svg>
);

const links = [
  { label: "Home",       id: "hero"       },
  { label: "Data",       id: "stats"      },
  { label: "Features",   id: "features"   },
  { label: "Visualizer", id: "visualizer" },
];

export default function NavBar({onLaunch}) {
  const [menuOpen,      setMenuOpen]      = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  // Scroll tracker
  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY + 120;
      for (let i = links.length - 1; i >= 0; i--) {
        const el = document.getElementById(links[i].id);
        if (el && el.offsetTop <= scrollY) {
          setActiveSection(links[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // run once on mount
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Smooth scroll handler — bypasses hash routing issues
  const handleNav = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 80; // nav height clearance
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <nav style={{
      position:             "fixed",
      top:                  "14px",
      left:                 "50%",
      transform:            "translateX(-50%)",
      zIndex:               100,
      width:                "calc(100% - 48px)",
      maxWidth:             "920px",
      display:              "flex",
      alignItems:           "center",
      justifyContent:       "space-between",
      padding:              "8px 8px 8px 16px",
      background:           "rgba(8,5,0,0.88)",
      backdropFilter:       "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border:               "1px solid rgba(196,140,64,0.2)",
      borderRadius:         "6px",
    }}>

      {/* ── Logo ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <div style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: "#d4944a", boxShadow: "0 0 6px rgba(196,150,80,0.6)",
            marginRight: "6px", animation: "signal-blink 2.4s ease-in-out infinite",
          }} />
          <div style={{
            width: "26px", height: "26px", borderRadius: "4px",
            background: "rgba(196,140,64,0.08)", border: "1px solid rgba(196,140,64,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#d4944a",
          }}>
            <MeteorIcon />
          </div>
        </div>
        <div>
          <div className="orbitron" style={{ fontWeight: 700, fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#d4944a", lineHeight: 1 }}>
            ASTERIA
          </div>
          <div className="mono" style={{ fontSize: "8px", letterSpacing: "0.15em", color: "#6a5030", marginTop: "2px" }}>
            TRANSMISSION ACTIVE
          </div>
        </div>
      </div>

      {/* ── Desktop links ── */}
      <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
        {links.map(({ label, id }) => {
          const isActive = activeSection === id;
          return (
            <a
              key={id}
              href={`#${id}`}
              className="mono"
              onClick={e => handleNav(e, id)}
              style={{
                color:          isActive ? "#f0d4a0" : "#8a7060",
                fontSize:       "10px",
                letterSpacing:  "0.18em",
                textTransform:  "uppercase",
                textDecoration: "none",
                padding:        "8px 14px",
                borderRadius:   "4px",
                background:     isActive ? "rgba(196,140,64,0.1)" : "transparent",
                borderBottom:   isActive ? "1px solid rgba(196,140,64,0.5)" : "1px solid transparent",
                transition:     "all 0.2s ease",
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.color      = "#f0d4a0";
                  e.currentTarget.style.background = "rgba(196,140,64,0.07)";
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.color      = "#8a7060";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {label}
            </a>
          );
        })}

 <button
    onClick={onLaunch}
    className="mono"
    style={{
      marginLeft:  "10px",
      padding:     "9px 20px",
      borderRadius:"4px",
      background:  "rgba(196,140,64,0.07)",
      color:       "#d4944a",
      fontSize:    "10px",
      letterSpacing:"0.18em",
      textTransform:"uppercase",
      border:      "1px solid rgba(196,140,64,0.35)",
      transition:  "all 0.25s ease",
      whiteSpace:  "nowrap",
      animation:   "pulse-soft 4s ease-in-out infinite",
      display:     "flex",
      alignItems:  "center",
      gap:         "8px",
      cursor:      "pointer",
    }}
    onMouseEnter={e => {
      e.currentTarget.style.background  = "rgba(196,140,64,0.16)";
      e.currentTarget.style.color       = "#f0e0c8";
      e.currentTarget.style.borderColor = "rgba(196,140,64,0.6)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background  = "rgba(196,140,64,0.07)";
      e.currentTarget.style.color       = "#d4944a";
      e.currentTarget.style.borderColor = "rgba(196,140,64,0.35)";
    }}
  >
    <span style={{
      width: "5px", height: "5px", borderRadius: "50%",
      background: "#f0b878", display: "inline-block",
      animation: "signal-blink 1.2s ease-in-out infinite", flexShrink: 0,
    }} />
    Launch App
  </button>
      </div>

      {/* ── Mobile hamburger ── */}
      <button
        className="nav-hamburger"
        style={{ background: "none", border: "none", color: "#8a7060", cursor: "pointer" }}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        {menuOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      {/* ── Mobile drawer ── */}
      {menuOpen && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
          background: "rgba(8,5,0,0.96)", border: "1px solid rgba(196,140,64,0.2)",
          borderRadius: "6px", padding: "12px",
          display: "flex", flexDirection: "column", gap: "4px",
        }}>
          {links.map(({ label, id }) => (
            <a
              key={id}
              href={`#${id}`}
              className="mono"
              onClick={e => handleNav(e, id)}
              style={{
                color: "#8a7060", fontSize: "11px", letterSpacing: "0.18em",
                textTransform: "uppercase", textDecoration: "none",
                padding: "10px 14px", borderRadius: "4px", transition: "all 0.2s ease",
              }}
            >
              {label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
