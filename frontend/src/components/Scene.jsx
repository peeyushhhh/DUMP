import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Text } from "@react-three/drei";
import { useRef } from "react";

const words = ["Stress", "Overthinking", "Anxiety", "Fear", "Doubt"];

function FallingWord({ text }) {
  const ref = useRef();

  useFrame(() => {
    if (!ref.current) return;

    ref.current.position.y -= 0.015;

    // small horizontal drift
    ref.current.position.x += Math.sin(ref.current.position.y) * 0.002;

    // reset
    if (ref.current.position.y < -3) {
      ref.current.position.y = 3 + Math.random() * 2;
      ref.current.position.x = (Math.random() - 0.5) * 3;
    }
  });

  return (
    <Text
      ref={ref}
      position={[
        (Math.random() - 0.5) * 3,
        Math.random() * 3 + 1,
        0,
      ]}
      fontSize={0.3}
      color="#a855f7"
      anchorX="center"
      anchorY="middle"
    >
      {text}
    </Text>
  );
}

function MeshBin() {
  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.6}>
      <mesh position={[0, -3, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 2.2, 32, 1, true]} />
        <meshStandardMaterial
          wireframe
          color="#a855f7"
          emissive="#a855f7"
          emissiveIntensity={0.6}
        />
      </mesh>
    </Float>
  );
}

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6] }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
      }}
    >
      <ambientLight intensity={1.2} />
      <pointLight position={[0, 3, 5]} intensity={2} color="#a855f7" />

      {words.map((word, i) => (
        <FallingWord key={i} text={word} />
      ))}

      <MeshBin />
    </Canvas>
  );
}