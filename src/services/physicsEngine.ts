/**
 * Physics calculations for the Kelvin Water Dropper generator.
 * Formulates:
 * - Electrostatic induction & positive feedback
 * - Plateau-Rayleigh jet breakup & continuous stream transition at high flow
 * - Optimal operating region bell-curve (why spark rate peaks and drops at very high flow)
 * - Environmental effects: humidity leakage, air pressure Paschen breakdown, and crosswind deflection
 */

import { SimulationParams, SimulationState, SparkEvent } from '../types/simulation';

export const EPSILON_0 = 8.8541878128e-12; // F/m Vacuum permittivity
export const GRAVITY = 9.81; // m/s^2
export const MOLAR_MASS_AIR = 0.02897; // kg/mol
export const UNIVERSAL_GAS_CONSTANT = 8.31446; // J/(mol·K)
export const STANDARD_PRESSURE_KPA = 101.325; // kPa

/**
 * Calculate air density using Ideal Gas Law: rho = (P * M) / (R * T)
 */
export function calculateAirDensity(airPressureKpa: number, temperatureC: number): number {
  const pressurePa = Math.max(20, airPressureKpa) * 1000;
  const tempKelvin = Math.max(250, temperatureC + 273.15);
  return (pressurePa * MOLAR_MASS_AIR) / (UNIVERSAL_GAS_CONSTANT * tempKelvin);
}

/**
 * Calculate water surface tension as a function of temperature (°C).
 */
export function calculateSurfaceTension(temperatureC: number): number {
  const T = Math.max(0, Math.min(60, temperatureC));
  return 75.64 - 0.14 * T - 0.00028 * T * T;
}

/**
 * Calculate average droplet diameter in mm based on surface tension.
 */
export function calculateDropletDiameter(temperatureC: number): number {
  const sigma = calculateSurfaceTension(temperatureC);
  const nominalSigma = 72.8;
  const scale = Math.pow(sigma / nominalSigma, 0.333);
  return 2.5 * scale;
}

/**
 * Calculate dielectric leakage resistance across insulator stands as a function of RH (%).
 */
/**
 * Calculate dielectric leakage resistance across insulator stands as a function of RH (%).
 * Higher humidity creates a microscopic water film on insulating stands,
 * causing exponential charge leakage to ground (bleeding charge away before high voltage builds up).
 */
export function calculateLeakageResistance(humidityPercent: number, dropletRate: number = 14): number {
  const rh = Math.max(5, Math.min(99, humidityPercent));
  // Baseline dry insulation resistance (15 Tera-ohms)
  const r0 = 15e12; 
  // Steeper exponential decay with relative humidity: moist air films conduct charge rapidly above 50% RH
  let rLeak = r0 * Math.exp(-0.14 * (rh - 25));

  // Splashing at very high flow rates wets the insulator stands, drastically dropping resistance
  if (dropletRate > 22) {
    const splashFactor = 1.0 + ((dropletRate - 22) / 10) * 4.5;
    rLeak /= splashFactor;
  }

  return Math.max(1e6, rLeak); // Minimum resistance floor (Mega-ohms)
}

/**
 * Calculate Plateau-Rayleigh stream breakup length and charging efficiency as a function of flow rate.
 * - Slow flow (<= 5 drips/s): Inter-drip delay (0.2s-0.5s per drip) allows charge to dissipate
 *   into ambient air/stands before the next drop arrives. Net induction = 0 V (No spark).
 * - Transition flow (5-8 drips/s): Partial charge accumulation as drip frequency matches charge relaxation time.
 * - Optimal flow (8-20 drips/s): Discrete drop charging at peak efficiency (1.0). Frequent sparks!
 * - Very high flow (>20 drips/s): Jet extends through ring. At >=26 drips/s, continuous water column
 *   shorts charge back to grounded nozzle (0 V).
 */
