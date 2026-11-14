'use client';

import { getRecordProvenance } from '@/lib/evidence/provenance';

import { useRef } from 'react';
import { useDialogFocus } from '@/lib/use-dialog-focus';
import {
  AlertTriangle,
  CheckCircle2,
  FileJson,
  FileText,
  FlaskConical,
  Info,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge';
import { SourceCitation } from '@/components/ui/SourceCitation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  generateSingleRecordMarkdown,
  triggerBrowserDownload,
} from '@/lib/export/brief';
import {
  formatMeasurementValue,
  formatNumericParam,
} from '@/lib/utils';
import type { EvidenceRecord } from '@/types/flare';

interface ExperimentDetailsDrawerProps {
  record: EvidenceRecord | null;
  onClose: () => void;
}

export function ExperimentDetailsDrawer({
  record,
  onClose,
}: ExperimentDetailsDrawerProps) {
  const dialog = useRef<HTMLDivElement>(null);
  useDialogFocus(Boolean(record), dialog, onClose);

  if (!record) return null;

  const handleExportMarkdown = () => {
    const md = generateSingleRecordMarkdown(record);
    triggerBrowserDownload(
      `flare-${record.id.toLowerCase()}.md`,
      md,
      'text/markdown;charset=utf-8'
    );
  };

  const handleExportJson = () => {
    triggerBrowserDownload(
      `flare-${record.id.toLowerCase()}.json`,
      JSON.stringify({ ...record, provenance: getRecordProvenance(record.id) }, null, 2),
      'application/json;charset=utf-8'
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      ref={dialog}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-record-title"
    >
      <div
        className="fixed inset-0 bg-[#0F172A]/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="relative z-10 w-full max-w-2xl h-full bg-[#FFFFFF] border-l border-[#E2E8F0] flex flex-col overflow-hidden shadow-2xl">
        {/* Sticky Drawer Header */}
        <div className="shrink-0 px-6 py-4 bg-[#FFFFFF] border-b border-[#E2E8F0] flex items-start justify-between gap-4">
          <div className="min-w-0 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono-telemetry text-[11px]">
                {record.id}
              </Badge>
              <Badge variant="cyan" className="font-mono-telemetry text-[11px]">
                {record.investigationId}
              </Badge>
              <ProvenanceBadge
                label={
                  record.recordType === 'experimental_observation'
                    ? 'Experimental Observation'
                    : 'Investigation Overview'
                }
              />
            </div>
            <h2
              id="drawer-record-title"
              className="font-display text-lg font-semibold tracking-tight text-[#0F172A] leading-snug"
            >
              {record.experimentTitle}
            </h2>
            <p className="text-xs text-[#334155]">
              {record.investigationName} · {record.platform} · {record.facility}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close experiment details"
            className="text-[#64748B] hover:text-[#0F172A]"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {record.recordType === 'investigation_overview' && (
            <div className="rounded-xl bg-[#0284C7]/8 border border-[#0284C7]/25 px-4 py-3 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
              <p className="text-xs text-[#334155] leading-relaxed">
                This entry is a program-level <strong className="text-[#0F172A]">Investigation Overview</strong>.
                Where specific test-point setpoints are not fixed across the program, FLARE displays documented ranges or marks unverified single-run values as{' '}
                <span className="font-mono-telemetry text-[#0F172A]">Not reported</span>.
              </p>
            </div>
          )}

          {/* Atmospheric & Facility Boundary Conditions */}
          <div className="space-y-2.5">
            <span className="font-mono-telemetry text-[11px] uppercase tracking-wider text-[#64748B]">
              Documented Boundary Conditions
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] p-3">
                <div className="font-mono-telemetry text-[10px] uppercase tracking-wider text-[#64748B]">
                  Oxygen
                </div>
                <div className="mt-1 font-mono-telemetry text-sm font-medium text-[#0F172A] tabular-nums">
                  {formatNumericParam(record.oxygenPercent, '%', record.oxygenRangePct)}
                </div>
              </div>
              <div className="rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] p-3">
                <div className="font-mono-telemetry text-[10px] uppercase tracking-wider text-[#64748B]">
                  Pressure
                </div>
                <div className="mt-1 font-mono-telemetry text-sm font-medium text-[#0F172A] tabular-nums">
                  {formatNumericParam(record.pressureKpa, 'kPa', record.pressureRangeKpa)}
                </div>
              </div>
              <div className="rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] p-3">
                <div className="font-mono-telemetry text-[10px] uppercase tracking-wider text-[#64748B]">
                  Airflow
                </div>
                <div className="mt-1 font-mono-telemetry text-sm font-medium text-[#0F172A] tabular-nums">
                  {formatNumericParam(record.airflowCms, 'cm/s', record.airflowRangeCms)}
                </div>
              </div>
              <div className="rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] p-3">
                <div className="font-mono-telemetry text-[10px] uppercase tracking-wider text-[#64748B]">
                  Gravity
                </div>
                <div className="mt-1 font-mono-telemetry text-sm font-medium text-[#0284C7]">
                  {record.gravityContext}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="block font-mono-telemetry text-[10px] uppercase tracking-wider text-[#64748B]">
                  Material / Sample
                </span>
                <span className="text-[#0F172A] font-medium mt-0.5 block">
                  {record.material}
                </span>
              </div>
              <div>
                <span className="block font-mono-telemetry text-[10px] uppercase tracking-wider text-[#64748B]">
                  Fuel Classification
                </span>
                <span className="text-[#0F172A] font-medium mt-0.5 block">
                  {record.fuelType}
                </span>
              </div>
              <div>
                <span className="block font-mono-telemetry text-[10px] uppercase tracking-wider text-[#64748B]">
                  Flow Configuration
                </span>
                <span className="text-[#0F172A] font-medium mt-0.5 block">
                  {record.flowConfiguration ?? 'Not reported'}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Scientific Findings */}
          <Card>
            <CardHeader className="py-3.5">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-[#0284C7]" />
                  <span>Documented Scientific Findings</span>
                </CardTitle>
                <ProvenanceBadge
                  label={
                    record.recordType === 'experimental_observation'
                      ? 'Experimental Observation'
                      : 'Investigation Overview'
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-[#0F172A] leading-relaxed">
                {record.findings}
              </p>

              {record.observations.length > 0 && (
                <div className="pt-3 border-t border-[#F1F5F9] space-y-2">
                  <span className="font-mono-telemetry text-[10px] uppercase tracking-wider text-[#64748B] block">
                    Recorded Experimental Observations
                  </span>
                  <ul className="space-y-1.5">
                    {record.observations.map((obs, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-[#334155] leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0 mt-0.5" />
                        <span>{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quantitative Measurements */}
          <Card>
            <CardHeader className="py-3.5">
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Recorded Measurements</CardTitle>
                <span className="font-mono-telemetry text-[11px] text-[#64748B]">
                  {record.measurements.length} {record.measurements.length === 1 ? 'metric' : 'metrics'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {record.measurements.length === 0 ? (
                <p className="p-4 text-xs text-[#64748B]">
                  Quantitative scalar metrics: Not reported for this overview record.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Metric</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Condition Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {record.measurements.map((m) => (
                      <TableRow key={m.key}>
                        <TableCell className="text-[#0F172A] font-medium">
                          {m.label}
                        </TableCell>
                        <TableCell className="font-mono-telemetry text-[#0284C7] tabular-nums whitespace-nowrap">
                          {formatMeasurementValue(m)}
                        </TableCell>
                        <TableCell className="text-[11px] text-[#334155] leading-snug">
                          {m.conditionNote}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Engineering Interpretation */}
          <Card className="border-[#D97706]/25 bg-[#FFFFFF]">
            <CardHeader className="py-3.5 border-[#D97706]/15">
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Pre-Mission Engineering Interpretation</CardTitle>
                <ProvenanceBadge label="Engineering Interpretation" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-[#334155] leading-relaxed">
                {record.engineeringInterpretation}
              </p>
            </CardContent>
          </Card>

          {/* Evidence Limitations */}
          <Card>
            <CardHeader className="py-3.5">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                <span>Scope & Evidence Limitations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {record.evidenceLimitations.map((lim, idx) => (
                  <li key={idx} className="text-xs text-[#334155] leading-relaxed flex items-start gap-2">
                    <span className="font-mono-telemetry text-[#D97706] shrink-0">•</span>
                    <span>{lim}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Verified Provenance */}
          <SourceCitation record={record} />
        </div>

        {/* Sticky Footer */}
        <div className="shrink-0 px-6 py-3.5 bg-[#FFFFFF] border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportMarkdown}>
              <FileText className="w-3.5 h-3.5 text-[#0284C7]" />
              <span>Export Markdown (.md)</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJson}>
              <FileJson className="w-3.5 h-3.5" />
              <span>Download JSON</span>
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <span>Close</span>
          </Button>
        </div>
      </aside>
    </div>
  );
}
