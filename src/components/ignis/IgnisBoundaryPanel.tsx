'use client';

import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  GitCompareArrows,
} from 'lucide-react';
import {
  formatCompactParam,
  formatMeasurementValue,
} from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EvidenceRankBadge } from '@/components/mission/EvidenceRankBadge';
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import type {
  EvidenceRecord,
  RankedEvidenceResult,
  ScenarioParameters,
} from '@/types/flare';

interface IgnisBoundaryPanelProps {
  scenario: ScenarioParameters;
  rankedResults: RankedEvidenceResult[];
  onInspectRecord: (record: EvidenceRecord) => void;
}

export function IgnisBoundaryPanel({
  scenario,
  rankedResults,
  onInspectRecord,
}: IgnisBoundaryPanelProps) {
  const directMatches = rankedResults.filter(
    (r) => r.classification === 'Approximate condition match'
  );
  const analogs = rankedResults.filter(
    (r) =>
      r.classification === 'Cross-platform environmental analog' ||
      r.classification === 'Same platform / differing conditions'
  );
  const topRelevant = rankedResults
    .filter((r) => r.classification !== 'Insufficient evidence')
    .slice(0, 4);

  const isRepresentedDirectly = directMatches.length > 0;
  const gravityCoveredInCorpus = rankedResults.some(
    (r) => r.record.gravityContext === scenario.gravityContext
  );

  const o2Values = rankedResults
    .flatMap((r) => [
      r.record.oxygenPercent,
      ...(r.record.oxygenRangePct ?? []),
    ])
    .filter((v): v is number => v !== null);
  const flowValues = rankedResults
    .flatMap((r) => [
      r.record.airflowCms,
      ...(r.record.airflowRangeCms ?? []),
    ])
    .filter((v): v is number => v !== null);

  const o2Min = o2Values.length > 0 ? Math.min(...o2Values) : null;
  const o2Max = o2Values.length > 0 ? Math.max(...o2Values) : null;
  const flowMin = flowValues.length > 0 ? Math.min(...flowValues) : null;
  const flowMax = flowValues.length > 0 ? Math.max(...flowValues) : null;

  return (
    <div className="flex flex-col gap-5">
      {/* Corpus Coverage & Boundary Audit */}
      <Card>
        <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="font-mono-telemetry text-[11px] text-[#0284C7] block">
              Corpus Representation &amp; Boundary Audit
            </span>
            <CardTitle className="text-base">
              Experimental Coverage Status for Configured Scenario
            </CardTitle>
          </div>

          <CardAction>
            <Badge variant={isRepresentedDirectly ? 'emerald' : 'warning'}>
              {isRepresentedDirectly ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  Approximate Condition Match ({directMatches.length})
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3" />
                  No Approximate Match — Showing Nearest Analogs
                </>
              )}
            </Badge>
          </CardAction>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          <div className="rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] p-3.5 flex flex-col gap-1.5">
            <span className="font-mono-telemetry text-[11px] text-[#64748B]">
              Loaded Corpus Parameter Span
            </span>
            <div className="font-mono-telemetry text-sm font-medium text-[#0F172A]">
              O₂:{' '}
              {o2Min !== null && o2Max !== null
                ? `${o2Min}% – ${o2Max}%`
                : 'Not reported'}
            </div>
            <div className="font-mono-telemetry text-xs text-[#0284C7]">
              Flow:{' '}
              {flowMin !== null && flowMax !== null
                ? `${flowMin} – ${flowMax} cm/s`
                : 'Not reported'}
            </div>
          </div>

          <div className="rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] p-3.5 flex flex-col gap-1.5">
            <span className="font-mono-telemetry text-[11px] text-[#64748B]">
              Gravity Coverage Check
            </span>
            <div className="text-[#0F172A] font-medium text-sm">
              {gravityCoveredInCorpus
                ? `${scenario.gravityContext} documented in ${rankedResults.filter((r) => r.record.gravityContext === scenario.gravityContext).length} records`
                : `No ${scenario.gravityContext} records in loaded corpus`}
            </div>
            <span className="text-[#64748B]">
              Absence in local corpus does not imply NASA never studied this regime.
            </span>
          </div>

          <div className="rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] p-3.5 flex flex-col gap-1.5">
            <span className="font-mono-telemetry text-[11px] text-[#64748B]">
              Missing Data &amp; Limitations
            </span>
            <div className="text-[#334155] leading-relaxed">
              {isRepresentedDirectly
                ? `${directMatches.length} approximate condition match(es) (±2.5% O₂, ±12 kPa, ±5.5 cm/s) and ${analogs.length} related analog(s) retrieved.`
                : `Selected combination (${scenario.oxygenPercent.toFixed(1)}% O₂, ${scenario.airflowCms.toFixed(1)} cm/s, ${scenario.material}, ${scenario.gravityContext}) has 0 simultaneous test-point matches within tolerance.`}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Related NASA Experiments */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-base font-semibold text-[#0F172A]">
            Related &amp; Nearby Documented NASA Experiments
          </h3>
          <ProvenanceBadge
            label={isRepresentedDirectly ? 'Experimental Observation' : 'Environmental Analog'}
          />
        </div>

        {topRelevant.length === 0 ? (
          <EmptyState
            title="No Supporting Record in Currently Loaded Corpus"
            description="None of the loaded NASA records share sufficient conditions with your configured IGNIS parameters. Try switching gravity back to Microgravity or selecting a documented material."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {topRelevant.map((item) => {
              const rec = item.record;
              const numericMetrics = rec.measurements.filter(
                (m) => m.value !== null
              );
              return (
                <Card key={rec.id} className="justify-between">
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono-telemetry text-[11px] text-[#D97706]">
                          {rec.investigationName} · {rec.investigationId}
                        </span>
                        <h4 className="font-display text-sm font-semibold text-[#0F172A]">
                          {rec.experimentTitle}
                        </h4>
                      </div>
                      <EvidenceRankBadge classification={item.classification} />
                    </div>

                    <p className="text-xs text-[#334155] leading-relaxed">
                      {rec.findings}
                    </p>

                    <div className="flex flex-wrap gap-2 font-mono-telemetry text-[11px] text-[#64748B]">
                      <span>
                        O₂: {formatCompactParam(rec.oxygenPercent, '%', rec.oxygenRangePct)}
                      </span>
                      <span>·</span>
                      <span>
                        Flow: {formatCompactParam(rec.airflowCms, 'cm/s', rec.airflowRangeCms)}
                      </span>
                      <span>·</span>
                      <span>{rec.gravityContext}</span>
                    </div>

                    {numericMetrics.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {numericMetrics.map((m) => (
                          <span
                            key={m.key}
                            className="px-2 py-0.5 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] font-mono-telemetry text-[11px] text-[#059669]"
                          >
                            {m.label}: {formatMeasurementValue(m)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="font-mono-telemetry text-[11px] text-[#64748B]">
                        Quantitative spread/LOI metrics: Not reported
                      </span>
                    )}

                    {item.missingOrDifferingParameters.length > 0 ? (
                      <div className="rounded-lg bg-[#FFFFFF] border border-[#F1F5F9] p-2.5 text-[11px] text-[#D97706]">
                        <span className="font-mono-telemetry uppercase text-[10px] block text-[#64748B] mb-0.5">
                          Differing / Missing Conditions
                        </span>
                        {item.missingOrDifferingParameters.join(' | ')}
                      </div>
                    ) : null}
                  </CardContent>

                  <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-t border-[#F1F5F9] bg-[#FFFFFF]/50">
                    <a
                      href={rec.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono-telemetry text-xs text-[#0284C7] hover:text-[#D97706]"
                    >
                      <span>NASA Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/compare?ids=${encodeURIComponent(rec.id)}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] font-mono-telemetry text-[11px] text-[#0F172A]"
                      >
                        <GitCompareArrows className="w-3 h-3 text-[#0284C7]" />
                        Compare
                      </Link>
                      <button
                        type="button"
                        onClick={() => onInspectRecord(rec)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] font-mono-telemetry text-[11px] text-[#0F172A] cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-[#D97706]" />
                        Details
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
