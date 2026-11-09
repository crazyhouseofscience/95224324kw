import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface SparkArcProps {
  startPos: [number, number, number];
  endPos: [number, number, number];
  active: boolean;
  intensity: number;
}

/**
 * Procedural electric lightning arc between spark gap electrodes.
 * Generates jagged polyline with dynamic midpoint displacement.
 */
export const SparkArc: React.FC<SparkArcProps> = ({
  startPos,
  endPos,
  active,
  intensity,
}) => {
  const lineRef = useRef<THREE.LineSegments>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  // Generate jagged line segments for electrical arc
  const { geometry, glowGeometry } = useMemo(() => {
    const pStart = new THREE.Vector3(...startPos);
    const pEnd = new THREE.Vector3(...endPos);
    const segments = 16;
    const positions = new Float32Array(segments * 2 * 3);

    let prev = pStart.clone();
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const curr = pStart.clone().lerp(pEnd, t);
      if (i < segments) {
        // Jagged offset perpendicular to path
        const offsetMag = 0.04 * (1 - Math.abs(t - 0.5) * 2);
        curr.x += (Math.random() - 0.5) * offsetMag;
        curr.y += (Math.random() - 0.5) * offsetMag;
        curr.z += (Math.random() - 0.5) * offsetMag;
      }
      const idx = (i - 1) * 6;
      positions[idx] = prev.x;
      positions[idx + 1] = prev.y;
      positions[idx + 2] = prev.z;
      positions[idx + 3] = curr.x;
      positions[idx + 4] = curr.y;
      positions[idx + 5] = curr.z;
      prev = curr;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Glow cylinder mesh along the gap
    const dir = new THREE.Vector3().subVectors(pEnd, pStart);
    const len = dir.length();
    const glowGeo = new THREE.CylinderGeometry(0.015, 0.015, Math.max(0.001, len), 8);
    glowGeo.rotateZ(Math.PI / 2);

    return { geometry: geo, glowGeometry: glowGeo };
  }, [startPos, endPos]);

  useFrame(() => {
    if (!lineRef.current || !active) return;
    // Jitter points each frame during spark discharge
    const posAttr = lineRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const pStart = new THREE.Vector3(...startPos);
    const pEnd = new THREE.Vector3(...endPos);
    const segments = 16;

    let prev = pStart.clone();
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const curr = pStart.clone().lerp(pEnd, t);
      if (i < segments) {
        const offsetMag = 0.05 * (1 - Math.abs(t - 0.5) * 2);
        curr.x += (Math.random() - 0.5) * offsetMag;
        curr.y += (Math.random() - 0.5) * offsetMag;
        curr.z += (Math.random() - 0.5) * offsetMag;
      }
      const idx = (i - 1) * 6;
      arr[idx] = prev.x;
      arr[idx + 1] = prev.y;
      arr[idx + 2] = prev.z;
      arr[idx + 3] = curr.x;
      arr[idx + 4] = curr.y;
      arr[idx + 5] = curr.z;
      prev = curr;
    }
    posAttr.needsUpdate = true;
  });

  if (!active && intensity <= 0.01) return null;

  const midPos: [number, number, number] = [
    (startPos[0] + endPos[0]) / 2,
    (startPos[1] + endPos[1]) / 2,
    (startPos[2] + endPos[2]) / 2,
  ];

  return (
    <group>
      {/* Primary electric spark line */}
      <lineSegments ref={lineRef} geometry={geometry}>
        <lineBasicMaterial
          color="#93c5fd"
          linewidth={3}
          transparent
          opacity={Math.min(1, intensity * 1.5)}
        />
      </lineSegments>

      {/* Core intense white/cyan arc body */}
      <mesh position={midPos} geometry={glowGeometry}>
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={Math.min(0.9, intensity * 1.2)}
        />
      </mesh>

      {/* High-voltage point light flash */}
      <pointLight
        ref={glowRef}
        position={midPos}
        color="#60a5fa"
        intensity={intensity * 12}
        distance={2.5}
        decay={2}
      />
    </group>
  );
};
