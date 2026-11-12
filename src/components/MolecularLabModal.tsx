import React, { useState, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import {
  X,
  Atom,
  Zap,
  Flame,
  Layers,
  Sparkles,
  Info,
  Sliders,
  RotateCcw,
  Eye,
  Shield,
} from 'lucide-react';

export type MolecularSystemType =
  | 'water_dipoles'
  | 'ion_separation'
  | 'copper_lattice'
  | 'pvc_polymer'
  | 'flame_plasma'
  | 'spark_breakdown';

interface MolecularLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSystem?: MolecularSystemType;
}

// ----------------------------------------------------------------------
// 1. WATER DIPOLES 3D COMPONENT (H2O Molecules & Dipole Alignment)
// ----------------------------------------------------------------------
function WaterDipolesScene({
  eField,
  temperature,
  showDipoles,
  showForces,
  showHBonds,
  showCharges,
}: {
  eField: number;
  temperature: number;
  showDipoles: boolean;
  showForces: boolean;
  showHBonds: boolean;
  showCharges: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Generate a grid of water molecules
  const molecules = useMemo(() => {
    const arr = [];
    const count = 16;
    for (let i = 0; i < count; i++) {
      const x = ((i % 4) - 1.5) * 1.6;
      const y = (Math.floor(i / 4) - 1.5) * 1.6;
      const z = (Math.random() - 0.5) * 1.2;
      const initRot = Math.random() * Math.PI * 2;
      arr.push({ id: i, pos: new THREE.Vector3(x, y, z), rot: initRot });
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const thermalSpeed = (temperature / 300) * 0.8;
    const fieldFactor = eField / 50;

    groupRef.current.children.forEach((child, idx) => {
      const jitter = Math.sin(Date.now() * 0.003 + idx) * 0.05 * thermalSpeed;
      child.position.z += Math.sin(Date.now() * 0.002 + idx) * 0.002 * thermalSpeed;

      const targetRot = 0;
      const currentRot = child.rotation.z;
      const rotDiff = targetRot - currentRot;

      const alignRate = Math.max(0.01, fieldFactor * 4.0 - thermalSpeed * 0.5);
      child.rotation.z += (rotDiff * alignRate + jitter * 0.2) * delta * 10;
    });
  });

  return (
    <group ref={groupRef}>
      {molecules.map((m) => (
        <group key={m.id} position={[m.pos.x, m.pos.y, m.pos.z]}>
          {/* Oxygen Atom */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.32, 32, 32]} />
            <meshStandardMaterial color="#ef4444" roughness={0.2} metalness={0.1} />
          </mesh>
          {showCharges && (
            <Text
              position={[0, 0.45, 0]}
              fontSize={0.16}
              color="#fca5a5"
              anchorX="center"
              anchorY="middle"
            >
              δ⁻ (0.66e)
            </Text>
          )}

          {/* Hydrogen Atom 1 (104.5 degree angle -> 52.25 degrees offset) */}
          <group rotation={[0, 0, Math.PI * (52.25 / 180)]}>
            <mesh position={[0.48, 0, 0]}>
              <sphereGeometry args={[0.18, 24, 24]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.3} />
            </mesh>
            <mesh position={[0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.48, 12]} />
              <meshStandardMaterial color="#cbd5e1" />
            </mesh>
            {showCharges && (
              <Text
                position={[0.55, 0.2, 0]}
                fontSize={0.14}
                color="#7dd3fc"
                anchorX="center"
                anchorY="middle"
              >
                δ⁺
              </Text>
            )}
          </group>

          {/* Hydrogen Atom 2 (-52.25 degrees offset) */}
          <group rotation={[0, 0, -Math.PI * (52.25 / 180)]}>
            <mesh position={[0.48, 0, 0]}>
              <sphereGeometry args={[0.18, 24, 24]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.3} />
            </mesh>
            <mesh position={[0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.04, 0.48, 12]} />
              <meshStandardMaterial color="#cbd5e1" />
            </mesh>
            {showCharges && (
              <Text
                position={[0.55, -0.2, 0]}
                fontSize={0.14}
                color="#7dd3fc"
                anchorX="center"
                anchorY="middle"
              >
                δ⁺
              </Text>
            )}
          </group>

          {/* Dipole Moment Vector Arrow */}
          {showDipoles && (
            <group position={[0, 0, 0]}>
              <Line
                points={[[0, 0, 0.35], [0.8, 0, 0.35]]}
                color="#38bdf8"
                lineWidth={3}
              />
              <mesh position={[0.85, 0, 0.35]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.08, 0.2, 12]} />
                <meshStandardMaterial color="#38bdf8" />
              </mesh>
              <Text
                position={[0.4, 0.2, 0.35]}
                fontSize={0.13}
                color="#38bdf8"
                anchorX="center"
                anchorY="middle"
              >
                p⃗ dipole
              </Text>
            </group>
          )}

          {/* Electrostatic Coulomb Force Vectors under E-Field */}
          {showForces && eField > 0 && (
            <group position={[0, 0, -0.35]}>
              <Line
                points={[[0, 0, 0], [-0.02 * eField, 0, 0]]}
                color="#ef4444"
                lineWidth={3}
              />
              <Line
                points={[[0.4, 0, 0], [0.4 + 0.02 * eField, 0, 0]]}
                color="#10b981"
                lineWidth={3}
              />
            </group>
          )}
        </group>
      ))}

      {/* Intermolecular Hydrogen Bonds */}
      {showHBonds && (
        <group position={[0, 0, 0]}>
          <Line
            points={[[-1.6, 1.6, 0], [0, 0, 0]]}
            color="#38bdf8"
            lineWidth={1.5}
            dashed
            dashScale={10}
          />
          <Line
            points={[[0, 0, 0], [1.6, -1.6, 0]]}
            color="#38bdf8"
            lineWidth={1.5}
            dashed
            dashScale={10}
          />
          <Line
            points={[[-1.6, -1.6, 0], [0, -1.6, 0]]}
            color="#38bdf8"
            lineWidth={1.5}
            dashed
            dashScale={10}
          />
        </group>
      )}
    </group>
  );
}

