/**
 * Physics and electrostatic calculations for Module 2: Material Interaction Lab.
 * Formulates physical interactions for Metal, Plastic, Wood, Rubber, and Flames:
 * - Dielectric constant (kappa) polarization & electric field alteration
 * - Electrical conductivity (sigma) grounding, bridging, and charge leakage
 * - Spark gap influence (bridging vs. dielectric suppression)
 * - 3D droplet stream curvature & Coulomb repulsion
 */

import { ProbeState, MATERIAL_DEFINITIONS } from '../types/probingLab';
import { SimulationParams, SimulationState } from '../types/simulation';

export const INITIAL_PROBE_STATE: ProbeState = {
  enabled: true,
  materialId: 'metal-copper',
  preset: 'stream-left',
  position: [-0.40, 1.25, 0.04],
  isDragging: false,
  isGrounded: true,
  chargeKv: 0,
  customPermittivity: 1.0,
  customConductivitySm: 5.96e7,
  isDischargingToProbe: false,
  probeSparkIntensity: 0,
  lastDischargeTime: 0,
  streamDeflectionMm: 0,
  activeObservation: 'Metal (Copper) placed near Stream A. Observe image charge attraction pulling the stream!',
  scientificExplanation: 'Conductive metal contains a mobile electron sea; incoming charged droplets induce an opposite image charge on the metal surface, pulling the water stream outward.',
  targetApparatusZone: 'stream-A',
};

/**
 * Calculate electrostatic force applied by the material object onto a falling water droplet.
 */
export function calculateProbeForceOnDroplet(
  probe: ProbeState,
  dropX: number,
  dropY: number,
  dropZ: number,
  dropChargeNc: number
): [number, number, number] {
  if (!probe.enabled) return [0, 0, 0];

  const dx = probe.position[0] - dropX;
  const dy = probe.position[1] - dropY;
  const dz = probe.position[2] - dropZ;
  const distSq = dx * dx + dy * dy + dz * dz + 0.002;
  const dist = Math.sqrt(distSq);

  if (dist > 0.45) return [0, 0, 0];

  const dirX = dx / dist;
  const dirY = dy / dist;
  const dirZ = dz / dist;

  const mat = MATERIAL_DEFINITIONS[probe.materialId];
  const kappa = probe.customPermittivity || mat.permittivity;
  let forceMagnitude = 0;

  if (mat.id === 'metal-copper') {
    // Metal Conductor: Image charge attraction (F ∝ q_drop² / (4 r²))
    const imageAttraction = (Math.abs(dropChargeNc) * 0.00055) / distSq;
    forceMagnitude = imageAttraction;
  } else if (mat.id === 'plastic-pvc') {
    // Plastic Dielectric & Triboelectric charge
    const chargeEquivNc = probe.chargeKv * 2.2;
    // Coulomb force: like charges repel, opposites attract
    const coulombForce = -(chargeEquivNc * dropChargeNc) / distSq * 0.00075;
    // Dielectric polarization gradient attraction on polar H2O dipoles
    const dipoleAttraction = ((kappa - 1) * 0.0002) / (distSq * dist);
    forceMagnitude = coulombForce + dipoleAttraction;
  } else if (mat.id === 'wood-oak') {
    // Wood: Mild dielectric polarization
    const dipoleAttraction = ((kappa - 1) * 0.00012) / (distSq * dist);
    forceMagnitude = dipoleAttraction;
  } else if (mat.id === 'rubber-vulcanized') {
    // Rubber: Higher dielectric permittivity (kappa ~ 3.8)
    const dipoleAttraction = ((kappa - 1) * 0.00022) / (distSq * dist);
    forceMagnitude = dipoleAttraction;
  } else if (mat.id === 'ionizing-flame') {
    // Thermal buoyant air dispersal
    forceMagnitude = -0.00015 / distSq;
  }

  const maxAcc = 20.0;
  const clampedF = Math.max(-maxAcc, Math.min(maxAcc, forceMagnitude * 100));

  // Electrostatic probe forces deflect streams horizontally (X & Z).
  // Clamp vertical force (Y) so probe interaction never causes droplets to levitate upward against gravity.
  const clampedFy = Math.min(0.5, dirY * clampedF);

  return [dirX * clampedF, clampedFy, dirZ * clampedF];
}

