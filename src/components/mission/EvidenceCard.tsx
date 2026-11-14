'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  GitCompareArrows,
  XCircle,
} from 'lucide-react';
import {
  cn,
  formatCompactParam,
  formatMeasurementValue,
} from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge';
import { EvidenceRankBadge } from './EvidenceRankBadge';
import type {
  EvidenceClassification,
  EvidenceRecord,
  RankedEvidenceResult,
} from '@/types/flare';

interface EvidenceCardProps {
  result: RankedEvidenceResult;
  rankIndex: number;
  onInspect: (record: EvidenceRecord) => void;
}

const LEFT_ACCENT_MAP: Record<EvidenceClassification, string> = {
  'Approximate condition match': 'border-l-[#059669]',
  'Cross-platform environmental analog': 'border-l-[#0284C7]',
  'Same platform / differing conditions': 'border-l-[#D97706]',
  'Partial evidence': 'border-l-[#7C3AED]',
  'Insufficient evidence': 'border-l-[#DC2626]',
};

export function EvidenceCard({
  result,
  rankIndex,
  onInspect,
}: EvidenceCardProps) {
  const [limitationsExpanded, setLimitationsExpanded] = useState(false);
  const {
    record,
    classification,
    alignedBoundaryCount,
    totalBoundaryCount,
    matchingParameters,
    missingOrDifferingParameters,
  } = result;

  const numericMeasurements = record.measurements.filter(
    (m) => m.value !== null
  );

  return (
    <Card className={cn('border-l-[3px]', LEFT_ACCENT_MAP[classification])}>
      <CardContent className="flex flex-col gap-4">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2 font-mono-telemetry text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-[#FFFFFF] border border-[#E2E8F0] text-[#D97706] font-medium">
                #{rankIndex + 1} · {record.investigationName}
              </span>
              <span className="text-[#0284C7]">{record.investigationId}</span>
              <span className="text-[#64748B]">·</span>
              <span className="text-[#334155]">{record.platform}</span>
              <span className="text-[#64748B]">·</span>
              <span className="text-[#64748B]">
                {record.recordType === 'experimental_observation'
                  ? 'Experimental Observation'
                  : 'Investigation Overview'}
              </span>
            </div>

            <h3 className="font-display text-base font-semibold text-[#0F172A] leading-snug">
              {record.experimentTitle}
            </h3>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
            <EvidenceRankBadge classification={classification} />
            <span
              className="font-mono-telemetry text-[11px] text-[#64748B]"
              title="Count of aligned boundary parameters (±2.5% O₂, ±12.0 kPa, ±5.5 cm/s); not a statistical or scientific confidence score"
            >
              {alignedBoundaryCount} / {totalBoundaryCount} Parameters Aligned (Not Confidence)
            </span>
          </div>
        </div>

        {/* Telemetry Condition Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div className="rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] px-3 py-2">
            <div className="text-[11px] text-[#64748B]">Material</div>
            <div
              className="text-[#0F172A] font-medium truncate mt-0.5"
              title={record.material}
            >
              {record.material}
            </div>
          </div>
          <div className="rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] px-3 py-2">
            <div className="text-[11px] text-[#64748B]">Oxygen</div>
            <div className="font-mono-telemetry text-[#D97706] mt-0.5">
              {formatCompactParam(record.oxygenPercent, '%', record.oxygenRangePct)}
            </div>
          </div>
          <div className="rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] px-3 py-2">
            <div className="text-[11px] text-[#64748B]">Pressure</div>
            <div className="font-mono-telemetry text-[#0284C7] mt-0.5">
              {formatCompactParam(record.pressureKpa, 'kPa', record.pressureRangeKpa)}
            </div>
          </div>
          <div className="rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] px-3 py-2">
            <div className="text-[11px] text-[#64748B]">Forced Flow</div>
            <div className="font-mono-telemetry text-[#0F172A] mt-0.5">
              {formatCompactParam(record.airflowCms, 'cm/s', record.airflowRangeCms)}
            </div>
          </div>
          <div className="rounded-lg bg-[#F8FAFC] border border-[#F1F5F9] px-3 py-2 col-span-2 sm:col-span-1">
            <div className="text-[11px] text-[#64748B]">Gravity</div>
            <div className="font-mono-telemetry text-[#334155] mt-0.5">
              {record.gravityContext}
            </div>
          </div>
        </div>

        {/* Boundary Alignment Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg bg-[#FFFFFF] border border-[#F1F5F9] p-3 flex flex-col gap-1.5">
            <span className="font-mono-telemetry text-[11px] uppercase tracking-wider text-[#059669]">
              Matching Parameters
            </span>
            {matchingParameters.length > 0 ? (
              <ul className="flex flex-col gap-1 text-[#334155]">
                {matchingParameters.map((item) => (
                  <li key={item} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-[#64748B]">None aligned</span>
            )}
          </div>

          <div className="rounded-lg bg-[#FFFFFF] border border-[#F1F5F9] p-3 flex flex-col gap-1.5">
            <span className="font-mono-telemetry text-[11px] uppercase tracking-wider text-[#D97706]">
              Missing or Differing Parameters
            </span>
            {missingOrDifferingParameters.length > 0 ? (
              <ul className="flex flex-col gap-1 text-[#334155]">
                {missingOrDifferingParameters.map((item) => (
                  <li key={item} className="flex items-start gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-[#D97706] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-[#059669]">
                All 5 evaluated parameters fall within documented tolerances.
              </span>
            )}
          </div>
        </div>

        {/* Findings & Documented Measurements */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono-telemetry text-[11px] uppercase tracking-wider text-[#64748B]">
              {record.recordType === 'experimental_observation'
                ? 'Documented observation — review source scope'
                : 'Investigation Overview Summary'}
            </span>
            <ProvenanceBadge
              label={
                classification === 'Cross-platform environmental analog'
                  ? 'Environmental Analog'
                  : record.recordType === 'investigation_overview'
                    ? 'Investigation Overview'
                    : 'Experimental Observation'
              }
            />
          </div>
          <p className="text-sm text-[#0F172A] leading-relaxed">
            {record.findings}
          </p>

          {numericMeasurements.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {numericMeasurements.map((m) => (
                <div
                  key={`${record.id}-${m.key}`}
                  className="px-2.5 py-1 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] font-mono-telemetry text-[11px] text-[#059669]"
                >
                  {m.label}: {formatMeasurementValue(m)}
                </div>
              ))}
            </div>
          ) : (
            <div className="font-mono-telemetry text-[11px] text-[#64748B]">
              Quantitative Spread / LOI Measurements: Not reported
            </div>
          )}
        </div>

        {/* Expandable Limitations & Footer Actions */}
        <div className="border-t border-[#F1F5F9] pt-3 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setLimitationsExpanded((prev) => !prev)}
              aria-expanded={limitationsExpanded}
              className="inline-flex items-center gap-1.5 font-mono-telemetry text-xs text-[#334155] hover:text-[#0F172A] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] rounded"
            >
              <AlertCircle className="w-3.5 h-3.5 text-[#D97706]" />
              <span>
                Limitations &amp; Provenance ({record.evidenceLimitations.length})
              </span>
              {limitationsExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onInspect(record)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] font-mono-telemetry text-[11px] text-[#0F172A] transition-colors cursor-pointer"
              >
                <Eye className="w-3 h-3 text-[#D97706]" />
                Full Record
              </button>

              <Link
                href={`/compare?ids=${encodeURIComponent(record.id)}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] font-mono-telemetry text-[11px] text-[#0F172A] transition-colors"
              >
                <GitCompareArrows className="w-3 h-3 text-[#0284C7]" />
                Compare
              </Link>

              <a
                href={record.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] font-mono-telemetry text-[11px] text-[#0284C7] transition-colors"
              >
                <span>NASA Source</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {limitationsExpanded ? (
            <div className="rounded-lg bg-[#FFFFFF] border border-[#F1F5F9] p-3.5 flex flex-col gap-2 text-xs text-[#334155]">
              <div className="font-mono-telemetry text-[11px] text-[#64748B]">
                Source Document: {record.sourceDocument}
                {record.doi ? ` · DOI: ${record.doi}` : ''}
              </div>
              <ul className="list-disc list-inside flex flex-col gap-1">
                {record.evidenceLimitations.map((lim, i) => (
                  <li key={i}>{lim}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
