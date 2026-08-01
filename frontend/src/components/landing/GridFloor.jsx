export default function GridFloor() {
  return (
    <div style={{
      position:      "absolute",
      bottom:        0,
      left:          0,
      right:         0,
      height:        "48%",
      overflow:      "hidden",
      pointerEvents: "none",
    }}>

      {/* Primary grid — amber orange */}
      <div style={{
        position:        "absolute",
        inset:           0,
        backgroundImage: `
          linear-gradient(to right,  rgba(196, 140, 64, 0.75) 3px, transparent 3px),
          linear-gradient(to bottom, rgba(196, 140, 64, 0.75) 3px, transparent 3px)
        `,
        backgroundSize:  "90px 90px",
        transform:       "perspective(480px) rotateX(62deg)",
        transformOrigin: "50% 0%",
        animation:       "grid-scroll 3s linear infinite",
        maskImage: `
          linear-gradient(to bottom,
            black           0%,
            black           35%,
            rgba(0,0,0,0.6) 60%,
            rgba(0,0,0,0.2) 80%,
            transparent     100%
          )
        `,
        WebkitMaskImage: `
          linear-gradient(to bottom,
            black           0%,
            black           35%,
            rgba(0,0,0,0.6) 60%,
            rgba(0,0,0,0.2) 80%,
            transparent     100%
          )
        `,
      }} />

      {/* Fine secondary grid */}
      <div style={{
        position:        "absolute",
        inset:           0,
        backgroundImage: `
          linear-gradient(to right,  rgba(196, 140, 64, 0.25) 3px, transparent 3px),
          linear-gradient(to bottom, rgba(196, 140, 64, 0.25) 3px, transparent 3px)
        `,
        backgroundSize:  "45px 45px",
        transform:       "perspective(480px) rotateX(62deg)",
        transformOrigin: "50% 0%",
        animation:       "grid-scroll 3s linear infinite",
        maskImage: `
          linear-gradient(to bottom,
            black           0%,
            black           25%,
            rgba(0,0,0,0.4) 50%,
            transparent     75%
          )
        `,
        WebkitMaskImage: `
          linear-gradient(to bottom,
            black           0%,
            black           25%,
            rgba(0,0,0,0.4) 50%,
            transparent     75%
          )
        `,
      }} />

      {/* Horizon line — amber glow */}
      <div style={{
        position:   "absolute",
        top:        0,
        left:       0,
        right:      0,
        height:     "5px",
        background: `linear-gradient(to right,
          transparent         0%,
          rgba(196,140,64,0.7) 8%,
          rgba(220,160,80,1.0) 30%,
          rgba(235,175,90,1.0) 50%,
          rgba(220,160,80,1.0) 70%,
          rgba(196,140,64,0.7) 92%,
          transparent         100%
        )`,
        boxShadow: `
          0 0  8px rgba(223, 159, 76, 0.9),
          0 0 20px rgba(196,140,64,0.6),
          0 0 45px rgba(196,140,64,0.3),
          0 0 80px rgba(196,140,64,0.12)
        `,
      }} />

      {/* Second thin horizon line */}
      <div style={{
        position:   "absolute",
        top:        "6px",
        left:       "10%",
        right:      "10%",
        height:     "4px",
        background: "linear-gradient(to right, transparent, rgba(196,140,64,0.3), transparent)",
        boxShadow:  "0 0 10px rgba(196,140,64,0.2)",
      }} />

      {/* Floor fade */}
      <div style={{
        position:   "absolute",
        inset:      0,
        background: "linear-gradient(to top, #080500 0%, #080500 8%, transparent 50%)",
      }} />
    </div>
  );
}
