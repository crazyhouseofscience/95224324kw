import React, { useMemo } from 'react';
import * as THREE from 'three';
import { SimulationParams, SimulationState } from '../types/simulation';

interface ElectricFieldLinesProps {
  params: SimulationParams;
  state: SimulationState;
  nozzleLeftPos: [number, number, number];
  nozzleRightPos: [number, number, number];
  ringLeftPos: [number, number, number];
  ringRightPos: [number, number, number];
  canLeftPos: [number, number, number];
  canRightPos: [number, number, number];
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
}) => {
  if (!params.showFieldLines) return null;

  // Potential magnitudes
  const normVa = Math.min(1.0, Math.abs(state.voltageA) / 12000);
  const normVb = Math.min(1.0, Math.abs(state.voltageB) / 12000);
  const normDiff = Math.min(1.0, Math.abs(state.potentialDifference) / 15000);

  // Field lines between Nozzle A (ground 0V) and Ring A (potential V_B)
  const linesRingA = useMemo(() => {
    const lines: THREE.BufferGeometry[] = [];
    const numLines = 8;
    const rRing = 0.095;

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
      const pMid = new THREE.Vector3(
        (nx + rx) / 2 + Math.cos(angle) * 0.03,
        (ny + ry) / 2,
        (nz + rz) / 2 + Math.sin(angle) * 0.03
      );

      const curve = new THREE.QuadraticBezierCurve3(pStart, pMid, pEnd);
      const points = curve.getPoints(12);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      lines.push(geo);
    }
    return lines;
  }, [ringLeftPos, nozzleLeftPos]);

  // Field lines between Nozzle B (ground 0V) and Ring B (potential V_A)
  const linesRingB = useMemo(() => {
    const lines: THREE.BufferGeometry[] = [];
    const numLines = 8;
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
      const pMid = new THREE.Vector3(
        (nx + rx) / 2 + Math.cos(angle) * 0.03,
        (ny + ry) / 2,
        (nz + rz) / 2 + Math.sin(angle) * 0.03
      );

      const curve = new THREE.QuadraticBezierCurve3(pStart, pMid, pEnd);
      const points = curve.getPoints(12);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      lines.push(geo);
    }
    return lines;
  }, [ringRightPos, nozzleRightPos]);

  // Field lines across Spark Gap Spheres
  const linesSparkGap = useMemo(() => {
    const lines: THREE.BufferGeometry[] = [];
    const halfGap = (params.sparkGapDistance * 0.007) / 2;
    const sparkY = canLeftPos[1] + 0.42;

    const count = 5;
    for (let i = 0; i < count; i++) {
      const offset = ((i - (count - 1) / 2) / count) * 0.05;
      const p1 = new THREE.Vector3(-halfGap, sparkY + offset * 0.3, offset);
      const p2 = new THREE.Vector3(halfGap, sparkY + offset * 0.3, offset);
      const pMid = new THREE.Vector3(0, sparkY + offset * 1.5, offset * 1.5);

      const curve = new THREE.QuadraticBezierCurve3(p1, pMid, p2);
      const points = curve.getPoints(10);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      lines.push(geo);
    }
    return lines;
  }, [params.sparkGapDistance, canLeftPos]);

  // Color selection based on polarity
  const colorRingA = state.voltageB >= 0 ? '#f59e0b' : '#38bdf8';
  const colorRingB = state.voltageA >= 0 ? '#f59e0b' : '#38bdf8';

  const lineObjectsA = useMemo(() => {
    const mat = new THREE.LineDashedMaterial({
      color: colorRingA,
      dashSize: 0.02,
      gapSize: 0.015,
      transparent: true,
      opacity: Math.max(0.2, normVb * 0.8),
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
      opacity: Math.max(0.2, normVa * 0.8),
    });
    return linesRingB.map((geo) => {
      const line = new THREE.Line(geo, mat);
      line.computeLineDistances();
      return line;
    });
  }, [linesRingB, colorRingB, normVa]);

  const lineObjectsSpark = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color: '#a78bfa',
      transparent: true,
      opacity: Math.max(0.25, normDiff * 0.9),
    });
    return linesSparkGap.map((geo) => new THREE.Line(geo, mat));
  }, [linesSparkGap, normDiff]);

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

      {/* Spark Gap Field Lines */}
      {lineObjectsSpark.map((lineObj, idx) => (
        <primitive key={`spark_${idx}`} object={lineObj} />
      ))}
    </group>
  );
};
