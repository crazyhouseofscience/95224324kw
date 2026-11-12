import React from 'react';
import {
  Zap,
  Droplets,
  Wind,
  Gauge,
  FlaskConical,
  Lightbulb,
  LineChart,
  Play,
  RotateCcw,
  Layers,
  Atom,
} from 'lucide-react';
import { SimulationState, SimulationParams } from '../types/simulation';

interface TelemetryBarProps {
  state: SimulationState;
  params: SimulationParams;
  onShortCircuit: () => void;
  onOpenLabInvestigation: () => void;
  onOpenLightningModal: () => void;
  onOpenMolecularModal: () => void;
  showHotspots: boolean;
  setShowHotspots: (show: boolean) => void;
  showGraphOverlay: boolean;
  setShowGraphOverlay: (show: boolean) => void;
  onTriggerSpark?: () => void;
  activeModule?: 'module1' | 'module2';
  setActiveModule?: (mod: 'module1' | 'module2') => void;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({
  state,
  params,
  onShortCircuit,
  onOpenLabInvestigation,
  onOpenLightningModal,
  onOpenMolecularModal,
  showHotspots,
  setShowHotspots,
  showGraphOverlay,
  setShowGraphOverlay,
  onTriggerSpark,
  activeModule = 'module1',
  setActiveModule,
}) => {
  const vDiffKv = (Math.abs(state.potentialDifference) / 1000).toFixed(1);
  const vaKv = (state.voltageA / 1000).toFixed(1);
  const vbKv = (state.voltageB / 1000).toFixed(1);
  const bdKv = (state.calculatedBreakdownVoltage / 1000).toFixed(1);

  const isQuenched = params.humidity > 80 && state.growthRate <= 0.05;

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between gap-4 px-4 py-2 bg-slate-950/95 border-b border-slate-800 shadow-lg select-none backdrop-blur-md">
      {/* Zone 1: Brand & Wordmark + Module Switcher */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-sm">
            <Droplets size={17} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-tight text-white whitespace-nowrap">
              Kelvin Water Dropper
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-medium">
              CP & Honors Chemistry
            </span>
          </div>
        </div>

        {/* Module Switcher Tabs: Part 1 vs Part 2 */}
        {setActiveModule && (
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 ml-1">
            <button
              type="button"
              onClick={() => setActiveModule('module1')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeModule === 'module1'
                  ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Classic Kelvin Water Dropper Generator (Part 1)"
            >
              <Droplets size={13} className={activeModule === 'module1' ? 'text-cyan-400' : 'text-slate-500'} />
              <span className="hidden sm:inline">Part 1: Generator</span>
              <span className="sm:hidden">Part 1</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveModule('module2')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeModule === 'module2'
                  ? 'bg-purple-500/25 text-purple-200 border border-purple-400/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Material Interaction Lab: Drag Metal, Plastic, Wood, Rubber into 3D Scene (Part 2)"
            >
              <Layers size={13} className={activeModule === 'module2' ? 'text-purple-400' : 'text-slate-500'} />
              <span className="hidden sm:inline">Part 2: Materials</span>
              <span className="sm:hidden">Part 2</span>
            </button>
          </div>
        )}
      </div>

      {/* Zone 2: Telemetry Readouts & Compact Spark Meter */}
      <div className="hidden md:flex items-center gap-4 text-xs font-mono">
        {/* Voltage Potential Difference */}
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-slate-400">ΔV Potential</span>
          <span className="text-sm font-extrabold text-cyan-300">
            {vDiffKv} <span className="text-[10px] font-normal text-slate-400">kV</span>
          </span>
        </div>

        <span className="text-slate-800" aria-hidden="true">|</span>

        {/* Can A & Can B */}
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-slate-400">Can A (+) / Can B (−)</span>
          <div className="flex items-center gap-1 text-xs font-semibold">
            <span className={state.voltageA >= 0 ? 'text-amber-400' : 'text-sky-400'}>{vaKv} kV</span>
            <span className="text-slate-600">/</span>
            <span className={state.voltageB >= 0 ? 'text-amber-400' : 'text-fuchsia-400'}>{vbKv} kV</span>
          </div>
        </div>

        <span className="text-slate-800" aria-hidden="true">|</span>

        {/* 4-Stage Charge State Readout */}
        <div className="flex flex-col">
          <span className="text-[9px] uppercase font-bold text-slate-400">Charge State</span>
          <span
            className={`text-[11px] font-bold font-mono ${
              isQuenched
                ? 'text-rose-400'
                : state.sparkProgressPercent >= 75
                ? 'text-amber-300 animate-pulse'
                : 'text-sky-300'
            }`}
          >
            {isQuenched
              ? 'Quenched (High RH)'
              : state.sparkProgressPercent < 25
              ? '1. Induction (Low Q)'
              : state.sparkProgressPercent < 75
              ? '2. Feedback Buildup'
              : state.sparkProgressPercent < 98
              ? '3. Dielectric Stress'
              : '4. Spark Arc!'}
          </span>
        </div>

        <span className="text-slate-800" aria-hidden="true">|</span>

        {/* Integrated Sleek Spark Meter Progress */}
        <div className="flex flex-col w-48 lg:w-56">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400 uppercase font-bold flex items-center gap-1">
              <Zap size={11} className={state.sparkProgressPercent > 85 ? 'text-amber-400 animate-pulse' : 'text-cyan-400'} />
              <span>Spark Meter</span>
            </span>
            <span className="text-slate-300 font-bold">
              {vDiffKv} / <span className="text-rose-400">{bdKv} kV</span>
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1 border border-slate-700/60">
            <div
              className={`h-full transition-all duration-100 ${
                isQuenched
                  ? 'bg-rose-500'
                  : state.sparkProgressPercent > 85
                  ? 'bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500'
                  : 'bg-gradient-to-r from-sky-500 to-cyan-400'
              }`}
              style={{ width: `${isQuenched ? 100 : Math.max(3, state.sparkProgressPercent)}%` }}
            />
          </div>
        </div>

        <span className="text-slate-800" aria-hidden="true">|</span>

        {/* Discharge Count */}
        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
          <Zap size={12} className="text-amber-400" />
          <span className="text-xs font-bold text-amber-300">{state.sparkCount} Sparks</span>
        </div>

        {/* Quick Spark Button */}
        {onTriggerSpark && (
          <button
            type="button"
            onClick={onTriggerSpark}
            className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 rounded-lg text-[10px] font-bold font-mono transition-colors cursor-pointer"
            title="Force immediate spark discharge"
          >
            Spark Now
          </button>
        )}
      </div>

      {/* Zone 3: Interactive View & Hints Selectors */}
      <div className="flex items-center gap-2 shrink-0">
        {/* 3D Molecular Interactions Lab Modal Button */}
        <button
          type="button"
          onClick={onOpenMolecularModal}
          className="px-3 py-1.5 text-xs font-bold text-cyan-200 bg-gradient-to-r from-purple-600/30 to-cyan-600/30 hover:from-purple-600/50 hover:to-cyan-600/50 border border-purple-400/50 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          title="Open 3D Molecular & Sub-Atomic Interactions Lab (H2O dipoles, ions, electron sea, PVC, plasma, spark)"
        >
          <Atom size={14} className="text-cyan-300" />
          <span className="hidden sm:inline">3D Molecular Lab</span>
        </button>

        {/* Kelvin vs. Lightning Modal Trigger Button */}
        <button
          type="button"
          onClick={onOpenLightningModal}
          className="px-3 py-1.5 text-xs font-bold text-amber-300 bg-gradient-to-r from-amber-600/30 to-rose-600/30 hover:from-amber-600/50 hover:to-rose-600/50 border border-amber-500/50 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          title="Compare Kelvin Dropper mechanics to natural thunderstorm cloud-to-ground lightning"
        >
          <Zap size={14} className="text-amber-400" />
          <span className="hidden sm:inline">Kelvin vs. Lightning</span>
        </button>

        {/* Hints & Information Selectors Toggle */}
        <button
          type="button"
          onClick={() => setShowHotspots(!showHotspots)}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
            showHotspots
              ? 'bg-amber-500/25 text-amber-300 border-amber-400/60 shadow-amber-500/10'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
          }`}
          title="Toggle interactive 3D hints on each part of the apparatus"
        >
          <Lightbulb size={14} className={showHotspots ? 'text-amber-300' : 'text-slate-400'} />
          <span className="hidden sm:inline">3D Hints</span>
        </button>

        {/* Graph Overlay Toggle */}
        <button
          type="button"
          onClick={() => setShowGraphOverlay(!showGraphOverlay)}
          className={`px-2.5 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
            showGraphOverlay
              ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400/60'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
          }`}
          title="Show/Hide Voltage Oscilloscope Graph"
        >
          <LineChart size={14} />
          <span className="hidden lg:inline">Graph</span>
        </button>

        {/* Lab Investigation Modal */}
        <button
          type="button"
          onClick={onOpenLabInvestigation}
          className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/40 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          title="Open CP Chemistry 30-Second Spark Investigation"
        >
          <FlaskConical size={14} className="text-cyan-200" />
          <span className="hidden sm:inline">Lab Trials</span>
        </button>

        {/* Short Circuit / Ground */}
        <button
          type="button"
          onClick={onShortCircuit}
          className="px-2.5 py-1.5 text-xs font-mono font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
          title="Discharge and reset cans to ground"
        >
          <RotateCcw size={13} className="text-amber-400" />
          <span className="hidden xl:inline">Ground</span>
        </button>
      </div>
    </header>
  );
};
