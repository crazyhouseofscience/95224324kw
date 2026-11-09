import React, { useState } from 'react';
import { HelpCircle, Sparkles, BookOpen } from 'lucide-react';
import { EducationalTooltipData } from '../types/simulation';

export const TOOLTIP_DICTIONARY: Record<string, EducationalTooltipData> = {
  dropletRate: {
    title: 'Droplet Rate (Flow Speed)',
    concept:
      'Controls how many water drops pinch off per second from each dropper nozzle.',
    impact:
      'Faster dripping delivers charge packets more rapidly into the collection cans, causing voltage to build up much faster.',
    chemistryNote:
      'Water (H₂O) naturally self-ionizes slightly into H⁺ (hydronium) and OH⁻ (hydroxide) ions. As drops pinch off, these ions separate and get trapped on the falling drops.',
  },
  seedVoltage: {
    title: 'Initial Seed Voltage (Asymmetry)',
    concept:
      'A tiny initial electrical charge imbalance between the left and right sides.',
    impact:
      'In a real chemistry classroom, random microscopic chemical impurities, dissolved ions, or static friction provide this seed. A larger seed speeds up startup.',
    chemistryNote:
      'Even pure deionized water absorbs tiny traces of atmospheric CO₂, forming carbonic acid (H₂CO₃ ⇌ H⁺ + HCO₃⁻), providing initial mobile charge carriers.',
  },
  humidity: {
    title: 'Relative Humidity (% RH)',
    concept:
      'The percentage of water vapor moisture present in the surrounding air.',
    impact:
      'HIGH HUMIDITY QUENCHES THE GENERATOR! Moisture condenses into a microscopic liquid film on the insulating support rods, leaking charge away before a spark can form.',
    chemistryNote:
      'Water is a polar molecule with a strong dipole moment. Liquid surface films dissolve dust salts, creating a conductive electrolytic path that drains electrostatic charge.',
  },
  temperature: {
    title: 'Ambient Temperature (°C)',
    concept:
      'Room air and water temperature.',
    impact:
      'Warmer water has lower surface tension, causing drops to pinch off earlier at smaller diameters. Warmer air also slightly reduces dielectric air breakdown strength.',
    chemistryNote:
      'Thermal energy disrupts hydrogen bonding between water molecules, reducing cohesive forces and lowering surface tension σ from 75.6 mN/m (at 5°C) to 68.8 mN/m (at 45°C).',
  },
  airPressure: {
    title: 'Atmospheric Air Pressure (kPa)',
    concept:
      'The pressure exerted by air molecules in the environment (Standard Sea Level = 101.3 kPa).',
    impact:
      'At lower pressure (e.g. high altitude or partial vacuum), air molecules are farther apart. Sparks jump at MUCH LOWER VOLTAGE because electrons accelerate freely with fewer gas collisions (Paschen’s Law).',
    chemistryNote:
      'Governed by the Ideal Gas Law (PV = nRT). Gas density ρ = PM/RT determines how easily an electric field can ionize neutral N₂ and O₂ molecules into a conductive plasma channel.',
  },
  windSpeed: {
    title: 'Crosswind / Air Draft (m/s)',
    concept:
      'Simulates ambient room drafts, open windows, or cooling fan airflow.',
    impact:
      'Crosswinds blow falling water drops sideways! If droplets are blown clear of the collection can rim, charge is lost and fails to accumulate in the can.',
    chemistryNote:
      'Demonstrates fluid dynamics drag forces overcoming droplet inertia, directly reducing collection efficiency and disrupting the positive-feedback charging loop.',
  },
  sparkGapDistance: {
    title: 'Spark Gap Distance (mm)',
    concept:
      'The physical gap between the two brass discharge sphere terminals.',
    impact:
      'A narrow gap (1–3 mm) creates rapid, frequent low-voltage sparks. A wide gap (15–20 mm) allows huge voltage (20+ kV) to build, causing droplets to spray outward before a loud arc snaps!',
    chemistryNote:
      'When electric field E = V / d exceeds ~30,000 V/cm, air molecules ionize into a high-temperature plasma arc, emitting light and an acoustic shockwave (spark crackle).',
  },
  deflection: {
    title: 'Electrostatic Droplet Spray',
    concept:
      'Repulsion between like charges (Coulomb’s Law).',
    impact:
      'As collection cans charge up to 15,000–25,000 Volts, newly arriving droplets carrying the SAME charge are repelled! They slow down and fan outward into a fine mist.',
    chemistryNote:
      'Demonstrates electrostatic repulsion: like charges repel (F ∝ q₁q₂ / r²). Excess charge migrates to the outer surface of conductors and droplet tips.',
  },
  electronFlow: {
    title: 'Electron Drift in Copper Wires',
    concept:
      'The physical migration of delocalized valence electrons through metal conductors.',
    impact:
      'Watch the glowing cyan dots moving along the cross-coupling wires. Negatively charged Can B pushes free electrons along the wire into Ring A, making Ring A strongly negative.',
    chemistryNote:
      'In metallic bonding, copper atoms form a crystalline lattice submerged in a "sea of mobile delocalized electrons". Unlike ions in solution, only negative electrons move through the solid wires.',
  },
  chargeSigns: {
    title: 'Electrostatic Charge Buildup (+ and −)',
    concept:
      'Visual markers showing where positive and negative charges concentrate on the apparatus.',
    impact:
      'As voltage builds, amber (+) signs multiply on Can A and Ring B, while electric cyan (−) signs multiply on Can B and Ring A. During a spark, they flash and rapidly neutralize.',
    chemistryNote:
      '+ represents an electron deficit (or excess hydronium H₃O⁺ cations), while − represents an electron excess (or excess hydroxide OH⁻ anions).',
  },
};

