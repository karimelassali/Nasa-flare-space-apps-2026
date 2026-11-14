'use client';

import { AlertTriangle, HelpCircle, Layers, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumericParam } from '@/lib/utils';
import type { EvidenceRecord, ScenarioParameters } from '@/types/flare';

interface MaterialScreeningRow {
  label: string;
  recordId: string;
}

const SCREENING_TARGETS: MaterialScreeningRow[] = [
  {
    label: 'SIBAL Cotton-Fiberglass Composite',
    recordId: 'EV-PSI98-01',
  },
  {
    label: 'Structured & Thick Cast PMMA',
    recordId: 'EV-SAFFIRE-V-01',
  },
  {
    label: 'Nomex & Silicone Elastomers',
    recordId: 'EV-PSI99-03',
  },
  {
    label: 'n-Heptane Liquid Fuel Droplets',
    recordId: 'EV-PSI69-01',
  },
  {
    label: 'Gaseous Coflow / Burner Surrogates',
    recordId: 'EV-SLICE-01',
  },
  {
    label: 'Pyrolyzing Polymers (Teflon / Kapton / Pyrell)',
    recordId: 'EV-SAME-01',
  },
];

interface MaterialScreeningMatrixProps {
  scenario: ScenarioParameters;
  recordsById: Map<string, EvidenceRecord>;
  onInspectRecord: (record: EvidenceRecord) => void;
}

export function MaterialScreeningMatrix({
  scenario,
  recordsById,
  onInspectRecord,
}: MaterialScreeningMatrixProps) {
  const isPartialGravity = scenario.gravityContext !== 'Microgravity';
  const maxSolidOxygen = Math.max(...Array.from(recordsById.values())
    .filter((record) => record.recordType === 'experimental_observation' &&
      (record.fuelType === 'Thin Solid Fabric' || record.fuelType === 'Thick Solid Polymer'))
    .map((record) => record.oxygenPercent ?? 0));
  const isHighOxygenGap = scenario.oxygenPercent > maxSolidOxygen;

  return (
    <Card>
      <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="cyan">Material Evidence Overview</Badge>
            <Badge variant="outline" className="font-mono-telemetry">
              {scenario.oxygenPercent.toFixed(1)}% O₂ · {scenario.pressureKpa.toFixed(1)} kPa · {scenario.airflowCms.toFixed(1)} cm/s · {scenario.gravityContext}
            </Badge>
          </div>
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0284C7]" />
            <span>Compare conditions across material records</span>
          </CardTitle>
          <CardDescription>
            Compare your scenario with conditions extracted in this corpus. A nearby test point does not establish material safety or performance at your settings.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {(isPartialGravity || isHighOxygenGap) && (
          <div className="rounded-lg border border-[#F59E0B]/40 bg-[#FFFBEB] px-3.5 py-2.5 text-xs text-[#92400E] flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
            <span>
              <strong>Exploration Boundary Notice:</strong>{' '}
              {isPartialGravity
                ? `No record in the loaded corpus tests ${scenario.gravityContext} gravity. `
                : ''}
              {isHighOxygenGap
                ? `Requested ${scenario.oxygenPercent.toFixed(1)}% O₂ exceeds the highest extracted single-point oxygen condition for solid-fuel observations (${maxSolidOxygen}% O₂). Study ranges do not establish a matching test.`
                : ''}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {SCREENING_TARGETS.map((target) => {
            const rec = recordsById.get(target.recordId);
            if (!rec) return null;

            const o2Delta =
              rec.oxygenPercent !== null
                ? +(scenario.oxygenPercent - rec.oxygenPercent).toFixed(1)
                : null;
            const pDelta =
              rec.pressureKpa !== null
                ? +(scenario.pressureKpa - rec.pressureKpa).toFixed(1)
                : null;
            const flowDelta =
              rec.airflowCms !== null
                ? +(scenario.airflowCms - rec.airflowCms).toFixed(1)
                : null;

            const isClose =
              !isPartialGravity &&
              o2Delta !== null &&
              Math.abs(o2Delta) <= 2.5 &&
              pDelta !== null && Math.abs(pDelta) <= 12.0 &&
              flowDelta !== null && Math.abs(flowDelta) <= 5.5 &&
              rec.recordType === 'experimental_observation';

            return (
              <div
                key={target.recordId}
                className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 flex flex-col justify-between gap-2.5"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-semibold text-[#0F172A] leading-snug">
                      {target.label}
                    </h3>
                    <button
                      type="button"
                      onClick={() => onInspectRecord(rec)}
                      className="font-mono-telemetry text-[10px] text-[#0284C7] hover:underline shrink-0 cursor-pointer"
                    >
                      {rec.id}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {isPartialGravity || isHighOxygenGap ? (
                      <Badge variant="outline" className="text-[10px] text-[#B45309] border-[#F59E0B]/40 bg-[#FFFBEB]">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        No matching test
                      </Badge>
                    ) : isClose ? (
                      <Badge variant="cyan" className="text-[10px]">
                        Approximate conditions
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-[#475569]">
                        <HelpCircle className="w-3 h-3 mr-1" />
                        Conditions differ or unknown
                      </Badge>
                    )}
                  </div>

                  <div className="rounded bg-[#FFFFFF] border border-[#E2E8F0] px-2.5 py-1.5 font-mono-telemetry text-[10px] text-[#334155] space-y-0.5">
                    <div>
                      Source conditions: {formatNumericParam(rec.oxygenPercent, '% O₂', rec.oxygenRangePct)} ·{' '}
                      {formatNumericParam(rec.pressureKpa, 'kPa', rec.pressureRangeKpa)} ·{' '}
                      {formatNumericParam(rec.airflowCms, 'cm/s', rec.airflowRangeCms)}
                    </div>
                    <div className="text-[#64748B]">
                      ΔO₂: {o2Delta !== null ? `${o2Delta >= 0 ? '+' : ''}${o2Delta}%` : 'N/A'} ·{' '}
                      ΔP: {pDelta !== null ? `${pDelta >= 0 ? '+' : ''}${pDelta} kPa` : 'N/A'} ·{' '}
                      ΔFlow: {flowDelta !== null ? `${flowDelta >= 0 ? '+' : ''}${flowDelta} cm/s` : 'N/A'}
                    </div>
                  </div>

                  <p className="text-[11px] text-[#334155] leading-relaxed">
                    {rec.findings}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
