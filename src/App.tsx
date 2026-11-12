import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap } from 'lucide-react';
import { SimulationParams, SimulationState, DataPoint, SavedRun } from './types/simulation';
import {
  stepPhysics,
  calculateBreakdownVoltage,
  calculateLeakageResistance,
  calculateSurfaceTension,
  calculateDropletDiameter,
  calculateGrowthRate,
  calculateTheoreticalVoltage,
  calculateAirDensity,
  calculateCollectionEfficiency,
  calculateChargingEfficiency,
} from './services/physicsEngine';
import { audioEngine } from './services/AudioEngine';
import { KelvinDropperScene } from './components/KelvinDropperScene';
import { TelemetryBar } from './components/TelemetryBar';
import { SidePanels } from './components/SidePanels';
import { VoltageGraph } from './components/VoltageGraph';
import { SparkFlashBanner } from './components/SparkFlashBanner';
import { ClassroomLabInvestigation } from './components/ClassroomLabInvestigation';
import { LightningAnalogyModal } from './components/LightningAnalogyModal';
import { MolecularLabModal } from './components/MolecularLabModal';
import { ProbeState } from './types/probingLab';
import { INITIAL_PROBE_STATE, stepProbeInteraction } from './services/probingPhysics';
import { ProbingLabPanel } from './components/ProbingLabPanel';

const INITIAL_PARAMS: SimulationParams = {
  dropletRate: 14,
  seedVoltage: 5,
  sparkGapDistance: 5.5,
  humidity: 32,
  temperature: 22,
  airPressure: 101.3,
  windSpeed: 0.0,
  windDirection: 'left-to-right',
  dropperSeparation: 1.1,
  ringHeight: 0.55,
  simSpeed: 1.0,
  isPaused: false,
  enableDeflection: true,
  showFieldLines: false,
  audioEnabled: true,
  showElectronFlow: true,
  showChargeSigns: true,
  electronFlowSpeed: 1.0,
  chargeFlowMode: 'chemistry',
  chargeSignSize: 1.2,
  showDropletDriftPaths: true,
};

const INITIAL_STATE: SimulationState = {
  time: 0,
  voltageA: 50, // initial seed imbalance
  voltageB: -50,
  potentialDifference: 100,
  chargeA: 50 * 16e-12,
  chargeB: -50 * 16e-12,
  capacitance: 16e-12, // 16 pF typical for isolated metal pail
  inductionCapacitance: 0.22e-12, // 0.22 pF
  sparkCount: 0,
  lastSparkTime: 0,
  isSparking: false,
  sparkIntensity: 0,
  sparkProgressPercent: 0,
  lastSparkVoltageKv: 0,
  sparkHistory: [],
  currentWaterVolumeA: 15,
  currentWaterVolumeB: 15,
  calculatedBreakdownVoltage: 10000,
  leakageResistance: 250e9,
  dropletDiameter: 2.5,
  growthRate: 0.95,
  surfaceTension: 72.8,
  airDensity: 1.204,
  collectionEfficiencyA: 1.0,
  collectionEfficiencyB: 1.0,
  timeToNextSpark: 3.2,
  statusMessage: '⚡ Building charge toward spark breakdown...',
  isStreamContinuous: false,
  breakupLength: 0.35,
  chargingEfficiency: 1.0,
};