interface TooltipProps {
  id: keyof typeof TOOLTIP_DICTIONARY;
  children: React.ReactNode;
}

export const EducationalTooltip: React.FC<TooltipProps> = ({ id, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const data = TOOLTIP_DICTIONARY[id];

  if (!data) return <>{children}</>;

  return (
    <div className="relative inline-flex items-center group">
      {children}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="ml-1 text-slate-400 hover:text-cyan-400 p-0.5 rounded cursor-pointer transition-colors focus:outline-none"
        title="View chemistry & physics explanation"
        aria-label={`Learn about ${data.title}`}
      >
        <HelpCircle size={13} className="text-slate-400 group-hover:text-cyan-400" />
      </button>

      {/* Floating Tooltip Card */}
      {isOpen && (
        <div
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 sm:w-96 p-3.5 bg-slate-900/98 border border-cyan-500/40 rounded-xl shadow-2xl backdrop-blur-xl text-left text-xs pointer-events-none transition-all"
        >
          {/* Header */}
          <div className="flex items-center gap-1.5 font-bold text-cyan-300 text-xs pb-1.5 border-b border-slate-800">
            <Sparkles size={13} className="text-cyan-400" />
            <span>{data.title}</span>
          </div>

          {/* Core Concept */}
          <div className="mt-2 text-slate-200 leading-snug">
            {data.concept}
          </div>

          {/* Simulation Impact */}
          <div className="mt-2 bg-slate-950/70 p-2 rounded-lg border border-slate-800 text-[11px] text-slate-300">
            <strong className="text-amber-300 block mb-0.5">What to Observe:</strong>
            {data.impact}
          </div>

          {/* Chemistry Connection */}
          {data.chemistryNote && (
            <div className="mt-2 text-[11px] text-cyan-200/90 leading-tight flex items-start gap-1.5 bg-cyan-950/30 p-2 rounded-lg border border-cyan-800/40">
              <BookOpen size={13} className="shrink-0 text-cyan-400 mt-0.5" />
              <div>
                <span className="font-semibold text-cyan-300">Chemistry Connection: </span>
                {data.chemistryNote}
              </div>
            </div>
          )}

          {/* Downward triangle pointer */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
};
