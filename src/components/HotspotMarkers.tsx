import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { X, Sparkles } from 'lucide-react';

export interface Hotspot {
  id: string;
  num: number;
  title: string;
  position: [number, number, number];
  color: 'amber' | 'cyan' | 'blue' | 'rose';
  description: string;
  chemistryConcept: string;
}

export const HOTSPOTS: Hotspot[] = [
  {
    id: 'reservoir',
    num: 1,
    title: 'Top Manifold (Charge Separation)',
    position: [0, 2.42, 0],
    color: 'blue',
    description:
      'Water naturally auto-ionizes: 2H₂O ⇌ H₃O⁺ (+) + OH⁻ (−). The charged rings pull H₃O⁺ ions left and OH⁻ ions right across this pipe before droplets form!',
    chemistryConcept: 'Water Auto-Ionization & Ion Migration in Solution',
  },
  {
    id: 'streamLeft',
    num: 2,
    title: 'Positive Droplets Falling',
    position: [-0.95, 1.82, 0],
    color: 'amber',
    description:
      'Droplets pinch off inside negative Ring A, trapping positive hydronium ions (H₃O⁺). These amber (+) drops fall down into Can A.',
    chemistryConcept: 'Electrostatic Induction Traps Net Positive Charge',
  },
  {
    id: 'ringA',
    num: 3,
    title: 'Left Induction Ring (−)',
    position: [-0.95, 1.45, 0],
    color: 'cyan',
    description:
      'Charged negative (−) by Can B. Its electric field pulls positive ions into the droplets forming inside it!',
    chemistryConcept: 'Negative Inductor Polarizes the Droplet Tip',
  },
  {
    id: 'canA',
    num: 4,
    title: 'Left Collector Can (+)',
    position: [-0.95, 0.45, 0],
    color: 'amber',
    description:
      'Catches the (+) droplets, accumulating thousands of volts. Connected to Wire A, which carries positive charge UP to Ring B.',
    chemistryConcept: 'High-Voltage Capacitance Storage (V = Q / C)',
  },
  {
    id: 'wireA',
    num: 5,
    title: 'Cross-Wire A (Carries + UP)',
    position: [-0.42, 0.95, 0.35],
    color: 'amber',
    description:
      'Carries positive charge (+) UP from Can A to charge Ring B. This creates closed positive feedback!',
    chemistryConcept: 'Positive Feedback Charge Transfer',
  },
  {
    id: 'streamRight',
    num: 6,
    title: 'Negative Droplets Falling',
    position: [0.95, 1.82, 0],
    color: 'cyan',
    description:
      'Droplets pinch off inside positive Ring B, trapping negative hydroxide ions (OH⁻). These blue (−) drops fall down into Can B.',
    chemistryConcept: 'Traps Net Negative Charge on Falling Droplets',
  },
  {
    id: 'ringB',
    num: 7,
    title: 'Right Induction Ring (+)',
    position: [0.95, 1.45, 0],
    color: 'amber',
    description:
      'Charged positive (+) by Can A. Its electric field pulls negative hydroxide ions (OH⁻) into the droplets forming inside it!',
    chemistryConcept: 'Positive Inductor Polarizes Opposite Stream',
  },
  {
    id: 'canB',
    num: 8,
    title: 'Right Collector Can (−)',
    position: [0.95, 0.45, 0],
    color: 'cyan',
    description:
      'Catches the (−) droplets, accumulating negative voltage. Connected to Wire B, which carries negative charge UP to Ring A.',
    chemistryConcept: 'Negative Charge Accumulation',
  },
  {
    id: 'wireB',
    num: 9,
    title: 'Cross-Wire B (Carries − UP)',
    position: [0.42, 0.95, 0.35],
    color: 'cyan',
    description:
      'Carries negative charge (−) UP from Can B to charge Ring A. Both wires carry charges UP to the rings!',
    chemistryConcept: 'Positive Feedback Completes the Circuit',
  },
  {
    id: 'sparkgap',
    num: 10,
    title: 'Spark Gap Discharge Spheres',
    position: [0, 0.72, 0.32],
    color: 'rose',
    description:
      'Left sphere is (+) and right sphere is (−). When voltage exceeds the air breakdown limit (~11,000 V), a loud spark jumps across, neutralizing both sides!',
    chemistryConcept: 'Dielectric Breakdown & Plasma Formation (Paschen’s Law)',
  },
];

export interface ScreenPosition {
  id: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  visible: boolean;
}