export function calculateChargingEfficiency(dropletRate: number): {
  chargingEfficiency: number;
  isStreamContinuous: boolean;
  breakupLength: number;
  isTooSlow: boolean;
} {
  const breakupLength = 0.22 + (dropletRate / 35) * 0.46;
  const isStreamContinuous = dropletRate >= 26;
  const isTooSlow = dropletRate <= 5;

  let efficiency = 1.0;

  if (dropletRate >= 26) {
    // Continuous solid stream through the ring: electrical short circuit! Zero net induction charging.
    efficiency = 0.0;
  } else if (dropletRate > 20) {
    const overage = (dropletRate - 20) / 6;
    efficiency = Math.max(0.0, 1.0 - Math.pow(overage, 1.2) * 1.0);
  } else if (dropletRate <= 5) {
    // Slow drip rate (<=5 drips/s): inter-drip delay allows charge to bleed away completely between drops!
    efficiency = 0.0;
  } else if (dropletRate < 8) {
    // Transition zone (5 < f < 8): efficiency ramps up from 0 to 1
    efficiency = (dropletRate - 5) / 3.0;
  }

  return {
    chargingEfficiency: efficiency,
    isStreamContinuous,
    breakupLength,
    isTooSlow,
  };
}

/**
 * Calculate spark gap breakdown voltage in Volts based on:
 * - Gap distance (mm)
 * - Air pressure (kPa) via Paschen's Law (lower pressure = lower density = lower breakdown threshold)
 * - Relative humidity (%)
 * - Ambient temperature (°C)
 */
export function calculateBreakdownVoltage(
  gapDistanceMm: number,
  humidityPercent: number,
  temperatureC: number,
  airPressureKpa: number = 101.3
): number {
  const d = Math.max(0.5, gapDistanceMm);
  const rh = Math.max(10, Math.min(95, humidityPercent));
  const t = Math.max(0, Math.min(50, temperatureC));
  const p = Math.max(40, Math.min(150, airPressureKpa));

  // Base breakdown voltage scaling with distance (Paschen's Law curve approximation)
  const baseBreakdownKv = 2.6 * Math.pow(d, 0.86);
  // Paschen air pressure factor: lower pressure = lower breakdown threshold
  const pressureFactor = Math.pow(p / STANDARD_PRESSURE_KPA, 0.82);
  const tempCorrection = 293.15 / (273.15 + t);
  const humidityCorrection = 1.0 + 0.0008 * (rh - 30); // Electronegative water vapor effect on gas breakdown strength

  const breakdownKv = baseBreakdownKv * pressureFactor * tempCorrection * humidityCorrection;
  return Math.max(600, breakdownKv * 1000);
}

/**
 * Calculate wind velocity vector [vx, vy, vz] in m/s.
 */
export function getWindVector(speed: number, direction: SimulationParams['windDirection']): [number, number, number] {
  if (speed <= 0.01) return [0, 0, 0];
  switch (direction) {
    case 'left-to-right':
      return [speed, 0, 0];
    case 'right-to-left':
      return [-speed, 0, 0];
    case 'front-to-back':
      return [0, 0, -speed];
    case 'back-to-front':
      return [0, 0, speed];
    default:
      return [speed, 0, 0];
  }
}

/**
 * Calculate droplet collection efficiency (0.0 to 1.0) under crosswind and electrostatic spray repulsion.
 * When voltage is high or wind is blowing, droplets flare outward in a cone.
 * If droplets flare past the mouth of the Faraday collector can (r > 0.19m),
 * collection efficiency drops off sharply!
 */
