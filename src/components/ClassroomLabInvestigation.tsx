import React, { useState, useEffect, useRef } from 'react';
import {
  FlaskConical,
  Play,
  RotateCcw,
  Download,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Timer,
  Zap,
  BookOpen,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { ClassroomTrial, SimulationParams, SimulationState } from '../types/simulation';

interface ClassroomLabInvestigationProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  state: SimulationState;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_TRIALS: ClassroomTrial[] = [
  {
    id: 'trial-1',
    category: 'very-slow',
    flowLabel: 'Very Slow',
    dropletRate: 4,
    description: 'Infrequent individual droplets forming at nozzle tip.',
    sparks30sTrial1: null,
    sparks30sTrial2: null,
    averageSparks: null,
    streamState: 'discrete-drops',
  },
  {
    id: 'trial-2',
    category: 'slow',
    flowLabel: 'Slow',
    dropletRate: 8,
    description: 'Steady drops pinching off with distinct spacing.',
    sparks30sTrial1: null,
    sparks30sTrial2: null,
    averageSparks: null,
    streamState: 'discrete-drops',
  },
  {
    id: 'trial-3',
    category: 'moderate',
    flowLabel: 'Moderate',
    dropletRate: 14,
    description: 'Rhythmic, efficient drop separation right inside inductor ring.',
    sparks30sTrial1: null,
    sparks30sTrial2: null,
    averageSparks: null,
    streamState: 'optimal-pinch',
  },
  {
    id: 'trial-4',
    category: 'faster',
    flowLabel: 'Faster',
    dropletRate: 22,
    description: 'Elongated jet pinching into rapid drops near bottom of ring.',
    sparks30sTrial1: null,
    sparks30sTrial2: null,
    averageSparks: null,
    streamState: 'elongated-jet',
  },
  {
    id: 'trial-5',
    category: 'very-fast',
    flowLabel: 'Very Fast',
    dropletRate: 32,
    description: 'Continuous liquid stream extends through ring! Splash leakage occurs.',
    sparks30sTrial1: null,
    sparks30sTrial2: null,
    averageSparks: null,
    streamState: 'continuous-stream',
  },
];

export const ClassroomLabInvestigation: React.FC<ClassroomLabInvestigationProps> = ({
  params,
  setParams,
  state,
  isOpen,
  onClose,
}) => {
  const [trials, setTrials] = useState<ClassroomTrial[]>(DEFAULT_TRIALS);
  const [activeTrialId, setActiveTrialId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(30);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [sparkCountAtStart, setSparkCountAtStart] = useState<number>(0);
  const [activeSubTab, setActiveSubTab] = useState<'experiment' | 'graph' | 'concepts'>('experiment');

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const activeTrialIdRef = useRef<string | null>(activeTrialId);
  useEffect(() => {
    activeTrialIdRef.current = activeTrialId;
  }, [activeTrialId]);

  const sparkCountAtStartRef = useRef<number>(sparkCountAtStart);
  useEffect(() => {
    sparkCountAtStartRef.current = sparkCountAtStart;
  }, [sparkCountAtStart]);

  // Handle active 30-second investigation countdown with rock-solid timer
  useEffect(() => {
    if (!timerRunning) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerRunning(false);

          const trialId = activeTrialIdRef.current;
          const startSparks = sparkCountAtStartRef.current;
          const currentSparks = stateRef.current.sparkCount;
          const sparksGenerated = Math.max(0, currentSparks - startSparks);

          if (trialId) {
            setTrials((prevTrials) =>
              prevTrials.map((t) => {
                if (t.id === trialId) {
                  let t1 = t.sparks30sTrial1;
                  let t2 = t.sparks30sTrial2;

                  if (t1 === null) {
                    t1 = sparksGenerated;
                  } else {
                    t2 = sparksGenerated;
                  }

                  const avg = t2 !== null ? (t1 + t2) / 2 : t1;

                  return {
                    ...t,
                    sparks30sTrial1: t1,
                    sparks30sTrial2: t2,
                    averageSparks: avg,
                  };
                }
                return t;
              })
            );
          }
          setActiveTrialId(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning]);

  // Start 30-second trial for a row
  const startTrial = (trial: ClassroomTrial) => {
    // Set simulator to this flow rate and unpause
    setParams((p) => ({
      ...p,
      dropletRate: trial.dropletRate,
      isPaused: false,
    }));

    setActiveTrialId(trial.id);
    setTimeRemaining(30);
    setSparkCountAtStart(state.sparkCount);
    setTimerRunning(true);
  };

  const cancelTrial = () => {
    setTimerRunning(false);
    setActiveTrialId(null);
    setTimeRemaining(30);
  };

  const resetAllTrials = () => {
    cancelTrial();
    setTrials(DEFAULT_TRIALS);
  };

  // Export CSV of student lab results
  const exportLabData = () => {
    const header = 'Trial,Water Flow Category,Droplet Rate (drips/s),30s Trial 1 Sparks,30s Trial 2 Sparks,Average Sparks / 30s,Stream Behavior\n';
    const rows = trials
      .map(
        (t, idx) =>
          `${idx + 1},${t.flowLabel},${t.dropletRate},${t.sparks30sTrial1 ?? ''},${t.sparks30sTrial2 ?? ''},${t.averageSparks ?? ''},"${t.description}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CP_Chemistry_Kelvin_Dropper_Lab_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentTrialSparks = timerRunning ? Math.max(0, state.sparkCount - sparkCountAtStart) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FlaskConical size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>CP Chemistry Classroom Investigation</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Lab Question: How does water flow rate affect spark frequency?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sub-tabs */}
            <div className="flex items-center p-1 bg-slate-800 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveSubTab('experiment')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeSubTab === 'experiment'
                    ? 'bg-cyan-500/25 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1. Data Table & Timer
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('graph')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeSubTab === 'graph'
                    ? 'bg-cyan-500/25 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                2. Spark Rate Graph
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('concepts')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeSubTab === 'concepts'
                    ? 'bg-cyan-500/25 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                3. Teacher Guide
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center ml-2 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 30-Second Active Countdown Bar (visible if trial running) */}
          {timerRunning && (
            <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 p-4 rounded-2xl border-2 border-cyan-400 shadow-xl flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400 flex items-center justify-center font-mono font-bold text-lg">
                  {timeRemaining}s
                </div>
                <div>
                  <div className="text-xs uppercase font-bold tracking-wider text-cyan-300">
                    30-Second Trial in Progress...
                  </div>
                  <div className="text-sm font-semibold text-white">
                    Flow: {trials.find((t) => t.id === activeTrialId)?.flowLabel} ({params.dropletRate} drips/s)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Sparks Counted</div>
                  <div className="text-2xl font-extrabold text-amber-300 font-mono">
                    ⚡ {currentTrialSparks}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={cancelTrial}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg border border-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: EXPERIMENT DATA TABLE */}
          {activeSubTab === 'experiment' && (
            <div className="space-y-4">
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <strong className="text-cyan-300 block mb-1">Investigation Instructions for Students:</strong>
                Keep the apparatus, electrode gap ({params.sparkGapDistance} mm), humidity ({params.humidity}%), and air pressure ({params.airPressure} kPa) constant.
                Click <strong>"Run 30s Trial"</strong> on each flow rate. The system will count sparks for 30 seconds. Repeat each flow rate twice to compute the average.
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800 shadow-md">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Trial</th>
                      <th className="py-3 px-4">Water Flow</th>
                      <th className="py-3 px-4">Rate (Hz)</th>
                      <th className="py-3 px-4 text-center">Trial 1 (30s)</th>
                      <th className="py-3 px-4 text-center">Trial 2 (30s)</th>
                      <th className="py-3 px-4 text-center">Average Sparks</th>
                      <th className="py-3 px-4">Stream State</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                    {trials.map((trial, idx) => {
                      const isRunningThis = timerRunning && activeTrialId === trial.id;
                      return (
                        <tr
                          key={trial.id}
                          className={`hover:bg-slate-800/50 transition-colors ${
                            isRunningThis ? 'bg-cyan-950/30' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4 font-bold text-white">{trial.flowLabel}</td>
                          <td className="py-3 px-4 text-cyan-300">{trial.dropletRate} drips/s</td>
                          <td className="py-3 px-4 text-center">
                            {trial.sparks30sTrial1 !== null ? (
                              <span className="font-bold text-amber-300">⚡ {trial.sparks30sTrial1}</span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {trial.sparks30sTrial2 !== null ? (
                              <span className="font-bold text-amber-300">⚡ {trial.sparks30sTrial2}</span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {trial.averageSparks !== null ? (
                              <span className="font-extrabold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                                {trial.averageSparks.toFixed(1)} sparks
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[11px] text-slate-300">
                            {trial.dropletRate >= 26 ? (
                              <span className="text-rose-400 font-semibold">Continuous Jet (Charge Leaks)</span>
                            ) : trial.dropletRate >= 14 ? (
                              <span className="text-emerald-400 font-semibold">Optimal Droplets (Peak Rate)</span>
                            ) : (
                              <span className="text-slate-400">Slow Isolated Drops</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => startTrial(trial)}
                              disabled={timerRunning}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                isRunningThis
                                  ? 'bg-cyan-500 text-slate-950'
                                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/50'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {trial.sparks30sTrial1 === null
                                ? 'Run 30s'
                                : trial.sparks30sTrial2 === null
                                ? 'Repeat 30s'
                                : 'Re-run'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Action Toolbar */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={resetAllTrials}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Clear All Lab Trials</span>
                </button>

                <button
                  type="button"
                  onClick={exportLabData}
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download size={14} />
                  <span>Download Student Lab Sheet (.csv)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SPARK RATE VS FLOW GRAPH */}
          {activeSubTab === 'graph' && (
            <div className="space-y-4">
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-cyan-300 flex items-center gap-2">
                    <TrendingUp size={16} />
                    <span>Spark Rate vs. Water Flow Curve (30-Second Count)</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    Comparing Empirical Trials against Physical Theory
                  </span>
                </div>

                {/* SVG Plot */}
                <div className="w-full h-64 bg-slate-950 rounded-xl p-3 border border-slate-800 relative">
                  <svg className="w-full h-full" viewBox="0 0 600 220">
                    {/* Grid lines */}
                    <line x1="50" y1="20" x2="50" y2="180" stroke="#334155" strokeWidth="1.5" />
                    <line x1="50" y1="180" x2="580" y2="180" stroke="#334155" strokeWidth="1.5" />

                    <line x1="50" y1="140" x2="580" y2="140" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="50" y1="100" x2="580" y2="100" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="50" y1="60" x2="580" y2="60" stroke="#1e293b" strokeDasharray="3 3" />

                    {/* Y-axis labels */}
                    <text x="40" y="184" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">0</text>
                    <text x="40" y="144" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">4</text>
                    <text x="40" y="104" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">8</text>
                    <text x="40" y="64" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">12</text>
                    <text x="25" y="25" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle" transform="rotate(-90 25 25)">Sparks / 30s</text>

                    {/* X-axis labels */}
                    <text x="100" y="198" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">Very Slow (4)</text>
                    <text x="210" y="198" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">Slow (8)</text>
                    <text x="320" y="198" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">Moderate (14)</text>
                    <text x="430" y="198" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">Faster (22)</text>
                    <text x="535" y="198" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">Very Fast (32)</text>

                    {/* Theoretical Bell Curve Line */}
                    <path
                      d="M 100 165 C 160 145, 240 100, 320 65 C 380 40, 430 45, 480 80 C 510 110, 540 140, 560 155"
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth="2.5"
                      strokeDasharray="5 3"
                    />

                    {/* Optimal Operating Zone Highlight */}
                    <rect x="290" y="30" width="160" height="150" fill="rgba(6, 182, 212, 0.08)" rx="8" />
                    <text x="370" y="45" fill="#38bdf8" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      Optimal Zone
                    </text>

                    {/* Student Empirical Polyline Connecting Trials */}
                    {(() => {
                      const validPoints = trials
                        .map((t, idx) => {
                          if (t.averageSparks === null) return null;
                          const xPositions = [100, 210, 320, 430, 535];
                          const x = xPositions[idx];
                          const y = Math.max(30, 180 - (t.averageSparks / 14) * 140);
                          return `${x},${y}`;
                        })
                        .filter(Boolean);
                      if (validPoints.length > 1) {
                        return (
                          <polyline
                            points={validPoints.join(' ')}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="2.5"
                          />
                        );
                      }
                      return null;
                    })()}

                    {/* Student Empirical Data Points */}
                    {trials.map((t, idx) => {
                      const xPositions = [100, 210, 320, 430, 535];
                      const x = xPositions[idx];
                      if (t.averageSparks === null) return null;
                      // Max sparks ~ 14 = y: 40, 0 sparks = y: 180
                      const y = Math.max(30, 180 - (t.averageSparks / 14) * 140);
                      return (
                        <g key={t.id}>
                          <circle cx={x} cy={y} r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                          <text x={x} y={y - 10} fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                            {t.averageSparks.toFixed(1)}
                          </text>
                        </g>
                      );
                    })}

                    {/* Chart Legend */}
                    <g transform="translate(60, 28)">
                      <line x1="0" y1="5" x2="20" y2="5" stroke="#818cf8" strokeWidth="2" strokeDasharray="4 2" />
                      <text x="26" y="8" fill="#a5b4fc" fontSize="9" fontFamily="monospace">Physical Model Theory</text>
                      <circle cx="160" cy="5" r="4" fill="#f59e0b" stroke="#fff" strokeWidth="1" />
                      <text x="170" y="8" fill="#fbbf24" fontSize="9" fontFamily="monospace">Student Lab Average</text>
                    </g>
                  </svg>
                </div>

                {/* Graph Explanation Note */}
                <div className="mt-3 text-xs text-slate-300 leading-relaxed grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-amber-400 font-bold block mb-1">1. Slow Drops (Low Flow):</span>
                    Charge accumulates slowly. Interval between sparks is long.
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-cyan-400 font-bold block mb-1">2. Optimal Operating Region:</span>
                    At 14–22 drips/s, drops pinch off cleanly in the ring, delivering maximum isolated charge packets.
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-rose-400 font-bold block mb-1">3. Very Fast Flow Drop-off:</span>
                    The stream becomes a continuous liquid jet through the ring, conducting charge right back up to the grounded nozzle!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CP CHEMISTRY TEACHER GUIDE & CONCEPTS */}
          {activeSubTab === 'concepts' && (
            <div className="space-y-4 text-xs text-slate-200 leading-relaxed">
              {/* Concept 1 */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-sm text-cyan-300">
                  1. How the System Generates a Spark (Without a Battery!)
                </h4>
                <p>
                  The Kelvin Water Dropper is an <strong>electrostatic generator</strong>, not a chemical battery or reaction.
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-slate-300">
                  <li>Water begins falling from dual nozzles through two metal inductor rings.</li>
                  <li>A tiny natural electrical imbalance (dissolved ions, thermal noise, static) causes one stream to carry a slight excess of positive ions (H⁺) and the other negative ions (OH⁻).</li>
                  <li>Charged water drops land in the collection cans, charging them up.</li>
                  <li><strong>The Key Positive Feedback:</strong> Ring A is cross-wired to Can B, and Ring B is cross-wired to Can A. Each charged can reinforces the opposite ring's ability to induce more charge on the next falling drops!</li>
                  <li>Voltage amplifies exponentially until the electric field reaches dielectric breakdown in air (~30,000 V/cm), producing a spark!</li>
                </ol>
              </div>

              {/* Concept 2 */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-sm text-amber-300">
                  2. Why More Water Does Not Always Mean More Sparks
                </h4>
                <p>
                  Think of the system as having to do two distinct tasks:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <strong className="text-white block mb-1">1. Deliver Electrical Charge:</strong>
                    Faster drops deliver more packets of charge per second, speeding up buildup.
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <strong className="text-white block mb-1">2. Maintain Electrical Isolation:</strong>
                    Drops MUST separate into discrete, isolated spheres inside the ring. If the stream becomes a continuous liquid jet, the water column conducts charge back to ground!
                  </div>
                </div>
              </div>

              {/* Concept 3 */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-sm text-rose-300">
                  3. Spark Frequency vs. Spark Energy
                </h4>
                <p>
                  Caution for students: <em>A higher spark count does not mean more total electrical energy.</em>
                </p>
                <p className="text-slate-300">
                  A narrow electrode gap (2 mm) produces rapid, low-voltage sparks (~4 kV, small energy). A wide gap (15 mm) takes longer to build up, producing fewer sparks, but each discharge releases much higher energy: <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300 font-mono">E = ½ C V²</code>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
