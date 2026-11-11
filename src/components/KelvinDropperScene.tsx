import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { SimulationParams, SimulationState } from '../types/simulation';
import { ProbeState } from '../types/probingLab';
import { ApparatusModel } from './ApparatusModel';
import { DropletParticles } from './DropletParticles';
import { ElectricFieldLines } from './ElectricFieldLines';
import { Hotspot3DTracker, HotspotDOMOverlay, ScreenPosition } from './HotspotMarkers';
import { WindIndicator } from './WindIndicator';
import { ElectronFlowWires } from './ElectronFlowWires';
import { ChargeBuildupSigns } from './ChargeBuildupSigns';
import { SparkGapChargeBuildup } from './SparkGapChargeBuildup';
import { ProbeObject3D } from './ProbeObject3D';

interface KelvinDropperSceneProps {
  params: SimulationParams;
  state: SimulationState;
  showHotspots: boolean;
  probe?: ProbeState;
  setProbe?: React.Dispatch<React.SetStateAction<ProbeState>>;
}

export const KelvinDropperScene: React.FC<KelvinDropperSceneProps> = ({
  params,
  state,
  showHotspots,
  probe,
  setProbe,
}) => {
  const [hotspotPositions, setHotspotPositions] = useState<Record<string, ScreenPosition>>({});

  // Geometric positions calculated from parameters
  const separation = params.dropperSeparation; // ~1.1m scale
  const halfSep = separation / 2;

  const nozzleLeftPos = useMemo<[number, number, number]>(() => [-halfSep, 2.0, 0], [halfSep]);
  const nozzleRightPos = useMemo<[number, number, number]>(() => [halfSep, 2.0, 0], [halfSep]);

  const ringY = nozzleLeftPos[1] - params.ringHeight;
  const ringLeftPos = useMemo<[number, number, number]>(() => [-halfSep, ringY, 0], [halfSep, ringY]);
  const ringRightPos = useMemo<[number, number, number]>(() => [halfSep, ringY, 0], [halfSep, ringY]);

  const canLeftPos = useMemo<[number, number, number]>(() => [-halfSep, 0.45, 0], [halfSep]);
  const canRightPos = useMemo<[number, number, number]>(() => [halfSep, 0.45, 0], [halfSep]);

  // Software WebGL detection
  const isSoftwareGl = useMemo(() => {
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      return false;
    }
  }, []);

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [0, 1.15, 4.8], fov: 36 }}
        dpr={isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)}
        shadows={!isSoftwareGl}
        gl={{
          antialias: !isSoftwareGl,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
      >
        <color attach="background" args={['#030712']} />

        {/* 3-Point Studio Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[3, 5, 4]}
          intensity={1.3}
          castShadow={!isSoftwareGl}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0005}
        />
        <hemisphereLight
          args={['#38bdf8', '#0f172a', 0.6]}
          position={[0, 4, 0]}
        />
        <directionalLight
          position={[-3, 2, -3]}
          intensity={0.5}
          color="#94a3b8"
        />

        {/* Soft Contact Ground Shadow */}
        <ContactShadows
          position={[0, -0.09, 0]}
          opacity={0.65}
          scale={3.5}
          blur={1.8}
          far={1.5}
        />

        {/* 3D Physics Apparatus */}
        <ApparatusModel
          params={params}
          state={state}
          nozzleLeftPos={nozzleLeftPos}
          nozzleRightPos={nozzleRightPos}
          ringLeftPos={ringLeftPos}
          ringRightPos={ringRightPos}
          canLeftPos={canLeftPos}
          canRightPos={canRightPos}
        />

        {/* Droplets Fluid Dynamics Particle System */}
        <DropletParticles
          params={params}
          state={state}
          nozzleLeftPos={nozzleLeftPos}
          nozzleRightPos={nozzleRightPos}
          ringLeftPos={ringLeftPos}
          ringRightPos={ringRightPos}
          canLeftPos={canLeftPos}
          canRightPos={canRightPos}
          probe={probe}
        />

        {/* Electric Field Vector Lines */}
        <ElectricFieldLines
          params={params}
          state={state}
          nozzleLeftPos={nozzleLeftPos}
          nozzleRightPos={nozzleRightPos}
          ringLeftPos={ringLeftPos}
          ringRightPos={ringRightPos}
          canLeftPos={canLeftPos}
          canRightPos={canRightPos}
          probe={probe}
        />

        {/* Animated Mobile Electron Flow Along Wires & Leads */}
        <ElectronFlowWires
          params={params}
          state={state}
          ringLeftPos={ringLeftPos}
          ringRightPos={ringRightPos}
          canLeftPos={canLeftPos}
          canRightPos={canRightPos}
          sparkGapDistance={params.sparkGapDistance}
        />

        {/* Dynamic + and - Charge Buildup Signs on Cans, Rings & Electrodes */}
        <ChargeBuildupSigns
          params={params}
          state={state}
          ringLeftPos={ringLeftPos}
          ringRightPos={ringRightPos}
          canLeftPos={canLeftPos}
          canRightPos={canRightPos}
          sparkGapDistance={params.sparkGapDistance}
        />

        {/* Dedicated Spark Gap Charge Accumulation & Dielectric Field Corona */}
        <SparkGapChargeBuildup
          params={params}
          state={state}
          canLeftPos={canLeftPos}
          canRightPos={canRightPos}
        />

        {/* Ambient Crosswind Breeze Indicator */}
        <WindIndicator params={params} />

        {/* Module 2: Draggable Physical Material Object (Metal, Plastic, Wood, Rubber) */}
        {probe && setProbe && probe.enabled && (
          <ProbeObject3D
            probe={probe}
            setProbe={setProbe}
            canLeftPos={canLeftPos}
            canRightPos={canRightPos}
            ringLeftPos={ringLeftPos}
            ringRightPos={ringRightPos}
          />
        )}

        {/* Interactive Theory 3D Position Tracker (Inside R3F Canvas) */}
        <Hotspot3DTracker
          showHotspots={showHotspots}
          onUpdatePositions={setHotspotPositions}
        />

        {/* Orbit Controls (temporarily disabled while dragging 3D probe) */}
        <OrbitControls
          enabled={!probe?.isDragging}
          enableDamping={!isSoftwareGl}
          dampingFactor={0.06}
          target={[0, 1.15, 0]}
          minDistance={1.4}
          maxDistance={7.0}
          maxPolarAngle={Math.PI / 2 + 0.05}
        />
      </Canvas>

      {/* Interactive Theory DOM Overlay (Outside R3F Canvas, avoiding React 19 root unmount race conditions) */}
      <HotspotDOMOverlay
        showHotspots={showHotspots}
        positions={hotspotPositions}
      />
    </div>
  );
};
