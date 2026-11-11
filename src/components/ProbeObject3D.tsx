/**
 * 3D visual model and high-precision offset dragging for Module 2: Material Interaction Lab.
 * Features:
 * - High-precision delta offset cursor locking (zero lag, zero jitter)
 * - Smooth magnetic snapping into apparatus influence zones (Spark Gap, Water Streams, Rings, Cans)
 * - Grounding wires and spark discharge arcs
 */

import React, { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { ProbeState, MATERIAL_DEFINITIONS } from '../types/probingLab';

interface ProbeObject3DProps {
  probe: ProbeState;
  setProbe: React.Dispatch<React.SetStateAction<ProbeState>>;
  canLeftPos: [number, number, number];
  canRightPos: [number, number, number];
  ringLeftPos?: [number, number, number];
  ringRightPos?: [number, number, number];
}

const _raycaster = new THREE.Raycaster();
const _ndc = new THREE.Vector2();

export const ProbeObject3D: React.FC<ProbeObject3DProps> = ({
  probe,
  setProbe,
  canLeftPos,
  canRightPos,
  ringLeftPos,
  ringRightPos,
}) => {
  const { camera, gl } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const flameLightRef = useRef<THREE.PointLight>(null);
  const flameMeshRef = useRef<THREE.Mesh>(null);
  const arcLineRef = useRef<THREE.LineSegments>(null);
  const [isHovered, setIsHovered] = useState(false);
  const isDraggingRef = useRef(false);

  // High-precision drag refs
  const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const planeIntersectRef = useRef(new THREE.Vector3());
  const clickOffsetRef = useRef(new THREE.Vector3());
  const initialPosRef = useRef(new THREE.Vector3());

  const mat = MATERIAL_DEFINITIONS[probe.materialId];
  const sparkY = canLeftPos[1] + 0.42;

  // Ground wire curve
  const groundWireCurve = useMemo(() => {
    const p1 = new THREE.Vector3(...probe.position);
    p1.y += 0.16;
    const p2 = new THREE.Vector3(probe.position[0] * 0.7, 0.35, probe.position[2] + 0.25);
    const p3 = new THREE.Vector3(0.7, -0.04, 0.3);
    return new THREE.CatmullRomCurve3([p1, p2, p3]);
  }, [probe.position]);

  const groundWireGeo = useMemo(() => {
    return new THREE.TubeGeometry(groundWireCurve, 24, 0.005, 8, false);
  }, [groundWireCurve]);

  // Discharge arc target position
  const dischargeOrigin = useMemo<[number, number, number]>(() => {
    const px = probe.position[0];
    const py = probe.position[1];
    const distToSparkGap = Math.hypot(px - 0, py - sparkY);
    const distToCanA = Math.hypot(px - canLeftPos[0], py - canLeftPos[1]);
    const distToCanB = Math.hypot(px - canRightPos[0], py - canRightPos[1]);

    if (distToSparkGap <= distToCanA && distToSparkGap <= distToCanB) {
      return [px < 0 ? -0.03 : 0.03, sparkY, 0];
    }
    if (distToCanA < distToCanB) {
      return [canLeftPos[0], canLeftPos[1] + 0.3, canLeftPos[2]];
    }
    return [canRightPos[0], canRightPos[1] + 0.3, canRightPos[2]];
  }, [probe.position, sparkY, canLeftPos, canRightPos]);

  const arcPoints = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const segments = 12;
    const pos = new Float32Array(segments * 2 * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    if (probe.materialId === 'ionizing-flame') {
      if (flameLightRef.current) {
        flameLightRef.current.intensity = 1.2 + Math.sin(t * 18) * 0.35 + Math.cos(t * 27) * 0.2;
      }
      if (flameMeshRef.current) {
        const s = 1.0 + Math.sin(t * 14) * 0.12;
        flameMeshRef.current.scale.set(s, s * 1.15, s);
        flameMeshRef.current.rotation.y = t * 2;
      }
    }

    if (probe.isDischargingToProbe && arcLineRef.current) {
      const posAttr = arcLineRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const pStart = new THREE.Vector3(...dischargeOrigin);
      const pEnd = new THREE.Vector3(...probe.position);
      const segments = 12;

      let prev = pStart.clone();
      for (let i = 1; i <= segments; i++) {
        const frac = i / segments;
        const curr = pStart.clone().lerp(pEnd, frac);
        if (i < segments) {
          const jitter = 0.035 * (1 - Math.abs(frac - 0.5) * 2);
          curr.x += (Math.random() - 0.5) * jitter;
          curr.y += (Math.random() - 0.5) * jitter;
          curr.z += (Math.random() - 0.5) * jitter;
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
    }
  });

  // High-Precision Delta Offset Dragging Handlers
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    setProbe((p) => ({ ...p, isDragging: true, preset: 'custom' }));

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    // Define drag plane facing the camera coplanar with the probe
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    dragPlaneRef.current.setFromNormalAndCoplanarPoint(camDir.negate(), new THREE.Vector3(...probe.position));

    const rect = gl.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    _ndc.set(x, y);
    _raycaster.setFromCamera(_ndc, camera);
    if (_raycaster.ray.intersectPlane(dragPlaneRef.current, planeIntersectRef.current)) {
      initialPosRef.current.set(...probe.position);
      clickOffsetRef.current.copy(planeIntersectRef.current).sub(initialPosRef.current);
    }

    const onPointerMove = (ev: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const mRect = gl.domElement.getBoundingClientRect();
      const mx = ((ev.clientX - mRect.left) / mRect.width) * 2 - 1;
      const my = -((ev.clientY - mRect.top) / mRect.height) * 2 + 1;

      _ndc.set(mx, my);
      _raycaster.setFromCamera(_ndc, camera);
      if (_raycaster.ray.intersectPlane(dragPlaneRef.current, planeIntersectRef.current)) {
        const targetPos = planeIntersectRef.current.clone().sub(clickOffsetRef.current);

        let posX = Math.max(-0.85, Math.min(0.85, targetPos.x));
        let posY = Math.max(0.15, Math.min(2.15, targetPos.y));
        let posZ = Math.max(-0.35, Math.min(0.45, targetPos.z));

        let zone: ProbeState['targetApparatusZone'] = 'none';

        // Magnetic Snapping into Influence Zones
        if (Math.hypot(posX - 0, posY - sparkY) < 0.16) {
          posX = 0;
          posY = sparkY;
          posZ = 0;
          zone = 'spark-gap';
        } else if (
          Math.hypot(posX - canLeftPos[0], posZ - canLeftPos[2]) < 0.22 &&
          posY > 0.6 &&
          posY < 1.8
        ) {
          posX = canLeftPos[0] + 0.10;
          posZ = canLeftPos[2] + 0.02;
          zone = 'stream-A';
        } else if (
          Math.hypot(posX - canRightPos[0], posZ - canRightPos[2]) < 0.22 &&
          posY > 0.6 &&
          posY < 1.8
        ) {
          posX = canRightPos[0] - 0.10;
          posZ = canRightPos[2] + 0.02;
          zone = 'stream-B';
        } else if (ringLeftPos && Math.hypot(posX - ringLeftPos[0], posY - ringLeftPos[1]) < 0.18) {
          posX = ringLeftPos[0] + 0.12;
          posY = ringLeftPos[1];
          posZ = ringLeftPos[2] + 0.04;
          zone = 'ring-A';
        } else if (ringRightPos && Math.hypot(posX - ringRightPos[0], posY - ringRightPos[1]) < 0.18) {
          posX = ringRightPos[0] - 0.12;
          posY = ringRightPos[1];
          posZ = ringRightPos[2] + 0.04;
          zone = 'ring-B';
        } else if (Math.hypot(posX - canLeftPos[0], posY - (canLeftPos[1] + 0.15)) < 0.20) {
          posX = canLeftPos[0] + 0.14;
          posY = canLeftPos[1] + 0.15;
          posZ = canLeftPos[2] + 0.06;
          zone = 'can-A';
        } else if (Math.hypot(posX - canRightPos[0], posY - (canRightPos[1] + 0.15)) < 0.20) {
          posX = canRightPos[0] - 0.14;
          posY = canRightPos[1] + 0.15;
          posZ = canRightPos[2] + 0.06;
          zone = 'can-B';
        }

        setProbe((p) => ({
          ...p,
          position: [posX, posY, posZ],
          targetApparatusZone: zone,
        }));
      }
    };

    const onPointerUp = (ev: PointerEvent) => {
      isDraggingRef.current = false;
      setProbe((p) => ({ ...p, isDragging: false }));
      try {
        (ev.target as HTMLElement).releasePointerCapture(ev.pointerId);
      } catch {}
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  if (!probe.enabled) return null;

  return (
    <group ref={groupRef}>
      <group
        position={probe.position}
        onPointerDown={handlePointerDown}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setIsHovered(false);
        }}
      >
        {/* Generous hit sphere proxy */}
        <mesh visible={false}>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        {/* 1. METAL (Copper / Brass Conductor) */}
        {probe.materialId === 'metal-copper' && (
          <group>
            <mesh position={[0, -0.06, 0]} castShadow>
              <cylinderGeometry args={[0.013, 0.013, 0.32, 24]} />
              <meshStandardMaterial color="#b45309" metalness={0.96} roughness={0.12} />
            </mesh>
            <mesh position={[0, -0.22, 0]} castShadow>
              <sphereGeometry args={[0.015, 20, 20]} />
              <meshStandardMaterial color="#d97706" metalness={0.98} roughness={0.08} />
            </mesh>
            <mesh position={[0, 0.14, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 0.16, 20]} />
              <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.1} />
            </mesh>
            <mesh position={[0, 0.06, 0.014]}>
              <boxGeometry args={[0.02, 0.02, 0.015]} />
              <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        )}

        {/* 2. PLASTIC (PVC / Acrylic Dielectric) */}
        {probe.materialId === 'plastic-pvc' && (
          <group>
            <mesh position={[0, 0, 0]} castShadow>
              <cylinderGeometry args={[0.016, 0.016, 0.38, 24]} />
              <meshStandardMaterial color="#0284c7" roughness={0.35} metalness={0.1} />
            </mesh>
            <mesh position={[0, -0.19, 0]}>
              <sphereGeometry args={[0.016, 20, 20]} />
              <meshStandardMaterial color="#0284c7" roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.19, 0]}>
              <sphereGeometry args={[0.016, 20, 20]} />
              <meshStandardMaterial color="#0284c7" roughness={0.35} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 0.36, 16]} />
              <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.25} />
            </mesh>
            {probe.chargeKv !== 0 && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.038, 0.009, 12, 24]} />
                <meshBasicMaterial
                  color={probe.chargeKv > 0 ? '#f59e0b' : '#ec4899'}
                  transparent
                  opacity={0.5}
                />
              </mesh>
            )}
          </group>
        )}

        {/* 3. WOOD (Dried Oak) */}
        {probe.materialId === 'wood-oak' && (
          <group>
            <mesh position={[0, 0, 0]} castShadow>
              <cylinderGeometry args={[0.018, 0.018, 0.38, 20]} />
              <meshStandardMaterial color="#78350f" roughness={0.85} metalness={0.05} />
            </mesh>
            <mesh position={[0, 0.19, 0]}>
              <cylinderGeometry args={[0.017, 0.017, 0.004, 16]} />
              <meshStandardMaterial color="#92400e" roughness={0.9} />
            </mesh>
            <mesh position={[0, -0.19, 0]}>
              <cylinderGeometry args={[0.017, 0.017, 0.004, 16]} />
              <meshStandardMaterial color="#92400e" roughness={0.9} />
            </mesh>
          </group>
        )}

        {/* 4. RUBBER (Vulcanized Neoprene) */}
        {probe.materialId === 'rubber-vulcanized' && (
          <group>
            <mesh position={[0, 0, 0]} castShadow>
              <boxGeometry args={[0.05, 0.34, 0.08]} />
              <meshStandardMaterial color="#1e293b" roughness={0.92} metalness={0.04} />
            </mesh>
            {[-0.12, -0.04, 0.04, 0.12].map((yOff, i) => (
              <mesh key={i} position={[0, yOff, 0]}>
                <boxGeometry args={[0.054, 0.012, 0.084]} />
                <meshStandardMaterial color="#0f172a" roughness={0.95} />
              </mesh>
            ))}
          </group>
        )}

        {/* 5. IONIZING FLAME */}
        {probe.materialId === 'ionizing-flame' && (
          <group>
            <mesh position={[0, -0.1, 0]} castShadow>
              <cylinderGeometry args={[0.024, 0.024, 0.22, 20]} />
              <meshStandardMaterial color="#fef08a" roughness={0.7} metalness={0.05} />
            </mesh>
            <mesh position={[0, 0.018, 0]}>
              <cylinderGeometry args={[0.002, 0.002, 0.016, 8]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh ref={flameMeshRef} position={[0, 0.045, 0]}>
              <coneGeometry args={[0.015, 0.048, 16]} />
              <meshBasicMaterial color="#f97316" transparent opacity={0.9} />
            </mesh>
            <mesh position={[0, 0.026, 0]}>
              <sphereGeometry args={[0.007, 12, 12]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.8} />
            </mesh>
            <pointLight
              ref={flameLightRef}
              position={[0, 0.05, 0]}
              color="#fb923c"
              intensity={1.2}
              distance={1.8}
              decay={2}
            />
          </group>
        )}

        {/* Hover / Drag Ring Indicator */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.07, 0.09, 24]} />
          <meshBasicMaterial
            color={probe.isDragging ? '#10b981' : isHovered ? '#38bdf8' : mat.accentColor}
            transparent
            opacity={probe.isDragging ? 0.95 : isHovered ? 0.8 : 0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Ground Wire */}
      {probe.materialId === 'metal-copper' && probe.isGrounded && (
        <group>
          <mesh geometry={groundWireGeo}>
            <meshStandardMaterial color="#16a34a" roughness={0.5} metalness={0.2} />
          </mesh>
          <mesh position={[0.7, -0.04, 0.3]}>
            <boxGeometry args={[0.04, 0.025, 0.04]} />
            <meshStandardMaterial color="#ca8a04" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      )}

      {/* Discharge Arc */}
      {probe.isDischargingToProbe && (
        <group>
          <lineSegments ref={arcLineRef} geometry={arcPoints}>
            <lineBasicMaterial
              color="#67e8f9"
              linewidth={3}
              transparent
              opacity={Math.min(1.0, probe.probeSparkIntensity * 1.5)}
            />
          </lineSegments>
          <pointLight
            position={probe.position}
            color="#67e8f9"
            intensity={probe.probeSparkIntensity * 8}
            distance={2.0}
            decay={2}
          />
        </group>
      )}
    </group>
  );
};