export function calculateCollectionEfficiency(
  windSpeed: number,
  windDirection: SimulationParams['windDirection'],
  voltageA: number = 0,
  voltageB: number = 0,
  enableDeflection: boolean = true
): { effA: number; effB: number } {
  // 1. Wind drift displacement (m) over ~0.45s falling duration
  let driftWindX = 0;
  let driftWindZ = 0;
  if (windSpeed > 0.05) {
    const [wx, wy, wz] = getWindVector(windSpeed, windDirection);
    const tFall = 0.45;
    driftWindX = wx * tFall * 0.38;
    driftWindZ = wz * tFall * 0.38;
  }

  // 2. Electrostatic Spray Cone Flaring (Coulomb Repulsion from Like-Charged Can)
  const vAKv = Math.abs(voltageA) / 1000;
  const vBKv = Math.abs(voltageB) / 1000;
  const deflectScale = enableDeflection ? 1.0 : 0.05;

  // Repulsion displacement at the top opening of the can (m)
  // At 10-15 kV, droplets flare outward by 0.10 - 0.22 m
  const electroOffsetA = Math.pow(vAKv / 6.0, 1.45) * 0.065 * deflectScale;
  const electroOffsetB = Math.pow(vBKv / 6.0, 1.45) * 0.065 * deflectScale;

  const canRadius = 0.19;

  const totalOffsetA = Math.hypot(driftWindX + electroOffsetA, driftWindZ);
  const totalOffsetB = Math.hypot(driftWindX - electroOffsetB, driftWindZ);

  let effA = 1.0;
  if (totalOffsetA > 0.04) {
    effA = Math.max(0.0, 1.0 - Math.pow(totalOffsetA / canRadius, 2.0));
  }

  let effB = 1.0;
  if (totalOffsetB > 0.04) {
    effB = Math.max(0.0, 1.0 - Math.pow(totalOffsetB / canRadius, 2.0));
  }

  return {
    effA: Math.min(1.0, Math.max(0.0, effA)),
    effB: Math.min(1.0, Math.max(0.0, effB)),
  };
}

/**
 * Estimate exponential growth rate lambda (1/s) for the current setup.
 * Models the bell curve described in CP Chemistry curriculum:
 * - Very slow flow (4 drips/s): lambda ~ 0.32 s^-1 (slow charging)
 * - Moderate flow (14 drips/s): lambda ~ 1.05 s^-1 (frequent sparks)
 * - Faster flow (22 drips/s): lambda ~ 1.55 s^-1 (optimal peak)
 * - Very fast flow (32 drips/s): continuous jet reduces charging efficiency to ~0.25!
 */
export function calculateGrowthRate(
  params: SimulationParams,
  cCan: number,
  cInd: number,
  voltageA: number = 0,
  voltageB: number = 0
): number {
  const rLeak = calculateLeakageResistance(params.humidity, params.dropletRate);
  const { effA, effB } = calculateCollectionEfficiency(
    params.windSpeed,
    params.windDirection,
    voltageA,
    voltageB,
    params.enableDeflection
  );
  const { chargingEfficiency } = calculateChargingEfficiency(params.dropletRate);
  
  // Strictly couple impact percentage to charge transfer: if < 0.2, zero charge transfer entirely
  const effectiveEffA = effA < 0.2 ? 0.0 : effA;
  const effectiveEffB = effB < 0.2 ? 0.0 : effB;
  const avgEff = (effectiveEffA + effectiveEffB) / 2;

  const baseInductionMultiplier = 0.082; // s^-1 per drip/s
  // Effective charging rate scales with droplet rate AND charging efficiency
  const chargingRate = params.dropletRate * avgEff * chargingEfficiency * baseInductionMultiplier;
  const leakageRate = 1.0 / (rLeak * cCan);

  return chargingRate - leakageRate;
}

/**
 * Perform one physics integration step.
 */
