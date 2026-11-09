import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SimulationParams, SimulationState, DropletData } from '../types/simulation';
import { audioEngine } from '../services/AudioEngine';
import { getWindVector } from '../services/physicsEngine';

interface DropletParticlesProps {
  params: SimulationParams;
  state: SimulationState;
  nozzleLeftPos: [number, number, number];
  nozzleRightPos: [number, number, number];
  ringLeftPos: [number, number, number];
  ringRightPos: [number, number, number];
  canLeftPos: [number, number, number];
  canRightPos: [number, number, number];
}

const MAX_DROPLETS = 600;
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

export const DropletParticles: React.FC<DropletParticlesProps> = ({
  params,
  state,
  nozzleLeftPos,
  nozzleRightPos,
  ringLeftPos,
  ringRightPos,
  canLeftPos,
  canRightPos,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dropletsRef = useRef<DropletData[]>([]);
  const nextIdRef = useRef(0);
  const spawnTimerLeftRef = useRef(0);
  const spawnTimerRightRef = useRef(0);

  // Sync audio mute state & cleanup stream audio on unmount
  useEffect(() => {
    audioEngine.setMuted(!params.audioEnabled);
    return () => {
      audioEngine.stopWaterStreamSound();
    };
  }, [params.audioEnabled]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (params.isPaused) {
      audioEngine.stopWaterStreamSound();
      return;
    }

    // Update continuous liquid stream ambient audio loop
    if (params.audioEnabled) {
      audioEngine.updateWaterStreamSound(params.dropletRate, params.isPaused);
    } else {
      audioEngine.stopWaterStreamSound();
    }

    const dt = Math.min(0.05, delta) * params.simSpeed;
    const droplets = dropletsRef.current;
    const spawnInterval = 1.0 / Math.max(1, params.dropletRate);

    // Wind vector in 3D
    const [wx, wy, wz] = getWindVector(params.windSpeed, params.windDirection);
    // Air density drag scale (Ideal gas law ratio)
    const airDragScale = Math.min(1.5, Math.max(0.6, state.airDensity / 1.204));

    // 1. SPAWN NEW DROPLETS
    spawnTimerLeftRef.current += dt;
    spawnTimerRightRef.current += dt;

    // Droplet diameter scale from temperature
    const baseRadius = 0.018 * (state.dropletDiameter / 2.5);

    // Left nozzle (Side A)
    while (spawnTimerLeftRef.current >= spawnInterval && droplets.length < MAX_DROPLETS) {
      spawnTimerLeftRef.current -= spawnInterval;
      const inducedChargeNc = (-state.inductionCapacitance * state.voltageB) * 1e9;

      if (params.audioEnabled && droplets.length % 2 === 0) {
        audioEngine.playDroplet(0.7, (Math.random() - 0.5) * 0.4);
      }

      droplets.push({
        id: nextIdRef.current++,
        nozzle: 'A',
        x: nozzleLeftPos[0] + (Math.random() - 0.5) * 0.004,
        y: nozzleLeftPos[1] - 0.02,
        z: nozzleLeftPos[2] + (Math.random() - 0.5) * 0.004,
        vx: (Math.random() - 0.5) * 0.015,
        vy: -0.25, // initial downward nozzle exit velocity
        vz: (Math.random() - 0.5) * 0.015,
        charge: inducedChargeNc,
        radius: baseRadius * (0.92 + Math.random() * 0.16),
        life: 0,
        maxLife: 3.5,
      });
    }

    // Right nozzle (Side B)
    while (spawnTimerRightRef.current >= spawnInterval && droplets.length < MAX_DROPLETS) {
      spawnTimerRightRef.current -= spawnInterval;
      const inducedChargeNc = (-state.inductionCapacitance * state.voltageA) * 1e9;

      if (params.audioEnabled && droplets.length % 2 === 1) {
        audioEngine.playDroplet(0.7, (Math.random() - 0.5) * 0.4);
      }

      droplets.push({
        id: nextIdRef.current++,
        nozzle: 'B',
        x: nozzleRightPos[0] + (Math.random() - 0.5) * 0.004,
        y: nozzleRightPos[1] - 0.02,
        z: nozzleRightPos[2] + (Math.random() - 0.5) * 0.004,
        vx: (Math.random() - 0.5) * 0.015,
        vy: -0.25,
        vz: (Math.random() - 0.5) * 0.015,
        charge: inducedChargeNc,
        radius: baseRadius * (0.92 + Math.random() * 0.16),
        life: 0,
        maxLife: 3.5,
      });
    }

    // 2. SIMULATE FLUID MOTION, WIND DEFLECTION & REALISTIC ELECTROSTATIC STREAM CURVATURE
    const canAY = canLeftPos[1];
    const canBY = canRightPos[1];
    const canRadius = 0.19;
    const canWaterSurfaceA = canAY - 0.05 + Math.max(0.02, (state.currentWaterVolumeA / 350) * 0.45);
    const canWaterSurfaceB = canBY - 0.05 + Math.max(0.02, (state.currentWaterVolumeB / 350) * 0.45);

    const deflectScale = params.enableDeflection ? 1.0 : 0.05;
    const vAKv = state.voltageA / 1000;
    const vBKv = state.voltageB / 1000;
    const vDiffKv = (state.voltageA - state.voltageB) / 1000;

    for (let i = droplets.length - 1; i >= 0; i--) {
      const d = droplets[i];
      d.life += dt;

      // Gravity acceleration
      d.vy -= 9.81 * dt * 0.65;

      // Wind draft acceleration
      if (params.windSpeed > 0) {
        d.vx += (wx - d.vx) * dt * 2.8 * airDragScale;
        d.vz += (wz - d.vz) * dt * 2.8 * airDragScale;
      }

      // Air drag
      d.vx *= 1.0 - 0.015 * airDragScale;
      d.vy *= 1.0 - 0.008 * airDragScale;
      d.vz *= 1.0 - 0.015 * airDragScale;

      // ELECTROSTATIC STREAM CURVATURE PHYSICS
      if (d.nozzle === 'A') {
        // --- SIDE A DROPLET (Positive Charge q > 0) ---
        // 1. Inward Attraction to Ring A (Opposite charge attraction)
        if (d.y > ringLeftPos[1] - 0.15 && d.y < nozzleLeftPos[1]) {
          const dxRing = ringLeftPos[0] - d.x;
          const dzRing = ringLeftPos[2] - d.z;
          const ringAttraction = Math.abs(vBKv) * 16.0 * deflectScale;
          d.vx += dxRing * ringAttraction * dt;
          d.vz += dzRing * ringAttraction * dt;
        }

        // 2. Cross-Apparatus Electric Field Bending (Pulled toward opposite side B potential)
        d.vx += vDiffKv * 0.18 * deflectScale * dt;

        // 3. Like-Charge Collector Can A Repulsion (Outward spray cone flaring)
        if (d.y < ringLeftPos[1]) {
          const dxCan = d.x - canLeftPos[0];
          const dzCan = d.z - canLeftPos[2];
          const dyCan = d.y - canAY;
          const distSq = dxCan * dxCan + dzCan * dzCan + dyCan * dyCan + 0.015;

          const canRepulsion = (vAKv / distSq) * 0.0035 * deflectScale;
          d.vx += dxCan * canRepulsion * dt * 32;
          d.vz += dzCan * canRepulsion * dt * 32;
          if (dyCan > 0) {
            d.vy += dyCan * canRepulsion * dt * 10; // Upward levitation / spray deceleration at high kV
          }
        }

        // Splash check on Can A water surface
        if (d.y <= canWaterSurfaceA) {
          const dxCan = d.x - canLeftPos[0];
          const dzCan = d.z - canLeftPos[2];
          const rFromCenter = Math.sqrt(dxCan * dxCan + dzCan * dzCan);
          if (rFromCenter <= canRadius) {
            if (params.audioEnabled && Math.random() < 0.3) {
              audioEngine.playDroplet(0.9, Math.min(1.2, Math.abs(vAKv) / 8));
            }
            droplets.splice(i, 1);
            continue;
          }
        }
      } else {
        // --- SIDE B DROPLET (Negative Charge q < 0) ---
        // 1. Inward Attraction to Ring B (Opposite charge attraction)
        if (d.y > ringRightPos[1] - 0.15 && d.y < nozzleRightPos[1]) {
          const dxRing = ringRightPos[0] - d.x;
          const dzRing = ringRightPos[2] - d.z;
          const ringAttraction = Math.abs(vAKv) * 16.0 * deflectScale;
          d.vx += dxRing * ringAttraction * dt;
          d.vz += dzRing * ringAttraction * dt;
        }

        // 2. Cross-Apparatus Electric Field Bending
        d.vx -= vDiffKv * 0.18 * deflectScale * dt;

        // 3. Like-Charge Collector Can B Repulsion (Outward spray cone flaring)
        if (d.y < ringRightPos[1]) {
          const dxCan = d.x - canRightPos[0];
          const dzCan = d.z - canRightPos[2];
          const dyCan = d.y - canBY;
          const distSq = dxCan * dxCan + dzCan * dzCan + dyCan * dyCan + 0.015;

          const canRepulsion = (vBKv / distSq) * 0.0035 * deflectScale;
          d.vx += dxCan * canRepulsion * dt * 32;
          d.vz += dzCan * canRepulsion * dt * 32;
          if (dyCan > 0) {
            d.vy += dyCan * canRepulsion * dt * 10;
          }
        }

        // Splash check on Can B water surface
        if (d.y <= canWaterSurfaceB) {
          const dxCan = d.x - canRightPos[0];
          const dzCan = d.z - canRightPos[2];
          const rFromCenter = Math.sqrt(dxCan * dxCan + dzCan * dzCan);
          if (rFromCenter <= canRadius) {
            if (params.audioEnabled && Math.random() < 0.3) {
              audioEngine.playDroplet(0.9, Math.min(1.2, Math.abs(vBKv) / 8));
            }
            droplets.splice(i, 1);
            continue;
          }
        }
      }

      // Update position
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.z += d.vz * dt;

      if (d.y < 0.02 || d.life > d.maxLife) {
        droplets.splice(i, 1);
      }
    }

    // 3. UPDATE INSTANCED MESH
    const count = droplets.length;
    meshRef.current.count = count;

    for (let i = 0; i < count; i++) {
      const d = droplets[i];
      _dummy.position.set(d.x, d.y, d.z);
      const speed = Math.sqrt(d.vx * d.vx + d.vy * d.vy + d.vz * d.vz);
      const stretch = Math.min(1.8, 1.0 + speed * 0.18);
      _dummy.scale.set(d.radius, d.radius * stretch, d.radius);
      _dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, _dummy.matrix);

      // WATER IS ALWAYS NATURAL PURE BLUE (#38bdf8)!
      _color.set('#38bdf8');
      meshRef.current.setColorAt(i, _color);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Continuous Liquid Water Jet Column (always pure blue) */}
      {params.dropletRate >= 16 && (
        <group>
          {/* Left stream jet */}
          <mesh position={[nozzleLeftPos[0], nozzleLeftPos[1] - state.breakupLength / 2, nozzleLeftPos[2]]}>
            <cylinderGeometry args={[0.006, 0.005, state.breakupLength, 12]} />
            <meshStandardMaterial
              color="#38bdf8"
              transparent
              opacity={0.8}
              roughness={0.05}
            />
          </mesh>
          {/* Right stream jet */}
          <mesh position={[nozzleRightPos[0], nozzleRightPos[1] - state.breakupLength / 2, nozzleRightPos[2]]}>
            <cylinderGeometry args={[0.006, 0.005, state.breakupLength, 12]} />
            <meshStandardMaterial
              color="#38bdf8"
              transparent
              opacity={0.8}
              roughness={0.05}
            />
          </mesh>
        </group>
      )}

      {/* Instanced falling water droplets (always pure blue liquid) */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, MAX_DROPLETS]}
        frustumCulled={false}
        castShadow
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color="#38bdf8"
          roughness={0.05}
          metalness={0.1}
          transparent
          opacity={0.82}
        />
      </instancedMesh>
    </group>
  );
};
