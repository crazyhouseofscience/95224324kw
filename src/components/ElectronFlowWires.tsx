import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SimulationParams, SimulationState } from '../types/simulation';

interface ElectronFlowWiresProps {
  params: SimulationParams;
  state: SimulationState;
  ringLeftPos: [number, number, number];
  ringRightPos: [number, number, number];
  canLeftPos: [number, number, number];
  canRightPos: [number, number, number];
  sparkGapDistance: number;
}

const PARTICLES_PER_WIRE = 6;
const PARTICLES_PER_LEAD = 3;
const PARTICLES_RESERVOIR = 4;

const MAX_TOTAL_H = PARTICLES_PER_WIRE * 2 + PARTICLES_PER_LEAD * 2 + PARTICLES_RESERVOIR;
const MAX_TOTAL_V = PARTICLES_PER_WIRE * 2 + PARTICLES_PER_LEAD * 2 + PARTICLES_RESERVOIR;

const _dummyH = new THREE.Object3D();
const _dummyV = new THREE.Object3D();
const _color = new THREE.Color();
const _pos = new THREE.Vector3();

// Standardized colors:
// Positive (+) Charge = Warm Amber Gold (#f59e0b)
// Negative (−) Charge = Electric Magenta / Pink (#ec4899)
const COLOR_PLUS = '#f59e0b';
const COLOR_MINUS = '#ec4899';