// ----------------------------------------------------------------------
// 2. WATER AUTO-IONIZATION & ION SEPARATION (H3O+ Cations & OH- Anions)
// ----------------------------------------------------------------------
function IonSeparationScene({
  eField,
  temperature,
  showForces,
  showCharges,
}: {
  eField: number;
  temperature: number;
  showForces: boolean;
  showCharges: boolean;
}) {
  const hydroniumRef = useRef<THREE.Group>(null);
  const hydroxideRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    const speed = (eField / 50) * 3.5;
    const thermal = (temperature / 300) * 0.2;

    if (hydroniumRef.current) {
      hydroniumRef.current.position.x += (-speed * 0.4 + Math.sin(Date.now() * 0.005) * thermal) * delta;
      if (hydroniumRef.current.position.x < -3.2) hydroniumRef.current.position.x = 3.2;
    }

    if (hydroxideRef.current) {
      hydroxideRef.current.position.x += (speed * 0.4 + Math.cos(Date.now() * 0.005) * thermal) * delta;
      if (hydroxideRef.current.position.x > 3.2) hydroxideRef.current.position.x = -3.2;
    }
  });

  return (
    <group>
      {/* Induction Ring Electrode A (- Ring) on Left */}
      <mesh position={[-3.5, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[1.5, 0.12, 16, 32]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.2} metalness={0.8} emissive="#0284c7" emissiveIntensity={0.3} />
      </mesh>
      <Text
        position={[-3.5, 1.8, 0]}
        fontSize={0.2}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
      >
        Induction Ring A (−)
      </Text>

      {/* Induction Ring Electrode B (+ Ring) on Right */}
      <mesh position={[3.5, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[1.5, 0.12, 16, 32]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.2} metalness={0.8} emissive="#d97706" emissiveIntensity={0.3} />
      </mesh>
      <Text
        position={[3.5, 1.8, 0]}
        fontSize={0.2}
        color="#f59e0b"
        anchorX="center"
        anchorY="middle"
      >
        Induction Ring B (+)
      </Text>

      {/* Hydronium Cation H3O+ Group */}
      <group ref={hydroniumRef} position={[1.0, 0.3, 0]}>
        <mesh>
          <sphereGeometry args={[0.38, 32, 32]} />
          <meshStandardMaterial color="#ef4444" roughness={0.2} emissive="#b91c1c" emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0.35, 0.25, 0.2]}>
          <sphereGeometry args={[0.18, 24, 24]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-0.35, 0.25, 0.2]}>
          <sphereGeometry args={[0.18, 24, 24]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, -0.38, 0.2]}>
          <sphereGeometry args={[0.18, 24, 24]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>

        {showCharges && (
          <Text
            position={[0, 0.7, 0]}
            fontSize={0.2}
            color="#38bdf8"
            anchorX="center"
            anchorY="middle"
          >
            H₃O⁺ Cation (+1)
          </Text>
        )}

        {showForces && eField > 0 && (
          <Line points={[[0, 0, 0], [-0.03 * eField, 0, 0]]} color="#38bdf8" lineWidth={4} />
        )}
      </group>

      {/* Hydroxide Anion OH- Group */}
      <group ref={hydroxideRef} position={[-1.0, -0.3, 0]}>
        <mesh>
          <sphereGeometry args={[0.38, 32, 32]} />
          <meshStandardMaterial color="#ec4899" roughness={0.2} emissive="#be185d" emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0.45, 0, 0]}>
          <sphereGeometry args={[0.18, 24, 24]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>

        {showCharges && (
          <Text
            position={[0, 0.7, 0]}
            fontSize={0.2}
            color="#f472b6"
            anchorX="center"
            anchorY="middle"
          >
            OH⁻ Anion (−1)
          </Text>
        )}

        {showForces && eField > 0 && (
          <Line points={[[0, 0, 0], [0.03 * eField, 0, 0]]} color="#ec4899" lineWidth={4} />
        )}
      </group>
    </group>
  );
}

