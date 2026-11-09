import React from 'react';
import { Zap, X, CloudRain, Flame, ArrowRight, ShieldCheck, HelpCircle, Layers } from 'lucide-react';
import { SimulationParams, SimulationState } from '../types/simulation';

interface LightningAnalogyModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: SimulationParams;
  state: SimulationState;
}

export const LightningAnalogyModal: React.FC<LightningAnalogyModalProps> = ({
  isOpen,
  onClose,
  params,
  state,
}) => {
  if (!isOpen) return null;

  const vDiffKv = (Math.abs(state.potentialDifference) / 1000).toFixed(1);
  const bdKv = (state.calculatedBreakdownVoltage / 1000).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-rose-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-md">
              <Zap size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>How Kelvin's Dropper Explains Natural Lightning</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  CP & Honors Chemistry
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Connecting water auto-ionization and charge feedback to thunderstorm dielectric breakdown
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Key Physics Takeaway Banner */}
          <div className="bg-gradient-to-r from-amber-950/50 via-slate-900 to-rose-950/50 p-4 rounded-xl border border-amber-500/40 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <SparkIcon />
              <span>Core Chemistry & Physics Connection</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Both Lord Kelvin's apparatus and natural storm clouds generate high voltage using <strong>falling water drops</strong> without any battery! Water auto-ionizes (<strong className="text-cyan-300">2H₂O ⇌ H₃O⁺ + OH⁻</strong>). When falling drops pass through an electric field, charges separate. Positive feedback accumulates charge until the electric field exceeds air breakdown strength (<strong className="text-rose-400">~3.0 MV/m</strong>), causing air molecules to ionize into plasma—producing a laboratory spark or a cloud-to-ground lightning bolt!
            </p>
          </div>

          {/* 4-Stage Side-by-Side Comparison Grid */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers size={14} className="text-cyan-400" />
              <span>Step-by-Step Mechanism Comparison</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* STAGE 1 */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-cyan-300 text-xs">1. Charge Separation</span>
                  <span className="text-[10px] font-mono text-slate-400">Stage 1</span>
                </div>
                <div className="space-y-1.5">
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <strong className="text-amber-300 block text-[11px]">💧 Kelvin Dropper Lab:</strong>
                    <span className="text-slate-300 text-[11px]">
                      Water auto-ionizes. Charged inductor rings pull H₃O⁺ (+) left and OH⁻ (−) right across the top manifold before drops form.
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <strong className="text-sky-300 block text-[11px]">⛈️ Thunderstorm Cloud:</strong>
                    <span className="text-slate-300 text-[11px]">
                      Updrafts collide rising ice crystals (+) with falling heavy graupel hail (−), separating positive charge to cloud top and negative to cloud base.
                    </span>
                  </div>
                </div>
              </div>

              {/* STAGE 2 */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-amber-300 text-xs">2. Charge Transport & Storage</span>
                  <span className="text-[10px] font-mono text-slate-400">Stage 2</span>
                </div>
                <div className="space-y-1.5">
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <strong className="text-amber-300 block text-[11px]">💧 Kelvin Dropper Lab:</strong>
                    <span className="text-slate-300 text-[11px]">
                      Falling charged drops deposit (+) into Can A and (−) into Can B. Cans act as capacitors storing energy (Q = C · V).
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <strong className="text-sky-300 block text-[11px]">⛈️ Thunderstorm Cloud:</strong>
                    <span className="text-slate-300 text-[11px]">
                      Negative graupel accumulates at cloud base, inducing a positive charge reservoir on the Earth's surface directly beneath.
                    </span>
                  </div>
                </div>
              </div>

              {/* STAGE 3 */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-fuchsia-300 text-xs">3. Exponential Positive Feedback</span>
                  <span className="text-[10px] font-mono text-slate-400">Stage 3</span>
                </div>
                <div className="space-y-1.5">
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <strong className="text-amber-300 block text-[11px]">💧 Kelvin Dropper Lab:</strong>
                    <span className="text-slate-300 text-[11px]">
                      Cross wires connect Can A (+) to Ring B and Can B (−) to Ring A. More charge collected → stronger ring fields → more drop charge! [V(t) = V₀ e^(λt)]
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <strong className="text-sky-300 block text-[11px]">⛈️ Thunderstorm Cloud:</strong>
                    <span className="text-slate-300 text-[11px]">
                      As cloud base charge grows, ground induction intensifies, building potential differences up to 100,000,000 Volts!
                    </span>
                  </div>
                </div>
              </div>

              {/* STAGE 4 */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-rose-300 text-xs">4. Dielectric Breakdown & Arc</span>
                  <span className="text-[10px] font-mono text-slate-400">Stage 4</span>
                </div>
                <div className="space-y-1.5">
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <strong className="text-amber-300 block text-[11px]">💧 Kelvin Dropper Lab:</strong>
                    <span className="text-slate-300 text-[11px]">
                      At ~11 kV across gap, E exceeds 3 MV/m. Air molecules ionize into plasma. A bright miniature spark arc discharges the gap!
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <strong className="text-sky-300 block text-[11px]">⛈️ Thunderstorm Cloud:</strong>
                    <span className="text-slate-300 text-[11px]">
                      Electric field ionizes air into stepped leader plasma channels. Ground return stroke produces a massive lightning bolt (100 kA, 30,000°C)!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Environmental Control Verification Matrix */}
          <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-2 font-mono">
            <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={14} className="text-cyan-400" />
              <span>Environmental Factors & Physics Influences Audit</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <strong className="text-rose-400 block mb-0.5">💧 Humidity (Moisture Film Leakage)</strong>
                <span className="text-slate-300 font-sans">
                  High RH (&gt;65%) coats stands in water vapor → lowers R_leak → <strong>bleeds charge to ground</strong> faster than drops deliver it → quenches spark!
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <strong className="text-emerald-400 block mb-0.5">⛰️ Air Pressure (Paschen's Law)</strong>
                <span className="text-slate-300 font-sans">
                  Lower pressure (thin high-altitude air) → fewer gas molecules → lower electron collision damping → <strong>sparks jump at lower voltage</strong>!
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <strong className="text-cyan-300 block mb-0.5">💨 Crosswind Draft</strong>
                <span className="text-slate-300 font-sans">
                  Pushes falling droplets sideways → drops miss collector cans → reduces collection efficiency η → <strong>slows down charge accumulation</strong>.
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <strong className="text-amber-300 block mb-0.5">💧 Droplet Flow Rate Bell Curve</strong>
                <span className="text-slate-300 font-sans">
                  Optimal flow (14-22 drips/s) yields fast sparks. Very fast flow (&gt;26 drips/s) extends continuous jet → conducts charge back to nozzle!
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs font-mono">
          <div className="text-slate-400 flex items-center gap-2">
            <span>Current ΔV: <strong className="text-cyan-300">{vDiffKv} kV</strong></span>
            <span>/</span>
            <span>Breakdown: <strong className="text-rose-400">{bdKv} kV</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all cursor-pointer"
          >
            Close Science Guide
          </button>
        </div>
      </div>
    </div>
  );
};

const SparkIcon = () => (
  <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L3 14h7v8l10-12h-7V2z" />
  </svg>
);
