/**
 * Types and interfaces for the Kelvin Water Dropper simulation.
 * Updated for CP Chemistry classroom investigation:
 * - 30-second spark count lab trials (Very slow, Slow, Moderate, Faster, Very fast)
 * - Plateau-Rayleigh jet breakup & continuous stream transition
 * - Investigation timers and student data tables
 */

export interface SimulationParams {
  dropletRate: number; // Drips per second per nozzle (2 - 35 Hz)
  seedVoltage: number; // Initial voltage asymmetry in Volts (-50V to +50V)
  sparkGapDistance: number; // Gap between spark spheres in mm (1.0 - 25.0 mm)
  humidity: number; // Relative humidity % (10% - 95%)
  temperature: number; // Ambient temperature in °C (5°C - 45°C)
  airPressure: number; // Atmospheric pressure in kPa (50 - 120 kPa, standard = 101.3 kPa)
  windSpeed: number; // Wind speed in m/s (0 - 5.0 m/s)
  windDirection: 'left-to-right' | 'right-to-left' | 'front-to-back' | 'back-to-front';
  dropperSeparation: number; // Spacing between nozzles in meters (scale)
  ringHeight: number; // Distance from nozzle to induction ring
  simSpeed: number; // Speed multiplier (0.25x, 0.5x, 1x, 2x)
  isPaused: boolean;
  enableDeflection: boolean; // Electrostatic repulsion droplet spray
  showFieldLines: boolean;
  audioEnabled: boolean;
  showElectronFlow: boolean; // Animate mobile charges moving through cross wires and leads
  showChargeSigns: boolean; // Display floating 3D + and - charge signs and ion markers
  electronFlowSpeed: number; // Animation speed multiplier for charge flow (0.5, 1.0, 2.0)
  chargeFlowMode: 'chemistry' | 'physics'; // 'chemistry' = Net + and - charge flow (both wires flow UP, + and - separate); 'physics' = mobile e- only
  chargeSignSize: number; // Scale multiplier for 3D charge symbols (0.6x - 2.2x, default 1.2x)
}

export interface SparkEvent {
  id: number;
  time: number; // seconds
  voltageKv: number; // kV at discharge
  energyMj: number; // millijoules
}

export type FlowCategory = 'very-slow' | 'slow' | 'moderate' | 'faster' | 'very-fast';

export interface ClassroomTrial {
  id: string;
  category: FlowCategory;
  flowLabel: string;
  dropletRate: number; // drips/s
  description: string;
  sparks30sTrial1: number | null;
  sparks30sTrial2: number | null;
  averageSparks: number | null;
  streamState: 'discrete-drops' | 'optimal-pinch' | 'elongated-jet' | 'continuous-stream';
}

export interface SimulationState {
  time: number; // Elapsed simulation time in seconds
  voltageA: number; // Volts (Can A)
  voltageB: number; // Volts (Can B)
  potentialDifference: number; // Volts (V_A - V_B)
  chargeA: number; // Coulombs
  chargeB: number; // Coulombs
  capacitance: number; // Farads (~16 pF)
  inductionCapacitance: number; // Farads (~0.22 pF)
  sparkCount: number;
  lastSparkTime: number;
  isSparking: boolean; // True during arc discharge
  sparkIntensity: number; // 0 to 1 decay
  sparkProgressPercent: number; // 0 - 100% towards spark breakdown
  lastSparkVoltageKv: number; // kV of last spark
  sparkHistory: SparkEvent[]; // Recent spark discharge logs
  currentWaterVolumeA: number; // mL
  currentWaterVolumeB: number; // mL
  calculatedBreakdownVoltage: number; // Volts (calculated from spark gap, RH, T, Air Pressure)
  leakageResistance: number; // Ohms (R_leak = f(RH))
  dropletDiameter: number; // mm (f(T, surface tension))
  growthRate: number; // 1/s (exponential charging factor lambda)
  surfaceTension: number; // mN/m
  airDensity: number; // kg/m^3 (f(p, T))
  collectionEfficiencyA: number; // % of drops falling inside Can A (affected by wind)
  collectionEfficiencyB: number; // % of drops falling inside Can B (affected by wind)
  timeToNextSpark: number; // Estimated seconds until next spark
  statusMessage: string; // Plain-English diagnostic message
  isStreamContinuous: boolean; // True when high flow extends continuous jet past ring
  breakupLength: number; // Length of unbroken liquid column (meters)
  chargingEfficiency: number; // 0.0 to 1.0 (drops if continuous stream conducts back to nozzle)
}

export interface DataPoint {
  t: number; // seconds
  vDiff: number; // kV
  vA: number; // kV
  vB: number; // kV
  qA: number; // nC
  qB: number; // nC
  spark: boolean;
  theoreticalVDiff: number; // kV
}

export interface SavedRun {
  id: string;
  name: string;
  timestamp: string;
  color: string;
  params: SimulationParams;
  data: DataPoint[];
  maxVoltage: number;
  sparkCount: number;
  growthRate: number;
}

export interface DropletData {
  id: number;
  nozzle: 'A' | 'B';
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  charge: number; // nC
  radius: number;
  life: number;
  maxLife: number;
}

export interface EducationalTooltipData {
  title: string;
  concept: string; // Plain-English chemistry/physics explanation
  impact: string; // What happens in the simulation when changed
  chemistryNote?: string; // High-school chemistry connection (ions, bonds, gas laws)
}