export function stepPhysics(
  state: SimulationState,
  params: SimulationParams,
  dt: number,
  onSpark?: (energyJoules: number, voltageKv: number) => void
): SimulationState {
  if (params.isPaused || dt <= 0) {
    return state;
  }

  const effectiveDt = dt * params.simSpeed;
  const cCan = state.capacitance;
  const cInd = state.inductionCapacitance;

  const airDensity = calculateAirDensity(params.airPressure, params.temperature);
  const rLeak = calculateLeakageResistance(params.humidity, params.dropletRate);
  const breakdownV = calculateBreakdownVoltage(
    params.sparkGapDistance,
    params.humidity,
    params.temperature,
    params.airPressure
  );
  const surfaceTension = calculateSurfaceTension(params.temperature);
  const dropletDiameter = calculateDropletDiameter(params.temperature);

  // Current potentials
  let vA = state.voltageA;
  let vB = state.voltageB;

  // Calculate dynamic collection efficiency based on current voltage and wind
  const { effA: calcEffA, effB: calcEffB } = calculateCollectionEfficiency(
    params.windSpeed,
    params.windDirection,
    vA,
    vB,
    params.enableDeflection
  );

  let effA = calcEffA;
  let effB = calcEffB;

  // If a Probe / Material interaction explicitly modified collection efficiency (e.g. blocking water stream A), respect it
  if (state.collectionEfficiencyA !== undefined && state.collectionEfficiencyA < calcEffA) {
    effA = state.collectionEfficiencyA;
  }
  if (state.collectionEfficiencyB !== undefined && state.collectionEfficiencyB < calcEffB) {
    effB = state.collectionEfficiencyB;
  }

  // Strictly couple collection efficiency to charge transfer: if < 0.2, zero charge accumulation entirely!
  const effectiveEffA = effA < 0.2 ? 0.0 : effA;
  const effectiveEffB = effB < 0.2 ? 0.0 : effB;

  const { chargingEfficiency, isStreamContinuous, breakupLength, isTooSlow } = calculateChargingEfficiency(params.dropletRate);

  // Initial seed safeguard
  const userSeed = Math.max(15, Math.abs(params.seedVoltage) * 5);
  if (Math.abs(vA) < 10 && Math.abs(vB) < 10) {
    vA = userSeed;
    vB = -userSeed;
  }

  // Positive feedback rate incorporating jet continuity efficiency and strict droplet impact percentage
  const baseInductionMultiplier = 0.082;
  const chargingRateA = params.dropletRate * effectiveEffA * chargingEfficiency * baseInductionMultiplier;
  const chargingRateB = params.dropletRate * effectiveEffB * chargingEfficiency * baseInductionMultiplier;
  const leakageRate = 1.0 / (rLeak * cCan);

  const dVA_dt = -chargingRateA * vB - vA * leakageRate;
  const dVB_dt = -chargingRateB * vA - vB * leakageRate;

  vA += dVA_dt * effectiveDt;
  vB += dVB_dt * effectiveDt;

  let vDiff = vA - vB;

  // Spark discharge check
  let isSparking = false;
  let sparkIntensity = Math.max(0, state.sparkIntensity - effectiveDt * 3.0);
  let sparkCount = state.sparkCount;
  let lastSparkTime = state.lastSparkTime;
  let lastSparkVoltageKv = state.lastSparkVoltageKv;
  const sparkHistory = [...state.sparkHistory];

  if (Math.abs(vDiff) >= breakdownV) {
    isSparking = true;
    sparkIntensity = 1.0;
    sparkCount += 1;
    lastSparkTime = state.time;
    lastSparkVoltageKv = Math.abs(vDiff) / 1000;

    const cEff = 0.5 * cCan;
    const energyJoules = 0.5 * cEff * vDiff * vDiff;

    if (onSpark) {
      onSpark(energyJoules, lastSparkVoltageKv);
    }

    const newSparkEvent: SparkEvent = {
      id: Date.now() + Math.random(),
      time: state.time,
      voltageKv: lastSparkVoltageKv,
      energyMj: energyJoules * 1000,
    };
    sparkHistory.unshift(newSparkEvent);
    if (sparkHistory.length > 8) {
      sparkHistory.pop();
    }

    // Residual reset
    const residualRatio = 0.18;
    vA = vA * residualRatio;
    vB = vB * residualRatio;
    vDiff = vA - vB;
  }

  const qA = vA * cCan;
  const qB = vB * cCan;

  // Droplet water volume accumulated (mL)
  const rMm = dropletDiameter / 2;
  const dropVolMl = (4 / 3) * Math.PI * Math.pow(rMm, 3) / 1000;
  const waterFlowMlA = params.dropletRate * effectiveEffA * dropVolMl * effectiveDt;
  const waterFlowMlB = params.dropletRate * effectiveEffB * dropVolMl * effectiveDt;

  const currentWaterVolumeA = (state.currentWaterVolumeA + waterFlowMlA) % 350;
  const currentWaterVolumeB = (state.currentWaterVolumeB + waterFlowMlB) % 350;

  const growthRate = calculateGrowthRate(params, cCan, cInd, vA, vB);
  const sparkProgressPercent = Math.min(100, Math.round((Math.abs(vDiff) / breakdownV) * 100));
  const avgEff = (effectiveEffA + effectiveEffB) / 2;

  // Time to next spark and pedagogical status message
  let timeToNextSpark = 0;
  let statusMessage = '';
  if (growthRate <= 0.05 || avgEff < 0.2 || isTooSlow) {
    timeToNextSpark = Infinity;
    if (params.humidity > 75) {
      statusMessage = `⚠️ Quenched by ${params.humidity}% humidity. Moisture film on insulating stands is leaking charge.`;
    } else if (params.windSpeed > 2.0) {
      statusMessage = `⚠️ Wind draft is blowing drops past the cans (${Math.round((1 - avgEff) * 100)}% missing). Charge collection halted.`;
    } else if (isStreamContinuous) {
      statusMessage = '⚠️ Continuous jet! Water column is conducting charge back to grounded nozzle.';
    } else if (isTooSlow) {
      statusMessage = `⚠️ Flow Rate Too Slow (${params.dropletRate} drips/s): Inter-drip delay allows charge to dissipate before next drop arrives. No spark generated.`;
    } else if (avgEff < 0.2) {
      statusMessage = `⚠️ Droplet Impact Threshold (<20% landing): Droplets missing can opening (${Math.round((1 - (effA + effB)/2) * 100)}% missing). Charge accumulation halted; no spark.`;
    } else {
      statusMessage = '⚠️ Charging rate too low to overcome insulator leakage. Increase droplet flow rate above 8 drips/s.';
    }
  } else {
    const currentAbsV = Math.max(10, Math.abs(vDiff));
    if (currentAbsV >= breakdownV) {
      timeToNextSpark = 0;
      statusMessage = '⚡ Spark arc discharging!';
    } else {
      timeToNextSpark = Math.max(0.1, Math.log(breakdownV / currentAbsV) / growthRate);
      if (isStreamContinuous) {
        statusMessage = `⚠️ Fast continuous jet: charge leaking back up! Next spark slowed to ~${timeToNextSpark.toFixed(1)}s`;
      } else {
        statusMessage = `⚡ Charging: Next spark in ~${timeToNextSpark.toFixed(1)}s (progress ${sparkProgressPercent}%)`;
      }
    }
  }

  return {
    ...state,
    time: state.time + effectiveDt,
    voltageA: vA,
    voltageB: vB,
    potentialDifference: vDiff,
    chargeA: qA,
    chargeB: qB,
    sparkCount,
    lastSparkTime,
    isSparking,
    sparkIntensity,
    sparkProgressPercent,
    lastSparkVoltageKv,
    sparkHistory,
    currentWaterVolumeA,
    currentWaterVolumeB,
    calculatedBreakdownVoltage: breakdownV,
    leakageResistance: rLeak,
    dropletDiameter,
    growthRate,
    surfaceTension,
    airDensity,
    collectionEfficiencyA: effA,
    collectionEfficiencyB: effB,
    timeToNextSpark,
    statusMessage,
    isStreamContinuous,
    breakupLength,
    chargingEfficiency,
  };
}

/**
 * Calculate theoretical potential difference at time t.
 */
export function calculateTheoreticalVoltage(
  t: number,
  seedVoltage: number,
  growthRate: number,
  breakdownVoltage: number
): number {
  if (growthRate <= 0) {
    return seedVoltage * Math.exp(growthRate * t);
  }
  const timeToBreakdown = Math.log(Math.max(1, breakdownVoltage) / Math.max(0.1, Math.abs(seedVoltage))) / growthRate;
  if (timeToBreakdown <= 0) return 0;
  const cycleTime = t % timeToBreakdown;
  return seedVoltage * Math.exp(growthRate * cycleTime);
}
