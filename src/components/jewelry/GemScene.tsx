import { Canvas, useFrame } from "@react-three/fiber";
import { Bounds, Center, ContactShadows, Environment, Lightformer, OrbitControls, Sparkles, useGLTF } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

export const METAL_PBR: Record<string, { color: string; roughness: number }> = {
  "18k_gold": { color: "#E8B84A", roughness: 0.16 },
  rose_gold: { color: "#E6A088", roughness: 0.18 },
  white_gold: { color: "#E9E7E2", roughness: 0.12 },
  platinum: { color: "#D9DCE0", roughness: 0.1 },
  silver: { color: "#CCD0D6", roughness: 0.2 },
};

/** Round-brilliant silhouette via lathe: table, crown, girdle, pavilion. */
function useBrilliantGeometry() {
  return useMemo(() => {
    const pts = [
      new THREE.Vector2(0, -0.43),
      new THREE.Vector2(0.5, 0),
      new THREE.Vector2(0.5, 0.03),
      new THREE.Vector2(0.3, 0.16),
      new THREE.Vector2(0, 0.16),
    ];
    const g = new THREE.LatheGeometry(pts, 16);
    return g.toNonIndexed();
  }, []);
}

/** A faceted diamond poised on a slender metal pedestal — no band, no ring silhouette. */
function Gem({ metal, autoRotate }: { metal: string; autoRotate: boolean }) {
  const group = useRef<THREE.Group>(null);
  const gem = useBrilliantGeometry();
  const m = METAL_PBR[metal] ?? { color: "#E8B84A", roughness: 0.16 };
  useFrame((_, d) => {
    if (group.current && autoRotate) group.current.rotation.y += Math.min(d, 0.05) * 0.35;
  });
  const metalMat = (
    <meshPhysicalMaterial color={m.color} metalness={1} roughness={m.roughness} clearcoat={0.6} clearcoatRoughness={0.1} envMapIntensity={1.6} />
  );
  return (
    <group ref={group} position={[0, -0.1, 0]} rotation={[0.1, 0.6, 0]}>
      {/* pedestal base */}
      <mesh position={[0, -0.78, 0]} castShadow>
        <cylinderGeometry args={[0.56, 0.62, 0.1, 48]} />
        {metalMat}
      </mesh>
      {/* slender riser */}
      <mesh position={[0, -0.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, 0.48, 24]} />
        {metalMat}
      </mesh>
      {/* collar beneath the stone */}
      <mesh position={[0, -0.26, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.14, 0.09, 32]} />
        {metalMat}
      </mesh>
      {/* the diamond itself, enlarged as the sole focal point */}
      <mesh geometry={gem} position={[0, 0.2, 0]} scale={1.15} castShadow>
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0.15}
          roughness={0}
          transmission={0.35}
          thickness={0.8}
          ior={2.42}
          clearcoat={1}
          specularIntensity={1}
          specularColor="#ffffff"
          envMapIntensity={4.5}
          flatShading
        />
      </mesh>
      <Sparkles position={[0, 0.25, 0]} count={24} scale={1.3} size={2.4} speed={0.4} color="#fff6d8" />
    </group>
  );
}

function UploadedModel({ url, autoRotate }: { url: string; autoRotate: boolean }) {
  const { scene } = useGLTF(url);
  const group = useRef<THREE.Group>(null);
  const clone = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; }
    });
    return c;
  }, [scene]);
  useFrame((_, d) => {
    if (group.current && autoRotate) group.current.rotation.y += Math.min(d, 0.05) * 0.35;
  });
  return (
    <Bounds fit clip observe margin={1.3}>
      <group ref={group}>
        <Center>
          <primitive object={clone} />
        </Center>
      </group>
    </Bounds>
  );
}

export default function GemScene({ metal, light, autoRotate, modelUrl }: { metal: string; light: number; autoRotate: boolean; modelUrl?: string | null | undefined }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [1.2, 1.4, 5.2], fov: 38 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
      <color attach="background" args={["#eef0f3"]} />
      <ambientLight intensity={0.2 * light} />
      <spotLight position={[3, 6, 3]} angle={0.4} penumbra={1} intensity={60 * light} castShadow color="#fff1d6" />
      <spotLight position={[-4, 3, -2]} angle={0.5} penumbra={1} intensity={25 * light} color="#ffd9a8" />
      {modelUrl ? (
        <Suspense fallback={null}>
          <UploadedModel url={modelUrl} autoRotate={autoRotate} />
        </Suspense>
      ) : (
        <Gem metal={metal} autoRotate={autoRotate} />
      )}
      <ContactShadows position={[0, -1.45, 0]} opacity={0.35} scale={8} blur={2.6} far={3} color="#000" />
      <Environment resolution={256}>
        <Lightformer intensity={3 * light} position={[0, 5, -2]} scale={[10, 2, 1]} />
        <Lightformer intensity={2 * light} color="#ffe2b0" position={[-5, 1, 0]} rotation-y={Math.PI / 2} scale={[10, 1, 1]} />
        <Lightformer intensity={2 * light} position={[5, 1, 1]} rotation-y={-Math.PI / 2} scale={[10, 1, 1]} />
        <Lightformer form="circle" intensity={4 * light} position={[0, 2, 5]} scale={2} />
      </Environment>
      <OrbitControls makeDefault enablePan={false} minDistance={2.6} maxDistance={7} target={[0, 0.2, 0]} />
    </Canvas>
  );
      }
