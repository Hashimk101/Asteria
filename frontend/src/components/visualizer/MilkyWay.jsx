import { useRef, useMemo } from "react";
import { useFrame }        from "@react-three/fiber";
import { Stars }           from "@react-three/drei";
import * as THREE          from "three";

function MilkyWayBand() {
  const meshRef = useRef();

  const texture = useMemo(() => {
    const w = 2048, h = 512;
    const canvas = document.createElement("canvas");
    canvas.width  = w;
    canvas.height = h;
    const ctx     = canvas.getContext("2d");

    // Pure void base — matches surface: #181305
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);

    // ── Core band — dusty amber, NOT red ─────────────────
    // Palette refs: primary-container #c4844a, surface #181305
    const band = ctx.createLinearGradient(0, 0, 0, h);
    band.addColorStop(0,    "rgba(0,0,0,0)");
    band.addColorStop(0.18, "rgba(12,9,3,0.15)");
    band.addColorStop(0.35, "rgba(28,20,7,0.40)");
    band.addColorStop(0.44, "rgba(52,36,12,0.65)");
    band.addColorStop(0.50, "rgba(68,46,14,0.78)");   // ≈ #c4844a at low opacity
    band.addColorStop(0.56, "rgba(52,36,12,0.65)");
    band.addColorStop(0.65, "rgba(28,20,7,0.40)");
    band.addColorStop(0.82, "rgba(12,9,3,0.15)");
    band.addColorStop(1,    "rgba(0,0,0,0)");
    ctx.fillStyle = band;
    ctx.fillRect(0, 0, w, h);

    // ── Nebula blobs — warm amber/gold only ──────────────
    // All derived from palette: primary #ffb779, secondary-container #564729
    const blobs = [
      // Dim amber clouds
      { x: 0.07, y: 0.50, r: 0.11, color: "rgba(196,132,74,0.22)"  },  // #c4844a
      { x: 0.18, y: 0.48, r: 0.08, color: "rgba(180,120,60,0.18)"  },
      { x: 0.28, y: 0.52, r: 0.14, color: "rgba(86,71,41,0.35)"    },  // #564729
      { x: 0.38, y: 0.47, r: 0.09, color: "rgba(210,150,80,0.16)"  },  // warm gold
      { x: 0.48, y: 0.50, r: 0.15, color: "rgba(104,82,48,0.40)"   },  // mid amber
      { x: 0.57, y: 0.49, r: 0.10, color: "rgba(196,132,74,0.20)"  },
      { x: 0.67, y: 0.52, r: 0.12, color: "rgba(86,71,41,0.32)"    },
      { x: 0.77, y: 0.48, r: 0.09, color: "rgba(170,110,50,0.18)"  },
      { x: 0.88, y: 0.51, r: 0.10, color: "rgba(196,132,74,0.22)"  },
      // Bright hot-spot cores — #ffb779 at very low opacity
      { x: 0.22, y: 0.50, r: 0.035, color: "rgba(255,183,121,0.18)" },
      { x: 0.50, y: 0.50, r: 0.045, color: "rgba(255,183,121,0.20)" },
      { x: 0.74, y: 0.50, r: 0.030, color: "rgba(255,183,121,0.15)" },
    ];

    blobs.forEach(({ x, y, r, color }) => {
      const g = ctx.createRadialGradient(
        x * w, y * h, 0,
        x * w, y * h, r * w
      );
      g.addColorStop(0,    color);
      g.addColorStop(0.5,  color.replace(/[\d.]+\)$/, "0.08)"));
      g.addColorStop(1,    "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });

    // ── Dust lanes — dark voids cutting through the band ─
    ctx.globalCompositeOperation = "multiply";
    [
      [0.15, 0.47, 0.16, 0.022],
      [0.42, 0.53, 0.13, 0.018],
      [0.70, 0.48, 0.15, 0.020],
    ].forEach(([x, y, rw, rh]) => {
      ctx.fillStyle = "rgba(0,0,0,0.60)";
      ctx.beginPath();
      ctx.ellipse(x * w, y * h, rw * w, rh * h, 0.06, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalCompositeOperation = "source-over";

    // ── Subtle outer feather — blends into void ──────────
    const feather = ctx.createLinearGradient(0, 0, 0, h);
    feather.addColorStop(0,    "rgba(0,0,0,0)");
    feather.addColorStop(0.40, "rgba(24,19,5,0.08)");   // #181305 tint
    feather.addColorStop(0.50, "rgba(36,26,8,0.14)");
    feather.addColorStop(0.60, "rgba(24,19,5,0.08)");
    feather.addColorStop(1,    "rgba(0,0,0,0)");
    ctx.fillStyle = feather;
    ctx.fillRect(0, 0, w, h);

    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.002;
  });

  return (
    <mesh ref={meshRef} rotation={[Math.PI * 0.08, 0.5, 0]}>
      <sphereGeometry args={[4000, 64, 32]} />
      <meshBasicMaterial
        map={texture}
        side={THREE.BackSide}
        transparent
        opacity={0.75}          // pulled back — less dominant, more atmospheric
        depthWrite={false}
      />
    </mesh>
  );
}

export default function MilkyWay() {
  return (
    <>
      {/* Deep field — near-white tiny stars, no color bias */}
      <Stars
        radius={3000}
        depth={200}
        count={10000}
        factor={1.5}
        saturation={0.05}       // almost white — neutral against amber band
        fade
        speed={0}
      />

      {/* Foreground scattered stars — slightly warmer */}
      <Stars
        radius={1000}
        depth={80}
        count={2000}
        factor={2.8}
        saturation={0.08}
        fade
        speed={0}
      />

      <MilkyWayBand />
    </>
  );
}
