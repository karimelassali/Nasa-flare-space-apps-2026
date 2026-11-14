'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { AlertTriangle, Camera, Info, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import type { GravityContext } from '@/types/flare';

const Scene = dynamic(() => import('@/components/simulation/ThreeCombustionScene').then(m => m.ThreeCombustionScene), {ssr:false});

interface IgnisVisualizerProps {
  oxygenPercent: number;
  airflowCms: number;
  material: string;
  gravityContext: GravityContext;
}

export function IgnisVisualizer({
  oxygenPercent,
  airflowCms,
  material,
  gravityContext,
}: IgnisVisualizerProps) {
  const [viewMode, setViewMode] = useState<'concept' | 'optical' | '3d'>('3d');

  // Qualitative conceptual geometry only — never presented as a CFD prediction
  const flowRatio = airflowCms / 25;
  const oxygenRatio = (oxygenPercent - 15) / 20;
  const outerRx = Math.round(48 + flowRatio * 34 + oxygenRatio * 14);
  const outerRy =
    gravityContext === 'Microgravity'
      ? Math.round(44 - flowRatio * 10 + oxygenRatio * 10)
      : gravityContext === 'Lunar'
        ? Math.round(52 + oxygenRatio * 12)
        : Math.round(62 + oxygenRatio * 14);

  const plumeOffsetX = Math.round(flowRatio * 36);
  const plumeOffsetY =
    gravityContext === 'Microgravity'
      ? 0
      : gravityContext === 'Lunar'
        ? -14
        : -26;

  const regimeLabel =
    gravityContext !== 'Microgravity'
      ? `${gravityContext} Buoyant Convection Regime (Qualitative)`
      : airflowCms < 1
        ? 'Quiescent Microgravity Spherical Diffusion (Qualitative)'
        : 'Forced-Flow Microgravity Boundary Layer (Qualitative)';

  return (
    <Card className="overflow-hidden">
      {/* Viewport Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-[#FFFFFF] border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-[#0284C7]" />
          <span className="font-mono-telemetry text-[11px] font-medium uppercase tracking-wider text-[#0F172A]">
            IGNIS Conceptual Chamber Schematic
          </span>
        </div>

        <div className="inline-flex bg-[#F8FAFC] p-0.5 rounded-lg border border-[#E2E8F0]">
          <button type="button" onClick={() => setViewMode('3d')} className="px-3 text-xs text-[#0284C7]">3D Chamber</button>
          <button
            type="button"
            onClick={() => setViewMode('concept')}
            className={cn(
              'px-2.5 py-1 rounded-md font-mono-telemetry text-[11px] transition-colors cursor-pointer',
              viewMode === 'concept'
                ? 'bg-[#F1F5F9] text-[#0F172A] font-medium border border-[#E2E8F0]'
                : 'text-[#334155] hover:text-[#0F172A]'
            )}
          >
            Schematic
          </button>
          <button
            type="button"
            onClick={() => setViewMode('optical')}
            className={cn(
              'px-2.5 py-1 rounded-md font-mono-telemetry text-[11px] transition-colors cursor-pointer',
              viewMode === 'optical'
                ? 'bg-[#F1F5F9] text-[#0F172A] font-medium border border-[#E2E8F0]'
                : 'text-[#334155] hover:text-[#0F172A]'
            )}
          >
            Flight Diagnostics
          </button>
        </div>
      </div>

      {/* Mandatory Non-CFD Disclaimer Strip */}
      <div className="px-4 py-2 bg-[#D97706]/8 border-b border-[#D97706]/25 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
        <span className="font-mono-telemetry text-[11px] font-semibold uppercase tracking-wider text-[#D97706]">
          Conceptual Visualization — Not a Validated CFD Simulation.
        </span>
      </div>

      {/* Main Viewport */}
      <div className="relative h-[520px] bg-[#F8FAFC] flex items-center justify-center overflow-hidden select-none">
        {viewMode === '3d' ? <Scene facility={material.includes("Droplet") ? "cir_rack" : "msg_duct"} fuelGeometry={material.includes("Droplet") ? "liquid_droplet" : material.includes("Burner") ? "gaseous_burner" : material.includes("PMMA") ? "polymer_slab" : "fabric_strip"} oxygenPercent={oxygenPercent} pressureKpa={101.3} airflowCms={airflowCms} gravityContext={gravityContext} isRunning={true} simResetNonce={0} cameraPreset="isometric" cameraResetNonce={0} visibility={{flowParticles:true,sensors:true,enclosure:true,grid:true}} /> : viewMode === 'concept' ? (
          <>
            <svg
              viewBox="0 0 600 320"
              role="img"
              aria-label="Conceptual SVG diagram illustrating airflow vectors and qualitative flame envelope under configured oxygen, forced airflow, and gravity parameters. Not a CFD simulation."
              className="w-full h-full"
            >
              <defs>
                <pattern
                  id="ignis-grid"
                  width="24"
                  height="24"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 24 0 L 0 0 0 24"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeOpacity="0.45"
                    strokeWidth="0.6"
                  />
                </pattern>
                <radialGradient id="flame-outer" cx="45%" cy="50%" r="55%">
                  <stop offset="0%" stopColor="#0284C7" stopOpacity="0.82" />
                  <stop offset="48%" stopColor="#D97706" stopOpacity="0.58" />
                  <stop offset="85%" stopColor="#DC2626" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="flame-core" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0F172A" stopOpacity="0.92" />
                  <stop offset="55%" stopColor="#0284C7" stopOpacity="0.68" />
                  <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Coordinate Grid */}
              <rect width="600" height="320" fill="url(#ignis-grid)" />
              <line
                x1="300"
                y1="0"
                x2="300"
                y2="320"
                stroke="#0284C7"
                strokeOpacity="0.18"
                strokeDasharray="4 4"
              />
              <line
                x1="0"
                y1="160"
                x2="600"
                y2="160"
                stroke="#0284C7"
                strokeOpacity="0.18"
                strokeDasharray="4 4"
              />
              <circle
                cx="300"
                cy="160"
                r="76"
                fill="none"
                stroke="#0284C7"
                strokeOpacity="0.15"
                strokeDasharray="3 5"
              />

              {/* Directional Forced Airflow Indicators */}
              {airflowCms > 0 ? (
                <g stroke="#0284C7" strokeOpacity={0.35 + flowRatio * 0.55}>
                  {[95, 160, 225].map((yPos) => {
                    const arrowLen = 36 + flowRatio * 52;
                    return (
                      <g key={yPos}>
                        <line
                          x1="44"
                          y1={yPos}
                          x2={44 + arrowLen}
                          y2={yPos}
                          strokeWidth="1.6"
                        />
                        <polygon
                          points={`${44 + arrowLen + 7},${yPos} ${44 + arrowLen - 2},${yPos - 3.5} ${44 + arrowLen - 2},${yPos + 3.5}`}
                          fill="#0284C7"
                        />
                      </g>
                    );
                  })}
                </g>
              ) : (
                <text
                  x="44"
                  y="112"
                  fill="#64748B"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  ZERO FORCED FLOW (QUIESCENT)
                </text>
              )}

              {/* Gravity Vector Indicator */}
              {gravityContext !== 'Microgravity' ? (
                <g>
                  <line
                    x1="540"
                    y1="210"
                    x2="540"
                    y2="275"
                    stroke="#D97706"
                    strokeWidth="2"
                  />
                  <polygon
                    points="540,282 535,272 545,272"
                    fill="#D97706"
                  />
                  <text
                    x="512"
                    y="200"
                    fill="#D97706"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    g-vector
                  </text>
                </g>
              ) : null}

              {/* Fuel Holder & Sample */}
              <rect
                x="180"
                y="151"
                width="96"
                height="18"
                rx="3"
                fill="#F1F5F9"
                stroke="#CBD5E1"
                strokeWidth="1.5"
              />
              <rect
                x="266"
                y="151"
                width="14"
                height="18"
                rx="2"
                fill="#D97706"
                fillOpacity="0.85"
              />

              {/* Conceptual Flame Envelope */}
              <ellipse
                cx={286 + plumeOffsetX}
                cy={160 + plumeOffsetY}
                rx={outerRx}
                ry={outerRy}
                fill="url(#flame-outer)"
              />
              <ellipse
                cx={280 + Math.round(plumeOffsetX * 0.6)}
                cy={160 + Math.round(plumeOffsetY * 0.55)}
                rx={Math.max(18, Math.round(outerRx * 0.45))}
                ry={Math.max(16, Math.round(outerRy * 0.48))}
                fill="url(#flame-core)"
              />
            </svg>

            {/* Clean Readout HUD */}
            <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
              <span className="px-2.5 py-1 rounded-md bg-[#FFFFFF]/90 border border-[#E2E8F0] font-mono-telemetry text-[11px] text-[#0284C7]">
                u_∞ = {airflowCms.toFixed(1)} cm/s
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#FFFFFF]/90 border border-[#E2E8F0] font-mono-telemetry text-[10px] text-[#334155]">
                {regimeLabel}
              </span>
            </div>

            <div className="absolute top-3 right-3 flex flex-col items-end gap-1 font-mono-telemetry text-[11px] pointer-events-none">
              <span className="px-2 py-0.5 rounded-md bg-[#FFFFFF]/90 border border-[#E2E8F0] text-[#D97706]">
                O₂ = {oxygenPercent.toFixed(1)}%
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#FFFFFF]/90 border border-[#E2E8F0] text-[#0F172A]">
                g ={' '}
                {gravityContext === 'Microgravity'
                  ? '~10⁻⁶ g'
                  : gravityContext === 'Lunar'
                    ? '0.16 g'
                    : '1.0 g'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#FFFFFF]/90 border border-[#E2E8F0] text-[#334155] max-w-[190px] truncate">
                {material}
              </span>
            </div>
          </>
        ) : (
          <div className="p-6 max-w-lg text-center flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] flex items-center justify-center text-[#0284C7]">
              <Camera className="w-5 h-5" />
            </div>
            <span className="font-mono-telemetry text-xs uppercase tracking-wider text-[#0284C7]">
              NASA Flight Diagnostics Reference (MSG / CIR / SAFFIRE)
            </span>
            <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
              In NASA flight hardware (BASS-II in MSG, FLEX/ACME/SoFIE in CIR, and SAFFIRE ducts), combustion behavior is measured using intensified UV/visible CCD imagery, radiometers, fine-wire thermocouples, and O₂/CO₂/pressure transducers—never inferred from unvalidated diagrams.
            </p>
            <span className="font-mono-telemetry text-[11px] text-[#64748B]">
              Inspect individual optical/radiometric findings in the matched evidence cards below.
            </span>
          </div>
        )}
      </div>

      {/* Caption footer */}
      <div className="px-4 py-2.5 bg-[#FFFFFF] border-t border-[#E2E8F0] flex items-start gap-2 text-[11px] text-[#334155]">
        <Info className="w-3.5 h-3.5 text-[#64748B] shrink-0 mt-0.5" />
        <span>
          Qualitative schematic only: does not compute or predict quantitative flame spread speed, soot color, peak temperature, or extinction thresholds.
        </span>
      </div>
    </Card>
  );
}