export interface ProbeInteractionResult {
  updatedProbe: ProbeState;
  modifiedState: Partial<SimulationState>;
  playDischargeAudio: boolean;
  dischargeEnergyJoules: number;
}

/**
 * Step material object interaction with the apparatus (Spark Gap, Cans, Rings, Streams).
 */
export function stepProbeInteraction(
  probe: ProbeState,
  simState: SimulationState,
  params: SimulationParams,
  dt: number,
  canLeftPos: [number, number, number],
  canRightPos: [number, number, number],
  ringLeftPos: [number, number, number],
  ringRightPos: [number, number, number]
): ProbeInteractionResult {
  if (!probe.enabled) {
    return {
      updatedProbe: probe,
      modifiedState: {},
      playDischargeAudio: false,
      dischargeEnergyJoules: 0,
    };
  }

  const mat = MATERIAL_DEFINITIONS[probe.materialId];
  const kappa = probe.customPermittivity || mat.permittivity;
  const px = probe.position[0];
  const py = probe.position[1];
  const pz = probe.position[2];

  let activeObservation = '';
  let scientificExplanation = '';
  let isDischargingToProbe = false;
  let probeSparkIntensity = Math.max(0, probe.probeSparkIntensity - dt * 3.5);
  let playDischargeAudio = false;
  let dischargeEnergyJoules = 0;
  const modifiedState: Partial<SimulationState> = {
    collectionEfficiencyA: 1.0,
    collectionEfficiencyB: 1.0,
  };

  // Geometry references
  const sparkY = canLeftPos[1] + 0.42;
  const distToSparkGap = Math.hypot(px - 0, py - sparkY, pz - 0);

  const distToCanA = Math.hypot(px - canLeftPos[0], py - (canLeftPos[1] + 0.15), pz - canLeftPos[2]);
  const distToCanB = Math.hypot(px - canRightPos[0], py - (canRightPos[1] + 0.15), pz - canRightPos[2]);

  const distToRingA = Math.hypot(px - ringLeftPos[0], py - ringLeftPos[1], pz - ringLeftPos[2]);
  const distToRingB = Math.hypot(px - ringRightPos[0], py - ringRightPos[1], pz - ringRightPos[2]);

  const distToStreamA = Math.hypot(px - canLeftPos[0], pz - canLeftPos[2]);
  const isAtStreamA = distToStreamA < 0.22 && py > canLeftPos[1] && py < 2.0;

  const distToStreamB = Math.hypot(px - canRightPos[0], pz - canRightPos[2]);
  const isAtStreamB = distToStreamB < 0.22 && py > canRightPos[1] && py < 2.0;

  // ----------------------------------------------------
  // ZONE 1: MATERIAL IN THE SPARK GAP
  // ----------------------------------------------------
  if (distToSparkGap < 0.08) {
    if (mat.id === 'metal-copper') {
      if (probe.isGrounded) {
        activeObservation = '⚡ Grounded Metal in Spark Gap: Electrodes discharge directly to Earth ground!';
        scientificExplanation = 'Conductive copper provides a zero-resistance path to Earth (0 V). The electric field concentrates on the metal tip, triggering an immediate arc discharge to ground.';
        const vDiff = Math.abs(simState.potentialDifference);
        if (vDiff > 1200) {
          isDischargingToProbe = true;
          probeSparkIntensity = 1.0;
          playDischargeAudio = true;
          dischargeEnergyJoules = 0.5 * simState.capacitance * vDiff * vDiff;

          modifiedState.voltageA = 5;
          modifiedState.voltageB = -5;
          modifiedState.potentialDifference = 10;
          modifiedState.isSparking = true;
        }
      } else {
        activeObservation = '⚡ Floating Metal Wand in Spark Gap: Bridges air gap; triggers dual-cascade sparks!';
        scientificExplanation = 'The conductive metal sphere divides the gap distance in half: d_eff = d / 2. Because E = V / d, the electric field doubles, allowing two simultaneous sparks to jump at half the normal voltage threshold!';
        const vDiff = Math.abs(simState.potentialDifference);
        if (vDiff > simState.calculatedBreakdownVoltage * 0.5) {
          isDischargingToProbe = true;
          probeSparkIntensity = 1.0;
          playDischargeAudio = true;
          dischargeEnergyJoules = 0.5 * simState.capacitance * vDiff * vDiff;

          modifiedState.voltageA = simState.voltageA * 0.25;
          modifiedState.voltageB = simState.voltageB * 0.25;
          modifiedState.potentialDifference = (simState.voltageA - simState.voltageB) * 0.25;
          modifiedState.isSparking = true;
        }
      }
    } else if (mat.id === 'plastic-pvc' || mat.id === 'rubber-vulcanized') {
      const matName = mat.id === 'plastic-pvc' ? 'Plastic' : 'Rubber';
      activeObservation = `🛡️ ${matName} Dielectric Barrier in Spark Gap: Sparks are completely SUPPRESSED!`;
      scientificExplanation = `${matName} is an exceptional electrical insulator with a dielectric breakdown strength of ~20–25 MV/m (almost 8× higher than air). Its bound dipoles polarize (κ = ${kappa.toFixed(1)}), weakening the internal field and preventing arc formation.`;
      // Push breakdown threshold very high so no spark occurs while block is inserted
      modifiedState.calculatedBreakdownVoltage = Math.max(simState.calculatedBreakdownVoltage, 32000);
    } else if (mat.id === 'wood-oak') {
      activeObservation = '🪵 Wood in Spark Gap: Slow resistive charge leakage; partial spark damping.';
      scientificExplanation = 'Trace moisture inside the wood fibers gives it moderate conductivity (σ ≈ 10⁻¹⁰ S/m). It bleeds charge gradually as a leaky resistor, reducing spark frequency.';
      modifiedState.voltageA = simState.voltageA * 0.96;
      modifiedState.voltageB = simState.voltageB * 0.96;
    } else if (mat.id === 'ionizing-flame') {
      activeObservation = '🔥 Candle Flame in Spark Gap: Thermal plasma prevents spark buildup entirely!';
      scientificExplanation = 'Hydrocarbon combustion produces ionized gas particles (cations and free electrons). This creates a conductive plasma channel that leaks charge continuously, preventing voltage buildup.';
      modifiedState.voltageA = simState.voltageA * 0.93;
      modifiedState.voltageB = simState.voltageB * 0.93;
    }
  }

  // ----------------------------------------------------
  // ZONE 2: MATERIAL NEAR OR TOUCHING COLLECTOR CANS
  // ----------------------------------------------------
  else if (distToCanA < 0.16) {
    if (mat.id === 'metal-copper' && probe.isGrounded) {
      activeObservation = '⚡ Grounded Metal touching Can A: Neutralizes positive charge (Can A → 0 V)!';
      scientificExplanation = 'Mobile electrons from Earth instantly flow into Can A to neutralize the hydronium H₃O⁺ cations. Without voltage on Can A, Ring B loses its field, halting generator induction!';
      if (Math.abs(simState.voltageA) > 1000) {
        isDischargingToProbe = true;
        probeSparkIntensity = 0.8;
        playDischargeAudio = true;
        dischargeEnergyJoules = 0.5 * simState.capacitance * simState.voltageA * simState.voltageA;
      }
      modifiedState.voltageA = 10;
      modifiedState.potentialDifference = 10 - simState.voltageB;
    } else if (mat.id === 'plastic-pvc' || mat.id === 'rubber-vulcanized') {
      activeObservation = `Insulating ${mat.name} touching Can A: Zero charge transfer (safe insulator).`;
      scientificExplanation = `Electrons are tightly held in covalent bonds. The material does not conduct charge away, allowing Can A to continue accumulating potential.`;
    } else if (mat.id === 'wood-oak') {
      activeObservation = 'Wood touching Can A: Weak leaky resistive discharge.';
      scientificExplanation = 'Slight conductivity in wood allows slow charge bleeding, reducing the charging slope.';
      modifiedState.voltageA = simState.voltageA * 0.98;
    } else if (mat.id === 'ionizing-flame') {
      activeObservation = '🔥 Flame near Can A: Plasma ions discharge Can A through the air.';
      scientificExplanation = 'Gaseous thermal ions drift in the field, neutralizing positive surface charge.';
      modifiedState.voltageA = simState.voltageA * 0.93;
    }
  } else if (distToCanB < 0.16) {
    if (mat.id === 'metal-copper' && probe.isGrounded) {
      activeObservation = '⚡ Grounded Metal touching Can B: Discharges negative charge (Can B → 0 V)!';
      scientificExplanation = 'Excess OH⁻ anions and free electrons on Can B flow down into Earth ground. Without charge on Can B, Ring A loses its field!';
      if (Math.abs(simState.voltageB) > 1000) {
        isDischargingToProbe = true;
        probeSparkIntensity = 0.8;
        playDischargeAudio = true;
        dischargeEnergyJoules = 0.5 * simState.capacitance * simState.voltageB * simState.voltageB;
      }
      modifiedState.voltageB = -10;
      modifiedState.potentialDifference = simState.voltageA - (-10);
    } else if (mat.id === 'ionizing-flame') {
      activeObservation = '🔥 Flame near Can B: Neutralizes negative charge through air ionization.';
      scientificExplanation = 'Thermal ions conduct charge across the air gap, dissipating Can B.';
      modifiedState.voltageB = simState.voltageB * 0.93;
    }
  }

  // ----------------------------------------------------
  // ZONE 3: MATERIAL NEAR INDUCTION RINGS
  // ----------------------------------------------------
  else if (distToRingA < 0.14) {
    if (mat.id === 'metal-copper' && probe.isGrounded) {
      activeObservation = '⚡ Grounded Metal at Ring A: Ring grounded to 0 V; halts positive droplet induction!';
      scientificExplanation = 'Grounding Ring A removes the electric field at the droplet pinch-off point. Falling water drops remain electrically neutral (no ion separation).';
      modifiedState.voltageB = simState.voltageB * 0.95;
    } else if (mat.id === 'plastic-pvc' && probe.chargeKv < -1) {
      activeObservation = '🧲 Charged Plastic Rod at Ring A: Negative field REINFORCES positive induction!';
      scientificExplanation = 'External negative charge on the plastic rod adds to Ring A’s field, pulling more H₃O⁺ cations into falling droplets and speeding up charging!';
    } else if (mat.id === 'rubber-vulcanized' || mat.id === 'plastic-pvc') {
      activeObservation = `Dielectric ${mat.name} near Ring A: Warps induction field lines (κ = ${kappa.toFixed(1)}).`;
      scientificExplanation = 'Dielectric polarization redistributes the local electric field around the ring without conducting charge.';
    }
  } else if (distToRingB < 0.14) {
    if (mat.id === 'metal-copper' && probe.isGrounded) {
      activeObservation = '⚡ Grounded Metal at Ring B: Ring grounded to 0 V; halts negative droplet induction!';
      scientificExplanation = 'Forcing Ring B to 0 V eliminates the electric field needed to pull OH⁻ anions into right droplets.';
      modifiedState.voltageA = simState.voltageA * 0.95;
    }
  }

  // ----------------------------------------------------
  // ZONE 4: MATERIAL NEAR FALLING WATER STREAMS
  // ----------------------------------------------------
  else if (isAtStreamA || isAtStreamB) {
    const isStreamA = isAtStreamA;
    if (mat.id === 'metal-copper') {
      activeObservation = '💧 Metal Conductor near Water Stream: Image charges pull droplets toward the metal!';
      scientificExplanation = 'Mobile electrons in the metal redistribute to create an opposite image charge, exerting an electrostatic attractive force that curves the water stream.';
    } else if (mat.id === 'plastic-pvc') {
      if (probe.chargeKv < -1) {
        if (isStreamA) {
          activeObservation = '💧 Charged Plastic (−) ATTRACTS positive water droplets (Opposite charges attract)!';
          scientificExplanation = 'Coulomb Attraction (F ∝ q₁q₂ / r²): Positively charged droplets (H₃O⁺) are strongly pulled outward toward the negative plastic rod.';
        } else {
          activeObservation = '💧 Charged Plastic (−) REPELS negative water droplets (Like charges repel)!';
          scientificExplanation = 'Coulomb Repulsion: Negatively charged droplets (OH⁻) are repelled away from the negative plastic rod, widening the stream spray.';
        }
      } else {
        activeObservation = `Plastic Dielectric (κ = ${kappa.toFixed(1)}) near stream: Mild dipole polarization attraction.`;
        scientificExplanation = 'Non-uniform electric field polarizes neutral water molecules, gently drawing droplets toward the plastic.';
      }
    } else if (mat.id === 'rubber-vulcanized') {
      activeObservation = `Rubber Dielectric (κ = ${kappa.toFixed(1)}) near stream: Polarizes and curves stream slightly.`;
      scientificExplanation = 'Dielectric constant κ = 3.8 creates dipole polarization in water molecules, attracting the stream.';
    } else if (mat.id === 'wood-oak') {
      activeObservation = 'Wood near water stream: Very subtle electrostatic deflection.';
      scientificExplanation = 'Cellulose fibers experience weak electric polarization under the droplet field.';
    } else if (mat.id === 'ionizing-flame') {
      activeObservation = '🔥 Candle Flame near stream: Neutralizes charge on droplets and disperses spray.';
      scientificExplanation = 'Thermal ions conduct charge away from drops in mid-air.';
    }
  } else {
    activeObservation = `${mat.name} in 3D workspace. Drag it towards the Spark Gap, Water Streams, Rings, or Cans!`;
    scientificExplanation = `${mat.description} ${mat.electricalProperty}. Dielectric constant κ = ${kappa.toFixed(1)}, Conductivity σ = ${mat.conductivitySm.toExponential(1)} S/m.`;
  }

  if (distToCanA < 0.16 || isAtStreamA) {
    modifiedState.collectionEfficiencyA = 0.0;
    activeObservation += ' [Drops missing Can A: Charging halted, voltage bleeding to 0V]';
  }
  if (distToCanB < 0.16 || isAtStreamB) {
    modifiedState.collectionEfficiencyB = 0.0;
    activeObservation += ' [Drops missing Can B: Charging halted, voltage bleeding to 0V]';
  }

  // Estimate deflection
  let streamDeflectionMm = 0;
  if (isAtStreamA || isAtStreamB) {
    if (mat.id === 'plastic-pvc' && Math.abs(probe.chargeKv) > 1) {
      streamDeflectionMm = Math.min(45, Math.abs(probe.chargeKv) * 4.5);
    } else if (mat.id === 'metal-copper') {
      streamDeflectionMm = 16;
    } else if (mat.id === 'rubber-vulcanized') {
      streamDeflectionMm = 8;
    } else {
      streamDeflectionMm = 5;
    }
  }

  return {
    updatedProbe: {
      ...probe,
      activeObservation,
      scientificExplanation,
      isDischargingToProbe,
      probeSparkIntensity,
      streamDeflectionMm,
      lastDischargeTime: isDischargingToProbe ? Date.now() : probe.lastDischargeTime,
    },
    modifiedState,
    playDischargeAudio,
    dischargeEnergyJoules,
  };
}
