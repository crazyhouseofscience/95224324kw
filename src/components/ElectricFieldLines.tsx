import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SimulationParams, SimulationState } from '../types/simulation';
import { ProbeState, MATERIAL_DEFINITIONS } from '../types/probingLab';

interface ElectricFieldLinesProps {
  params: SimulationParams;
  state: SimulationState;
  nozzleLeftPos: [number, number, number];
  nozzleRightPos: [number, number, number];
  ringLeftPos: [number, number, number];
  ringRightPos: [number, number, number];
  canLeftPos: [number, number, number];
  canRightPos: [number, number, number];
  probe?: ProbeState;
}

export const ElectricFieldLines: React.FC<ElectricFieldLinesProps> = ({
  params,
  state,
  nozzleLeftPos,
  nozzleRightPos,
  ringLeftPos,
  ringRightPos,
  canLeftPos,
  canRightPos,
  probe,
}) => {
  const matRingARef = useRef<THREE.LineDashedMaterial>(null);
  const matRingBRef = useRef<THREE.LineDashedMaterial>(null);
  const matProbeRef = useRef<THREE.LineDashedMaterial>(null);

  if (!params.showFieldLines) return null;

  // Potential normalized magnitudes
  const normVa = Math.min(1.0, Math.abs(state.voltageA) / 12000);
  const normVb = Math.min(1.0, Math.abs(state.voltageB) / 12000);
  const normDiff = Math.min(1.0, Math.abs(state.potentialDifference) / 15000);

  // Probe Position & Material Specs
  const probePos = probe && probe.enabled ? new THREE.Vector3(...probe.position) : null;
  const probeMat = probe ? MATERIAL_DEFINITIONS[probe.materialId] : null;
  const kappa = probe ? probe.customPermittivity || (probeMat ? probeMat.permittivity : 1.0) : 1.0;

  // ----------------------------------------------------
  // 1. RING A FIELD LINES (Warped dynamically by Probe)
  // ----------------------------------------------------
  const linesRingA = useMemo(() => {
    const lines: THREE.BufferGeometry[] = [];
    const numLines = 10;
    const rRing = 0.095;
    const ringLeftCenter = new THREE.Vector3(...ringLeftPos);

    for (let i = 0; i < numLines; i++) {
      const angle = (i / numLines) * Math.PI * 2;
      const rx = ringLeftPos[0] + Math.cos(angle) * rRing;
      const rz = ringLeftPos[2] + Math.sin(angle) * rRing;
      const ry = ringLeftPos[1];

      const nx = nozzleLeftPos[0] + (Math.cos(angle) * rRing) * 0.15;
      const nz = nozzleLeftPos[2] + (Math.sin(angle) * rRing) * 0.15;
      const ny = nozzleLeftPos[1];

      const pStart = new THREE.Vector3(nx, ny, nz);
      const pEnd = new THREE.Vector3(rx, ry, rz);
      let pMid = new THREE.Vector3(
        (nx + rx) / 2 + Math.cos(angle) * 0.03,
        (ny + ry) / 2,
        (nz + rz) / 2 + Math.sin(angle) * 0.03
      );

      // Check field distortion from Probe near Ring A
      if (probePos) {
        const distToRing = pMid.distanceTo(probePos);
        if (distToRing < 0.42) {
          const proxRatio = Math.pow(1.0 - distToRing / 0.42, 1.3);
          let warpFactor = 0.25;

          if (probe?.materialId === 'metal-copper') {
            warpFactor = probe.isGrounded ? 0.85 : 0.65; // Conductor image charge attraction
          } else if (probe?.materialId === 'plastic-pvc') {
            warpFactor = 0.35 + Math.min(0.4, Math.abs(probe.chargeKv) * 0.03); // Triboelectric charge repulsion/attraction
          } else if (probe?.materialId === 'ionizing-flame') {
            warpFactor = 0.55; // Plasma ion dispersion
          } else {
            warpFactor = 0.2 + (kappa - 1) * 0.08; // Dielectric polarization
          }

          const totalWarp = proxRatio * warpFactor;
          pMid.lerp(probePos, totalWarp * 0.8);
          pEnd.lerp(probePos, totalWarp * 0.4);
        }
      }

      const curve = new THREE.QuadraticBezierCurve3(pStart, pMid, pEnd);
      const points = curve.getPoints(14);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      lines.push(geo);
    }
    return lines;
  }, [ringLeftPos, nozzleLeftPos, probePos, probe?.materialId, probe?.isGrounded, probe?.chargeKv, kappa]);

  // ----------------------------------------------------
  // 2. RING B FIELD LINES (Warped dynamically by Probe)
  // ----------------------------------------------------
  const linesRingB = useMemo(() => {
    const lines: THREE.BufferGeometry[] = [];
    const numLines = 10;
    const rRing = 0.095;

    for (let i = 0; i < numLines; i++) {
      const angle = (i / numLines) * Math.PI * 2;
      const rx = ringRightPos[0] + Math.cos(angle) * rRing;
      const rz = ringRightPos[2] + Math.sin(angle) * rRing;
      const ry = ringRightPos[1];

      const nx = nozzleRightPos[0] + (Math.cos(angle) * rRing) * 0.15;
      const nz = nozzleRightPos[2] + (Math.sin(angle) * rRing) * 0.15;
      const ny = nozzleRightPos[1];

      const pStart = new THREE.Vector3(nx, ny, nz);
      const pEnd = new THREE.Vector3(rx, ry, rz);
      let pMid = new THREE.Vector3(
        (nx + rx) / 2 + Math.cos(angle) * 0.03,
        (ny + ry) / 2,
        (nz + rz) / 2 + Math.sin(angle) * 0.03
      );

      // Check field distortion from Probe near Ring B
      if (probePos) {
        const distToRing = pMid.distanceTo(probePos);
        if (distToRing < 0.42) {
          const proxRatio = Math.pow(1.0 - distToRing / 0.42, 1.3);
          let warpFactor = 0.25;

          if (probe?.materialId === 'metal-copper') {
            warpFactor = probe.isGrounded ? 0.85 : 0.65;
          } else if (probe?.materialId === 'plastic-pvc') {
            warpFactor = 0.35 + Math.min(0.4, Math.abs(probe.chargeKv) * 0.03);
          } else if (probe?.materialId === 'ionizing-flame') {
            warpFactor = 0.55;
          } else {
            warpFactor = 0.2 + (kappa - 1) * 0.08;
          }

          const totalWarp = proxRatio * warpFactor;
          pMid.lerp(probePos, totalWarp * 0.8);
          pEnd.lerp(probePos, totalWarp * 0.4);
        }
      }

      const curve = new THREE.QuadraticBezierCurve3(pStart, pMid, pEnd);
      const points = curve.getPoints(14);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      lines.push(geo);
    }
    return lines;
  }, [ringRightPos, nozzleRightPos, probePos, probe?.materialId, probe?.isGrounded, probe?.chargeKv, kappa]);

  // ----------------------------------------------------
  // 3. DYNAMIC FIELD FLUX LINES TERMINATING ON PROBE OBJECT
  // ----------------------------------------------------
  const linesProbeInteraction = useMemo(() => {
    if (!probePos) return [];
    const lines: THREE.BufferGeometry[] = [];

    const ringA = new THREE.Vector3(...ringLeftPos);
    const ringB = new THREE.Vector3(...ringRightPos);

    const distA = ringA.distanceTo(probePos);
    const distB = ringB.distanceTo(probePos);

    const targetRing = distA < distB ? ringA : ringB;
    const minDist = Math.min(distA, distB);

    if (minDist < 0.38) {
      const count = 6;
      const rRing = 0.095;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const pStart = new THREE.Vector3(
          targetRing.x + Math.cos(angle) * rRing,
          targetRing.y,
          targetRing.z + Math.sin(angle) * rRing
        );
        const pEnd = probePos.clone().add(
          new THREE.Vector3(
            (Math.cos(angle) * 0.04),
            (Math.sin(angle) * 0.04),
            (Math.cos(angle * 2) * 0.02)
          )
        );
        const pMid = pStart.clone().lerp(pEnd, 0.5);
        pMid.y += 0.04 * Math.sin(angle);

        const curve = new THREE.QuadraticBezierCurve3(pStart, pMid, pEnd);
        const points = curve.getPoints(12);
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        lines.push(geo);
      }
    }
    return lines;
  }, [probePos, ringLeftPos, ringRightPos]);

  // ----------------------------------------------------
  // 4. SPARK GAP SPHERES FIELD LINES (Warped by Probe)
  // ----------------------------------------------------
  const linesSparkGap = useMemo(() => {
    const lines: THREE.BufferGeometry[] = [];
    const halfGap = (params.sparkGapDistance * 0.007) / 2;
    const sparkY = canLeftPos[1] + 0.42;

    const probeNearGap =
      probePos && Math.hypot(probePos.x - 0, probePos.y - sparkY, probePos.z) < 0.32;

    const count = 6;
    for (let i = 0; i < count; i++) {
      const offset = ((i - (count - 1) / 2) / count) * 0.05;
      const p1 = new THREE.Vector3(-halfGap, sparkY + offset * 0.3, offset);
      const p2 = new THREE.Vector3(halfGap, sparkY + offset * 0.3, offset);
      let pMid = new THREE.Vector3(0, sparkY + offset * 1.5, offset * 1.5);

      if (probeNearGap && probePos) {
        const warpFactor = probe?.materialId === 'metal-copper' ? 0.8 : 0.5;
        pMid.lerp(probePos, warpFactor);
      }

      const curve = new THREE.QuadraticBezierCurve3(p1, pMid, p2);
      const points = curve.getPoints(12);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      lines.push(geo);
    }
    return lines;
  }, [params.sparkGapDistance, canLeftPos, probePos, probe?.materialId]);

  // Color selection based on polarity
  const colorRingA = state.voltageB >= 0 ? '#f59e0b' : '#38bdf8';
  const colorRingB = state.voltageA >= 0 ? '#f59e0b' : '#38bdf8';
  const colorProbe = probe?.materialId === 'metal-copper' ? '#38bdf8' : '#e879f9';

  const lineObjectsA = useMemo(() => {
    const mat = new THREE.LineDashedMaterial({
      color: colorRingA,
      dashSize: 0.02,
      gapSize: 0.015,
      transparent: true,
      opacity: Math.max(0.25, normVb * 0.85),
    });
    return linesRingA.map((geo) => {
      const line = new THREE.Line(geo, mat);
      line.computeLineDistances();
      return line;
    });
  }, [linesRingA, colorRingA, normVb]);

  const lineObjectsB = useMemo(() => {
    const mat = new THREE.LineDashedMaterial({
      color: colorRingB,
      dashSize: 0.02,
      gapSize: 0.015,
      transparent: true,
      opacity: Math.max(0.25, normVa * 0.85),
    });
    return linesRingB.map((geo) => {
      const line = new THREE.Line(geo, mat);
      line.computeLineDistances();
      return line;
    });
  }, [linesRingB, colorRingB, normVa]);

  const lineObjectsProbe = useMemo(() => {
    const mat = new THREE.LineDashedMaterial({
      color: colorProbe,
      dashSize: 0.018,
      gapSize: 0.012,
      transparent: true,
      opacity: 0.9,
    });
    return linesProbeInteraction.map((geo) => {
      const line = new THREE.Line(geo, mat);
      line.computeLineDistances();
      return line;
    });
  }, [linesProbeInteraction, colorProbe]);

  const lineObjectsSpark = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color: '#a78bfa',
      transparent: true,
      opacity: Math.max(0.25, normDiff * 0.9),
    });
    return linesSparkGap.map((geo) => new THREE.Line(geo, mat));
  }, [linesSparkGap, normDiff]);

  // Animate line dash movements dynamically over time
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const dashOffset = -t * 0.25;

    lineObjectsA.forEach((obj) => {
      if (obj.material) {
        (obj.material as unknown as { dashOffset: number }).dashOffset = dashOffset;
      }
    });

    lineObjectsB.forEach((obj) => {
      if (obj.material) {
        (obj.material as unknown as { dashOffset: number }).dashOffset = dashOffset;
      }
    });

    lineObjectsProbe.forEach((obj) => {
      if (obj.material) {
        (obj.material as unknown as { dashOffset: number }).dashOffset = -t * 0.5; // Faster flow into probe object
      }
    });
  });

  return (
    <group>
      {/* Ring A Field Lines */}
      {lineObjectsA.map((lineObj, idx) => (
        <primitive key={`ringA_${idx}`} object={lineObj} />
      ))}

      {/* Ring B Field Lines */}
      {lineObjectsB.map((lineObj, idx) => (
        <primitive key={`ringB_${idx}`} object={lineObj} />
      ))}

      {/* Dedicated Probe Field Flux Coupling Lines */}
      {lineObjectsProbe.map((lineObj, idx) => (
        <primitive key={`probe_${idx}`} object={lineObj} />
      ))}

      {/* Spark Gap Field Lines */}
      {lineObjectsSpark.map((lineObj, idx) => (
        <primitive key={`spark_${idx}`} object={lineObj} />
      ))}
    </group>
  );
};