// ----------------------------------------------------------------------
// 3. COPPER METAL CONDUCTOR LATTICE (Delocalized Electron Sea)
// ----------------------------------------------------------------------
function CopperLatticeScene({
  eField,
  temperature,
  showForces,
  showCharges,
}: {
  eField: number;
  temperature: number;
  showForces: boolean;
  showCharges: boolean;
}) {
  const electronsRef = useRef<THREE.Group>(null);

  const ionCores = useMemo(() => {
    const arr = [];
    for (let x = -2; x <= 2; x += 1.3) {
      for (let y = -1.3; y <= 1.3; y += 1.3) {
        for (let z = -1.3; z <= 1.3; z += 1.3) {
          arr.push(new THREE.Vector3(x, y, z));
        }
      }
    }
    return arr;
  }, []);

  const electrons = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 45; i++) {
      arr.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 5.2,
          (Math.random() - 0.5) * 3.2,
          (Math.random() - 0.5) * 3.2
        ),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5
        ),
      });
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (!electronsRef.current) return;
    const driftSpeed = (eField / 50) * 3.0;
    const thermal = (temperature / 300) * 0.6;

    electronsRef.current.children.forEach((child, idx) => {
      const eData = electrons[idx];
      if (!eData) return;

      child.position.x -= (driftSpeed + Math.sin(Date.now() * 0.005 + idx) * thermal) * delta;
      child.position.y += Math.sin(Date.now() * 0.008 + idx * 2) * 0.01 * thermal;
      child.position.z += Math.cos(Date.now() * 0.007 + idx * 3) * 0.01 * thermal;

      if (child.position.x < -3.0) child.position.x = 3.0;
    });
  });

  return (
    <group>
      {ionCores.map((pos, i) => (
        <group key={i} position={[pos.x, pos.y, pos.z]}>
          <mesh>
            <sphereGeometry args={[0.26, 24, 24]} />
            <meshStandardMaterial color="#b45309" roughness={0.1} metalness={0.9} emissive="#78350f" emissiveIntensity={0.2} />
          </mesh>
          {showCharges && i === 6 && (
            <Text
              position={[0, 0.45, 0]}
              fontSize={0.14}
              color="#fbbf24"
              anchorX="center"
              anchorY="middle"
            >
              Cu²⁺ Core (+2)
            </Text>
          )}
        </group>
      ))}

      <group ref={electronsRef}>
        {electrons.map((e, idx) => (
          <mesh key={idx} position={[e.pos.x, e.pos.y, e.pos.z]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
          </mesh>
        ))}
      </group>

      {showCharges && (
        <Text
          position={[0, 2.0, 0]}
          fontSize={0.22}
          color="#38bdf8"
          anchorX="center"
          anchorY="middle"
        >
          Delocalized Conduction Electron Sea (e⁻)
        </Text>
      )}

      {showForces && eField > 0 && (
        <group position={[0, -2.0, 0]}>
          <Line points={[[1, 0, 0], [-1, 0, 0]]} color="#38bdf8" lineWidth={4} />
          <Text
            position={[0, -0.3, 0]}
            fontSize={0.16}
            color="#38bdf8"
            anchorX="center"
            anchorY="middle"
          >
            Electron Drift F⃗ = -eE⃗
          </Text>
        </group>
      )}
    </group>
  );
}

