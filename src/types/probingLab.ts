/**
 * Data structures and presets for Module 2: Material Interaction Lab.
 * Allows users to select physical materials (Metal, Plastic, Wood, Rubber),
 * configure dielectric constants (kappa) and conductivity levels (sigma),
 * and drag them in 3D to observe their influence on electric fields, water streams,
 * and spark gap behavior.
 */

export type ProbeMaterialId =
  | 'metal-copper'
  | 'plastic-pvc'
  | 'wood-oak'
  | 'rubber-vulcanized'
  | 'ionizing-flame';

export type ProbePresetLocation =
  | 'parked'
  | 'stream-left'
  | 'stream-right'
  | 'ring-left'
  | 'ring-right'
  | 'spark-gap'
  | 'can-left'
  | 'can-right'
  | 'custom';

export interface MaterialDefinition {
  id: ProbeMaterialId;
  name: string;
  category: 'conductor' | 'insulator' | 'semiconductor' | 'plasma';
  description: string;
  electricalProperty: string;
  color: string;
  accentColor: string;
  permittivity: number; // Dielectric constant kappa (relative permittivity)
  conductivitySm: number; // S/m electrical conductivity
  dielectricBreakdownMvM: number; // MV/m air/dielectric breakdown strength
  isGroundedByDefault: boolean;
  defaultChargeKv: number;
}

export interface ProbeState {
  enabled: boolean;
  materialId: ProbeMaterialId;
  preset: ProbePresetLocation;
  position: [number, number, number];
  isDragging: boolean;
  isGrounded: boolean;
  chargeKv: number; // Static triboelectric charge if charged (-15 kV to +15 kV)
  customPermittivity: number; // User-adjustable dielectric constant kappa (1.0 to 10.0)
  customConductivitySm: number; // User-adjustable electrical conductivity
  isDischargingToProbe: boolean;
  probeSparkIntensity: number;
  lastDischargeTime: number;
  streamDeflectionMm: number; // Estimated droplet deflection
  activeObservation: string;
  scientificExplanation: string;
  targetApparatusZone: 'none' | 'stream-A' | 'stream-B' | 'ring-A' | 'ring-B' | 'spark-gap' | 'can-A' | 'can-B';
}

export const MATERIAL_DEFINITIONS: Record<ProbeMaterialId, MaterialDefinition> = {
  'metal-copper': {
    id: 'metal-copper',
    name: 'Metal (Copper / Brass)',
    category: 'conductor',
    description: 'Highly conductive metallic rod with mobile delocalized electron sea.',
    electricalProperty: 'High Conductivity (σ ≈ 5.96 × 10⁷ S/m), Zero Internal Field (E = 0)',
    color: '#b45309',
    accentColor: '#38bdf8',
    permittivity: 1.0,
    conductivitySm: 5.96e7,
    dielectricBreakdownMvM: 0, // Conductor (conducts at 0 V)
    isGroundedByDefault: true,
    defaultChargeKv: 0,
  },
  'plastic-pvc': {
    id: 'plastic-pvc',
    name: 'Plastic (PVC / Acrylic)',
    category: 'insulator',
    description: 'Polymer dielectric with covalently bound electrons and high polarizability.',
    electricalProperty: 'Dielectric Constant κ = 3.2, Low Conductivity (σ ≈ 10⁻¹⁵ S/m)',
    color: '#0284c7',
    accentColor: '#ec4899',
    permittivity: 3.2,
    conductivitySm: 1e-15,
    dielectricBreakdownMvM: 20.0, // Resists sparks up to 20 MV/m
    isGroundedByDefault: false,
    defaultChargeKv: -6,
  },
  'wood-oak': {
    id: 'wood-oak',
    name: 'Wood (Dried Oak)',
    category: 'semiconductor',
    description: 'Cellulose fiber organic material with trace moisture; weak leaky conductor.',
    electricalProperty: 'Dielectric Constant κ = 2.5, Moderate Loss (σ ≈ 10⁻¹⁰ S/m)',
    color: '#78350f',
    accentColor: '#d97706',
    permittivity: 2.5,
    conductivitySm: 1e-10,
    dielectricBreakdownMvM: 4.5,
    isGroundedByDefault: false,
    defaultChargeKv: 0,
  },
  'rubber-vulcanized': {
    id: 'rubber-vulcanized',
    name: 'Rubber (Vulcanized)',
    category: 'insulator',
    description: 'Elastomeric cross-linked polymer; exceptional electrical insulator.',
    electricalProperty: 'Dielectric Constant κ = 3.8, Ultra-low Conductivity (σ ≈ 10⁻¹⁴ S/m)',
    color: '#1e293b',
    accentColor: '#a855f7',
    permittivity: 3.8,
    conductivitySm: 1e-14,
    dielectricBreakdownMvM: 25.0, // High breakdown barrier
    isGroundedByDefault: false,
    defaultChargeKv: 0,
  },
  'ionizing-flame': {
    id: 'ionizing-flame',
    name: 'Ionizing Flame (Candle)',
    category: 'plasma',
    description: 'Thermal plasma producing free gas ions (cations and electrons) in air.',
    electricalProperty: 'Gaseous Plasma Ions, High Air Leakage Conductance',
    color: '#ea580c',
    accentColor: '#f97316',
    permittivity: 1.0,
    conductivitySm: 1e-3,
    dielectricBreakdownMvM: 0.2, // Air conducts freely through flame
    isGroundedByDefault: false,
    defaultChargeKv: 0,
  },
};

export const PROBE_PRESETS: Record<ProbePresetLocation, { name: string; position: [number, number, number]; zone: ProbeState['targetApparatusZone']; description: string }> = {
  'parked': {
    name: 'Parked (Standby)',
    position: [1.15, 1.1, 0.4],
    zone: 'none',
    description: 'Positioned safely away from active electrostatic fields.',
  },
  'stream-left': {
    name: 'Stream A (Water Drops)',
    position: [-0.42, 1.25, 0.02],
    zone: 'stream-A',
    description: 'Adjacent to falling positive droplets (Stream A).',
  },
  'stream-right': {
    name: 'Stream B (Water Drops)',
    position: [0.42, 1.25, 0.02],
    zone: 'stream-B',
    description: 'Adjacent to falling negative droplets (Stream B).',
  },
  'ring-left': {
    name: 'Induction Ring A',
    position: [-0.40, 1.45, 0.06],
    zone: 'ring-A',
    description: 'Close to left negative induction ring.',
  },
  'ring-right': {
    name: 'Induction Ring B',
    position: [0.40, 1.45, 0.06],
    zone: 'ring-B',
    description: 'Close to right positive induction ring.',
  },
  'spark-gap': {
    name: 'Spark Gap Center',
    position: [0.0, 0.87, 0.0],
    zone: 'spark-gap',
    description: 'Directly centered between the two brass spark gap spheres.',
  },
  'can-left': {
    name: 'Collector Can A',
    position: [-0.34, 0.52, 0.04],
    zone: 'can-A',
    description: 'Touching or adjacent to Can A (positive).',
  },
  'can-right': {
    name: 'Collector Can B',
    position: [0.34, 0.52, 0.04],
    zone: 'can-B',
    description: 'Touching or adjacent to Can B (negative).',
  },
  'custom': {
    name: 'Custom 3D Position',
    position: [0.0, 1.0, 0.2],
    zone: 'none',
    description: 'Interactive 3D drag or coordinate sliders.',
  },
};
