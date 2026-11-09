import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Download,
  BookmarkPlus,
  Trash2,
  Maximize2,
  Minimize2,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { DataPoint, SavedRun, SimulationParams, SimulationState } from '../types/simulation';

interface VoltageGraphProps {
  data: DataPoint[];
  state: SimulationState;
  params: SimulationParams;
  savedRuns: SavedRun[];
  onSaveRun: () => void;
  onClearRuns: () => void;
}

type ViewChannel = 'diff' | 'dual' | 'charge';

export const VoltageGraph: React.FC<VoltageGraphProps> = ({
  data,
  state,
  params,
  savedRuns,
  onSaveRun,
  onClearRuns,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewChannel, setViewChannel] = useState<ViewChannel>('diff');
  const [showTheoryOverlay, setShowTheoryOverlay] = useState(true);
  const [timeWindowSec, setTimeWindowSec] = useState<number>(30); // 15, 30, 60, or 0 (all)
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    t: number;
    vDiff: number;
    vA: number;
    vB: number;
    theoryV: number;
  } | null>(null);

  // Export data as CSV
  const handleExportCsv = () => {
    if (data.length === 0) return;
    const header = 'Time (s),Potential Difference (kV),Voltage A (kV),Voltage B (kV),Charge A (nC),Charge B (nC),Spark Discharge,Theoretical V (kV)\n';
    const rows = data
      .map(
        (d) =>
          `${d.t.toFixed(3)},${d.vDiff.toFixed(3)},${d.vA.toFixed(3)},${d.vB.toFixed(3)},${d.qA.toFixed(4)},${d.qB.toFixed(4)},${d.spark ? 1 : 0},${d.theoreticalVDiff.toFixed(3)}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kelvin_water_dropper_data_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Peak voltage and generation rate
  const metrics = useMemo(() => {
    if (data.length === 0) {
      return { maxV: 0, sparkCount: state.sparkCount, avgSparkInterval: 0, growthRate: state.growthRate };
    }
    let maxV = 0;
    const sparkTimes: number[] = [];
    data.forEach((d) => {
      if (Math.abs(d.vDiff) > maxV) maxV = Math.abs(d.vDiff);
      if (d.spark) sparkTimes.push(d.t);
    });

    let avgInterval = 0;
    if (sparkTimes.length > 1) {
      const intervals = [];
      for (let i = 1; i < sparkTimes.length; i++) {
        intervals.push(sparkTimes[i] - sparkTimes[i - 1]);
      }
      avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    return {
      maxV,
      sparkCount: state.sparkCount,
      avgSparkInterval: avgInterval,
      growthRate: state.growthRate,
    };
  }, [data, state.sparkCount, state.growthRate]);

  // High-performance Canvas rendering of traces & overlays
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas sizing with device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Margins
    const padLeft = 52;
    const padRight = 20;
    const padTop = 22;
    const padBottom = 28;
    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;

    if (data.length < 2) {
      // Empty state text
      ctx.fillStyle = '#64748b';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Accumulating charge data... Start droplets to generate potential.', w / 2, h / 2);
      ctx.restore();
      return;
    }

    // Determine time range
    const maxT = data[data.length - 1].t;
    const minT = timeWindowSec > 0 ? Math.max(0, maxT - timeWindowSec) : 0;
    const timeSpan = Math.max(1, maxT - minT);

    // Determine voltage range
    let maxAbsV = 5.0; // default minimum scale 5 kV
    data.forEach((d) => {
      if (d.t >= minT) {
        if (viewChannel === 'charge') {
          maxAbsV = Math.max(maxAbsV, Math.abs(d.qA), Math.abs(d.qB));
        } else {
          maxAbsV = Math.max(maxAbsV, Math.abs(d.vDiff), Math.abs(d.vA), Math.abs(d.vB));
        }
      }
    });
    // Add headroom
    maxAbsV = Math.ceil(maxAbsV * 1.15);
    const minVal = viewChannel === 'diff' ? 0 : -maxAbsV;
    const maxVal = maxAbsV;
    const valRange = maxVal - minVal;

    // Coordinate mapping functions
    const getX = (t: number) => padLeft + ((t - minT) / timeSpan) * plotW;
    const getY = (v: number) => padTop + plotH - ((v - minVal) / valRange) * plotH;

    // Draw Grid Lines & Axes
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();

    // Horizontal grid lines
    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const val = minVal + (valRange / gridSteps) * i;
      const y = getY(val);
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);

      // Y-axis label
      ctx.fillStyle = '#64748b';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const label = viewChannel === 'charge' ? `${val.toFixed(1)} nC` : `${val.toFixed(0)} kV`;
      ctx.fillText(label, padLeft - 6, y);
    }

    // Vertical time grid lines
    const timeSteps = 6;
    for (let i = 0; i <= timeSteps; i++) {
      const t = minT + (timeSpan / timeSteps) * i;
      const x = getX(t);
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, h - padBottom);

      // X-axis label
      ctx.fillStyle = '#64748b';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`${t.toFixed(0)}s`, x, h - padBottom + 6);
    }
    ctx.stroke();

    // Zero-axis line if dual channel
    if (minVal < 0) {
      const zeroY = getY(0);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padLeft, zeroY);
      ctx.lineTo(w - padRight, zeroY);
      ctx.stroke();
    }

    // Breakdown Voltage threshold indicator line (for diff view)
    if (viewChannel === 'diff') {
      const breakdownKv = state.calculatedBreakdownVoltage / 1000;
      if (breakdownKv <= maxVal) {
        const bdY = getY(breakdownKv);
        ctx.strokeStyle = '#ef444488';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padLeft, bdY);
        ctx.lineTo(w - padRight, bdY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#ef4444';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`Breakdown (${breakdownKv.toFixed(1)} kV)`, w - padRight, bdY - 4);
      }
    }

    // 1. DRAW SAVED REFERENCE RUNS (Comparative Data Overlay)
    savedRuns.forEach((run) => {
      ctx.strokeStyle = run.color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      let started = false;

      run.data.forEach((pt) => {
        if (pt.t >= minT && pt.t <= maxT) {
          const x = getX(pt.t);
          const val = viewChannel === 'charge' ? pt.qA : pt.vDiff;
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 2. THEORETICAL EXPONENTIAL FIT OVERLAY
    if (showTheoryOverlay && viewChannel === 'diff') {
      ctx.strokeStyle = '#818cf888';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      let started = false;

      for (let i = 0; i < data.length; i++) {
        const pt = data[i];
        if (pt.t >= minT) {
          const x = getX(pt.t);
          const y = getY(Math.abs(pt.theoreticalVDiff));
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. DRAW PRIMARY LIVE RUN TRACES
    if (viewChannel === 'diff') {
      // Potential Difference curve
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let started = false;

      // Also subtle area fill under curve
      const gradient = ctx.createLinearGradient(0, padTop, 0, h - padBottom);
      gradient.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
      gradient.addColorStop(1, 'rgba(56, 189, 248, 0.0)');

      data.forEach((d) => {
        if (d.t >= minT) {
          const x = getX(d.t);
          const y = getY(Math.abs(d.vDiff));
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();
    } else if (viewChannel === 'dual') {
      // Channel A (Orange/Amber)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      let startedA = false;
      data.forEach((d) => {
        if (d.t >= minT) {
          const x = getX(d.t);
          const y = getY(d.vA);
          if (!startedA) {
            ctx.moveTo(x, y);
            startedA = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();

      // Channel B (Cyan/Sky)
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      let startedB = false;
      data.forEach((d) => {
        if (d.t >= minT) {
          const x = getX(d.t);
          const y = getY(d.vB);
          if (!startedB) {
            ctx.moveTo(x, y);
            startedB = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();
    } else if (viewChannel === 'charge') {
      // Charge A (nC)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      let startedA = false;
      data.forEach((d) => {
        if (d.t >= minT) {
          const x = getX(d.t);
          const y = getY(d.qA);
          if (!startedA) {
            ctx.moveTo(x, y);
            startedA = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();

      // Charge B (nC)
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      let startedB = false;
      data.forEach((d) => {
        if (d.t >= minT) {
          const x = getX(d.t);
          const y = getY(d.qB);
          if (!startedB) {
            ctx.moveTo(x, y);
            startedB = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();
    }

    // 4. DRAW SPARK EVENT MARKERS
    data.forEach((d) => {
      if (d.spark && d.t >= minT) {
        const x = getX(d.t);
        // Vertical indicator line
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, padTop);
        ctx.lineTo(x, h - padBottom);
        ctx.stroke();

        // Spark badge dot
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(x, padTop + 8, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 5. HOVER CROSSHAIR
    if (hoveredPoint) {
      ctx.strokeStyle = '#94a3b888';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(hoveredPoint.x, padTop);
      ctx.lineTo(hoveredPoint.x, h - padBottom);
      ctx.stroke();

      // Point circle
      ctx.setLineDash([]);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(hoveredPoint.x, hoveredPoint.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, [data, viewChannel, showTheoryOverlay, timeWindowSec, savedRuns, state.calculatedBreakdownVoltage, hoveredPoint]);

  // Handle canvas mouse move for tooltips
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const padLeft = 52;
    const padRight = 20;
    const plotW = rect.width - padLeft - padRight;
    if (mouseX < padLeft || mouseX > rect.width - padRight) {
      setHoveredPoint(null);
      return;
    }

    const maxT = data[data.length - 1].t;
    const minT = timeWindowSec > 0 ? Math.max(0, maxT - timeWindowSec) : 0;
    const targetT = minT + ((mouseX - padLeft) / plotW) * (maxT - minT);

    // Find closest data point
    let closest = data[0];
    let minDiff = Infinity;
    for (let i = 0; i < data.length; i++) {
      const diff = Math.abs(data[i].t - targetT);
      if (diff < minDiff) {
        minDiff = diff;
        closest = data[i];
      }
    }

    setHoveredPoint({
      x: mouseX,
      y: mouseY,
      t: closest.t,
      vDiff: closest.vDiff,
      vA: closest.vA,
      vB: closest.vB,
      theoryV: closest.theoreticalVDiff,
    });
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div
      className={`bg-slate-900/90 border border-slate-800 rounded-xl shadow-2xl transition-all duration-300 flex flex-col ${
        isExpanded
          ? 'fixed inset-4 z-50 p-5'
          : 'relative w-full h-[220px] p-3'
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 mb-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-xs tracking-wide uppercase">
            <TrendingUp size={14} />
            <span>Voltage Potential Telemetry</span>
          </div>
          {/* Quick Metrics */}
          <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>
              Peak: <strong className="text-cyan-300">{metrics.maxV.toFixed(1)} kV</strong>
            </span>
            <span>·</span>
            <span>
              Growth Rate λ: <strong className="text-emerald-400">{metrics.growthRate.toFixed(2)} s⁻¹</strong>
            </span>
            <span>·</span>
            <span>
              Sparks: <strong className="text-amber-400">{metrics.sparkCount}</strong>
            </span>
          </div>
        </div>

        {/* Action Buttons & Channel Selectors */}
        <div className="flex items-center gap-2">
          {/* Channel Selector */}
          <div className="flex items-center p-0.5 bg-slate-800/80 rounded-lg text-xs font-mono">
            <button
              type="button"
              onClick={() => setViewChannel('diff')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                viewChannel === 'diff' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ΔV
            </button>
            <button
              type="button"
              onClick={() => setViewChannel('dual')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                viewChannel === 'dual' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              VA / VB
            </button>
            <button
              type="button"
              onClick={() => setViewChannel('charge')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                viewChannel === 'charge' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              QA / QB
            </button>
          </div>

          {/* Time window */}
          <select
            value={timeWindowSec}
            onChange={(e) => setTimeWindowSec(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1 font-mono focus:outline-none"
          >
            <option value={15}>15s Window</option>
            <option value={30}>30s Window</option>
            <option value={60}>60s Window</option>
            <option value={0}>All Time</option>
          </select>

          {/* Theory Overlay Toggle */}
          <button
            type="button"
            onClick={() => setShowTheoryOverlay(!showTheoryOverlay)}
            className={`px-2 py-1 text-xs rounded-md border transition-colors ${
              showTheoryOverlay
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Overlay Theoretical Exponential Curve V(t) = V0 * e^(λt)"
          >
            Theory Overlay
          </button>

          {/* Save Run Benchmark */}
          <button
            type="button"
            onClick={onSaveRun}
            className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 flex items-center gap-1 transition-colors"
            title="Save current run as comparison baseline"
          >
            <BookmarkPlus size={13} />
            <span className="hidden sm:inline">Save Run</span>
          </button>

          {savedRuns.length > 0 && (
            <button
              type="button"
              onClick={onClearRuns}
              className="px-2 py-1 text-xs bg-slate-800 hover:bg-rose-900/50 text-rose-300 rounded-md border border-slate-700 flex items-center gap-1 transition-colors"
              title="Clear saved benchmark runs"
            >
              <Trash2 size={13} />
            </button>
          )}

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition-colors"
            title="Export CSV data"
          >
            <Download size={14} />
          </button>

          {/* Expand/Collapse */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand full graph'}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Comparative Legend & Saved Runs Bar */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400 mb-1 px-1 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-sky-400 rounded-full inline-block" />
          <span className="text-slate-200">Live Trial ({viewChannel === 'diff' ? 'ΔV' : viewChannel})</span>
        </div>

        {showTheoryOverlay && viewChannel === 'diff' && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-indigo-400 inline-block" />
            <span className="text-indigo-300">Theory Model V₀e^(λt)</span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
          <span className="text-rose-400">Spark Breakdown</span>
        </div>

        {savedRuns.map((run, idx) => (
          <div key={run.id} className="flex items-center gap-1.5">
            <span
              className="w-3 h-0.5 border-t border-dashed inline-block"
              style={{ borderColor: run.color }}
            />
            <span style={{ color: run.color }}>{run.name}</span>
          </div>
        ))}
      </div>

      {/* Canvas Plot Stage */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full cursor-crosshair block"
        />

        {/* Hover Crosshair Tooltip */}
        {hoveredPoint && (
          <div
            className="pointer-events-none absolute z-20 bg-slate-900/95 border border-slate-700 rounded-lg p-2 text-[11px] font-mono shadow-xl text-slate-200"
            style={{
              left: Math.min(hoveredPoint.x + 12, (canvasRef.current?.clientWidth || 300) - 160),
              top: Math.max(10, hoveredPoint.y - 45),
            }}
          >
            <div>Time: {hoveredPoint.t.toFixed(2)}s</div>
            <div className="text-cyan-400">ΔV: {hoveredPoint.vDiff.toFixed(2)} kV</div>
            <div className="text-amber-400">VA: {hoveredPoint.vA.toFixed(2)} kV</div>
            <div className="text-cyan-300">VB: {hoveredPoint.vB.toFixed(2)} kV</div>
            {showTheoryOverlay && (
              <div className="text-indigo-300">Theory: {hoveredPoint.theoryV.toFixed(2)} kV</div>
            )}
          </div>
        )}
      </div>

      {/* Detailed comparative summary when expanded */}
      {isExpanded && savedRuns.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
            <div className="text-slate-400 uppercase text-[10px]">Current Live Run</div>
            <div className="text-cyan-400 font-bold text-sm">Peak: {metrics.maxV.toFixed(1)} kV</div>
            <div className="text-slate-400">Rate: {params.dropletRate} drips/s · {params.humidity}% RH</div>
          </div>
          {savedRuns.slice(0, 2).map((run) => (
            <div key={run.id} className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <div className="uppercase text-[10px]" style={{ color: run.color }}>{run.name}</div>
              <div className="font-bold text-sm" style={{ color: run.color }}>Peak: {run.maxVoltage.toFixed(1)} kV</div>
              <div className="text-slate-400">Rate: {run.params.dropletRate} drips/s · {run.params.humidity}% RH</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