// ----------------------------------------------------------------------
// 4. PVC POLYMER DIELECTRIC (C-Cl Bond Polarization)
// ----------------------------------------------------------------------
function PvcPolymerScene({
  eField,
  temperature,
  showDipoles,
  showCharges,
}: {
  eField: number;
  temperature: number;
  showDipoles: boolean;
  showCharges: boolean;
}) {
  const chainRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!chainRef.current) return;
    const alignStrength = eField / 50;
    const thermal = (temperature / 300) * 0.1;

    chainRef.current.children.forEach((unit, idx) => {
      const targetRotZ = alignStrength * 0.6;
      const jitter = Math.sin(Date.now() * 0.003 + idx) * thermal;
      unit.rotation.z += (targetRotZ - unit.rotation.z + jitter) * delta * 5.0;
    });
  });

  const chainUnits = useMemo(() => {
    const arr = [];
    for (let i = -3; i <= 3; i++) {
      arr.push({ x: i * 0.9, id: i });
    }
    return arr;
  }, []);

  return (
    <group ref={chainRef}>
      {chainUnits.map((unit) => (
        <group key={unit.id} position={[unit.x, (unit.id % 2) * 0.2, 0]}>
          <mesh>
            <sphereGeometry args={[0.28, 24, 24]} />
            <meshStandardMaterial color="#334155" roughness={0.4} />
          </mesh>

          <group position={[0, 0.6, 0]}>
            <mesh>
              <sphereGeometry args={[0.32, 24, 24]} />
              <meshStandardMaterial color="#22c55e" roughness={0.2} emissive="#15803d" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[0, -0.3, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.6, 12]} />
              <meshStandardMaterial color="#94a3b8" />
            </mesh>
            {showCharges && (
              <Text
                position={[0, 0.45, 0]}
                fontSize={0.14}
                color="#4ade80"
                anchorX="center"
                anchorY="middle"
              >
                Cl (δ⁻)
              </Text>
            )}
          </group>

          <group position={[0, -0.55, 0]}>
            <mesh>
              <sphereGeometry args={[0.18, 24, 24]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.5, 12]} />
              <meshStandardMaterial color="#94a3b8" />
            </mesh>
            {showCharges && (
              <Text
                position={[0, -0.35, 0]}
                fontSize={0.14}
                color="#7dd3fc"
                anchorX="center"
                anchorY="middle"
              >
                H (δ⁺)
              </Text>
            )}
          </group>

          {unit.id < 3 && (
            <mesh position={[0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.06, 0.06, 0.9, 12]} />
              <meshStandardMaterial color="#64748b" />
            </mesh>
          )}

          {showDipoles && (
            <Line points={[[0, 0, 0], [0, 0.6, 0]]} color="#22c55e" lineWidth={3} />
          )}
        </group>
      ))}

      {showCharges && (
        <Text
          position={[0, 1.8, 0]}
          fontSize={0.2}
          color="#4ade80"
          anchorX="center"
          anchorY="middle"
        >
          PVC Polymer Chain (-CH₂-CHCl-) Dielectric Polarization
        </Text>
      )}
    </group>
  );
}