export default function App() {
  const [params, setParams] = useState<SimulationParams>(INITIAL_PARAMS);
  const [state, setState] = useState<SimulationState>(() => {
    const s = { ...INITIAL_STATE };
    s.calculatedBreakdownVoltage = calculateBreakdownVoltage(
      INITIAL_PARAMS.sparkGapDistance,
      INITIAL_PARAMS.humidity,
      INITIAL_PARAMS.temperature,
      INITIAL_PARAMS.airPressure
    );
    s.airDensity = calculateAirDensity(INITIAL_PARAMS.airPressure, INITIAL_PARAMS.temperature);
    s.leakageResistance = calculateLeakageResistance(INITIAL_PARAMS.humidity, INITIAL_PARAMS.dropletRate);
    s.surfaceTension = calculateSurfaceTension(INITIAL_PARAMS.temperature);
    s.dropletDiameter = calculateDropletDiameter(INITIAL_PARAMS.temperature);
    s.growthRate = calculateGrowthRate(INITIAL_PARAMS, s.capacitance, s.inductionCapacitance);
    const { effA, effB } = calculateCollectionEfficiency(
      INITIAL_PARAMS.windSpeed,
      INITIAL_PARAMS.windDirection,
      s.voltageA,
      s.voltageB,
      INITIAL_PARAMS.enableDeflection
    );
    s.collectionEfficiencyA = effA;
    s.collectionEfficiencyB = effB;
    const { chargingEfficiency, isStreamContinuous, breakupLength } = calculateChargingEfficiency(INITIAL_PARAMS.dropletRate);
    s.chargingEfficiency = chargingEfficiency;
    s.isStreamContinuous = isStreamContinuous;
    s.breakupLength = breakupLength;
    return s;
  });

  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [savedRuns, setSavedRuns] = useState<SavedRun[]>([]);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showGraphOverlay, setShowGraphOverlay] = useState(false);
  const [showLabInvestigation, setShowLabInvestigation] = useState(false);
  const [showLightningModal, setShowLightningModal] = useState(false);
  const [showMolecularModal, setShowMolecularModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcodeDigits, setPasscodeDigits] = useState(['', '', '', '', '', '', '', '']);
  const [passcodeError, setPasscodeError] = useState(false);

  // Module switcher: Part 1 (Classic Generator) vs Part 2 (Material Interaction Lab)
  const [activeModule, setActiveModule] = useState<'module1' | 'module2'>('module1');
  const [probe, setProbe] = useState<ProbeState>(INITIAL_PROBE_STATE);

  const CORRECT_PASSCODE = 'PAHS2026';

  const handlePasscodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const entered = passcodeDigits.join('');
    if (entered === CORRECT_PASSCODE) {
      setIsAuthenticated(true);
      setPasscodeError(false);
    } else {
      setPasscodeError(true);
      setTimeout(() => setPasscodeError(false), 1500);
    }
  };

  // References to keep render loop decoupled from React state triggers
  const stateRef = useRef<SimulationState>(state);
  const paramsRef = useRef<SimulationParams>(params);
  const activeModuleRef = useRef<'module1' | 'module2'>(activeModule);
  const probeRef = useRef<ProbeState>(probe);
  const lastStepTimeRef = useRef<number>(performance.now());
  const lastDataSampleTimeRef = useRef<number>(0);
  const seedVoltageRef = useRef<number>(params.seedVoltage);

  useEffect(() => {
    paramsRef.current = params;
    seedVoltageRef.current = params.seedVoltage;
  }, [params]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    activeModuleRef.current = activeModule;
  }, [activeModule]);

  useEffect(() => {
    probeRef.current = probe;
  }, [probe]);

  // Spark callback triggering procedural audio
  const handleSpark = useCallback((energyJoules: number, voltageKv: number) => {
    if (paramsRef.current.audioEnabled) {
      const intensity = Math.min(1.5, Math.max(0.6, energyJoules * 60));
      audioEngine.playSpark(intensity);
    }
  }, []);

  // Main high-frequency physics integration loop
  useEffect(() => {
    let animationFrameId: number;

    const loop = (timestamp: number) => {
      const dt = (timestamp - lastStepTimeRef.current) / 1000;
      lastStepTimeRef.current = timestamp;

      if (dt > 0 && dt < 0.1 && !paramsRef.current.isPaused) {
        // Step physics forward
        let nextState = stepPhysics(
          stateRef.current,
          paramsRef.current,
          dt,
          handleSpark
        );

        // Step Module 2 Material Probe interactions if active
        if (activeModuleRef.current === 'module2' && probeRef.current.enabled) {
          const sep = paramsRef.current.dropperSeparation;
          const ringY = 2.0 - paramsRef.current.ringHeight;
          const canLeft: [number, number, number] = [-sep / 2, 0.45, 0];
          const canRight: [number, number, number] = [sep / 2, 0.45, 0];
          const ringLeft: [number, number, number] = [-sep / 2, ringY, 0];
          const ringRight: [number, number, number] = [sep / 2, ringY, 0];

          const probeRes = stepProbeInteraction(
            probeRef.current,
            nextState,
            paramsRef.current,
            dt,
            canLeft,
            canRight,
            ringLeft,
            ringRight
          );

          if (probeRes.playDischargeAudio && paramsRef.current.audioEnabled) {
            handleSpark(probeRes.dischargeEnergyJoules, Math.abs(nextState.potentialDifference) / 1000);
          }

          if (Object.keys(probeRes.modifiedState).length > 0) {
            nextState = {
              ...nextState,
              ...probeRes.modifiedState,
            };
          }

          probeRef.current = probeRes.updatedProbe;
          setProbe(probeRes.updatedProbe);
        }

        stateRef.current = nextState;
        setState(nextState);

        // Record time-series telemetry data point (~20 Hz sample rate)
        if (nextState.time - lastDataSampleTimeRef.current >= 0.05) {
          lastDataSampleTimeRef.current = nextState.time;

          const theoreticalV = calculateTheoreticalVoltage(
            nextState.time,
            seedVoltageRef.current || 2,
            nextState.growthRate,
            nextState.calculatedBreakdownVoltage
          );

          const newPoint: DataPoint = {
            t: nextState.time,
            vDiff: nextState.potentialDifference / 1000, // kV
            vA: nextState.voltageA / 1000,
            vB: nextState.voltageB / 1000,
            qA: nextState.chargeA * 1e9, // nC
            qB: nextState.chargeB * 1e9,
            spark: nextState.isSparking,
            theoreticalVDiff: theoreticalV / 1000,
          };

          setDataPoints((prev) => {
            const updated = [...prev, newPoint];
            if (updated.length > 1200) {
              return updated.slice(updated.length - 1200);
            }
            return updated;
          });
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [handleSpark]);

  // Reset charges, reservoir, and time
  const handleReset = () => {
    const seed = Math.max(30, Math.abs(params.seedVoltage) * 8);
    const initialVDiff = seed * 2;
    const { effA, effB } = calculateCollectionEfficiency(
      params.windSpeed,
      params.windDirection,
      seed,
      -seed,
      params.enableDeflection
    );
    const { chargingEfficiency, isStreamContinuous, breakupLength } = calculateChargingEfficiency(params.dropletRate);

    const next: SimulationState = {
      ...INITIAL_STATE,
      voltageA: seed,
      voltageB: -seed,
      potentialDifference: initialVDiff,
      chargeA: seed * INITIAL_STATE.capacitance,
      chargeB: -seed * INITIAL_STATE.capacitance,
      sparkCount: 0,
      sparkHistory: [],
      sparkProgressPercent: 0,
      lastSparkVoltageKv: 0,
      time: 0,
      calculatedBreakdownVoltage: calculateBreakdownVoltage(
        params.sparkGapDistance,
        params.humidity,
        params.temperature,
        params.airPressure
      ),
      airDensity: calculateAirDensity(params.airPressure, params.temperature),
      leakageResistance: calculateLeakageResistance(params.humidity, params.dropletRate),
      surfaceTension: calculateSurfaceTension(params.temperature),
      dropletDiameter: calculateDropletDiameter(params.temperature),
      growthRate: calculateGrowthRate(params, INITIAL_STATE.capacitance, INITIAL_STATE.inductionCapacitance),
      collectionEfficiencyA: effA,
      collectionEfficiencyB: effB,
      chargingEfficiency,
      isStreamContinuous,
      breakupLength,
      timeToNextSpark: 3.2,
      statusMessage: '⚡ Building charge toward spark breakdown...',
    };
    stateRef.current = next;
    setState(next);
    setDataPoints([]);
  };

  // Manual short-circuit discharge
  const handleManualDischarge = () => {
    const vKv = Math.abs(stateRef.current.potentialDifference) / 1000;
    handleSpark(0.005, vKv);
    setState((prev) => {
      const next = {
        ...prev,
        voltageA: 0.1,
        voltageB: -0.1,
        potentialDifference: 0.2,
        chargeA: 0.1 * prev.capacitance,
        chargeB: -0.1 * prev.capacitance,
        isSparking: true,
        sparkIntensity: 1.0,
        sparkCount: prev.sparkCount + 1,
        sparkProgressPercent: 0,
        lastSparkVoltageKv: vKv,
        sparkHistory: [
          {
            id: Date.now(),
            time: prev.time,
            voltageKv: vKv,
            energyMj: 5.0,
          },
          ...prev.sparkHistory.slice(0, 7),
        ],
      };
      stateRef.current = next;
      return next;
    });
  };

  // Save current run as comparative baseline
  const handleSaveRun = () => {
    if (dataPoints.length === 0) return;
    const runColors = ['#f59e0b', '#a855f7', '#10b981', '#ec4899'];
    const color = runColors[savedRuns.length % runColors.length];

    const maxV = Math.max(...dataPoints.map((d) => Math.abs(d.vDiff)));
    const newRun: SavedRun = {
      id: `run_${Date.now()}`,
      name: `Trial #${savedRuns.length + 1} (${params.humidity}% RH, ${params.airPressure.toFixed(0)} kPa, ${params.dropletRate} Hz)`,
      timestamp: new Date().toLocaleTimeString(),
      color,
      params: { ...params },
      data: [...dataPoints],
      maxVoltage: maxV,
      sparkCount: state.sparkCount,
      growthRate: state.growthRate,
    };

    setSavedRuns((prev) => [...prev, newRun]);
  };

  const handleClearSavedRuns = () => {
    setSavedRuns([]);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {!isAuthenticated ? (
        /* PASSCODE ENTRY SCREEN */
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 flex flex-col items-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/25 to-blue-500/10 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-lg">
              <span className="text-2xl font-bold font-mono">⚡</span>
            </div>

            <div className="text-center space-y-1">
              <h1 className="text-lg font-bold text-white">Kelvin Water Dropper Simulation</h1>
              <p className="text-xs text-slate-400">Designed by Keith Chapman 2026 v 2.0 using Google AI Studio</p>
            </div>

            <form onSubmit={handlePasscodeSubmit} className="w-full space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300 text-center">
                  Enter Main Screen Passcode
                </label>
                <div className="flex justify-center gap-2">
                  {passcodeDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      type="password"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        const next = [...passcodeDigits];
                        next[idx] = val;
                        setPasscodeDigits(next);
                        if (val && idx < 7) {
                          const nextInput = document.getElementById(`pass_digit_${idx + 1}`);
                          nextInput?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !digit && idx > 0) {
                          const prevInput = document.getElementById(`pass_digit_${idx - 1}`);
                          prevInput?.focus();
                        } else if (e.key === 'Enter') {
                          handlePasscodeSubmit();
                        }
                      }}
                      id={`pass_digit_${idx}`}
                      className={`w-10 h-12 text-center text-lg font-mono font-bold bg-slate-950 border rounded-xl text-white focus:outline-none focus:ring-2 ${
                        passcodeError
                          ? 'border-rose-500 ring-rose-500/30'
                          : 'border-slate-700 focus:border-cyan-400 focus:ring-cyan-500/30'
                      }`}
                    />
                  ))}
                </div>
                {passcodeError && (
                  <p className="text-xs text-rose-400 text-center font-mono animate-shake pt-1">
                    Incorrect Passcode.
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold rounded-xl border border-cyan-400/40 shadow-lg transition-all cursor-pointer"
                >
                  Unlock Simulation
                </button>
              </div>
            </form>

            <div className="pt-2 border-t border-slate-800 text-center text-[10px] font-mono text-slate-500">
              CP & Honors Chemistry Lab Investigation Apparatus
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 1. TOP TELEMETRY RIBBON (Clean, Sleek, Houses Spark Meter & Controls) */}
          <TelemetryBar
            state={state}
            params={params}
            onShortCircuit={handleManualDischarge}
            onOpenLabInvestigation={() => setShowLabInvestigation(true)}
            onOpenLightningModal={() => setShowLightningModal(true)}
            onOpenMolecularModal={() => setShowMolecularModal(true)}
            showHotspots={showHotspots}
            setShowHotspots={setShowHotspots}
            showGraphOverlay={showGraphOverlay}
            setShowGraphOverlay={setShowGraphOverlay}
            onTriggerSpark={handleManualDischarge}
            activeModule={activeModule}
            setActiveModule={setActiveModule}
          />

          {/* 2. SUBTLE VIEWPORT EDGE FLASH ON SPARK */}
          <SparkFlashBanner
            state={state}
            params={params}
            onTriggerSpark={handleManualDischarge}
          />

          {/* 3. 3D SIMULATION VIEWPORT (REACT THREE FIBER) */}
          <main className="absolute inset-0 z-0">
            <KelvinDropperScene
              params={params}
              state={state}
              showHotspots={showHotspots}
              probe={activeModule === 'module2' ? probe : undefined}
              setProbe={activeModule === 'module2' ? setProbe : undefined}
            />
          </main>

          {/* 4. REAL-TIME VOLTAGE GRAPH OVERLAY */}
          {showGraphOverlay && (
            <aside className="fixed top-16 right-80 mr-4 z-20 w-[92vw] sm:w-[420px] pointer-events-auto shadow-2xl">
              <VoltageGraph
                data={dataPoints}
                state={state}
                params={params}
                savedRuns={savedRuns}
                onSaveRun={handleSaveRun}
                onClearRuns={handleClearSavedRuns}
              />
            </aside>
          )}

          {/* 5. SIDE PANELS: Module 1 (Apparatus Controls) vs Module 2 (Material Interaction Lab) */}
          {activeModule === 'module1' ? (
            <SidePanels
              params={params}
              setParams={setParams}
              state={state}
              onReset={handleReset}
              onManualDischarge={handleManualDischarge}
              showHotspots={showHotspots}
              setShowHotspots={setShowHotspots}
              showGraphOverlay={showGraphOverlay}
              setShowGraphOverlay={setShowGraphOverlay}
              onOpenLabInvestigation={() => setShowLabInvestigation(true)}
              onOpenLightningModal={() => setShowLightningModal(true)}
              onOpenMolecularModal={() => setShowMolecularModal(true)}
            />
          ) : (
            <ProbingLabPanel
              probe={probe}
              setProbe={setProbe}
              state={state}
              params={params}
              onResetApparatus={handleReset}
              onOpenMolecularModal={() => setShowMolecularModal(true)}
            />
          )}

          {/* 6. CP CHEMISTRY LAB INVESTIGATION MODAL */}
          <ClassroomLabInvestigation
            params={params}
            setParams={setParams}
            state={state}
            isOpen={showLabInvestigation}
            onClose={() => setShowLabInvestigation(false)}
          />

          {/* 7. KELVIN VS NATURAL LIGHTNING COMPARISON MODAL */}
          <LightningAnalogyModal
            params={params}
            state={state}
            isOpen={showLightningModal}
            onClose={() => setShowLightningModal(false)}
          />

          {/* 8. 3D MOLECULAR & SUB-ATOMIC INTERACTIONS LAB MODAL */}
          <MolecularLabModal
            isOpen={showMolecularModal}
            onClose={() => setShowMolecularModal(false)}
          />

          {/* 9. FOOTER DESIGN CREDIT */}
          <div className="absolute bottom-1 left-3 z-20 pointer-events-none text-[10px] font-mono text-slate-500 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-900">
            Designed by Keith Chapman 2026 v 2.0 using Google AI Studio
          </div>
        </>
      )}
    </div>
  );
}
