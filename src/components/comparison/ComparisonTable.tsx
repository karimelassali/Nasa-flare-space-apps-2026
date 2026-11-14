'use client';

import { ExternalLink } from 'lucide-react';
import {
  formatMeasurementValue,
  formatNumericParam,
} from '@/lib/utils';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { EvidenceRecord } from '@/types/flare';

interface ComparisonTableProps {
  recordA: EvidenceRecord;
  recordB: EvidenceRecord;
}

export function ComparisonTable({ recordA, recordB }: ComparisonTableProps) {
  const rows: Array<{
    label: string;
    valA: React.ReactNode;
    valB: React.ReactNode;
    mono?: boolean;
  }> = [
    {
      label: 'Investigation & ID',
      valA: `${recordA.investigationName} (${recordA.investigationId})`,
      valB: `${recordB.investigationName} (${recordB.investigationId})`,
      mono: true,
    },
    {
      label: 'Record Type',
      valA:
        recordA.recordType === 'experimental_observation'
          ? 'Experimental Observation'
          : 'Investigation Overview',
      valB:
        recordB.recordType === 'experimental_observation'
          ? 'Experimental Observation'
          : 'Investigation Overview',
    },
    {
      label: 'Platform & Facility',
      valA: `${recordA.platform} · ${recordA.facility}`,
      valB: `${recordB.platform} · ${recordB.facility}`,
    },
    {
      label: 'Test Material & Fuel Type',
      valA: `${recordA.material} (${recordA.fuelType})`,
      valB: `${recordB.material} (${recordB.fuelType})`,
    },
    {
      label: 'Oxygen Concentration',
      valA: formatNumericParam(
        recordA.oxygenPercent,
        '% O₂',
        recordA.oxygenRangePct
      ),
      valB: formatNumericParam(
        recordB.oxygenPercent,
        '% O₂',
        recordB.oxygenRangePct
      ),
      mono: true,
    },
    {
      label: 'Ambient Pressure',
      valA: formatNumericParam(
        recordA.pressureKpa,
        'kPa',
        recordA.pressureRangeKpa
      ),
      valB: formatNumericParam(
        recordB.pressureKpa,
        'kPa',
        recordB.pressureRangeKpa
      ),
      mono: true,
    },
    {
      label: 'Forced Airflow',
      valA: formatNumericParam(
        recordA.airflowCms,
        'cm/s',
        recordA.airflowRangeCms
      ),
      valB: formatNumericParam(
        recordB.airflowCms,
        'cm/s',
        recordB.airflowRangeCms
      ),
      mono: true,
    },
    {
      label: 'Gravity Context',
      valA: recordA.gravityContext,
      valB: recordB.gravityContext,
      mono: true,
    },
    {
      label: 'Documented Measurements',
      valA:
        recordA.measurements.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {recordA.measurements.map((m) => (
              <li key={m.key}>
                <span className="text-[#334155]">{m.label}:</span>{' '}
                <span className="text-[#059669] font-semibold">
                  {formatMeasurementValue(m)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-[#64748B]">Not reported</span>
        ),
      valB:
        recordB.measurements.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {recordB.measurements.map((m) => (
              <li key={m.key}>
                <span className="text-[#334155]">{m.label}:</span>{' '}
                <span className="text-[#059669] font-semibold">
                  {formatMeasurementValue(m)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-[#64748B]">Not reported</span>
        ),
      mono: true,
    },
    {
      label: 'Observed Results & Findings',
      valA: recordA.findings,
      valB: recordB.findings,
    },
    {
      label: 'Limitations',
      valA: (
        <ul className="list-disc list-inside flex flex-col gap-1">
          {recordA.evidenceLimitations.map((l, idx) => (
            <li key={idx}>{l}</li>
          ))}
        </ul>
      ),
      valB: (
        <ul className="list-disc list-inside flex flex-col gap-1">
          {recordB.evidenceLimitations.map((l, idx) => (
            <li key={idx}>{l}</li>
          ))}
        </ul>
      ),
    },
    {
      label: 'Source Provenance',
      valA: (
        <div className="flex flex-col gap-1">
          <span>{recordA.sourceDocument}</span>
          <a
            href={recordA.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono-telemetry text-[11px] text-[#0284C7] hover:text-[#D97706]"
          >
            <span>Open NASA Source</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      ),
      valB: (
        <div className="flex flex-col gap-1">
          <span>{recordB.sourceDocument}</span>
          <a
            href={recordB.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono-telemetry text-[11px] text-[#0284C7] hover:text-[#D97706]"
          >
            <span>Open NASA Source</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      ),
    },
  ];

  return (
    <Card className="overflow-hidden">
      <Table className="min-w-[760px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[22%] py-3.5 px-4">Parameter / Field</TableHead>
            <TableHead className="w-[39%] py-3.5 px-4 font-display text-sm font-semibold normal-case tracking-normal text-[#D97706]">
              Record A: {recordA.investigationName} ({recordA.id})
            </TableHead>
            <TableHead className="w-[39%] py-3.5 px-4 font-display text-sm font-semibold normal-case tracking-normal text-[#0284C7]">
              Record B: {recordB.investigationName} ({recordB.id})
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.label} className="align-top">
              <TableCell className="py-3 px-4 font-mono-telemetry text-[11px] uppercase text-[#64748B]">
                {row.label}
              </TableCell>
              <TableCell
                className={
                  row.mono
                    ? 'py-3 px-4 font-mono-telemetry text-[#0F172A] leading-relaxed'
                    : 'py-3 px-4 text-[#334155] leading-relaxed'
                }
              >
                {row.valA}
              </TableCell>
              <TableCell
                className={
                  row.mono
                    ? 'py-3 px-4 font-mono-telemetry text-[#0F172A] leading-relaxed'
                    : 'py-3 px-4 text-[#334155] leading-relaxed'
                }
              >
                {row.valB}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
