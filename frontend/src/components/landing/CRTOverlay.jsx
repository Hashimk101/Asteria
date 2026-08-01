export default function CRTOverlay() {
  return (
    <>
      {/* SVG filter defs */}
      <svg width="0" height="0" style={{ position: "absolute", overflow: "hidden" }} aria-hidden="true">
        <defs>
          <filter id="rgb-split" x="-3%" y="-3%" width="106%" height="106%"
                  colorInterpolationFilters="sRGB">
            <feOffset in="SourceGraphic" dx="-1.5" dy="0" result="r" />
            <feOffset in="SourceGraphic" dx="1.5"  dy="0" result="b" />
            <feColorMatrix in="r" type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="rOnly" />
            <feColorMatrix in="b" type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="bOnly" />
            <feColorMatrix in="SourceGraphic" type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="gOnly" />
            <feBlend in="rOnly" in2="gOnly" mode="screen" result="rg" />
            <feBlend in="rg"    in2="bOnly" mode="screen" />
          </filter>
        </defs>
      </svg>

      {/* RGB chromatic aberration — edges only */}
      <div style={{
        position:        "absolute",
        inset:           0,
        zIndex:          18,
        pointerEvents:   "none",
        filter:          "url(#rgb-split)",
        opacity:         0.18,
        background:      "transparent",
        mixBlendMode:    "screen",
        maskImage:       "radial-gradient(ellipse at center, transparent 50%, black 100%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, transparent 50%, black 100%)",
      }} />

      {/* Moving scanline bar */}
      <div className="scanline-bar" />

      {/* Film grain */}
      <div className="film-grain" />

      {/* Vignette — warm dark brown undertone instead of purple */}
      <div style={{
        position:      "absolute",
        inset:         0,
        background:    "radial-gradient(ellipse at 50% 40%, transparent 40%, rgba(8,5,0,0.65) 100%)",
        pointerEvents: "none",
        zIndex:        16,
      }} />

      {/* Corner brackets — amber tint */}
      {[
        { top: "12px",    left:  "12px",    borderTop:    "1px solid rgba(196,140,64,0.25)", borderLeft:   "1px solid rgba(196,140,64,0.25)" },
        { top: "12px",    right: "12px",    borderTop:    "1px solid rgba(196,140,64,0.25)", borderRight:  "1px solid rgba(196,140,64,0.25)" },
        { bottom: "12px", left:  "12px",    borderBottom: "1px solid rgba(196,140,64,0.25)", borderLeft:   "1px solid rgba(196,140,64,0.25)" },
        { bottom: "12px", right: "12px",    borderBottom: "1px solid rgba(196,140,64,0.25)", borderRight:  "1px solid rgba(196,140,64,0.25)" },
      ].map((s, i) => (
        <div key={i} style={{ position: "absolute", width: "18px", height: "18px", pointerEvents: "none", zIndex: 30, ...s }} />
      ))}
    </>
  );
}
