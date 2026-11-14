'use client';

import { Flame, Gauge, Info, RotateCcw, Wind } from 'lucide-react';
import { MATERIAL_OPTIONS } from '@/lib/evidence/repository';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type {
  GravityContext,
  MissionPreset,
  ScenarioParameters,
} from '@/types/flare';

interface EnvironmentControlsProps {
  preset: MissionPreset;
  scenario: ScenarioParameters;
  isModifiedFromPreset: boolean;
  onChange: (next: ScenarioParameters) => void;
  onReset: () => void;
}

const GRAVITY_OPTIONS: Array<{ value: GravityContext; label: string }> = [
  { value: 'Microgravity', label: 'Microgravity (~10⁻⁶ g)' },
  { value: 'Lunar', label: 'Lunar Gravity (0.16 g)' },
  { value: 'Martian', label: 'Martian Gravity (0.38 g)' },
  { value: 'Earth', label: 'Earth Normal Gravity (1.0 g)' },
];

function clamp(val: number, min: number, max: number): number {
  if (Number.isNaN(val)) return min;
  return Math.min(max, Math.max(min, val));
}

export function EnvironmentControls({
  preset,
  scenario,
  isModifiedFromPreset,
  onChange,
  onReset,
}: EnvironmentControlsProps) {
  const updateField = <K extends keyof ScenarioParameters>(
    key: K,
    value: ScenarioParameters[K]
  ) => {
    onChange({
      ...scenario,
      [key]: value,
    });
  };

  return (
    <Card className="h-full justify-between">
      <div>
        <CardHeader className="flex-col gap-3">
          <div className="space-y-1">
            <CardTitle>Atmospheric & Boundary Parameters</CardTitle>
            <CardDescription>
              Adjust oxygen, total pressure, forced ventilation velocity, fuel, and gravity context.
            </CardDescription>
          </div>
          <CardAction className="flex-wrap justify-between w-full">
            <Badge variant={isModifiedFromPreset ? 'default' : 'cyan'}>
              {isModifiedFromPreset
                ? 'Modified Scenario'
                : `Preset · ${preset.title}`}
            </Badge>
            <Button variant="secondary" size="sm" onClick={onReset}>
              <RotateCcw className="w-3.5 h-3.5 text-[#0284C7]" />
              Reset Baseline
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Reference Provenance Strip */}
          <div className="rounded-lg bg-[#FFFFFF] border border-[#F1F5F9] px-3.5 py-2.5 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
            <p className="text-xs text-[#334155] leading-relaxed">
              <span className="font-mono-telemetry text-[11px] font-medium text-[#0F172A] mr-1.5">
                Baseline Note:
              </span>
              {preset.provenanceNote}
            </p>
          </div>

          {/* Numeric Sliders + Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Oxygen */}
            <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 flex flex-col gap-2.5 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="mission-o2-number"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F172A]"
                >
                  <Flame className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                  <span>Oxygen</span>
                </label>
                <span className="font-mono-telemetry text-[10px] text-[#64748B]">
                  O₂ %
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  id="mission-o2-number"
                  type="number"
                  min={10}
                  max={50}
                  step={0.5}
                  value={scenario.oxygenPercent}
                  onChange={(e) =>
                    updateField(
                      'oxygenPercent',
                      clamp(parseFloat(e.target.value), 10, 50)
                    )
                  }
                  className="flex-1 min-w-0 h-8 px-2.5 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-right font-mono-telemetry text-xs text-[#D97706] focus:border-[#D97706] focus:outline-none tabular-nums"
                />
                <span className="font-mono-telemetry text-[11px] text-[#64748B] shrink-0 w-7">
                  %
                </span>
              </div>

              <input
                aria-label="Oxygen concentration slider"
                type="range"
                min={10}
                max={50}
                step={0.5}
                value={scenario.oxygenPercent}
                onChange={(e) =>
                  updateField('oxygenPercent', parseFloat(e.target.value))
                }
                className="flare-slider w-full"
              />

              <div className="flex justify-between font-mono-telemetry text-[10px] text-[#64748B]">
                <span>10%</span>
                <span>21% Air</span>
                <span>34%</span>
                <span>50%</span>
              </div>
            </div>

            {/* Pressure */}
            <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 flex flex-col gap-2.5 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="mission-pressure-number"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F172A]"
                >
                  <Gauge className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                  <span>Pressure</span>
                </label>
                <span className="font-mono-telemetry text-[10px] text-[#64748B]">
                  Total
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  id="mission-pressure-number"
                  type="number"
                  min={20}
                  max={150}
                  step={0.1}
                  value={scenario.pressureKpa}
                  onChange={(e) =>
                    updateField(
                      'pressureKpa',
                      clamp(parseFloat(e.target.value), 20, 150)
                    )
                  }
                  className="flex-1 min-w-0 h-8 px-2.5 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-right font-mono-telemetry text-xs text-[#0369A1] focus:border-[#0369A1] focus:outline-none tabular-nums"
                />
                <span className="font-mono-telemetry text-[11px] text-[#64748B] shrink-0 w-7">
                  kPa
                </span>
              </div>

              <input
                aria-label="Ambient pressure slider"
                type="range"
                min={20}
                max={150}
                step={0.1}
                value={scenario.pressureKpa}
                onChange={(e) =>
                  updateField('pressureKpa', parseFloat(e.target.value))
                }
                className="flare-slider flare-slider-cyan w-full"
              />

              <div className="flex justify-between font-mono-telemetry text-[10px] text-[#64748B]">
                <span>20</span>
                <span>56.5</span>
                <span>101.3</span>
                <span>150</span>
              </div>
            </div>

            {/* Forced Airflow */}
            <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 flex flex-col gap-2.5 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="mission-airflow-number"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F172A]"
                >
                  <Wind className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                  <span>Airflow</span>
                </label>
                <span className="font-mono-telemetry text-[10px] text-[#64748B]">
                  Duct
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  id="mission-airflow-number"
                  type="number"
                  min={0}
                  max={50}
                  step={0.5}
                  value={scenario.airflowCms}
                  onChange={(e) =>
                    updateField(
                      'airflowCms',
                      clamp(parseFloat(e.target.value), 0, 50)
                    )
                  }
                  className="flex-1 min-w-0 h-8 px-2.5 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-right font-mono-telemetry text-xs text-[#059669] focus:border-[#059669] focus:outline-none tabular-nums"
                />
                <span className="font-mono-telemetry text-[11px] text-[#64748B] shrink-0 w-7">
                  cm/s
                </span>
              </div>

              <input
                aria-label="Forced airflow slider"
                type="range"
                min={0}
                max={50}
                step={0.5}
                value={scenario.airflowCms}
                onChange={(e) =>
                  updateField('airflowCms', parseFloat(e.target.value))
                }
                className="flare-slider flare-slider-emerald w-full"
              />

              <div className="flex justify-between font-mono-telemetry text-[10px] text-[#64748B]">
                <span>0 Quiescent</span>
                <span>10–20</span>
                <span>50</span>
              </div>
            </div>
          </div>

          {/* Material & Gravity Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="mission-material-select"
                className="text-xs font-medium text-[#334155]"
              >
                Fuel / Combustible Material
              </label>
              <select
                id="mission-material-select"
                value={scenario.material}
                onChange={(e) => updateField('material', e.target.value)}
                className="h-9 px-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#0F172A] focus:border-[#0284C7] focus:outline-none"
              >
                {MATERIAL_OPTIONS.map((mat) => (
                  <option key={mat} value={mat}>
                    {mat === 'Any' ? 'Any / All Documented NASA Fuels' : mat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="mission-gravity-select"
                className="text-xs font-medium text-[#334155]"
              >
                Gravity Context
              </label>
              <select
                id="mission-gravity-select"
                value={scenario.gravityContext}
                onChange={(e) =>
                  updateField('gravityContext', e.target.value as GravityContext)
                }
                className="h-9 px-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#0F172A] focus:border-[#0284C7] focus:outline-none"
              >
                {GRAVITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