// ----------------------------------------------------------------------
// 5. FLAME PLASMA & THERMAL IONIZATION
// ----------------------------------------------------------------------
function FlamePlasmaScene({
  eField,
  temperature,
  showForces,
  showCharges,
}: {
  eField: number;
  temperature: number;
  showForces: boolean;
  showCharges: boolean;
}) {
  const flameIonsRef = useRef<THREE.Group>(null);

  const plasmaIons = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 30; i++) {
      arr.push({
        id: i,
        type: i % 2 === 0 ? 'cation' : 'electron',
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 2.5,
          (Math.random() - 0.5) * 1.5
        ),
      });
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (!flameIonsRef.current) return;
    const speed = (eField / 50) * 4.0;
    const thermalSpeed = (temperature / 300) * 1.2;

    flameIonsRef.current.children.forEach((child, idx) => {
      const p = plasmaIons[idx];
      if (!p) return;

      if (p.type === 'cation') {
        child.position.x += (speed * 0.3 + (Math.random() - 0.5) * thermalSpeed) * delta;
        child.position.y += (0.8 + (Math.random() - 0.5) * thermalSpeed) * delta;
        if (child.position.y > 2.5) child.position.y = -1.5;
        if (child.position.x > 3.0) child.position.x = -3.0;
      } else {
        child.position.x -= (speed * 0.8 + (Math.random() - 0.5) * thermalSpeed) * delta;
        child.position.y += (1.2 + (Math.random() - 0.5) * thermalSpeed) * delta;
        if (child.position.y > 2.5) child.position.y = -1.5;
        if (child.position.x < -3.0) child.position.x = 3.0;
      }
    });
  });

  return (
    <group>
      <mesh position={[0, -0.5, 0]}>
        <coneGeometry args={[0.8, 2.5, 32]} />
        <meshStandardMaterial
          color="#f97316"
          emissive="#ea580c"
          emissiveIntensity={1.5}
          transparent
          opacity={0.7}
        />
      </mesh>
      <mesh position={[0, -0.8, 0]}>
        <coneGeometry args={[0.4, 1.5, 32]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#eab308"
          emissiveIntensity={2.0}
          transparent
          opacity={0.85}
        />
      </mesh>

      <group ref={flameIonsRef}>
        {plasmaIons.map((p) => (
          <mesh key={p.id} position={[p.pos.x, p.pos.y, p.pos.z]}>
            <sphereGeometry args={[p.type === 'cation' ? 0.22 : 0.08, 16, 16]} />
            <meshStandardMaterial
              color={p.type === 'cation' ? '#ef4444' : '#38bdf8'}
              emissive={p.type === 'cation' ? '#b91c1c' : '#0284c7'}
              emissiveIntensity={1.0}
            />
          </mesh>
        ))}
      </group>

      {showCharges && (
        <Text
          position={[0, 2.3, 0]}
          fontSize={0.2}
          color="#fed7aa"
          anchorX="center"
          anchorY="middle"
        >
          Candle Flame Thermal Plasma (C₂*, HCO⁺, e⁻) Neutralizing Charges
        </Text>
      )}
    </group>
  );
}

