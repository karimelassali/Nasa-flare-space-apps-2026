'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, Flame, HelpCircle, ShieldCheck } from 'lucide-react';
import {
  evaluateStrictSameRowVerdict,
  type SameRowVerdict,
} from '@/lib/matching/condition-verdict';
import { getSolidDatasetSummary } from '@/lib/evidence/solid-dataset';
import type { GravityContext } from '@/types/flare';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface SameRowVerdictPanelProps {
  defaultMaterial?: string;
  defaultOxygen?: number;
  defaultAirflow?: number;
  defaultGravity?: GravityContext;
}

const PRESET_CHECKS = [
  {
    label: 'PMMA · 19% O₂ · 10 cm/s',
    material: 'PMMA Acrylic',
    useO2: true,
    o2: 19.0,
    useFlow: true,
    flow: 10.0,
    usePressure: false,
    pressure: 101.3,
    useThickness: false,
    thickness: 2.0,
    gravity: 'Microgravity' as GravityContext,
  },
  {
    label: 'SIBAL · 17% O₂ · 5 cm/s',
    material: 'SIBAL Fabric',
    useO2: true,
    o2: 17.0,
    useFlow: true,
    flow: 5.0,
    usePressure: false,
    pressure: 101.3,
    useThickness: false,
    thickness: 1.0,
    gravity: 'Microgravity' as GravityContext,
  },
  {
    label: 'Nomex · 21% O₂ (no flow)',
    material: 'Nomex III',
    useO2: true,
    o2: 21.0,
    useFlow: false,
    flow: 10.0,
    usePressure: false,
    pressure: 101.3,
    useThickness: false,
    thickness: 1.0,
    gravity: 'Microgravity' as GravityContext,
  },
  {
    label: 'Nomex · 21% O₂ · 10 cm/s (abstain)',
    material: 'Nomex III',
    useO2: true,
    o2: 21.0,
    useFlow: true,
    flow: 10.0,
    usePressure: false,
    pressure: 101.3,
    useThickness: false,
    thickness: 1.0,
    gravity: 'Microgravity' as GravityContext,
  },
  {
    label: 'PMMA · 19% O₂ · 56.5 kPa (abstain)',
    material: 'PMMA Acrylic',
    useO2: true,
    o2: 19.0,
    useFlow: false,
    flow: 10.0,
    usePressure: true,
    pressure: 56.5,
    useThickness: false,
    thickness: 2.0,
    gravity: 'Microgravity' as GravityContext,
  },
  {
    label: 'Polyurethane Foam (gap)',
    material: 'Polyurethane Foam',
    useO2: true,
    o2: 21.0,
    useFlow: false,
    flow: 10.0,
    usePressure: false,
    pressure: 101.3,
    useThickness: false,
    thickness: 2.0,
    gravity: 'Microgravity' as GravityContext,
  },
];

function verdictStyle(verdict: SameRowVerdict): {
  badgeClass: string;
  panelClass: string;
  Icon: typeof Flame;
} {
  switch (verdict) {
    case 'Burned':
      return {
        badgeClass: 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]',
        panelClass: 'border-[#FCA5A5] bg-[#FEF2F2]/60',
        Icon: Flame,
      };
    case 'Mixed':
      return {
        badgeClass: 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]',
        panelClass: 'border-[#FCD34D] bg-[#FFFBEB]/60',
        Icon: AlertTriangle,
      };
    case 'No Flame':
      return {
        badgeClass: 'bg-[#D1FAE5] text-[#065F46] border-[#6EE7B7]',
        panelClass: 'border-[#6EE7B7] bg-[#ECFDF5]/60',
        Icon: CheckCircle2,
      };
    default:
      return {
        badgeClass: 'bg-[#F1F5F9] text-[#334155] border-[#CBD5E1]',
        panelClass: 'border-[#CBD5E1] bg-[#F8FAFC]',
        Icon: HelpCircle,
      };
  }
}

