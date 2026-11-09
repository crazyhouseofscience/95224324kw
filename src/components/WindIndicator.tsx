import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { SimulationParams } from '../types/simulation';
import { getWindVector } from '../services/physicsEngine';

interface WindIndicatorProps {
  params: SimulationParams;
}

const NUM_WIND_PARTICLES = 120;
const _dummy = new THREE.Object3D();

export const WindIndicator: React.FC<WindIndicatorProps> = ({ params }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particlesRef = useRef<Array<{ x: number; y: number; z: number; speed: number }>>([]);

  const windVec = useMemo(() => {
    return getWindVector(params.windSpeed, params.windDirection);
  }, [params.windSpeed, params.windDirection]);

  // Initialize wind stream particles
  useMemo(() => {
    const list = [];
    for (let i = 0; i < NUM_WIND_PARTICLES; i++) {
      list.push({
        x: (Math.random() - 0.5) * 2.8,
        y: 0.2 + Math.random() * 2.2,
        z: (Math.random() - 0.5) * 1.5,
        speed: 0.8 + Math.random() * 0.4,
      });
    }
    particlesRef.current = list;
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current || params.windSpeed <= 0.05) return;
    const dt = Math.min(0.05, delta) * params.simSpeed;
    const list = particlesRef.current;
    const [wx, wy, wz] = windVec;

    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      p.x += wx * dt * p.speed * 0.6;
      p.y += wy * dt * p.speed * 0.6;
      p.z += wz * dt * p.speed * 0.6;

      // Wrap around bounding box
      if (p.x > 1.8) p.x = -1.8;
      if (p.x < -1.8) p.x = 1.8;
      if (p.z > 1.2) p.z = -1.2;
      if (p.z < -1.2) p.z = 1.2;

      _dummy.position.set(p.x, p.y, p.z);
      // Elongate along wind direction
      const len = Math.max(0.04, params.windSpeed * 0.05);
      if (params.windDirection === 'left-to-right' || params.windDirection === 'right-to-left') {
        _dummy.scale.set(len, 0.005, 0.005);
      } else {
        _dummy.scale.set(0.005, 0.005, len);
      }
      _dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, _dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (params.windSpeed <= 0.05) return null;

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, NUM_WIND_PARTICLES]}
        frustumCulled={false}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={Math.min(0.4, params.windSpeed * 0.12)}
        />
      </instancedMesh>
    </group>
  );
};
