import { Suspense, useState }    from "react";
import { Canvas }                from "@react-three/fiber";
import { OrbitControls }         from "@react-three/drei";
import Earth                     from "./Earth";
import MilkyWay                  from "./MilkyWay";
import LoadingScreen             from "./LoadingScreen";
import { EARTH_RADIUS_U, EARTH_CAM_DISTANCE } from "../../lib/constants/scale";

function Lights() {
  return (
    <>
      <ambientLight intensity={0.08} color="#c8d8ff" />
      <directionalLight position={[5, 3, 5]}   intensity={2.4} color="#fff8e8" />
      <directionalLight position={[-4, -1, -4]} intensity={0.06} color="#2040c0" />
    </>
  );
}

// Suspense boundary — Earth renders only when texture resolves
function SceneContent({ onEarthLoaded }) {
  return (
    <>
      <Lights />
      <MilkyWay />

      {/* null fallback — LoadingScreen handles the 2D overlay */}
      <Suspense fallback={null}>
        <Earth onLoaded={onEarthLoaded} />
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minDistance={EARTH_RADIUS_U * 1.5}
        maxDistance={EARTH_RADIUS_U * 80}
        rotateSpeed={0.45}
        zoomSpeed={0.7}
        dampingFactor={0.07}
        enableDamping={true}
        makeDefault
      />
    </>
  );
}

export default function Scene() {
  const [earthReady, setEarthReady] = useState(false);

  return (
    <>
      <LoadingScreen ready={earthReady} />

      <Canvas
        camera={{
          position: [0, EARTH_RADIUS_U * 1.2, EARTH_CAM_DISTANCE],
          fov: 45, near: 0.0001, far: 50_000,
        }}
        style={{ width: "100%", height: "100%" }}
        gl={{
          antialias: true, alpha: false,
          powerPreference: "high-performance",
          toneMapping: 3, toneMappingExposure: 1.1,
        }}
        onCreated={({ gl }) => gl.setClearColor("#010205")}
      >
        <SceneContent onEarthLoaded={() => setEarthReady(true)} />
      </Canvas>
    </>
  );
}
