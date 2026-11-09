import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  CloudRain,
  Zap,
  FlaskConical,
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Droplets,
  Wind,
  Gauge,
  HelpCircle,
} from 'lucide-react';
import { SimulationParams, SimulationState } from '../types/simulation';
import { EducationalTooltip } from './EducationalTooltip';

interface SidePanelsProps {
  params: SimulationParams;
  setParams: React.Dispatch<React.SetStateAction<SimulationParams>>;
  state: SimulationState;
  onReset: () => void;
  onManualDischarge: () => void;
  showHotspots: boolean;
  setShowHotspots: (show: boolean) => void;
  showGraphOverlay: boolean;
  setShowGraphOverlay: (show: boolean) => void;
  onOpenLabInvestigation: () => void;
  onOpenLightningModal: () => void;
}

type LeftTab = 'flow' | 'charges' | 'guide';
type RightTab = 'environment' | 'spark' | 'presets';

export const SidePanels: React.FC<SidePanelsProps> = ({
  params,
  setParams,
  state,
  onReset,
  onManualDischarge,
  showHotspots,
  setShowHotspots,
  showGraphOverlay,
  setShowGraphOverlay,
  onOpenLabInvestigation,
  onOpenLightningModal,
}) => {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const [leftTab, setLeftTab] = useState<LeftTab>('flow');
  const [rightTab, setRightTab] = useState<RightTab>('environment');

  const applyPreset = (preset: Partial<SimulationParams>) => {
    setParams((prev) => ({
      ...prev,
      ...preset,
    }));
  };

  return (
    <>
      {/* ========================================== */}
      {/* 1. LEFT SIDE PANEL (Flow, Charges, Guide)   */}
      {/* ========================================== */}
      <aside
        className={`fixed top-14 bottom-3 z-30 transition-all duration-300 pointer-events-auto flex items-start select-none ${
          leftOpen ? 'left-3 w-80 max-w-[calc(50vw-20px)]' : '-left-80 w-80'
        }`}
      >
        <div className="relative w-full h-full bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden text-slate-100 text-xs">
          {/* Header & Left Tabs */}
          <div className="p-2.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 w-full text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setLeftTab('flow')}
                className={`flex-1 py-1 rounded-lg transition-colors cursor-pointer text-center ${
                  leftTab === 'flow'
                    ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Droplets & Flow
              </button>
              <button
                type="button"
                onClick={() => setLeftTab('charges')}
                className={`flex-1 py-1 rounded-lg transition-colors cursor-pointer text-center ${
                  leftTab === 'charges'
                    ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Charges (+ / −)
              </button>
              <button
                type="button"
                onClick={() => setLeftTab('guide')}
                className={`flex-1 py-1 rounded-lg transition-colors cursor-pointer text-center ${
                  leftTab === 'guide'
                    ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Color Guide
              </button>
            </div>
          </div>

          {/* Left Panel Content Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
            {/* TAB 1: DROPLETS & FLOW CONTROLS */}
            {leftTab === 'flow' && (
              <div className="space-y-3">
                {/* Droplet Flow Rate */}
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <EducationalTooltip id="dropletRate">
                      <span className="font-semibold text-slate-200">Droplet Flow Rate</span>
                    </EducationalTooltip>
                    <span className="font-mono font-bold text-cyan-300 text-sm">
                      {params.dropletRate} <span className="text-[10px] text-slate-400">drips/s</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setParams((p) => ({ ...p, dropletRate: Math.max(2, p.dropletRate - 1) }))}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      type="range"
                      min="2"
                      max="32"
                      step="1"
                      value={params.dropletRate}
                      onChange={(e) => setParams((p) => ({ ...p, dropletRate: Number(e.target.value) }))}
                      className="flex-1 accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => setParams((p) => ({ ...p, dropletRate: Math.min(32, p.dropletRate + 1) }))}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>2 drips/s (Slow)</span>
                    <span className={params.dropletRate >= 26 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {params.dropletRate >= 26 ? 'Jet Leakage!' : '14-22 (Optimal)'}
                    </span>
                    <span>32 drips/s</span>
                  </div>
                </div>

                {/* Initial Seed Asymmetry */}
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <EducationalTooltip id="seedVoltage">
                      <span className="font-semibold text-slate-200">Seed Asymmetry</span>
                    </EducationalTooltip>
                    <span className="font-mono font-bold text-amber-300">
                      {params.seedVoltage > 0 ? `+${params.seedVoltage} V` : `${params.seedVoltage} V`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="5"
                    value={params.seedVoltage}
                    onChange={(e) => setParams((p) => ({ ...p, seedVoltage: Number(e.target.value) }))}
                    className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-400 font-mono">
                    Initial charge seed to start induction cascade
                  </div>
                </div>

                {/* Electrostatic Spray Repulsion */}
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <EducationalTooltip id="deflection">
                      <span className="font-semibold text-slate-200 block">Electrostatic Spray</span>
                    </EducationalTooltip>
                    <span className="text-[10px] text-slate-400">Like charges repel droplets</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setParams((p) => ({ ...p, enableDeflection: !p.enableDeflection }))}
                    className={`px-3 py-1 rounded-lg font-mono font-bold text-[11px] transition-all cursor-pointer ${
                      params.enableDeflection
                        ? 'bg-cyan-500 text-slate-950 font-extrabold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {params.enableDeflection ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Sim Speed & Primary Controls */}
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">Simulation Speed</span>
                    <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                      {([0.5, 1.0, 2.0] as const).map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => setParams((p) => ({ ...p, simSpeed: spd }))}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                            params.simSpeed === spd
                              ? 'bg-cyan-500 text-slate-950'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <div className="flex items-center gap-1.5">
                      {/* Play / Pause */}
                      <button
                        type="button"
                        onClick={() => setParams((p) => ({ ...p, isPaused: !p.isPaused }))}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-mono font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {params.isPaused ? <Play size={13} /> : <Pause size={13} />}
                        <span>{params.isPaused ? 'Play' : 'Pause'}</span>
                      </button>

                      {/* Reset */}
                      <button
                        type="button"
                        onClick={onReset}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 font-mono flex items-center gap-1 cursor-pointer"
                        title="Reset simulation charges"
                      >
                        <RotateCcw size={13} />
                        <span>Reset</span>
                      </button>
                    </div>

                    {/* Mute */}
                    <button
                      type="button"
                      onClick={() => setParams((p) => ({ ...p, audioEnabled: !p.audioEnabled }))}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        params.audioEnabled
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                      title={params.audioEnabled ? 'Sound is ON' : 'Sound is MUTED'}
                    >
                      {params.audioEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CHARGES & ELECTRON FLOW CONTROLS */}
            {leftTab === 'charges' && (
              <div className="space-y-3">
                {/* Charge Flow Model Switch */}
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">Flow Perspective</span>
                    <span className="text-[10px] text-cyan-300 font-mono">
                      {params.chargeFlowMode === 'chemistry' ? 'Both wires flow UP (+ & −)' : 'Mobile e⁻ drift'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setParams((p) => ({ ...p, chargeFlowMode: 'chemistry' }))}
                      className={`flex-1 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        params.chargeFlowMode === 'chemistry'
                          ? 'bg-cyan-500 text-slate-950 font-extrabold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Chemistry (+ & −)
                    </button>
                    <button
                      type="button"
                      onClick={() => setParams((p) => ({ ...p, chargeFlowMode: 'physics' }))}
                      className={`flex-1 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        params.chargeFlowMode === 'physics'
                          ? 'bg-cyan-500 text-slate-950 font-extrabold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Physics (e⁻ only)
                    </button>
                  </div>
                </div>

                {/* Charge Flow Speed */}
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Charge Flow Speed</span>
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    {([0.5, 1.0, 2.0] as const).map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => setParams((p) => ({ ...p, electronFlowSpeed: spd }))}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          params.electronFlowSpeed === spd
                            ? 'bg-cyan-500 text-slate-950'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Charge Symbol Size Selector */}
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">Charge Symbol Size</span>
                    <span className="font-mono font-bold text-amber-300 text-xs">
                      {(params.chargeSignSize ?? 1.2) === 0.8
                        ? 'Small (0.8x)'
                        : (params.chargeSignSize ?? 1.2) === 1.5
                        ? 'Large (1.5x)'
                        : (params.chargeSignSize ?? 1.2) === 2.0
                        ? 'Huge (2.0x)'
                        : 'Medium (1.2x)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    {[
                      { label: 'Small', val: 0.8 },
                      { label: 'Medium', val: 1.2 },
                      { label: 'Large', val: 1.5 },
                      { label: 'Huge', val: 2.0 },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setParams((p) => ({ ...p, chargeSignSize: opt.val }))}
                        className={`flex-1 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                          (params.chargeSignSize ?? 1.2) === opt.val
                            ? 'bg-amber-400 text-slate-950 font-extrabold shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Charge Signs (+ / −) Toggle */}
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <EducationalTooltip id="chargeSigns">
                      <span className="font-semibold text-slate-200 block">Charge Signs (+ / −)</span>
                    </EducationalTooltip>
                    <span className="text-[10px] text-slate-400">Visible on cans, rings & wires</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setParams((p) => ({ ...p, showChargeSigns: !p.showChargeSigns }))}
                    className={`px-3 py-1 rounded-lg font-mono font-bold text-[11px] transition-all cursor-pointer ${
                      params.showChargeSigns
                        ? 'bg-cyan-500 text-slate-950 font-extrabold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {params.showChargeSigns ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Electron Flow Particles Toggle */}
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <EducationalTooltip id="electronFlow">
                      <span className="font-semibold text-slate-200 block">Animated Flow Beads</span>
                    </EducationalTooltip>
                    <span className="text-[10px] text-slate-400">Particles moving in wires</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setParams((p) => ({ ...p, showElectronFlow: !p.showElectronFlow }))}
                    className={`px-3 py-1 rounded-lg font-mono font-bold text-[11px] transition-all cursor-pointer ${
                      params.showElectronFlow
                        ? 'bg-cyan-500 text-slate-950 font-extrabold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {params.showElectronFlow ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: VISUAL COLOR GUIDE */}
            {leftTab === 'guide' && (
              <div className="space-y-2.5 text-[11px] leading-relaxed">
                {/* Kelvin vs Lightning Deep Dive Modal Trigger */}
                <button
                  type="button"
                  onClick={onOpenLightningModal}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-600/30 via-slate-900 to-rose-600/30 hover:from-amber-600/50 hover:to-rose-600/50 border border-amber-500/50 text-amber-300 font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer text-xs"
                >
                  <Zap size={15} className="text-amber-400" />
                  <span>⚡ Kelvin vs. Lightning Mechanism Guide</span>
                </button>

                {/* Water vs Charge Flow Distinction Card */}
                <div className="bg-gradient-to-r from-slate-950 to-blue-950/80 p-3 rounded-xl border border-blue-500/40 space-y-2 shadow-sm">
                  <div className="font-bold text-sky-300 flex items-center justify-between text-xs">
                    <span>Flow Identification Key</span>
                    <span className="text-[10px] font-mono text-sky-300 bg-sky-900/60 px-1.5 py-0.5 rounded border border-sky-500/30">Simplified Colors</span>
                  </div>
                  <div className="space-y-1.5 text-slate-200 text-[10.5px]">
                    <div className="flex items-start gap-1.5">
                      <span className="text-sky-400 font-bold shrink-0">💧 Water Drops (Blue):</span>
                      <span>All falling droplets are natural <strong>BLUE FLUID</strong> falling <em>DOWN</em> into cans.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold shrink-0">⚡ Positive Charge (+):</span>
                      <span>Large <strong>GOLD (+)</strong> energy symbols sliding <em>UP</em> Wire A to Ring B.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-fuchsia-400 font-bold shrink-0">⚡ Negative Charge (−):</span>
                      <span>Large <strong>MAGENTA (−)</strong> energy symbols sliding <em>UP</em> Wire B to Ring A.</span>
                    </div>
                  </div>
                </div>

                {/* Gold / Amber */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-bold font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                    +
                  </div>
                  <div>
                    <strong className="text-amber-300 block">Gold / Amber (+ Positive Charge)</strong>
                    <span className="text-slate-300">
                      Hydronium ions (H₃O⁺). (+) Charge signs accumulate on Can A and travel UP Wire A to Ring B.
                    </span>
                  </div>
                </div>

                {/* Magenta / Purple */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-fuchsia-500/20 border border-fuchsia-400 text-fuchsia-300 font-bold font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                    −
                  </div>
                  <div>
                    <strong className="text-fuchsia-300 block">Magenta / Purple (− Negative Charge)</strong>
                    <span className="text-slate-300">
                      Hydroxide ions (OH⁻) & e⁻. (−) Charge signs accumulate on Can B and travel UP Wire B to Ring A.
                    </span>
                  </div>
                </div>

                {/* Pure Blue Water */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400 text-blue-300 font-bold font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                    💧
                  </div>
                  <div>
                    <strong className="text-sky-300 block">Pure Blue Liquid Water</strong>
                    <span className="text-slate-300">
                      All liquid streams, droplets, and container fluids are translucent blue water.
                    </span>
                  </div>
                </div>

                {/* Spark Breakdown */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-rose-500/20 border border-rose-400 text-rose-300 font-bold font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ⚡
                  </div>
                  <div>
                    <strong className="text-rose-300 block">Spark Gap Breakdown</strong>
                    <span className="text-slate-300">
                      At ~11,000 V, an electric plasma arc snaps across the brass spheres, discharging both cans.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Collapse / Expand Toggle Handle on Right Edge of Left Panel */}
        <button
          type="button"
          onClick={() => setLeftOpen(!leftOpen)}
          className="absolute -right-7 top-1/2 -translate-y-1/2 w-7 h-14 bg-slate-900 border-y border-r border-slate-700/80 rounded-r-xl text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition-colors cursor-pointer"
          title={leftOpen ? 'Collapse Left Controls' : 'Expand Left Controls'}
        >
          {leftOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </aside>

      {/* =================================================== */}
      {/* 2. RIGHT SIDE PANEL (Environment, Spark, Presets)   */}
      {/* =================================================== */}
      <aside
        className={`fixed top-14 bottom-3 z-30 transition-all duration-300 pointer-events-auto flex items-start select-none ${
          rightOpen ? 'right-3 w-80 max-w-[calc(50vw-20px)]' : '-right-80 w-80'
        }`}
      >
        {/* Collapse / Expand Toggle Handle on Left Edge of Right Panel */}
        <button
          type="button"
          onClick={() => setRightOpen(!rightOpen)}
          className="absolute -left-7 top-1/2 -translate-y-1/2 w-7 h-14 bg-slate-900 border-y border-l border-slate-700/80 rounded-l-xl text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition-colors cursor-pointer"
          title={rightOpen ? 'Collapse Right Controls' : 'Expand Right Controls'}
        >
          {rightOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="relative w-full h-full bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden text-slate-100 text-xs">
          {/* Header & Right Tabs */}
          <div className="p-2.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 w-full text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setRightTab('environment')}
                className={`flex-1 py-1 rounded-lg transition-colors cursor-pointer text-center ${
                  rightTab === 'environment'
                    ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Environment
              </button>
              <button
                type="button"
                onClick={() => setRightTab('spark')}
                className={`flex-1 py-1 rounded-lg transition-colors cursor-pointer text-center ${
                  rightTab === 'spark'
                    ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Spark Gap
              </button>
              <button
                type="button"
                onClick={() => setRightTab('presets')}
                className={`flex-1 py-1 rounded-lg transition-colors cursor-pointer text-center ${
                  rightTab === 'presets'
                    ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Lab & Presets
              </button>
            </div>
          </div>

          {/* Right Panel Content Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
            {/* TAB 1: ENVIRONMENT & WIND CONTROLS */}
            {rightTab === 'environment' && (
              <div className="space-y-3">
                {/* Relative Humidity */}
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <EducationalTooltip id="humidity">
                      <span className="font-semibold text-slate-200">Relative Humidity</span>
                    </EducationalTooltip>
                    <span className={`font-mono font-bold ${params.humidity > 75 ? 'text-rose-400' : 'text-sky-300'}`}>
                      {params.humidity}% RH
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="95"
                    step="1"
                    value={params.humidity}
                    onChange={(e) => setParams((p) => ({ ...p, humidity: Number(e.target.value) }))}
                    className="w-full accent-sky-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>10% (Dry spark)</span>
                    <span className={params.humidity > 75 ? 'text-rose-400 font-bold' : ''}>
                      {params.humidity > 75 ? 'Quenched!' : '65% max'}
                    </span>
                    <span>95% (Damp)</span>
                  </div>
                </div>

                {/* Temperature */}
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <EducationalTooltip id="temperature">
                      <span className="font-semibold text-slate-200">Ambient Temp</span>
                    </EducationalTooltip>
                    <span className="font-mono font-bold text-amber-300">
                      {params.temperature}°C
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="45"
                    step="1"
                    value={params.temperature}
                    onChange={(e) => setParams((p) => ({ ...p, temperature: Number(e.target.value) }))}
                    className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-400 font-mono">
                    Surface tension: {state.surfaceTension.toFixed(1)} mN/m
                  </div>
                </div>

                {/* Atmospheric Air Pressure */}
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <EducationalTooltip id="airPressure">
                      <span className="font-semibold text-slate-200">Air Pressure</span>
                    </EducationalTooltip>
                    <span className="font-mono font-bold text-emerald-300">
                      {params.airPressure.toFixed(0)} kPa
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="120"
                    step="1"
                    value={params.airPressure}
                    onChange={(e) => setParams((p) => ({ ...p, airPressure: Number(e.target.value) }))}
                    className="w-full accent-emerald-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-400 font-mono">
                    Air density: {state.airDensity.toFixed(3)} kg/m³
                  </div>
                </div>

                {/* Crosswind Draft */}
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <EducationalTooltip id="windSpeed">
                      <span className="font-semibold text-slate-200">Crosswind Draft</span>
                    </EducationalTooltip>
                    <span className="font-mono font-bold text-cyan-300">
                      {params.windSpeed.toFixed(1)} m/s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="4.5"
                    step="0.2"
                    value={params.windSpeed}
                    onChange={(e) => setParams((p) => ({ ...p, windSpeed: Number(e.target.value) }))}
                    className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Draft direction:</span>
                    <select
                      value={params.windDirection}
                      onChange={(e) => setParams((p) => ({ ...p, windDirection: e.target.value as SimulationParams['windDirection'] }))}
                      className="bg-slate-900 border border-slate-700 text-cyan-300 rounded px-1.5 py-0.5 focus:outline-none"
                    >
                      <option value="left-to-right">Left → Right</option>
                      <option value="right-to-left">Right ← Left</option>
                      <option value="front-to-back">Front ↙ Back</option>
                      <option value="back-to-front">Back ↗ Front</option>
                    </select>
                  </div>
                </div>

                {/* Environmental Factors & Physics Impact Guide */}
                <div className="bg-slate-950/80 p-3 rounded-xl border border-sky-500/40 space-y-1.5 text-[11px] shadow-sm">
                  <div className="font-bold text-sky-300 flex items-center justify-between text-xs">
                    <span>Environmental Impact Guide</span>
                    <span className="text-[10px] font-mono text-sky-300 bg-sky-900/60 px-1.5 py-0.5 rounded border border-sky-500/30">Physics & Chem</span>
                  </div>
                  <div className="space-y-1.5 text-slate-300 text-[10.5px]">
                    <div>
                      <strong className="text-rose-300 block">💧 Humidity & Charge Leakage:</strong>
                      <span>High humidity (&gt;65% RH) creates a moisture film on insulating stands, <strong>exponentially bleeding charge to ground</strong>. This quenches spark buildup!</span>
                    </div>
                    <div>
                      <strong className="text-emerald-300 block">⛰️ Air Pressure (Paschen's Law):</strong>
                      <span>Lower pressure (thin air) allows electrons to accelerate freely, lowering the <strong>spark breakdown voltage threshold</strong>!</span>
                    </div>
                    <div>
                      <strong className="text-cyan-300 block">💨 Crosswind Draft:</strong>
                      <span>Pushes falling drops sideways, causing droplets to miss collector cans and lowering charge efficiency.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SPARK GAP CONTROLS */}
            {rightTab === 'spark' && (
              <div className="space-y-3">
                {/* Spark Gap Distance */}
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <EducationalTooltip id="sparkGapDistance">
                      <span className="font-semibold text-slate-200">Spark Gap Distance</span>
                    </EducationalTooltip>
                    <span className="font-mono font-bold text-indigo-300">
                      {params.sparkGapDistance.toFixed(1)} mm
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setParams((p) => ({ ...p, sparkGapDistance: Math.max(1.0, p.sparkGapDistance - 0.5) }))}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      type="range"
                      min="1.0"
                      max="24.0"
                      step="0.5"
                      value={params.sparkGapDistance}
                      onChange={(e) => setParams((p) => ({ ...p, sparkGapDistance: Number(e.target.value) }))}
                      className="flex-1 accent-indigo-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => setParams((p) => ({ ...p, sparkGapDistance: Math.min(24.0, p.sparkGapDistance + 0.5) }))}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>1 mm (Frequent)</span>
                    <span>24 mm (High kV)</span>
                  </div>
                </div>

                {/* Breakdown Readout */}
                <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1 font-mono">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                    Air Breakdown Threshold
                  </div>
                  <div className="text-2xl font-extrabold text-rose-400">
                    {(state.calculatedBreakdownVoltage / 1000).toFixed(1)} <span className="text-xs text-slate-400 font-normal">kV</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Paschen's law value for {params.airPressure.toFixed(0)} kPa air.
                  </div>
                </div>

                {/* Manual Discharge Button */}
                <button
                  type="button"
                  onClick={onManualDischarge}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-mono font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <Zap size={15} />
                  <span>Trigger Spark Discharge Now</span>
                </button>
              </div>
            )}

            {/* TAB 3: LAB INVESTIGATION & PRESETS */}
            {rightTab === 'presets' && (
              <div className="space-y-3">
                {/* 30-Second Lab Trials Launch Button */}
                <button
                  type="button"
                  onClick={onOpenLabInvestigation}
                  className="w-full py-3 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <FlaskConical size={16} />
                  <span>Open CP Chem Lab Trials (30s)</span>
                </button>

                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider pt-1">
                  Classroom Quick Presets:
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() =>
                      applyPreset({
                        dropletRate: 15,
                        humidity: 28,
                        temperature: 20,
                        airPressure: 101.3,
                        windSpeed: 0,
                        sparkGapDistance: 5.5,
                      })
                    }
                    className="w-full p-2.5 bg-slate-950/70 hover:bg-slate-800 text-left rounded-xl border border-slate-800 transition-colors cursor-pointer"
                  >
                    <strong className="text-emerald-400 block text-xs">1. Optimal Spark Demo</strong>
                    <span className="text-[10px] text-slate-400 block">Dry air, 15 drips/s, clean sparks every 3s</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      applyPreset({
                        dropletRate: 14,
                        humidity: 88,
                        temperature: 26,
                        airPressure: 101.3,
                        windSpeed: 0,
                        sparkGapDistance: 5.5,
                      })
                    }
                    className="w-full p-2.5 bg-slate-950/70 hover:bg-slate-800 text-left rounded-xl border border-slate-800 transition-colors cursor-pointer"
                  >
                    <strong className="text-rose-400 block text-xs">2. Humid Quenched Room</strong>
                    <span className="text-[10px] text-slate-400 block">88% RH creates surface film that bleeds charge</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      applyPreset({
                        dropletRate: 16,
                        humidity: 25,
                        temperature: 15,
                        airPressure: 65.0,
                        windSpeed: 0,
                        sparkGapDistance: 8.0,
                      })
                    }
                    className="w-full p-2.5 bg-slate-950/70 hover:bg-slate-800 text-left rounded-xl border border-slate-800 transition-colors cursor-pointer"
                  >
                    <strong className="text-cyan-300 block text-xs">3. High Altitude Paschen</strong>
                    <span className="text-[10px] text-slate-400 block">65 kPa air allows sparks at much lower voltage</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      applyPreset({
                        dropletRate: 32,
                        humidity: 30,
                        temperature: 22,
                        airPressure: 101.3,
                        windSpeed: 0,
                        sparkGapDistance: 5.5,
                      })
                    }
                    className="w-full p-2.5 bg-slate-950/70 hover:bg-slate-800 text-left rounded-xl border border-slate-800 transition-colors cursor-pointer"
                  >
                    <strong className="text-amber-400 block text-xs">4. Continuous Jet Leakage</strong>
                    <span className="text-[10px] text-slate-400 block">Very fast flow extends unbroken stream through ring</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
