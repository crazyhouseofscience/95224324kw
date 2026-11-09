import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SimulationParams, SimulationState } from '../types/simulation';

interface ChargeBuildupSignsProps {
  params: SimulationParams;
  state: SimulationState;
  ringLeftPos: [number, number, number];
  ringRightPos: [number, number, number];
  canLeftPos: [number, number, number];
  canRightPos: [number, number, number];
  sparkGapDistance: number;
}

const MAX_SIGNS_PER_CAN = 6;
const MAX_SIGNS_PER_RING = 4;
const MAX_SIGNS_PER_SPHERE = 3;
const MAX_SIGNS_PER_NOZZLE = 1;

const MAX_TOTAL_SIGNS =
  (MAX_SIGNS_PER_CAN + MAX_SIGNS_PER_RING + MAX_SIGNS_PER_SPHERE + MAX_SIGNS_PER_NOZZLE) * 2;

const _dummyH = new THREE.Object3D();
const _dummyV = new THREE.Object3D();
const _color = new THREE.Color();

export const ChargeBuildupSigns: React.FC<ChargeBuildupSignsProps> = ({
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
  const sparkLeftPos: [number, number, number] = [-(sphereRadius + gap3D / 2), sparkY, 0];
  const sparkRightPos: [number, number, number] = [+(sphereRadius + gap3D / 2), sparkY, 0];

  const distributionData = useMemo(() => {
    const canAngles = Array.from({ length: MAX_SIGNS_PER_CAN }, (_, i) => (i / MAX_SIGNS_PER_CAN) * Math.PI * 2);
    const ringAngles = Array.from({ length: MAX_SIGNS_PER_RING }, (_, i) => (i / MAX_SIGNS_PER_RING) * Math.PI * 2);
    const sphereAngles = Array.from({ length: MAX_SIGNS_PER_SPHERE }, (_, i) => (i / MAX_SIGNS_PER_SPHERE) * Math.PI * 2);
    return { canAngles, ringAngles, sphereAngles };
  }, []);

  useFrame(({ camera, clock }) => {
    if (!meshHRef.current || !meshVRef.current || !params.showChargeSigns) {
      if (meshHRef.current) meshHRef.current.count = 0;
      if (meshVRef.current) meshVRef.current.count = 0;
      return;
    }

    const t = clock.getElapsedTime() * 2.5;

    const normVa = Math.min(1.0, Math.abs(state.voltageA) / 14000);
    const normVb = Math.min(1.0, Math.abs(state.voltageB) / 14000);

    const countCanA = Math.max(1, Math.round(normVa * MAX_SIGNS_PER_CAN));
    const countRingA = Math.max(1, Math.round(normVb * MAX_SIGNS_PER_RING));
    const countSphereA = Math.max(1, Math.round(normVa * MAX_SIGNS_PER_SPHERE));

    const countCanB = Math.max(1, Math.round(normVb * MAX_SIGNS_PER_CAN));
    const countRingB = Math.max(1, Math.round(normVa * MAX_SIGNS_PER_RING));
    const countSphereB = Math.max(1, Math.round(normVb * MAX_SIGNS_PER_SPHERE));

    const isCanAPlus = state.voltageA >= 0;
    const isCanBPlus = state.voltageB >= 0;
    const isRingAPlus = state.voltageB >= 0;
    const isRingBPlus = state.voltageA >= 0;
    const isSphereAPlus = isCanAPlus;
    const isSphereBPlus = isCanBPlus;

    let hIdx = 0;
    let vIdx = 0;

    const userScale = params.chargeSignSize ?? 1.2;
    const baseSignScale = 0.026 * userScale;
    const pulse = 1.0 + Math.sin(t * 3.0) * 0.1;

    const addSign = (
      x: number,
      y: number,
      z: number,
      isPlus: boolean,
      intensity: number
    ) => {
      const s = baseSignScale * pulse * Math.max(0.65, intensity);

      _dummyH.position.set(x, y, z);
      _dummyH.quaternion.copy(camera.quaternion);
      _dummyH.scale.set(s * 1.0, s * 0.16, s * 0.16);
      _dummyH.updateMatrix();
      meshHRef.current?.setMatrixAt(hIdx, _dummyH.matrix);

      if (isPlus) {
        _color.set('#f59e0b'); // Gold / Amber (+)
      } else {
        _color.set('#ec4899'); // Pink / Magenta (−)
      }
      meshHRef.current?.setColorAt(hIdx, _color);
      hIdx++;

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

    // 1. CAN A (Left Can: Positive +)
    for (let i = 0; i < countCanA; i++) {
      const angle = distributionData.canAngles[i] + t * 0.12;
      const r = 0.23;
      const x = canLeftPos[0] + Math.cos(angle) * r;
      const y = canLeftPos[1] + 0.32;
      const z = canLeftPos[2] + Math.sin(angle) * r;
      addSign(x, y, z, isCanAPlus, normVa);
    }

    // 2. RING A (Left Ring: Negative −)
    for (let i = 0; i < countRingA; i++) {
      const angle = distributionData.ringAngles[i] - t * 0.15;
      const r = 0.13;
      const x = ringLeftPos[0] + Math.cos(angle) * r;
      const y = ringLeftPos[1] + 0.02;
      const z = ringLeftPos[2] + Math.sin(angle) * r;
      addSign(x, y, z, isRingAPlus, normVb);
    }

    // 3. NOZZLE TIPS (Offset outside nozzle tips so falling water stream is 100% unblocked)
    const halfSep = Math.abs(canRightPos[0]);
    addSign(-halfSep - 0.08, 2.08, 0.04, true, normVa); // Offset 8cm left outside Left Nozzle
    addSign(+halfSep + 0.08, 2.08, 0.04, false, normVb); // Offset 8cm right outside Right Nozzle

    // 4. SPARK SPHERE A
    for (let i = 0; i < countSphereA; i++) {
      const angle = distributionData.sphereAngles[i] + t * 0.2;
      const r = sphereRadius + 0.02;
      const x = sparkLeftPos[0] + Math.cos(angle) * r;
      const y = sparkLeftPos[1] + Math.sin(angle) * r;
      const z = sparkLeftPos[2] + Math.sin(angle * 2) * 0.01;
      addSign(x, y, z, isSphereAPlus, normVa);
    }

    // 5. CAN B (Right Can: Negative −)
    for (let i = 0; i < countCanB; i++) {
      const angle = distributionData.canAngles[i] - t * 0.12;
      const r = 0.23;
      const x = canRightPos[0] + Math.cos(angle) * r;
      const y = canRightPos[1] + 0.32;
      const z = canRightPos[2] + Math.sin(angle) * r;
      addSign(x, y, z, isCanBPlus, normVb);
    }

    // 6. RING B (Right Ring: Positive +)
    for (let i = 0; i < countRingB; i++) {
      const angle = distributionData.ringAngles[i] + t * 0.15;
      const r = 0.13;
      const x = ringRightPos[0] + Math.cos(angle) * r;
      const y = ringRightPos[1] + 0.02;
      const z = ringRightPos[2] + Math.sin(angle) * r;
      addSign(x, y, z, isRingBPlus, normVa);
    }

    // 7. SPARK SPHERE B
    for (let i = 0; i < countSphereB; i++) {
      const angle = distributionData.sphereAngles[i] - t * 0.2;
      const r = sphereRadius + 0.02;
      const x = sparkRightPos[0] + Math.cos(angle) * r;
      const y = sparkRightPos[1] + Math.sin(angle) * r;
      const z = sparkRightPos[2] + Math.sin(angle * 2) * 0.01;
      addSign(x, y, z, isSphereBPlus, normVb);
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
        args={[undefined, undefined, MAX_TOTAL_SIGNS]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      <instancedMesh
        ref={meshVRef}
        args={[undefined, undefined, MAX_TOTAL_SIGNS]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
};
