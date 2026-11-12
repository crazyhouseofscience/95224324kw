import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Flame,
  ShieldCheck,
  RotateCcw,
  Sliders,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Layers,
  Activity,
  Move,
  Info,
} from 'lucide-react';
import { ProbeState, ProbeMaterialId, ProbePresetLocation, MATERIAL_DEFINITIONS, PROBE_PRESETS } from '../types/probingLab';
import { SimulationState, SimulationParams } from '../types/simulation';

interface ProbingLabPanelProps {
  probe: ProbeState;
  setProbe: React.Dispatch<React.SetStateAction<ProbeState>>;
  state: SimulationState;
  params: SimulationParams;
  onResetApparatus: () => void;
  onOpenMolecularModal?: () => void;
}

export const ProbingLabPanel: React.FC<ProbingLabPanelProps> = ({
  probe,
  setProbe,
  state,
  params,
  onResetApparatus,
  onOpenMolecularModal,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'materials' | 'properties' | 'experiments'>('materials');

  const activeMat = MATERIAL_DEFINITIONS[probe.materialId];

  const handleSelectMaterial = (id: ProbeMaterialId) => {
    const def = MATERIAL_DEFINITIONS[id];
    setProbe((prev) => ({
      ...prev,
      materialId: id,
      chargeKv: def.defaultChargeKv,
      isGrounded: def.isGroundedByDefault,
      customPermittivity: def.permittivity,
      customConductivitySm: def.conductivitySm,
    }));
  };

  const handleSelectPreset = (preset: ProbePresetLocation) => {
    const p = PROBE_PRESETS[preset];
    setProbe((prev) => ({
      ...prev,
      preset,
      position: [...p.position],
      targetApparatusZone: p.zone,
    }));
  };

  const handleCoordChange = (axis: 0 | 1 | 2, val: number) => {
    setProbe((prev) => {
      const nextPos: [number, number, number] = [...prev.position];
      nextPos[axis] = val;
      return {
        ...prev,
        position: nextPos,
        preset: 'custom',
      };
    });
  };

  return (
    <aside
      className={`fixed top-14 bottom-3 z-30 transition-all duration-300 pointer-events-auto flex items-start select-none ${
        collapsed ? '-left-96 w-96' : 'left-3 w-96 max-w-[calc(50vw-10px)]'
      }`}
    >
      <div className="relative w-full h-full bg-slate-900/98 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden text-slate-100 text-xs">
        {/* Header Ribbon */}
        <div className="p-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/30 to-purple-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-sm">
              <Move size={16} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-xs">Material Interaction Lab</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  Part 2
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Drag Metal, Plastic, Wood & Rubber into the 3D scene
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setProbe((p) => ({ ...p, enabled: !p.enabled }))}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                probe.enabled
                  ? 'bg-cyan-600/30 text-cyan-200 border-cyan-400/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Toggle Material Object Visibility"
            >
              {probe.enabled ? 'Object ON' : 'Object OFF'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="p-2 border-b border-slate-800 bg-slate-950/60 flex items-center gap-1 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('materials')}
            className={`flex-1 py-1 rounded-lg text-center transition-colors cursor-pointer ${
              activeTab === 'materials'
                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Select Material
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('properties')}
            className={`flex-1 py-1 rounded-lg text-center transition-colors cursor-pointer ${
              activeTab === 'properties'
                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. κ & σ Properties
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('experiments')}
            className={`flex-1 py-1 rounded-lg text-center transition-colors cursor-pointer ${
              activeTab === 'experiments'
                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Lab Inquiry
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
          {/* TAB 1: MATERIAL SELECTION & SNAP LOCATIONS */}
          {activeTab === 'materials' && (
            <div className="space-y-3">
              {/* Material Cards */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-200">Physical Material:</span>
                  <span className="font-mono text-[10px] text-cyan-300">{activeMat.name}</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(MATERIAL_DEFINITIONS) as ProbeMaterialId[]).map((id) => {
                    const m = MATERIAL_DEFINITIONS[id];
                    const isSelected = probe.materialId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleSelectMaterial(id)}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col gap-0.5 ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400/80 shadow-sm'
                            : 'bg-slate-950/70 border-slate-800 hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: m.accentColor }}
                          />
                          <span className="text-[9px] font-mono text-slate-400 uppercase">
                            {m.category}
                          </span>
                        </div>
                        <span className="font-bold text-slate-200 text-[11px] leading-tight">
                          {m.name}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">
                          κ = {m.permittivity.toFixed(1)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3D Position Coordinates Sliders Card */}
              <div className="bg-slate-950/90 border border-cyan-500/50 rounded-xl p-3 space-y-2.5 shadow-lg shadow-cyan-950/30">
                <div className="flex items-center justify-between text-[11px] border-b border-cyan-500/30 pb-1">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                    <Sliders size={13} className="text-cyan-400" />
                    <span>3D Position Coordinates</span>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/50">
                    [{probe.position[0].toFixed(2)}, {probe.position[1].toFixed(2)}, {probe.position[2].toFixed(2)}]
                  </span>
                </div>

                {/* X Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-300">
                    <span className="font-semibold text-cyan-400">X (Left / Right):</span>
                    <span className="font-bold text-cyan-200">{probe.position[0].toFixed(2)} m</span>
                  </div>
                  <input
                    type="range"
                    min="-0.85"
                    max="0.85"
                    step="0.01"
                    value={probe.position[0]}
                    onChange={(e) => handleCoordChange(0, Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Y Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-300">
                    <span className="font-semibold text-cyan-400">Y (Height):</span>
                    <span className="font-bold text-cyan-200">{probe.position[1].toFixed(2)} m</span>
                  </div>
                  <input
                    type="range"
                    min="0.15"
                    max="2.15"
                    step="0.01"
                    value={probe.position[1]}
                    onChange={(e) => handleCoordChange(1, Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Z Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-300">
                    <span className="font-semibold text-cyan-400">Z (Front / Back):</span>
                    <span className="font-bold text-cyan-200">{probe.position[2].toFixed(2)} m</span>
                  </div>
                  <input
                    type="range"
                    min="-0.35"
                    max="0.45"
                    step="0.01"
                    value={probe.position[2]}
                    onChange={(e) => handleCoordChange(2, Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Quick Snap Preset Row */}
                <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[9.5px]">
                  <span className="text-slate-400 font-mono">Quick Snap:</span>
                  <div className="flex gap-1 font-mono">
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('spark-gap')}
                      className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                        probe.preset === 'spark-gap'
                          ? 'bg-purple-500/30 text-purple-200 border-purple-400 font-bold'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      Spark Gap
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('stream-left')}
                      className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                        probe.preset === 'stream-left'
                          ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 font-bold'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      Stream A
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('can-left')}
                      className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                        probe.preset === 'can-left'
                          ? 'bg-amber-500/30 text-amber-200 border-amber-400 font-bold'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      Can A
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('parked')}
                      className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                        probe.preset === 'parked'
                          ? 'bg-slate-700 text-white border-slate-500 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      Park
                    </button>
                  </div>
                </div>
              </div>

              {/* LIVE ELECTROSTATIC INFLUENCE & FIELD OBSERVATION CARD */}
              <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-purple-950/60 p-3 rounded-xl border border-cyan-500/50 space-y-2 shadow-lg">
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs border-b border-cyan-500/30 pb-1">
                  <Activity size={14} className="text-cyan-400" />
                  <span>Observed Physical Influence</span>
                </div>
                <div className="text-slate-200 text-[11px] font-semibold leading-relaxed">
                  {probe.activeObservation}
                </div>
                <div className="text-[10px] text-slate-300 leading-snug bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <strong className="text-cyan-300 block mb-0.5">Physical & Chemical Principle:</strong>
                  {probe.scientificExplanation}
                </div>

                {probe.streamDeflectionMm > 0 && (
                  <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-slate-400">
                    <span>Water Stream Curvature:</span>
                    <span className="text-cyan-300 font-bold">~{probe.streamDeflectionMm.toFixed(0)} mm deflection</span>
                  </div>
                )}
              </div>

              {/* MATERIAL ANALYSIS SIMULATED VOLTMETER CARD */}
              <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/40 space-y-2.5 shadow-xl">
                <div className="flex items-center justify-between border-b border-emerald-500/30 pb-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs font-mono">
                    <Zap size={13} className="animate-pulse" />
                    <span>Material Analysis Voltmeter</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Live Telemetry
                  </span>
                </div>

                {/* Simulated Digital Multimeter LCD Display */}
                <div className="bg-slate-900 border border-emerald-500/60 rounded-lg p-2.5 font-mono space-y-1.5 shadow-inner">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Dielectric Constant (κ):</span>
                    <span className="text-emerald-300 font-extrabold text-xs">
                      {(probe.customPermittivity || activeMat.permittivity).toFixed(1)} ε_r
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Local Electric Field (E):</span>
                    <span className="text-cyan-300 font-bold">
                      {probe.targetApparatusZone !== 'none'
                        ? `${(Math.abs(state.potentialDifference) / 1000 * ((probe.customPermittivity || activeMat.permittivity) * 0.35)).toFixed(1)} kV/m`
                        : '0.0 kV/m'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Capacitative Coupling:</span>
                    <span className="text-amber-300 font-bold">
                      {probe.targetApparatusZone !== 'none'
                        ? `${(0.22 * (probe.customPermittivity || activeMat.permittivity)).toFixed(2)} pF`
                        : '0.02 pF'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Zone Proximity:</span>
                    <span className="text-emerald-400 font-bold uppercase text-[9px]">
                      {probe.targetApparatusZone === 'none' ? 'Standby (Parked)' : probe.targetApparatusZone}
                    </span>
                  </div>
                </div>

                {/* Analog Voltmeter Needle Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>0 kV/m</span>
                    <span>Polarization Intensity</span>
                    <span>50+ kV/m</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400 rounded-full transition-all duration-150"
                      style={{
                        width: `${
                          probe.targetApparatusZone !== 'none'
                            ? Math.min(100, Math.max(10, (Math.abs(state.potentialDifference) / 15000) * 100))
                            : 5
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* PROXIMITY FIELD METER CARD (Cool to Hot Gradient) */}
              {(() => {
                const px = probe.position[0];
                const py = probe.position[1];
                const pz = probe.position[2];
                const sparkY = 0.87;

                const distSpark = Math.hypot(px - 0, py - sparkY, pz);
                const distStreamA = Math.hypot(px - (-0.55), py - 1.25, pz);
                const distStreamB = Math.hypot(px - 0.55, py - 1.25, pz);
                const distRingA = Math.hypot(px - (-0.55), py - 1.45, pz);
                const distRingB = Math.hypot(px - 0.55, py - 1.45, pz);

                const minDistance = Math.min(distSpark, distStreamA, distStreamB, distRingA, distRingB);
                const proximityPercent = Math.max(0, Math.min(100, Math.round((1 - Math.min(0.5, minDistance) / 0.5) * 100)));

                let proxColor = '#38bdf8'; // Blue (cool - far)
                let proxStatus = 'Distant (Low Field Perturbation)';
                if (proximityPercent > 80) {
                  proxColor = '#f43f5e'; // Hot Rose (critical)
                  proxStatus = 'Critical Proximity (Severe Perturbation)';
                } else if (proximityPercent > 55) {
                  proxColor = '#f59e0b'; // Amber (high)
                  proxStatus = 'High Proximity (Active Induction)';
                } else if (proximityPercent > 30) {
                  proxColor = '#10b981'; // Green (moderate)
                  proxStatus = 'Moderate Proximity (Polarization)';
                }

                return (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                      <div className="flex items-center gap-1.5 text-slate-200 font-bold text-xs font-mono">
                        <Activity size={13} style={{ color: proxColor }} />
                        <span>Proximity Field Meter</span>
                      </div>
                      <span
                        className="text-[9px] font-mono px-2 py-0.5 rounded font-bold border"
                        style={{ color: proxColor, borderColor: `${proxColor}55`, backgroundColor: `${proxColor}15` }}
                      >
                        {proximityPercent}% Proximity
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>Field Perturbation:</span>
                        <span className="font-bold" style={{ color: proxColor }}>
                          {proxStatus}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                        <div
                          className="h-full rounded-full transition-all duration-200"
                          style={{
                            width: `${Math.max(8, proximityPercent)}%`,
                            backgroundColor: proxColor,
                            boxShadow: `0 0 10px ${proxColor}88`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 2: DIELECTRIC CONSTANT & CONDUCTIVITY TUNING */}
          {activeTab === 'properties' && (
            <div className="space-y-3 text-[11px]">
              {/* Dielectric Constant Slider */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Dielectric Constant (κ / ε_r)</span>
                  <span className="font-mono font-bold text-cyan-300 text-xs">
                    κ = {(probe.customPermittivity || activeMat.permittivity).toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="10.0"
                  step="0.1"
                  value={probe.customPermittivity || activeMat.permittivity}
                  onChange={(e) => setProbe((p) => ({ ...p, customPermittivity: Number(e.target.value) }))}
                  className="w-full h-1.5 bg-slate-800 rounded accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>1.0 (Air)</span>
                  <span>2.5 (Wood)</span>
                  <span>3.2 (Plastic)</span>
                  <span>3.8 (Rubber)</span>
                  <span>10.0 (High)</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Higher dielectric constants cause stronger dipole polarization under electric fields, weakening internal fields and increasing capacitance.
                </p>
              </div>

              {/* Electrical Conductivity Level */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Electrical Conductivity (σ)</span>
                  <span className="font-mono font-bold text-amber-300 text-xs">
                    {activeMat.conductivitySm > 1000
                      ? 'Conductor (~10⁷ S/m)'
                      : activeMat.conductivitySm > 1e-11
                      ? 'Lossy (~10⁻¹⁰ S/m)'
                      : 'Insulator (<10⁻¹⁴ S/m)'}
                  </span>
                </div>

                {/* Ground Wire Toggle for Conductive Metal */}
                {probe.materialId === 'metal-copper' && (
                  <div className="pt-1 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-slate-300">Conductor Earth Ground:</span>
                    <button
                      type="button"
                      onClick={() => setProbe((p) => ({ ...p, isGrounded: !p.isGrounded }))}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                        probe.isGrounded
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {probe.isGrounded ? 'Grounded to Earth (0 V)' : 'Floating (Isolated Island)'}
                    </button>
                  </div>
                )}
              </div>

              {/* Static Triboelectric Charge (for Plastic) */}
              {probe.materialId === 'plastic-pvc' && (
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">Surface Triboelectric Charge</span>
                    <span className={`font-mono font-bold text-xs ${probe.chargeKv > 0 ? 'text-amber-300' : 'text-fuchsia-300'}`}>
                      {probe.chargeKv > 0 ? `+${probe.chargeKv}` : probe.chargeKv} kV
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-15"
                    max="15"
                    step="1"
                    value={probe.chargeKv}
                    onChange={(e) => setProbe((p) => ({ ...p, chargeKv: Number(e.target.value) }))}
                    className="w-full h-1.5 bg-slate-800 rounded accent-purple-400 cursor-pointer"
                  />
                  <div className="text-[10px] text-slate-400">
                    Simulates rubbing plastic with fur or wool to deposit static electrons.
                  </div>
                </div>
              )}


            </div>
          )}

          {/* TAB 3: GUIDED INQUIRY EXPERIMENTS */}
          {activeTab === 'experiments' && (
            <div className="space-y-2.5 text-[11px]">
              <div className="text-slate-300 text-xs">
                Classroom inquiries for testing physical materials on electrostatic fields:
              </div>

              {/* Experiment 1: Dielectric Spark Suppression */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-purple-300 flex items-center justify-between">
                  <span>1. Dielectric Spark Suppression</span>
                  <span className="text-[9px] font-mono bg-purple-900/60 text-purple-200 px-1.5 py-0.5 rounded">Dielectric</span>
                </div>
                <p className="text-slate-300">
                  Place <strong>Plastic</strong> or <strong>Rubber</strong> directly between the spark spheres. Does the spark stop completely?
                </p>
                <div className="flex gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectMaterial('plastic-pvc');
                      handleSelectPreset('spark-gap');
                    }}
                    className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-cyan-200 rounded-lg font-mono text-[10px] transition-colors cursor-pointer"
                  >
                    Insert Plastic Block
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectMaterial('rubber-vulcanized');
                      handleSelectPreset('spark-gap');
                    }}
                    className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-purple-200 rounded-lg font-mono text-[10px] transition-colors cursor-pointer"
                  >
                    Insert Rubber Block
                  </button>
                </div>
              </div>

              {/* Experiment 2: Conductor Spark Gap Bridging */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-amber-300 flex items-center justify-between">
                  <span>2. Conductor Gap Bridging</span>
                  <span className="text-[9px] font-mono bg-amber-900/60 text-amber-200 px-1.5 py-0.5 rounded">Conductor</span>
                </div>
                <p className="text-slate-300">
                  Insert a <strong>Floating Metal</strong> wand between the spark spheres. Why do dual simultaneous sparks jump at half the voltage?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleSelectMaterial('metal-copper');
                    setProbe((p) => ({ ...p, isGrounded: false }));
                    handleSelectPreset('spark-gap');
                  }}
                  className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-amber-200 rounded-lg font-mono text-[10px] transition-colors cursor-pointer"
                >
                  Insert Floating Metal in Gap
                </button>
              </div>

              {/* Experiment 3: Water Stream Bending */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-cyan-300 flex items-center justify-between">
                  <span>3. Water Stream Curving (Coulomb)</span>
                  <span className="text-[9px] font-mono bg-cyan-900/60 text-cyan-200 px-1.5 py-0.5 rounded">Coulomb Force</span>
                </div>
                <p className="text-slate-300">
                  Compare how <strong>Metal</strong> (image charge attraction) vs. <strong>Charged Plastic</strong> (Coulomb force) curves the falling stream.
                </p>
                <div className="flex gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectMaterial('plastic-pvc');
                      handleSelectPreset('stream-left');
                    }}
                    className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-fuchsia-200 rounded-lg font-mono text-[10px] transition-colors cursor-pointer"
                  >
                    Test Plastic on Stream A
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectMaterial('metal-copper');
                      handleSelectPreset('stream-left');
                    }}
                    className="flex-1 py-1 px-2 bg-slate-800 hover:bg-slate-700 text-cyan-200 rounded-lg font-mono text-[10px] transition-colors cursor-pointer"
                  >
                    Test Metal on Stream A
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Credit */}
        <div className="p-2.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>Material Interaction Lab</span>
          <button
            type="button"
            onClick={onResetApparatus}
            className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw size={11} />
            <span>Reset Charges</span>
          </button>
        </div>
      </div>

      {/* Collapse Handle */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-7 top-1/2 -translate-y-1/2 w-7 h-14 bg-slate-900 border-y border-r border-slate-700/80 rounded-r-xl text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition-colors cursor-pointer"
        title={collapsed ? 'Expand Material Controls' : 'Collapse Material Controls'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
};