export const ElectronFlowWires: React.FC<ElectronFlowWiresProps> = ({
  params,
  state,
  ringLeftPos,
  ringRightPos,
  canLeftPos,
  canRightPos,
  sparkGapDistance,
}) => {
  const meshHRef = useRef<THREE.InstancedMesh>(null);
  const meshVRef = useRef<THREE.InstancedMesh>(null);

  const sphereRadius = 0.026;
  const gap3D = Math.max(0.015, sparkGapDistance * 0.012);
  const sparkY = canLeftPos[1] + 0.42;

  const sparkLeftPos = useMemo<[number, number, number]>(
    () => [-(sphereRadius + gap3D / 2), sparkY, 0],
    [gap3D, sparkY]
  );
  const sparkRightPos = useMemo<[number, number, number]>(
    () => [+(sphereRadius + gap3D / 2), sparkY, 0],
    [gap3D, sparkY]
  );

  // Wire 1: Can B to Ring A (from canRight UP to ringLeft)
  const curveBtoA = useMemo(() => {
    const p1 = new THREE.Vector3(canRightPos[0] - 0.16, canRightPos[1] + 0.28, 0.05);
    const p2 = new THREE.Vector3(0.12, (canRightPos[1] + ringLeftPos[1]) / 2 - 0.05, 0.22);
    const p3 = new THREE.Vector3(ringLeftPos[0] + 0.14, ringLeftPos[1], 0.08);
    return new THREE.CatmullRomCurve3([p1, p2, p3]);
  }, [canRightPos, ringLeftPos]);

  // Wire 2: Can A to Ring B (from canLeft UP to ringRight)
  const curveAtoB = useMemo(() => {
    const p1 = new THREE.Vector3(canLeftPos[0] + 0.16, canLeftPos[1] + 0.28, -0.05);
    const p2 = new THREE.Vector3(-0.12, (canLeftPos[1] + ringRightPos[1]) / 2 + 0.05, -0.22);
    const p3 = new THREE.Vector3(ringRightPos[0] - 0.14, ringRightPos[1], -0.08);
    return new THREE.CatmullRomCurve3([p1, p2, p3]);
  }, [canLeftPos, ringRightPos]);

  // Spark Lead Left: Can A to Left Electrode Sphere
  const curveLeadLeft = useMemo(() => {
    const p1 = new THREE.Vector3(canLeftPos[0] + 0.18, canLeftPos[1] + 0.28, 0);
    const p2 = new THREE.Vector3(canLeftPos[0] + 0.28, sparkY, 0);
    const p3 = new THREE.Vector3(sparkLeftPos[0], sparkY, 0);
    return new THREE.CatmullRomCurve3([p1, p2, p3]);
  }, [canLeftPos, sparkLeftPos, sparkY]);

  // Spark Lead Right: Can B to Right Electrode Sphere
  const curveLeadRight = useMemo(() => {
    const p1 = new THREE.Vector3(canRightPos[0] - 0.18, canRightPos[1] + 0.28, 0);
    const p2 = new THREE.Vector3(canRightPos[0] - 0.28, sparkY, 0);
    const p3 = new THREE.Vector3(sparkRightPos[0], sparkY, 0);
    return new THREE.CatmullRomCurve3([p1, p2, p3]);
  }, [canRightPos, sparkRightPos, sparkY]);

  const phaseOffsets = useMemo(() => {
    const arr = new Float32Array(MAX_TOTAL_H);
    for (let i = 0; i < MAX_TOTAL_H; i++) {
      arr[i] = (i * 0.166) % 1.0;
    }
    return arr;
  }, []);

  const animationProgressRef = useRef(0);

  useFrame(({ camera, clock }, delta) => {
    if (!meshHRef.current || !meshVRef.current || !params.showElectronFlow) {
      if (meshHRef.current) meshHRef.current.count = 0;
      if (meshVRef.current) meshVRef.current.count = 0;
      return;
    }

    if (!params.isPaused) {
      const vDiff = Math.abs(state.potentialDifference);
      const activityScale = Math.min(2.5, Math.max(0.5, (vDiff / 7000) * 1.2));
      const speed = delta * params.simSpeed * params.electronFlowSpeed * activityScale * 0.35;
      animationProgressRef.current = (animationProgressRef.current + speed) % 1.0;
    }

    const tGlobal = animationProgressRef.current;
    const isChemistryMode = params.chargeFlowMode !== 'physics';

    let hIdx = 0;
    let vIdx = 0;

    // Adjustable charge sign size multiplier
    const userScale = params.chargeSignSize ?? 1.2;
    const baseSize = 0.026 * userScale;
    const pulse = 1.0 + Math.sin(clock.getElapsedTime() * 4) * 0.1;

    const addChargeSymbol = (
      x: number,
      y: number,
      z: number,
      isPlus: boolean,
      hexColor: string
    ) => {
      const s = baseSize * pulse;
      _color.set(hexColor);

      // Horizontal segment
      _dummyH.position.set(x, y, z);
      _dummyH.quaternion.copy(camera.quaternion); // Always face camera
      _dummyH.scale.set(s * 1.0, s * 0.16, s * 0.16);
      _dummyH.updateMatrix();
      meshHRef.current?.setMatrixAt(hIdx, _dummyH.matrix);
      meshHRef.current?.setColorAt(hIdx, _color);
      hIdx++;

      // Vertical segment (ONLY for +)
      if (isPlus) {
        _dummyV.position.set(x, y, z);
        _dummyV.quaternion.copy(camera.quaternion);
        _dummyV.scale.set(s * 0.16, s * 1.0, s * 0.16);
        _dummyV.updateMatrix();
        meshVRef.current?.setMatrixAt(vIdx, _dummyV.matrix);
        meshVRef.current?.setColorAt(vIdx, _color);
        vIdx++;
      }
    };

    // 1. WIRE B -> A (Can B UP to Ring A)
    let pIdx = 0;
    for (let i = 0; i < PARTICLES_PER_WIRE; i++) {
      let t = (phaseOffsets[pIdx++] + tGlobal) % 1.0;
      if (t < 0) t += 1.0;
      curveBtoA.getPoint(t, _pos);
      // Offset slightly in front (+z) and above (+y) so signs ride alongside wire without clipping tube
      addChargeSymbol(_pos.x, _pos.y + 0.025, _pos.z + 0.04, false, COLOR_MINUS);
    }

    // 2. WIRE A -> B (Can A UP to Ring B)
    const dirAtoB = isChemistryMode ? 1 : -1;
    for (let i = 0; i < PARTICLES_PER_WIRE; i++) {
      let t = (phaseOffsets[pIdx++] + tGlobal * dirAtoB) % 1.0;
      if (t < 0) t += 1.0;
      curveAtoB.getPoint(t, _pos);

      if (isChemistryMode) {
        addChargeSymbol(_pos.x, _pos.y + 0.025, _pos.z + 0.04, true, COLOR_PLUS);
      } else {
        addChargeSymbol(_pos.x, _pos.y + 0.025, _pos.z + 0.04, false, COLOR_MINUS);
      }
    }

    // 3. TOP RESERVOIR MANIFOLD SEPARATION (Float cleanly above top water pipe)
    const reservoirY = 2.22; // Offset above the brass pipe (y = 2.13)
    const reservoirZ = 0.04; // Offset in front
    const halfSep = Math.abs(canRightPos[0]);
    for (let i = 0; i < PARTICLES_RESERVOIR; i++) {
      const isLeftBranch = i < PARTICLES_RESERVOIR / 2;
      let t = (phaseOffsets[pIdx++] + tGlobal * 0.7) % 1.0;
      if (t < 0) t += 1.0;

      if (isLeftBranch) {
        const x = -t * halfSep;
        addChargeSymbol(x, reservoirY, reservoirZ, true, COLOR_PLUS);
      } else {
        const x = t * halfSep;
        addChargeSymbol(x, reservoirY, reservoirZ, false, COLOR_MINUS);
      }
    }

    // 4. SPARK GAP LEADS (Float cleanly above copper leads)
    for (let i = 0; i < PARTICLES_PER_LEAD; i++) {
      let t = (phaseOffsets[pIdx++] + tGlobal * 0.9) % 1.0;
      curveLeadLeft.getPoint(t, _pos);
      addChargeSymbol(_pos.x, _pos.y + 0.025, _pos.z + 0.03, true, COLOR_PLUS);
    }

    for (let i = 0; i < PARTICLES_PER_LEAD; i++) {
      let t = (phaseOffsets[pIdx++] + tGlobal * 0.9) % 1.0;
      curveLeadRight.getPoint(t, _pos);
      addChargeSymbol(_pos.x, _pos.y + 0.025, _pos.z + 0.03, false, COLOR_MINUS);
    }

    meshHRef.current.count = hIdx;
    meshVRef.current.count = vIdx;

    meshHRef.current.instanceMatrix.needsUpdate = true;
    meshVRef.current.instanceMatrix.needsUpdate = true;
    if (meshHRef.current.instanceColor) meshHRef.current.instanceColor.needsUpdate = true;
    if (meshVRef.current.instanceColor) meshVRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh
        ref={meshHRef}
        args={[undefined, undefined, MAX_TOTAL_H]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      <instancedMesh
        ref={meshVRef}
        args={[undefined, undefined, MAX_TOTAL_V]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
};
