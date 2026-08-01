import { useState } from "react";

function generateDust(count) {
  return Array.from({ length: count }, (_, i) => {
    const tier = i % 10 < 2 ? 2   // 20% bright accent stars
               : i % 10 < 5 ? 1   // 30% mid stars
               :               0;  // 50% fine dust

    return {
      id:       i,
      tier,
      size:
        tier === 2 ? Math.random() * 1.2 + 1.0   // 1.0 – 2.2px  (was 2.5–5.5)
        : tier === 1 ? Math.random() * 0.8 + 0.6 // 0.6 – 1.4px  (was 1.0–2.8)
        :              Math.random() * 0.5 + 0.2, // 0.2 – 0.7px  fine dust
      top:      Math.random() * 100,
      left:     Math.random() * 100,
      opacity:
        tier === 2 ? Math.random() * 0.3  + 0.6  // 0.60 – 0.90
        : tier === 1 ? Math.random() * 0.3 + 0.35 // 0.35 – 0.65
        :              Math.random() * 0.25 + 0.15,// 0.15 – 0.40
      duration: Math.random() * 12 + 6,
      delay:    Math.random() * 14,
      driftX:   (Math.random() - 0.5) * 30,
      driftY:   (Math.random() - 0.5) * 20,
      colorType: Math.floor(Math.random() * 4),
    };
  });
}

export default function GalaxyDust({ count = 350 }) {
  const [dust] = useState(() => generateDust(count));

  return (
    <>
      <style>{`
        @keyframes float-a {
          0%   { transform: translate(0px, 0px); }
          33%  { transform: translate(var(--dx1), var(--dy1)); }
          66%  { transform: translate(var(--dx2), var(--dy2)); }
          100% { transform: translate(0px, 0px); }
        }
        @keyframes float-b {
          0%   { transform: translate(0px, 0px); }
          50%  { transform: translate(var(--dx1), var(--dy2)); }
          100% { transform: translate(0px, 0px); }
        }
        @keyframes pulse-star {
          0%,100% { opacity: var(--op); transform: scale(1);   }
          50%     { opacity: 1;         transform: scale(1.5); }
        }
        @keyframes twinkle {
          0%,100% { opacity: var(--op); }
          50%     { opacity: calc(var(--op) * 0.3); }
        }
      `}</style>

      <div style={{
        position:      "fixed",
        inset:         0,
        pointerEvents: "none",
        zIndex:        0,
        overflow:      "hidden",
      }}>
        {dust.map(p => {
          const colors = [
            "rgba(255,245,200,1)",    // warm white
            "rgba(230,175,75,0.95)",  // amber
            "rgba(175,210,255,0.9)",  // ice blue
            "rgba(255,225,155,0.95)", // gold
          ];

          // Glow only on tier 2 — tiny but punchy
          const glow =
            p.tier === 2
              ? `0 0 ${p.size * 2.5}px rgba(255,215,100,0.9), 0 0 ${p.size * 5}px rgba(196,140,64,0.5)`
              : p.tier === 1
              ? `0 0 ${p.size * 1.5}px rgba(220,175,80,0.4)`
              : "none";

          const anim =
            p.tier === 2
              ? `pulse-star ${p.duration * 0.7}s ${p.delay}s ease-in-out infinite`
              : p.tier === 1
              ? `twinkle ${p.duration}s ${p.delay}s ease-in-out infinite, float-b ${p.duration * 1.4}s ${p.delay * 0.5}s ease-in-out infinite`
              : `float-a ${p.duration}s ${p.delay}s ease-in-out infinite`;

          return (
            <div
              key={p.id}
              style={{
                position:     "absolute",
                top:          `${p.top}%`,
                left:         `${p.left}%`,
                width:        `${p.size}px`,
                height:       `${p.size}px`,
                borderRadius: "50%",
                background:   colors[p.colorType],
                opacity:      p.opacity,
                boxShadow:    glow,
                animation:    anim,
                "--op":       p.opacity,
                "--dx1":      `${p.driftX}px`,
                "--dy1":      `${p.driftY}px`,
                "--dx2":      `${-p.driftX * 0.7}px`,
                "--dy2":      `${-p.driftY * 0.6}px`,
              }}
            />
          );
        })}
      </div>
    </>
  );
}