export function SameRowVerdictPanel({
  defaultMaterial = 'PMMA Acrylic',
  defaultOxygen = 19.0,
  defaultAirflow = 10.0,
  defaultGravity = 'Microgravity',
}: SameRowVerdictPanelProps) {
  const summary = useMemo(() => getSolidDatasetSummary(), []);

  const [material, setMaterial] = useState(defaultMaterial);
  const [gravityContext, setGravityContext] = useState<GravityContext>(defaultGravity);
  const [useO2, setUseO2] = useState(true);
  const [oxygenPercent, setOxygenPercent] = useState(defaultOxygen);
  const [useFlow, setUseFlow] = useState(true);
  const [airflowCms, setAirflowCms] = useState(defaultAirflow);
  const [usePressure, setUsePressure] = useState(false);
  const [pressureKpa, setPressureKpa] = useState(56.5);
  const [useThickness, setUseThickness] = useState(false);
  const [thicknessMm, setThicknessMm] = useState(2.0);

  const result = useMemo(
    () =>
      evaluateStrictSameRowVerdict({
        material,
        gravityContext,
        oxygenPercent: useO2 ? oxygenPercent : null,
        airflowCms: useFlow ? airflowCms : null,
        pressureKpa: usePressure ? pressureKpa : null,
        thicknessMm: useThickness ? thicknessMm : null,
      }),
    [material, gravityContext, useO2, oxygenPercent, useFlow, airflowCms, usePressure, pressureKpa, useThickness, thicknessMm]
  );

  const style = verdictStyle(result.verdict);
  const VerdictIcon = style.Icon;

  return (
    <Card className="border-[#E2E8F0]">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="cyan">Strict Same-Row Condition Verdict</Badge>
          <Badge variant="default">
            {summary.activeRows} Active BASS-II Solid Rows ({summary.reusedExcludedRows} reused excluded)
          </Badge>
        </div>
        <CardTitle className="text-lg">
          Solid Material Condition Checker (Burned / Mixed / No Flame / No Data)
        </CardTitle>
        <CardDescription>
          A NASA test row counts only if that single row in{' '}
          <code className="font-mono-telemetry text-[11px]">NASA/TM-20210011385</code>{' '}
          recorded every parameter you require. Missing columns never fall back to guessing—the checker abstains with <strong className="text-[#0F172A]">No Data</strong> and cites the exact sourced gap.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {/* Preset Quick Checks */}
        <div className="flex flex-col gap-2">
          <span className="font-mono-telemetry text-[11px] uppercase text-[#64748B]">
            Verification Scenarios
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_CHECKS.map((p) => (
              <Button
                key={p.label}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setMaterial(p.material);
                  setGravityContext(p.gravity);
                  setUseO2(p.useO2);
                  setOxygenPercent(p.o2);
                  setUseFlow(p.useFlow);
                  setAirflowCms(p.flow);
                  setUsePressure(p.usePressure);
                  setPressureKpa(p.pressure);
                  setUseThickness(p.useThickness);
                  setThicknessMm(p.thickness);
                }}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Parameter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3 flex flex-col gap-1.5">
            <label htmlFor="verdict-material" className="text-xs font-medium text-[#334155]">
              Solid Material
            </label>
            <select
              id="verdict-material"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="h-9 px-2.5 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] text-xs text-[#0F172A]"
            >
              <option value="PMMA Acrylic">PMMA Acrylic (Table 5.1 · {summary.byMaterial['PMMA Acrylic']} rows)</option>
              <option value="SIBAL Fabric">SIBAL Fabric (Table 7.1 · {summary.byMaterial['SIBAL Fabric']} active rows)</option>
              <option value="Nomex III">Nomex III (Table A.2 · {summary.byMaterial['Nomex III']} rows)</option>
              <option value="Polyurethane Foam">Polyurethane Foam (Untested gap)</option>
              <option value="Kapton Film">Kapton Film (Untested gap)</option>
            </select>
          </div>

          <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3 flex flex-col gap-1.5">
            <label htmlFor="verdict-gravity" className="text-xs font-medium text-[#334155]">
              Gravity Regime
            </label>
            <select
              id="verdict-gravity"
              value={gravityContext}
              onChange={(e) => setGravityContext(e.target.value as GravityContext)}
              className="h-9 px-2.5 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] text-xs text-[#0F172A]"
            >
              <option value="Microgravity">Microgravity (~10⁻⁶ g)</option>
              <option value="Lunar">Lunar (0.16 g)</option>
              <option value="Martian">Martian (0.38 g)</option>
              <option value="Earth">Earth (1.0 g)</option>
            </select>
          </div>

          <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3 flex flex-col gap-1.5">
            <label className="inline-flex items-center justify-between text-xs font-medium text-[#334155]">
              <span>Require Oxygen (% O₂)</span>
              <input
                type="checkbox"
                checked={useO2}
                onChange={(e) => setUseO2(e.target.checked)}
              />
            </label>
            <input
              aria-label="Oxygen Percent"
              type="number"
              step="0.5"
              min="10"
              max="100"
              disabled={!useO2}
              value={oxygenPercent}
              onChange={(e) => setOxygenPercent(Number(e.target.value) || 21)}
              className="h-9 px-2.5 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] text-xs font-mono-telemetry text-[#0F172A] disabled:opacity-50"
            />
          </div>

          <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3 flex flex-col gap-1.5">
            <label className="inline-flex items-center justify-between text-xs font-medium text-[#334155]">
              <span>Require Airflow (cm/s)</span>
              <input
                type="checkbox"
                checked={useFlow}
                onChange={(e) => setUseFlow(e.target.checked)}
              />
            </label>
            <input
              aria-label="Airflow cm/s"
              type="number"
              step="1"
              min="0"
              max="100"
              disabled={!useFlow}
              value={airflowCms}
              onChange={(e) => setAirflowCms(Number(e.target.value) || 0)}
              className="h-9 px-2.5 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] text-xs font-mono-telemetry text-[#0F172A] disabled:opacity-50"
            />
          </div>

          <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3 flex flex-col gap-1.5">
            <label className="inline-flex items-center justify-between text-xs font-medium text-[#334155]">
              <span>Require Pressure (kPa)</span>
              <input
                type="checkbox"
                checked={usePressure}
                onChange={(e) => setUsePressure(e.target.checked)}
              />
            </label>
            <input
              aria-label="Pressure kPa"
              type="number"
              step="1"
              min="10"
              max="300"
              disabled={!usePressure}
              value={pressureKpa}
              onChange={(e) => setPressureKpa(Number(e.target.value) || 101.3)}
              className="h-9 px-2.5 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] text-xs font-mono-telemetry text-[#0F172A] disabled:opacity-50"
            />
          </div>

          <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3 flex flex-col gap-1.5">
            <label className="inline-flex items-center justify-between text-xs font-medium text-[#334155]">
              <span>Require Thickness (mm)</span>
              <input
                type="checkbox"
                checked={useThickness}
                onChange={(e) => setUseThickness(e.target.checked)}
              />
            </label>
            <input
              aria-label="Thickness mm"
              type="number"
              step="0.5"
              min="0.5"
              max="20"
              disabled={!useThickness}
              value={thicknessMm}
              onChange={(e) => setThicknessMm(Number(e.target.value) || 2.0)}
              className="h-9 px-2.5 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] text-xs font-mono-telemetry text-[#0F172A] disabled:opacity-50"
            />
          </div>
        </div>

        {/* Verdict Output Box */}
        <div className={cn('rounded-xl border p-4 sm:p-5 flex flex-col gap-4', style.panelClass)}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                data-testid="same-row-verdict-badge"
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono-telemetry text-sm font-semibold',
                  style.badgeClass
                )}
              >
                <VerdictIcon className="w-4 h-4" />
                {result.verdict}
              </span>
              <span className="font-mono-telemetry text-xs text-[#475569]">
                Confidence:{' '}
                <strong className="text-[#0F172A]">
                  {result.confidence === 'supported'
                    ? 'Supported (≥5 rows)'
                    : result.confidence === 'extrapolated'
                      ? 'Extrapolated (1–4 rows)'
                      : 'No Data (0 rows)'}
                </strong>
              </span>
            </div>

            <div className="font-mono-telemetry text-[11px] text-[#475569]">
              Eligible same-row tests: {result.eligibleRowCount} / {result.materialRowCount}
            </div>
          </div>

          <p className="text-sm text-[#0F172A] font-medium">{result.summary}</p>

          {/* Sourced Gaps */}
          {result.sourcedGaps.length > 0 ? (
            <div className="rounded-lg bg-[#FFFFFF] border border-[#FDE68A] p-3.5 flex flex-col gap-2">
              <div className="font-mono-telemetry text-[11px] uppercase text-[#92400E] font-semibold">
                Sourced Evidence Gaps (Why Same-Row Matching Abstained)
              </div>
              <ul className="flex flex-col gap-2 text-xs text-[#334155]">
                {result.sourcedGaps.map((gap) => (
                  <li key={gap.parameter} className="flex flex-col gap-0.5">
                    <span>
                      <strong className="text-[#0F172A]">{gap.parameter}:</strong> {gap.reason}
                    </span>
                    <a
                      href={gap.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#0284C7] hover:underline font-mono-telemetry text-[11px] w-fit"
                    >
                      Source: {gap.sourceRef}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Matched NASA Rows */}
          {result.matchedRows.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-[#E2E8F0] bg-[#FFFFFF]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] font-mono-telemetry text-[11px] text-[#475569]">
                    <th className="py-2 px-3">Test</th>
                    <th className="py-2 px-3">Source Table</th>
                    <th className="py-2 px-3">O₂ (%)</th>
                    <th className="py-2 px-3">Airflow (cm/s)</th>
                    <th className="py-2 px-3">Thickness</th>
                    <th className="py-2 px-3">Outcome &amp; Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {result.matchedRows.map((row) => (
                    <tr key={row.id}>
                      <td className="py-2 px-3 font-mono-telemetry font-medium text-[#0F172A] whitespace-nowrap">
                        {row.testCode}
                        <div className="text-[10px] text-[#64748B]">row {row.sourceRow}</div>
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <a
                          href={row.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0284C7] hover:underline font-mono-telemetry text-[11px]"
                        >
                          {row.tableRef} ({row.printedPage})
                        </a>
                      </td>
                      <td className="py-2 px-3 font-mono-telemetry whitespace-nowrap">
                        {row.oxygenInitialPct !== null
                          ? row.oxygenFinalPct !== null
                            ? `${row.oxygenInitialPct}→${row.oxygenFinalPct}%`
                            : `${row.oxygenInitialPct}%`
                          : 'Not reported'}
                      </td>
                      <td className="py-2 px-3 font-mono-telemetry whitespace-nowrap">
                        {row.airflowRangeCms
                          ? row.airflowRangeCms[0] === row.airflowRangeCms[1]
                            ? `${row.airflowRangeCms[0]} cm/s`
                            : `${row.airflowRangeCms[0]}–${row.airflowRangeCms[1]} cm/s`
                          : 'Not reported'}
                      </td>
                      <td className="py-2 px-3 font-mono-telemetry whitespace-nowrap">
                        {row.thicknessMm !== null ? `${row.thicknessMm} mm` : 'Not reported'}
                      </td>
                      <td className="py-2 px-3 text-[#334155]">
                        <span className="font-semibold text-[#0F172A]">{row.outcome}</span>
                        {row.spreadRateMmS ? (
                          <span className="font-mono-telemetry text-[11px] text-[#0284C7] ml-2">
                            spread: {row.spreadRateMmS.join('; ')} mm/s
                          </span>
                        ) : null}
                        {row.burnDurationMin !== null ? (
                          <span className="font-mono-telemetry text-[11px] text-[#64748B] ml-2">
                            ({row.burnDurationMin} min)
                          </span>
                        ) : null}
                        {row.rawComment ? (
                          <div className="text-[11px] text-[#64748B] mt-0.5">{row.rawComment}</div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="flex items-start gap-2 text-[11px] text-[#475569]">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#0284C7]" />
            <span>{result.caveats.join(' ')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
