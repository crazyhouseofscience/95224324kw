import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SimulationParams, SimulationState } from '../types/simulation';

interface SparkGapChargeBuildupProps {
  params: SimulationParams;
  state: SimulationState;
  canLeftPos: [number, number, number];
  canRightPos: [number, number, number];
}

const _dummyH = new THREE.Object3D();
const _dummyV = new THREE.Object3D();
const _color = new THREE.Color();

// Color standards:
// Positive (+) = Warm Amber Gold (#f59e0b)
// Negative (−) = Electric Magenta (#ec4899)
const COLOR_PLUS = '#f59e0b';
const COLOR_MINUS = '#ec4899';

export const SparkGapChargeBuildup: React.FC<SparkGapChargeBuildupProps> = ({
  params,
  state,
  canLeftPos,
}) => {
  const meshHRef = useRef<THREE.InstancedMesh>(null);
  const meshVRef = useRef<THREE.InstancedMesh>(null);
  const jitterLineRef = useRef<THREE.LineSegments>(null);

  const sphereRadius = 0.026;
  const gap3D = Math.max(0.015, params.sparkGapDistance * 0.012);
  const sparkY = canLeftPos[1] + 0.42;

  // Exact positions of facing sphere tips (right at the spark gap)
  const tipLeftX = -(gap3D / 2);
  const tipRightX = +(gap3D / 2);

  const progress = state.sparkProgressPercent; // 0 to 100
  const normProgress = Math.min(1.0, Math.max(0, progress / 100));

  // Max 6 signs stacked at each sphere tip right at the gap
  const numSignsAtGap = Math.max(0, Math.min(6, Math.floor(normProgress * 6.5)));

  useFrame(({ camera, clock }) => {
    if (!meshHRef.current || !meshVRef.current || !params.showChargeSigns) {
      if (meshHRef.current) meshHRef.current.count = 0;
      if (meshVRef.current) meshVRef.current.count = 0;
      return;
    }

    const t = clock.getElapsedTime() * 4.0;
    const userScale = params.chargeSignSize ?? 1.2;
    const s = 0.026 * userScale;

    let hIdx = 0;
    let vIdx = 0;

    // 1. STACK POSITIVE (+) CHARGES RIGHT AT LEFT SPHERE GAP TIP
    for (let i = 0; i < numSignsAtGap; i++) {
      // Offset stacked around facing sphere tip
      const angle = (i / Math.max(1, numSignsAtGap)) * Math.PI * 2 + t * 0.2;
      const r = 0.012 + (i % 2) * 0.01;
      const x = tipLeftX - 0.008 - (i * 0.006);
      const y = sparkY + Math.sin(angle) * r;
      const z = Math.cos(angle) * r;

      _color.set(COLOR_PLUS);

      _dummyH.position.set(x, y, z);
      _dummyH.quaternion.copy(camera.quaternion);
      _dummyH.scale.set(s * 1.0, s * 0.16, s * 0.16);
      _dummyH.updateMatrix();
      meshHRef.current.setMatrixAt(hIdx, _dummyH.matrix);
      meshHRef.current.setColorAt(hIdx, _color);
      hIdx++;

      _dummyV.position.set(x, y, z);
      _dummyV.quaternion.copy(camera.quaternion);
      _dummyV.scale.set(s * 0.16, s * 1.0, s * 0.16);
      _dummyV.updateMatrix();
      meshVRef.current.setMatrixAt(vIdx, _dummyV.matrix);
      meshVRef.current.setColorAt(vIdx, _color);
      vIdx++;
    }

    // 2. STACK NEGATIVE (−) CHARGES RIGHT AT RIGHT SPHERE GAP TIP
    for (let i = 0; i < numSignsAtGap; i++) {
      const angle = (i / Math.max(1, numSignsAtGap)) * Math.PI * 2 - t * 0.2;
      const r = 0.012 + (i % 2) * 0.01;
      const x = tipRightX + 0.008 + (i * 0.006);
      const y = sparkY + Math.sin(angle) * r;
      const z = Math.cos(angle) * r;

      _color.set(COLOR_MINUS);

      _dummyH.position.set(x, y, z);
      _dummyH.quaternion.copy(camera.quaternion);
      _dummyH.scale.set(s * 1.0, s * 0.16, s * 0.16);
      _dummyH.updateMatrix();
      meshHRef.current.setMatrixAt(hIdx, _dummyH.matrix);
      meshHRef.current.setColorAt(hIdx, _color);
      hIdx++;
    }

    meshHRef.current.count = hIdx;
    meshVRef.current.count = vIdx;

    meshHRef.current.instanceMatrix.needsUpdate = true;
    meshVRef.current.instanceMatrix.needsUpdate = true;
    if (meshHRef.current.instanceColor) meshHRef.current.instanceColor.needsUpdate = true;
    if (meshVRef.current.instanceColor) meshVRef.current.instanceColor.needsUpdate = true;

    // 3. JITTER PRE-SPARK CORONA FIELD LINES
    if (jitterLineRef.current && progress > 50 && !state.isSparking) {
      const posAttr = jitterLineRef.current.geometry.attributes.position as THREE.BufferAttribute;
      if (posAttr) {
        const arr = posAttr.array as Float32Array;
        const count = arr.length / 3;
        for (let i = 0; i < count; i++) {
          const tPos = i / count;
          const baseX = tipLeftX + tPos * gap3D;
          const jitter = (progress / 100) * 0.015;
          arr[i * 3] = baseX;
          arr[i * 3 + 1] = sparkY + (Math.random() - 0.5) * jitter;
          arr[i * 3 + 2] = (Math.random() - 0.5) * jitter;
        }
        posAttr.needsUpdate = true;
      }
    }
  });

  return (
    <group>
      {/* Instanced 3D '+' and '−' charge symbols crowding right at the spark gap tips */}
      <instancedMesh
        ref={meshHRef}
        args={[undefined, undefined, 16]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      <instancedMesh
        ref={meshVRef}
        args={[undefined, undefined, 16]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Pulsing Pre-Spark Dielectric Ionization Glow Channel across the air gap */}
      {progress > 25 && !state.isSparking && (
        <group position={[0, sparkY, 0]}>
          {/* Outer glowing plasma corona cylinder */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry
              args={[
                0.01 + normProgress * 0.02,
                0.01 + normProgress * 0.02,
                Math.max(0.005, gap3D),
                16,
              ]}
            />
            <meshBasicMaterial
              color={progress > 75 ? '#ec4899' : '#f59e0b'}
              transparent
              opacity={normProgress * 0.6}
            />
          </mesh>

          {/* Intense core thread */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry
              args={[0.004, 0.004, Math.max(0.005, gap3D), 12]}
            />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={normProgress * 0.85}
            />
          </mesh>
        </group>
      )}

      {/* Pre-Spark Micro-Discharge Jitter Line Segment */}
      {progress > 55 && !state.isSparking && (
        <lineSegments ref={jitterLineRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array(10 * 3), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={progress > 80 ? '#f43f5e' : '#fbbf24'}
            linewidth={2}
            transparent
            opacity={normProgress * 0.8}
          />
        </lineSegments>
      )}
    </group>
  );
};
