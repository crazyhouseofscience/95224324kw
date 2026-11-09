import React, { useMemo } from 'react';
import * as THREE from 'three';
import { SimulationParams, SimulationState } from '../types/simulation';
import { SparkArc } from './SparkArc';

interface ApparatusModelProps {
  params: SimulationParams;
  state: SimulationState;
  nozzleLeftPos: [number, number, number];
  nozzleRightPos: [number, number, number];
  ringLeftPos: [number, number, number];
  ringRightPos: [number, number, number];
  canLeftPos: [number, number, number];
  canRightPos: [number, number, number];
}

export const ApparatusModel: React.FC<ApparatusModelProps> = ({
  params,
  state,
  nozzleLeftPos,
  nozzleRightPos,
  ringLeftPos,
  ringRightPos,
  canLeftPos,
  canRightPos,
}) => {
  // Spark spheres diameter and surface gap
  const sphereRadius = 0.026;
  const gap3D = Math.max(0.015, params.sparkGapDistance * 0.012);
  const sparkY = canLeftPos[1] + 0.42;

  // Center positions of the two brass spheres
  const sparkLeftPos: [number, number, number] = [-(sphereRadius + gap3D / 2), sparkY, 0];
  const sparkRightPos: [number, number, number] = [+(sphereRadius + gap3D / 2), sparkY, 0];

  // Arc endpoints right on the facing surface tips of the spheres
  const arcStartPos: [number, number, number] = [-gap3D / 2, sparkY, 0];
  const arcEndPos: [number, number, number] = [+gap3D / 2, sparkY, 0];

  // Dynamic glow color and intensity for Side A & Side B
  // Positive voltage -> Warm amber (#f59e0b)
  // Negative voltage -> Cool cyan/blue (#38bdf8)
  const normVa = Math.min(1.5, Math.abs(state.voltageA) / 15000);
  const normVb = Math.min(1.5, Math.abs(state.voltageB) / 15000);

  const colorA = state.voltageA >= 0 ? '#f59e0b' : '#38bdf8';
  const colorB = state.voltageB >= 0 ? '#f59e0b' : '#38bdf8';

  // Cross-coupling wire 1: Can B to Ring A
  const wireBtoA = useMemo(() => {
    const p1 = new THREE.Vector3(canRightPos[0] - 0.16, canRightPos[1] + 0.28, 0.05);
    const p2 = new THREE.Vector3(0.12, (canRightPos[1] + ringLeftPos[1]) / 2 - 0.05, 0.22);
    const p3 = new THREE.Vector3(ringLeftPos[0] + 0.14, ringLeftPos[1], 0.08);
    const curve = new THREE.CatmullRomCurve3([p1, p2, p3]);
    return new THREE.TubeGeometry(curve, 32, 0.012, 8, false);
  }, [canRightPos, ringLeftPos]);

  // Cross-coupling wire 2: Can A to Ring B
  const wireAtoB = useMemo(() => {
    const p1 = new THREE.Vector3(canLeftPos[0] + 0.16, canLeftPos[1] + 0.28, -0.05);
    const p2 = new THREE.Vector3(-0.12, (canLeftPos[1] + ringRightPos[1]) / 2 + 0.05, -0.22);
    const p3 = new THREE.Vector3(ringRightPos[0] - 0.14, ringRightPos[1], -0.08);
    const curve = new THREE.CatmullRomCurve3([p1, p2, p3]);
    return new THREE.TubeGeometry(curve, 32, 0.012, 8, false);
  }, [canLeftPos, ringRightPos]);

  // Spark electrode leads from Can A and Can B
  const sparkLeadLeft = useMemo(() => {
    const p1 = new THREE.Vector3(canLeftPos[0] + 0.18, canLeftPos[1] + 0.28, 0);
    const p2 = new THREE.Vector3(canLeftPos[0] + 0.28, sparkY, 0);
    const p3 = new THREE.Vector3(sparkLeftPos[0], sparkY, 0);
    const curve = new THREE.CatmullRomCurve3([p1, p2, p3]);
    return new THREE.TubeGeometry(curve, 20, 0.01, 8, false);
  }, [canLeftPos, sparkLeftPos, sparkY]);

  const sparkLeadRight = useMemo(() => {
    const p1 = new THREE.Vector3(canRightPos[0] - 0.18, canRightPos[1] + 0.28, 0);
    const p2 = new THREE.Vector3(canRightPos[0] - 0.28, sparkY, 0);
    const p3 = new THREE.Vector3(sparkRightPos[0], sparkY, 0);
    const curve = new THREE.CatmullRomCurve3([p1, p2, p3]);
    return new THREE.TubeGeometry(curve, 20, 0.01, 8, false);
  }, [canRightPos, sparkRightPos, sparkY]);

  // Water fill level height in cans
  const fillHeightA = Math.max(0.02, (state.currentWaterVolumeA / 350) * 0.45);
  const fillHeightB = Math.max(0.02, (state.currentWaterVolumeB / 350) * 0.45);

  return (
    <group>
      {/* 1. SOLID LAB BASEBOARD */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[2.0, 0.08, 1.1]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.65}
          metalness={0.2}
        />
      </mesh>
      {/* Beveled edge trim */}
      <mesh position={[0, -0.01, 0]}>
        <boxGeometry args={[1.96, 0.01, 1.06]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} />
      </mesh>

      {/* 2. REAR VERTICAL SUPPORT STAND */}
      <group position={[0, 1.1, -0.42]}>
        {/* Vertical mast */}
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 2.3, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Top crossbar */}
        <mesh position={[0, 1.05, 0.22]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 0.45, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Brass collar clamps */}
        <mesh position={[0, 1.05, 0]}>
          <cylinderGeometry args={[0.038, 0.038, 0.06, 16]} />
          <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.038, 0.038, 0.06, 16]} />
          <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* 3. UPPER WATER RESERVOIR & MANIFOLD */}
      <group position={[0, nozzleLeftPos[1] + 0.36, 0]}>
        {/* Main reservoir tank (translucent acrylic/glass cylinder) */}
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.42, 32]} />
          <meshStandardMaterial
            color="#93c5fd"
            transparent
            opacity={0.45}
            roughness={0.15}
            metalness={0.1}
          />
        </mesh>
        {/* Water inside reservoir */}
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.21, 0.21, 0.3, 32]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.65}
            roughness={0.2}
          />
        </mesh>
        {/* Top brass lid */}
        <mesh position={[0, 0.21, 0]}>
          <cylinderGeometry args={[0.23, 0.23, 0.03, 32]} />
          <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.25} />
        </mesh>
        {/* Bottom brass manifold */}
        <mesh position={[0, -0.21, 0]}>
          <cylinderGeometry args={[0.23, 0.23, 0.03, 32]} />
          <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.25} />
        </mesh>
        {/* Horizontal branch pipes to nozzles */}
        <mesh position={[0, -0.23, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.016, 0.016, nozzleRightPos[0] - nozzleLeftPos[0], 16]} />
          <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* 4. DROPPER NOZZLES (A & B) */}
      <group position={nozzleLeftPos}>
        {/* Left brass nozzle */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <cylinderGeometry args={[0.016, 0.008, 0.1, 16]} />
          <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Needle valve knob */}
        <mesh position={[0, 0.1, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.02, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>

      <group position={nozzleRightPos}>
        {/* Right brass nozzle */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <cylinderGeometry args={[0.016, 0.008, 0.1, 16]} />
          <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Needle valve knob */}
        <mesh position={[0, 0.1, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.02, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>

      {/* 5. INDUCTION RINGS (A & B) */}
      {/* Ring A (Left) */}
      <group position={ringLeftPos}>
        {/* Copper Inductor Ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.095, 0.014, 16, 32]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.15} />
        </mesh>
        {/* Insulating acrylic support arm to rear mast */}
        <mesh position={[0, 0, -0.21]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.42, 12]} />
          <meshStandardMaterial
            color="#cbd5e1"
            transparent
            opacity={0.4}
            roughness={0.1}
          />
        </mesh>
        {/* Electrostatic charge halo aura */}
        {normVa > 0.05 && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.105, 0.025, 12, 24]} />
            <meshBasicMaterial
              color={colorA}
              transparent
              opacity={normVa * 0.35}
            />
          </mesh>
        )}
      </group>

      {/* Ring B (Right) */}
      <group position={ringRightPos}>
        {/* Copper Inductor Ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.095, 0.014, 16, 32]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.15} />
        </mesh>
        {/* Insulating acrylic support arm to rear mast */}
        <mesh position={[0, 0, -0.21]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.42, 12]} />
          <meshStandardMaterial
            color="#cbd5e1"
            transparent
            opacity={0.4}
            roughness={0.1}
          />
        </mesh>
        {/* Electrostatic charge halo aura */}
        {normVb > 0.05 && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.105, 0.025, 12, 24]} />
            <meshBasicMaterial
              color={colorB}
              transparent
              opacity={normVb * 0.35}
            />
          </mesh>
        )}
      </group>

      {/* 6. COLLECTOR CANS (A & B) */}
      {/* Can A (Left) */}
      <group position={canLeftPos}>
        {/* Insulating acrylic base pedestal */}
        <mesh position={[0, -0.16, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.16, 0.18, 0.24, 24]} />
          <meshStandardMaterial
            color="#e2e8f0"
            transparent
            opacity={0.35}
            roughness={0.1}
          />
        </mesh>
        {/* Metal collection can cylinder */}
        <mesh position={[0, 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.19, 0.19, 0.38, 32, 1, true]} />
          <meshStandardMaterial
            color="#cbd5e1"
            metalness={0.88}
            roughness={0.22}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Can bottom plate */}
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[0.188, 0.188, 0.015, 32]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.88} roughness={0.25} />
        </mesh>
        {/* Water inside Can A */}
        <mesh position={[0, -0.05 + fillHeightA / 2, 0]}>
          <cylinderGeometry args={[0.185, 0.185, fillHeightA, 32]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.7}
            roughness={0.1}
          />
        </mesh>
        {/* Can rim charge halo */}
        {normVa > 0.05 && (
          <mesh position={[0, 0.31, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.195, 0.02, 12, 24]} />
            <meshBasicMaterial
              color={colorA}
              transparent
              opacity={normVa * 0.4}
            />
          </mesh>
        )}
      </group>

      {/* Can B (Right) */}
      <group position={canRightPos}>
        {/* Insulating acrylic base pedestal */}
        <mesh position={[0, -0.16, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.16, 0.18, 0.24, 24]} />
          <meshStandardMaterial
            color="#e2e8f0"
            transparent
            opacity={0.35}
            roughness={0.1}
          />
        </mesh>
        {/* Metal collection can cylinder */}
        <mesh position={[0, 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.19, 0.19, 0.38, 32, 1, true]} />
          <meshStandardMaterial
            color="#cbd5e1"
            metalness={0.88}
            roughness={0.22}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Can bottom plate */}
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[0.188, 0.188, 0.015, 32]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.88} roughness={0.25} />
        </mesh>
        {/* Water inside Can B */}
        <mesh position={[0, -0.05 + fillHeightB / 2, 0]}>
          <cylinderGeometry args={[0.185, 0.185, fillHeightB, 32]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.7}
            roughness={0.1}
          />
        </mesh>
        {/* Can rim charge halo */}
        {normVb > 0.05 && (
          <mesh position={[0, 0.31, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.195, 0.02, 12, 24]} />
            <meshBasicMaterial
              color={colorB}
              transparent
              opacity={normVb * 0.4}
            />
          </mesh>
        )}
      </group>

      {/* 7. CROSS-COUPLING ELECTRICAL WIRING */}
      {/* Wire B -> A (Sheath color cyan/sky) */}
      <mesh geometry={wireBtoA} castShadow>
        <meshStandardMaterial color="#0284c7" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Wire A -> B (Sheath color amber/gold) */}
      <mesh geometry={wireAtoB} castShadow>
        <meshStandardMaterial color="#d97706" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* 8. SPARK GAP ASSEMBLY */}
      {/* Spark lead Left from Can A */}
      <mesh geometry={sparkLeadLeft} castShadow>
        <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Spark lead Right from Can B */}
      <mesh geometry={sparkLeadRight} castShadow>
        <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Spark Gap Left Sphere (+) */}
      <mesh position={sparkLeftPos} castShadow>
        <sphereGeometry args={[sphereRadius, 24, 24]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.95} roughness={0.1} />
      </mesh>
      {/* High-voltage dielectric ionization aura on Left Sphere */}
      {state.sparkProgressPercent > 35 && (
        <mesh position={sparkLeftPos}>
          <sphereGeometry args={[sphereRadius * (1.1 + (state.sparkProgressPercent / 100) * 0.4), 16, 16]} />
          <meshBasicMaterial
            color="#f59e0b"
            transparent
            opacity={(state.sparkProgressPercent / 100) * 0.45}
          />
        </mesh>
      )}

      {/* Spark Gap Right Sphere (−) */}
      <mesh position={sparkRightPos} castShadow>
        <sphereGeometry args={[sphereRadius, 24, 24]} />
        <meshStandardMaterial color="#ec4899" metalness={0.95} roughness={0.1} />
      </mesh>
      {/* High-voltage dielectric ionization aura on Right Sphere */}
      {state.sparkProgressPercent > 35 && (
        <mesh position={sparkRightPos}>
          <sphereGeometry args={[sphereRadius * (1.1 + (state.sparkProgressPercent / 100) * 0.4), 16, 16]} />
          <meshBasicMaterial
            color="#ec4899"
            transparent
            opacity={(state.sparkProgressPercent / 100) * 0.45}
          />
        </mesh>
      )}

      {/* Dielectric Stress Ionization Corona between facing sphere gap tips right before breakdown */}
      {state.sparkProgressPercent > 70 && !state.isSparking && (
        <mesh position={[0, sparkY, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, gap3D, 12]} />
          <meshBasicMaterial
            color="#ec4899"
            transparent
            opacity={((state.sparkProgressPercent - 70) / 30) * 0.65}
          />
        </mesh>
      )}

      {/* 9. DYNAMIC SPARK ARC BETWEEN SPHERES */}
      <SparkArc
        startPos={arcStartPos}
        endPos={arcEndPos}
        active={state.isSparking}
        intensity={state.sparkIntensity}
      />
    </group>
  );
};