// ----------------------------------------------------------------------
// 6. SPARK BREAKDOWN & AIR IONIZATION (N2 / O2 Plasma Arc Channel)
// ----------------------------------------------------------------------
function SparkBreakdownScene({
  eField,
  showForces,
  showCharges,
}: {
  eField: number;
  showForces: boolean;
  showCharges: boolean;
}) {
  const sparkArcRef = useRef<THREE.Group>(null);
  const isBreakdown = eField >= 25;

  useFrame((_, delta) => {
    if (!sparkArcRef.current || !isBreakdown) return;
    sparkArcRef.current.rotation.z = (Math.random() - 0.5) * 0.1;
    sparkArcRef.current.scale.y = 0.95 + Math.random() * 0.1;
  });

  return (
    <group>
      <mesh position={[-3.0, 0, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.1} metalness={0.9} emissive="#b45309" emissiveIntensity={0.3} />
      </mesh>
      <Text
        position={[-3.0, 1.3, 0]}
        fontSize={0.2}
        color="#f59e0b"
        anchorX="center"
        anchorY="middle"
      >
        Electrode A (+30 kV)
      </Text>

      <mesh position={[3.0, 0, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.9} emissive="#0284c7" emissiveIntensity={0.3} />
      </mesh>
      <Text
        position={[3.0, 1.3, 0]}
        fontSize={0.2}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
      >
        Electrode B (-30 kV)
      </Text>

      {isBreakdown ? (
        <group ref={sparkArcRef}>
          <Line
            points={[
              [-2.2, 0, 0],
              [-1.5, 0.3, 0.1],
              [-0.8, -0.25, -0.1],
              [0, 0.35, 0.15],
              [0.8, -0.3, -0.1],
              [1.5, 0.25, 0.05],
              [2.2, 0, 0],
            ]}
            color="#a855f7"
            lineWidth={6}
          />
          <Line
            points={[
              [-2.2, 0, 0],
              [-1.4, -0.2, 0],
              [-0.7, 0.4, 0.1],
              [0.1, -0.3, -0.1],
              [0.9, 0.2, 0],
              [1.6, -0.2, 0.1],
              [2.2, 0, 0],
            ]}
            color="#38bdf8"
            lineWidth={4}
          />
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#e0e7ff" emissiveIntensity={3.0} transparent opacity={0.9} />
          </mesh>

          {showCharges && (
            <Text
              position={[0, 1.6, 0]}
              fontSize={0.2}
              color="#e9d5ff"
              anchorX="center"
              anchorY="middle"
            >
              ⚡ Paschen Breakdown: Plasma Ionization Channel (N₂⁺, O₂⁺, e⁻)
            </Text>
          )}
        </group>
      ) : (
        <Text
          position={[0, 0, 0]}
          fontSize={0.16}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
        >
          E-field below breakdown threshold (&lt; 25 kV/cm). Neutral N₂/O₂ intact.
        </Text>
      )}
    </group>
  );
}

// ----------------------------------------------------------------------
// MAIN MODAL COMPONENT
// ----------------------------------------------------------------------
export const MolecularLabModal: React.FC<MolecularLabModalProps> = ({
  isOpen,
  onClose,
  initialSystem = 'water_dipoles',
}) => {
  const [activeSystem, setActiveSystem] = useState<MolecularSystemType>(initialSystem);
  const [eField, setEField] = useState<number>(20);
  const [temperature, setTemperature] = useState<number>(300);
  const [showDipoles, setShowDipoles] = useState<boolean>(true);
  const [showForces, setShowForces] = useState<boolean>(true);
  const [showHBonds, setShowHBonds] = useState<boolean>(true);
  const [showCharges, setShowCharges] = useState<boolean>(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-lg select-none">
      <div className="relative w-full max-w-6xl h-[92vh] bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* HEADER BAR */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-md">
              <Atom size={22} className="animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                3D Molecular & Electrostatic Interactions Lab
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Sub-Nanometer Dynamics
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Inspect atomic dipoles, ionic charge separation, metal conduction sea, dielectric polarization, and plasma spark breakdown.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* SYSTEM SELECTOR TABS */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-950/80 border-b border-slate-800/80 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveSystem('water_dipoles')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSystem === 'water_dipoles'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/50 border border-transparent'
            }`}
          >
            <Atom size={14} className="text-cyan-400" />
            1. Water Dipoles (H₂O)
          </button>

          <button
            type="button"
            onClick={() => setActiveSystem('ion_separation')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSystem === 'ion_separation'
                ? 'bg-purple-500/20 text-purple-200 border border-purple-400/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/50 border border-transparent'
            }`}
          >
            <Zap size={14} className="text-purple-400" />
            2. Ion Separation (H₃O⁺ / OH⁻)
          </button>

          <button
            type="button"
            onClick={() => setActiveSystem('copper_lattice')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSystem === 'copper_lattice'
                ? 'bg-amber-500/20 text-amber-200 border border-amber-400/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/50 border border-transparent'
            }`}
          >
            <Layers size={14} className="text-amber-400" />
            3. Copper Electron Sea (Cu)
          </button>

          <button
            type="button"
            onClick={() => setActiveSystem('pvc_polymer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSystem === 'pvc_polymer'
                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/50 border border-transparent'
            }`}
          >
            <Shield size={14} className="text-emerald-400" />
            4. PVC Dielectric Polymer
          </button>

          <button
            type="button"
            onClick={() => setActiveSystem('flame_plasma')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSystem === 'flame_plasma'
                ? 'bg-orange-500/20 text-orange-200 border border-orange-400/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/50 border border-transparent'
            }`}
          >
            <Flame size={14} className="text-orange-400" />
            5. Flame Plasma Ions
          </button>

          <button
            type="button"
            onClick={() => setActiveSystem('spark_breakdown')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSystem === 'spark_breakdown'
                ? 'bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-400/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/50 border border-transparent'
            }`}
          >
            <Sparkles size={14} className="text-fuchsia-400" />
            6. Spark Air Breakdown
          </button>
        </div>

        {/* MAIN BODY: 3D VIEWPORT & CONTROL SIDEBAR */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 overflow-hidden relative">
          
          {/* 3D CANVAS VIEWPORT (3 COLS) */}
          <div className="lg:col-span-3 relative bg-slate-950 flex flex-col min-h-[350px]">
            <Canvas camera={{ position: [0, 0, 6.5], fov: 45 }}>
              <ambientLight intensity={0.8} />
              <pointLight position={[10, 10, 10]} intensity={1.5} />
              <pointLight position={[-10, -10, -10]} intensity={0.5} />

              {activeSystem === 'water_dipoles' && (
                <WaterDipolesScene
                  eField={eField}
                  temperature={temperature}
                  showDipoles={showDipoles}
                  showForces={showForces}
                  showHBonds={showHBonds}
                  showCharges={showCharges}
                />
              )}

              {activeSystem === 'ion_separation' && (
                <IonSeparationScene
                  eField={eField}
                  temperature={temperature}
                  showForces={showForces}
                  showCharges={showCharges}
                />
              )}

              {activeSystem === 'copper_lattice' && (
                <CopperLatticeScene
                  eField={eField}
                  temperature={temperature}
                  showForces={showForces}
                  showCharges={showCharges}
                />
              )}

              {activeSystem === 'pvc_polymer' && (
                <PvcPolymerScene
                  eField={eField}
                  temperature={temperature}
                  showDipoles={showDipoles}
                  showCharges={showCharges}
                />
              )}

              {activeSystem === 'flame_plasma' && (
                <FlamePlasmaScene
                  eField={eField}
                  temperature={temperature}
                  showForces={showForces}
                  showCharges={showCharges}
                />
              )}

              {activeSystem === 'spark_breakdown' && (
                <SparkBreakdownScene
                  eField={eField}
                  showForces={showForces}
                  showCharges={showCharges}
                />
              )}

              <OrbitControls enablePan={true} enableZoom={true} maxDistance={15} minDistance={2} />
            </Canvas>

            {/* Viewport Floating Info Hint */}
            <div className="absolute top-3 left-3 pointer-events-none bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl text-[11px] font-mono text-slate-300 flex items-center gap-2 backdrop-blur-md">
              <Eye size={13} className="text-cyan-400" />
              <span>Orbit / Zoom with mouse or touch</span>
            </div>
          </div>

          {/* CONTROL & EDUCATIONAL SIDEBAR (1 COL) */}
          <div className="lg:col-span-1 bg-slate-900/90 border-t lg:border-t-0 lg:border-l border-slate-800 p-4 flex flex-col space-y-4 overflow-y-auto">
            
            {/* CONTROLS SECTION */}
            <div className="space-y-3 bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-xl">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={13} className="text-cyan-400" />
                Physical Field Controls
              </h3>

              {/* Electric Field Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">External E-Field (E⃗):</span>
                  <span className="text-cyan-300 font-bold">{eField} kV/cm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={eField}
                  onChange={(e) => setEField(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Temperature Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Thermal Kinetic Temp (T):</span>
                  <span className="text-amber-300 font-bold">{temperature} K</span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="800"
                  step="10"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Toggle Options */}
              <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCharges}
                    onChange={(e) => setShowCharges(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span>Charges (δ/q)</span>
                </label>

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showForces}
                    onChange={(e) => setShowForces(e.target.checked)}
                    className="accent-cyan-500 rounded"
                  />
                  <span>Force Vectors</span>
                </label>

                {activeSystem === 'water_dipoles' && (
                  <>
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showDipoles}
                        onChange={(e) => setShowDipoles(e.target.checked)}
                        className="accent-cyan-500 rounded"
                      />
                      <span>Dipole p⃗</span>
                    </label>

                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showHBonds}
                        onChange={(e) => setShowHBonds(e.target.checked)}
                        className="accent-cyan-500 rounded"
                      />
                      <span>H-Bonds</span>
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* EDUCATIONAL CHEMISTRY & PHYSICS INSIGHT CARD */}
            <div className="space-y-2 bg-cyan-950/20 border border-cyan-500/30 p-3.5 rounded-xl text-slate-300 text-xs">
              <h4 className="font-bold text-cyan-300 flex items-center gap-1.5 font-mono">
                <Info size={14} className="text-cyan-400 shrink-0" />
                Chemistry & Physics Principle
              </h4>

              {activeSystem === 'water_dipoles' && (
                <div className="space-y-1.5 text-[11px] leading-relaxed text-slate-300">
                  <p>
                    <strong className="text-white">Water Dipole Alignment:</strong> Water is a polar covalent molecule with a bent geometry (104.5°). Oxygen is more electronegative (3.44) than Hydrogen (2.20), generating partial charges δ⁻ and δ⁺.
                  </p>
                  <p className="font-mono text-cyan-200 bg-slate-950/80 p-1.5 rounded border border-cyan-900">
                    Torque τ⃗ = p⃗ × E⃗
                  </p>
                  <p>
                    Under external electric fields E⃗, water dipoles rotate to minimize potential energy U = -p⃗·E⃗, creating the electrostatic induction mechanism in Kelvin's generator.
                  </p>
                </div>
              )}

              {activeSystem === 'ion_separation' && (
                <div className="space-y-1.5 text-[11px] leading-relaxed text-slate-300">
                  <p>
                    <strong className="text-white">Auto-Ionization & Electrostatic Drift:</strong> Pure water auto-ionizes into hydronium cations (H₃O⁺) and hydroxide anions (OH⁻).
                  </p>
                  <p className="font-mono text-purple-200 bg-slate-950/80 p-1.5 rounded border border-purple-900">
                    2H₂O ⇌ H₃O⁺ + OH⁻  (K_w = 1.0 × 10⁻¹⁴)
                  </p>
                  <p>
                    When water passes through induction rings, negative rings attract H₃O⁺ cations into the forming drops, leaving excess positive charge in the left stream.
                  </p>
                </div>
              )}

              {activeSystem === 'copper_lattice' && (
                <div className="space-y-1.5 text-[11px] leading-relaxed text-slate-300">
                  <p>
                    <strong className="text-white">Metallic Bonding & Conduction:</strong> Copper metal consists of a 3D periodic lattice of Cu²⁺ ionic cores immersed in a delocalized "sea" of free valence electrons.
                  </p>
                  <p className="font-mono text-amber-200 bg-slate-950/80 p-1.5 rounded border border-amber-900">
                    J⃗ = σE⃗ = n e v⃗_drift
                  </p>
                  <p>
                    Free electrons drift rapidly opposite to E⃗, explaining why metal pails accumulate charge without electrical breakdown.
                  </p>
                </div>
              )}

              {activeSystem === 'pvc_polymer' && (
                <div className="space-y-1.5 text-[11px] leading-relaxed text-slate-300">
                  <p>
                    <strong className="text-white">Dielectric Dipole Polarization:</strong> Polyvinyl chloride (PVC) is an insulator with strong C-Cl polar bonds.
                  </p>
                  <p className="font-mono text-emerald-200 bg-slate-950/80 p-1.5 rounded border border-emerald-900">
                    P⃗ = ε₀ (ε_r - 1) E⃗
                  </p>
                  <p>
                    Unlike metals, PVC has no free electrons; external E-fields only rotate bound dipoles, creating surface charges without electrical conduction.
                  </p>
                </div>
              )}

              {activeSystem === 'flame_plasma' && (
                <div className="space-y-1.5 text-[11px] leading-relaxed text-slate-300">
                  <p>
                    <strong className="text-white">Flame Ionization & Quenching:</strong> Candle flames contain thermal plasma with free positive ions (C₂*, HCO⁺) and electrons.
                  </p>
                  <p>
                    Placing a flame near the apparatus provides mobile charges that neutralize electric fields, preventing voltage accumulation and quenching sparks.
                  </p>
                </div>
              )}

              {activeSystem === 'spark_breakdown' && (
                <div className="space-y-1.5 text-[11px] leading-relaxed text-slate-300">
                  <p>
                    <strong className="text-white">Paschen Dielectric Air Breakdown:</strong> Air is normally an insulator (N₂, O₂). When field strength exceeds dielectric strength (~30 kV/cm), field ionization triggers an electron avalanche.
                  </p>
                  <p className="font-mono text-fuchsia-200 bg-slate-950/80 p-1.5 rounded border border-fuchsia-900">
                    V_breakdown = B · p d / (ln(A p d) - ln(ln(1 + 1/γ)))
                  </p>
                  <p>
                    Neutral air molecules ionize into glowing plasma (N₂⁺, O₂⁺, e⁻), resulting in a visible spark arc discharge!
                  </p>
                </div>
              )}
            </div>

            {/* RESET FIELD BUTTON */}
            <button
              type="button"
              onClick={() => {
                setEField(20);
                setTemperature(300);
              }}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} className="text-amber-400" />
              Reset Molecular Field Parameters
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