interface Hotspot3DTrackerProps {
  showHotspots: boolean;
  onUpdatePositions: (positions: Record<string, ScreenPosition>) => void;
}

const _vec = new THREE.Vector3();

/**
 * Lightweight 3D position projection tracker mounted inside <Canvas>.
 * Projects 3D world coordinates to 2D viewport percentages without creating DOM portal roots.
 */
export const Hotspot3DTracker: React.FC<Hotspot3DTrackerProps> = ({
  showHotspots,
  onUpdatePositions,
}) => {
  const lastUpdateRef = useRef<number>(0);

  useFrame(({ camera }) => {
    if (!showHotspots) return;

    const now = performance.now();
    // Throttle updates to ~30 FPS for DOM position sync
    if (now - lastUpdateRef.current < 30) return;
    lastUpdateRef.current = now;

    const positions: Record<string, ScreenPosition> = {};

    for (let i = 0; i < HOTSPOTS.length; i++) {
      const h = HOTSPOTS[i];
      _vec.set(h.position[0], h.position[1], h.position[2]);
      _vec.project(camera);

      // Check if pin is in front of the camera frustum
      const inFront = _vec.z < 1.0;
      const x = ((_vec.x + 1) * 0.5) * 100;
      const y = ((-_vec.y + 1) * 0.5) * 100;

      positions[h.id] = {
        id: h.id,
        x,
        y,
        visible: inFront && x >= 2 && x <= 98 && y >= 2 && y <= 98,
      };
    }

    onUpdatePositions(positions);
  });

  return null;
};

interface HotspotDOMOverlayProps {
  showHotspots: boolean;
  positions: Record<string, ScreenPosition>;
}

/**
 * Standard React DOM Overlay rendered OUTSIDE <Canvas> in the HTML layer.
 * Completely immune to React 19 Drei <Html> unmount race condition errors.
 */
export const HotspotDOMOverlay: React.FC<HotspotDOMOverlayProps> = ({
  showHotspots,
  positions,
}) => {
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);

  if (!showHotspots) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {HOTSPOTS.map((hotspot) => {
        const pos = positions[hotspot.id];
        if (!pos || !pos.visible) return null;

        const isAmber = hotspot.color === 'amber';
        const isCyan = hotspot.color === 'cyan';
        const isRose = hotspot.color === 'rose';

        const badgeBg = isAmber
          ? 'bg-amber-500 text-slate-950 border-amber-300 hover:bg-amber-400'
          : isCyan
          ? 'bg-cyan-400 text-slate-950 border-cyan-200 hover:bg-cyan-300'
          : isRose
          ? 'bg-rose-500 text-white border-rose-300 hover:bg-rose-400'
          : 'bg-blue-500 text-white border-blue-300 hover:bg-blue-400';

        const isSelected = activeHotspot?.id === hotspot.id;

        return (
          <div
            key={hotspot.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto select-none transition-transform duration-75"
            style={{
              left: `${pos.x.toFixed(2)}%`,
              top: `${pos.y.toFixed(2)}%`,
            }}
          >
            {/* Numbered Pin Badge */}
            <button
              type="button"
              onClick={() => setActiveHotspot(isSelected ? null : hotspot)}
              className={`w-6 h-6 rounded-full font-mono font-bold text-xs flex items-center justify-center border shadow-lg hover:scale-125 active:scale-95 transition-all cursor-pointer ${badgeBg}`}
              title={`Click pin ${hotspot.num} for ${hotspot.title}`}
            >
              {hotspot.num}
            </button>

            {/* Popup Card when clicked */}
            {isSelected && (
              <div className="absolute z-50 left-1/2 -translate-x-1/2 top-8 w-72 bg-slate-900/98 border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl text-left text-xs text-slate-200">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                  <span className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                    <Sparkles size={14} className="text-cyan-400" />
                    <span>
                      {hotspot.num}. {hotspot.title}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveHotspot(null)}
                    className="w-5 h-5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                </div>

                <p className="text-slate-300 leading-relaxed mb-2.5 font-sans">
                  {hotspot.description}
                </p>

                <div className="bg-slate-950/80 p-2 rounded-xl font-mono text-[10px] text-amber-300 border border-slate-800/80">
                  <strong className="text-slate-400 block mb-0.5 text-[9px] uppercase tracking-wider">
                    Chemistry Principle:
                  </strong>
                  {hotspot.chemistryConcept}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
