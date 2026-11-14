'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Box, RotateCcw } from 'lucide-react';
import {
  MATERIAL_OPTIONS,
  getAllEvidenceRecords,
} from '@/lib/evidence/repository';
import { rankEvidenceCorpus } from '@/lib/ranking/ranker';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IgnisVisualizer } from '@/components/ignis/IgnisVisualizer';
import { IgnisBoundaryPanel } from '@/components/ignis/IgnisBoundaryPanel';
import { FireSafetyQuiz } from '@/components/ignis/FireSafetyQuiz';
import { ExperimentDetailsDrawer } from '@/components/knowledge/ExperimentDetailsDrawer';
import type {
  EvidenceRecord,
  GravityContext,
  ScenarioParameters,
} from '@/types/flare';

const IGNIS_GRAVITY_OPTIONS: Array<{
  value: GravityContext;
  label: string;
  sublabel: string;
}> = [
  { value: 'Microgravity', label: 'Microgravity', sublabel: '~10⁻⁶ g' },
  { value: 'Lunar', label: 'Lunar', sublabel: '0.16 g' },
  { value: 'Earth', label: 'Earth', sublabel: '1.0 g' },
];

export default function IgnisLabPage() {
  const allRecords = useMemo(() => getAllEvidenceRecords(), []);
  const recordsById = useMemo(
    () => new Map(allRecords.map((r) => [r.id, r])),
    [allRecords]
  );

  const [oxygenPercent, setOxygenPercent] = useState(21.0);
  const [airflowCms, setAirflowCms] = useState(10.0);
  const [material, setMaterial] = useState(
    'Cast PMMA (Polymethyl Methacrylate)'
  );
  const [gravityContext, setGravityContext] =
    useState<GravityContext>('Microgravity');
  const [inspectedRecord, setInspectedRecord] =
    useState<EvidenceRecord | null>(null);

  const scenario: ScenarioParameters = useMemo(
    () => ({
      missionId: 'custom',
      oxygenPercent,
      pressureKpa: 101.3,
      airflowCms,
      material,
      gravityContext,
    }),
    [oxygenPercent, airflowCms, material, gravityContext]
  );

  const rankedResults = useMemo(
    () =>
      rankEvidenceCorpus(
        allRecords,
        scenario,
        `Combustion behavior of ${material} at ${oxygenPercent}% O2 and ${airflowCms} cm/s in ${gravityContext}`
      ),
    [allRecords, scenario, material, oxygenPercent, airflowCms, gravityContext]
  );

  const directCount = rankedResults.filter(
    (r) => r.classification === 'Approximate condition match'
  ).length;

  const resetIgnis = () => {
    setOxygenPercent(21.0);
    setAirflowCms(10.0);
    setMaterial('Cast PMMA (Polymethyl Methacrylate)');
    setGravityContext('Microgravity');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Link to 3D Lab */}
      <Card className="p-5 sm:p-6 gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <Badge variant="default">Qualitative Combustion Regime Lab</Badge>
            </div>
            <h2 className="font-display text-2xl font-semibold text-[#0F172A]">
              IGNIS Scenario Lab
            </h2>
            <p className="text-sm text-[#334155] leading-relaxed">
              Vary oxygen fraction, forced flow velocity, combustible fuel, and gravitational acceleration to inspect buoyancy vs. forced-convection boundary conditions against source-linked NASA PSI and NTRS experiments.
            </p>
          </div>

          <Link
            href="/simulation"
            className="inline-flex items-center gap-2 px-3.5 h-9 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] text-xs font-medium text-[#0284C7] shrink-0 transition-colors"
          >
            <Box className="w-4 h-4" />
            <span>Launch Three.js 3D Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Live Telemetry Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#F1F5F9]">
          <div className="rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] px-3 py-2">
            <div className="text-[11px] text-[#64748B]">Oxygen Fraction</div>
            <div className="font-mono-telemetry text-base font-semibold text-[#D97706]">
              {oxygenPercent.toFixed(1)}% O₂
            </div>
          </div>
          <div className="rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] px-3 py-2">
            <div className="text-[11px] text-[#64748B]">Forced Flow Velocity</div>
            <div className="font-mono-telemetry text-base font-semibold text-[#0284C7]">
              {airflowCms.toFixed(1)} cm/s
            </div>
          </div>
          <div className="rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] px-3 py-2">
            <div className="text-[11px] text-[#64748B]">Gravity Regime</div>
            <div className="font-mono-telemetry text-base font-semibold text-[#0F172A]">
              {gravityContext}
            </div>
          </div>
          <div className="rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] px-3 py-2">
            <div className="text-[11px] text-[#64748B]">Approximate NASA Matches</div>
            <div className="font-mono-telemetry text-base font-semibold text-[#059669]">
              {directCount} record{directCount === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      </Card>

      {/* Main 12-Col Laboratory Workbench */}
      <div data-tour="ignis-controls" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <Card className="lg:col-span-5">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Boundary Controls</CardTitle>
              <CardDescription>Qualitative regime parameters</CardDescription>
            </div>
            <CardAction>
              <Button variant="secondary" size="sm" onClick={resetIgnis}>
                <RotateCcw className="w-3.5 h-3.5 text-[#0284C7]" />
                Reset
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {/* Oxygen 15-35% */}
            <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="ignis-o2-range"
                  className="text-xs font-medium text-[#334155]"
                >
                  Oxygen Concentration
                </label>
                <span className="font-mono-telemetry text-sm font-semibold text-[#D97706]">
                  {oxygenPercent.toFixed(1)}% O₂
                </span>
              </div>
              <input
                id="ignis-o2-range"
                type="range"
                min={15}
                max={35}
                step={0.5}
                value={oxygenPercent}
                onChange={(e) => setOxygenPercent(parseFloat(e.target.value))}
                className="flare-slider w-full"
              />
              <div className="flex justify-between font-mono-telemetry text-[10px] text-[#64748B]">
                <span>15% Hypoxic</span>
                <span>21% Air</span>
                <span>35% Enriched</span>
              </div>
            </div>

            {/* Airflow 0-25 cm/s */}
            <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="ignis-flow-range"
                  className="text-xs font-medium text-[#334155]"
                >
                  Forced Airflow Velocity
                </label>
                <span className="font-mono-telemetry text-sm font-semibold text-[#0284C7]">
                  {airflowCms.toFixed(1)} cm/s
                </span>
              </div>
              <input
                id="ignis-flow-range"
                type="range"
                min={0}
                max={25}
                step={0.5}
                value={airflowCms}
                onChange={(e) => setAirflowCms(parseFloat(e.target.value))}
                className="flare-slider flare-slider-cyan w-full"
              />
              <div className="flex justify-between font-mono-telemetry text-[10px] text-[#64748B]">
                <span>0 (Quiescent)</span>
                <span>12.5 cm/s</span>
                <span>25.0 cm/s</span>
              </div>
            </div>

            {/* Material */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="ignis-material-select"
                className="text-xs font-medium text-[#334155]"
              >
                Fuel / Material Selection
              </label>
              <select
                id="ignis-material-select"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="h-9 px-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#0F172A] focus:border-[#0284C7] focus:outline-none"
              >
                {MATERIAL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === 'Any' ? 'Any Documented Fuel' : opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Gravity Segmented Control */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[#334155]">
                Gravity Context
              </span>
              <div className="grid grid-cols-3 gap-2">
                {IGNIS_GRAVITY_OPTIONS.map((opt) => {
                  const active = gravityContext === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setGravityContext(opt.value)}
                      aria-pressed={active}
                      className={cn(
                        'py-2 px-2 rounded-lg border text-center transition-colors flex flex-col items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7]',
                        active
                          ? 'bg-[#D97706] border-[#D97706] text-[#F8FAFC] font-semibold'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#334155] hover:border-[#CBD5E1] hover:text-[#0F172A]'
                      )}
                    >
                      <span className="text-xs font-display">{opt.label}</span>
                      <span className="font-mono-telemetry text-[10px] opacity-80">
                        {opt.sublabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <div data-tour="ignis-visual" className="lg:col-span-7">
          <IgnisVisualizer
            oxygenPercent={oxygenPercent}
            airflowCms={airflowCms}
            material={material}
            gravityContext={gravityContext}
          />
        </div>
      </div>

      {/* Below Visualizer: Evidence Matching & Boundary Status */}
      <IgnisBoundaryPanel
        scenario={scenario}
        rankedResults={rankedResults}
        onInspectRecord={(rec) => setInspectedRecord(rec)}
      />

      <div data-tour="ignis-quiz">
        <FireSafetyQuiz
          recordsById={recordsById}
          onInspectRecord={(rec) => setInspectedRecord(rec)}
        />
      </div>

      <ExperimentDetailsDrawer
        record={inspectedRecord}
        onClose={() => setInspectedRecord(null)}
      />
    </div>
  );
}
