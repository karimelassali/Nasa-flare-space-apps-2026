'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Database, ExternalLink, Flame, FlaskConical, Grid2x2Check, Layers } from 'lucide-react';
import { ExperimentDetailsDrawer } from '@/components/knowledge/ExperimentDetailsDrawer';
import { KnowledgeTable } from '@/components/knowledge/KnowledgeTable';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  getAllEvidenceRecords,
  getCorpusStatistics,
} from '@/lib/evidence/repository';
import { getPsiCorpusSummary } from '@/lib/evidence/psi-dataset';
import { getSolidDatasetSummary } from '@/lib/evidence/solid-dataset';
import type { EvidenceRecord } from '@/types/flare';

export default function KnowledgeBasePage() {
  const records = useMemo(() => getAllEvidenceRecords(), []);
  const stats = useMemo(() => getCorpusStatistics(records), [records]);
  const psiSummary = useMemo(() => getPsiCorpusSummary(), []);
  const solidSummary = useMemo(() => getSolidDatasetSummary(), []);
  const [selectedRecord, setSelectedRecord] = useState<EvidenceRecord | null>(null);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-2 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="cyan">NASA Empirical Repository</Badge>
            <Badge variant="outline" className="font-mono-telemetry">
              {stats.totalRecords} Curated Records
            </Badge>
            <Badge variant="warning" className="font-mono-telemetry">
              +{psiSummary.totalRows} PSI Gas/Droplet &amp; {solidSummary.totalRows} BASS-II Solid Rows
            </Badge>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-[#0F172A]">
            NASA Microgravity Combustion Knowledge Base
          </h1>
          <p className="text-sm text-[#334155] leading-relaxed">
            Browse the records compiled from NASA Physical Sciences Informatics (PSI)
            and Technical Reports Server (NTRS) across BASS, FLEX, ACME, SAFFIRE, and SoFIE.
            Missing values remain explicitly unfabricated as{' '}
            <span className="font-mono-telemetry text-[#0F172A]">Not reported</span>.
          </p>
        </div>

        <a
          href="https://psi.nasa.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] font-mono-telemetry text-xs text-[#0284C7] hover:border-[#0284C7]/50 transition-colors shrink-0 self-start lg:self-auto"
        >
          <span>NASA PSI Portal</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Tremor-style KPI Strip */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3.5">
              <div className="flex items-center justify-between text-[11px] font-mono-telemetry uppercase tracking-wider text-[#64748B]">
                <span>Curated Corpus</span>
                <Database className="w-3.5 h-3.5 text-[#0284C7]" />
              </div>
              <div className="mt-2 font-mono-telemetry text-2xl font-semibold text-[#0F172A] tabular-nums">
                {stats.totalRecords}
              </div>
              <div className="mt-0.5 text-[11px] text-[#64748B]">
                Schema-validated records
              </div>
            </div>

            <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3.5">
              <div className="flex items-center justify-between text-[11px] font-mono-telemetry uppercase tracking-wider text-[#64748B]">
                <span>Observations</span>
                <FlaskConical className="w-3.5 h-3.5 text-[#059669]" />
              </div>
              <div className="mt-2 font-mono-telemetry text-2xl font-semibold text-[#059669] tabular-nums">
                {stats.experimentalObservationCount}
              </div>
              <div className="mt-0.5 text-[11px] text-[#64748B]">
                Specific test-point entries
              </div>
            </div>

            <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3.5">
              <div className="flex items-center justify-between text-[11px] font-mono-telemetry uppercase tracking-wider text-[#64748B]">
                <span>Overviews</span>
                <BookOpen className="w-3.5 h-3.5 text-[#0284C7]" />
              </div>
              <div className="mt-2 font-mono-telemetry text-2xl font-semibold text-[#0F172A] tabular-nums">
                {stats.investigationOverviewCount}
              </div>
              <div className="mt-0.5 text-[11px] text-[#64748B]">
                Program-level baselines
              </div>
            </div>

            <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3.5">
              <div className="flex items-center justify-between text-[11px] font-mono-telemetry uppercase tracking-wider text-[#64748B]">
                <span>Investigations</span>
                <Layers className="w-3.5 h-3.5 text-[#D97706]" />
              </div>
              <div className="mt-2 font-mono-telemetry text-2xl font-semibold text-[#D97706] tabular-nums">
                {stats.uniqueInvestigationCount}
              </div>
              <div className="mt-0.5 text-[11px] text-[#64748B]">
                Distinct PSI / NTRS programs
              </div>
            </div>

            <Link
              href="/evidence"
              className="rounded-lg bg-[#F8FAFC] border border-[#BAE6FD] hover:border-[#0284C7] p-3.5 transition-colors block"
            >
              <div className="flex items-center justify-between text-[11px] font-mono-telemetry uppercase tracking-wider text-[#0284C7]">
                <span>PSI Gas/Droplet</span>
                <Grid2x2Check className="w-3.5 h-3.5 text-[#0284C7]" />
              </div>
              <div className="mt-2 font-mono-telemetry text-2xl font-semibold text-[#0284C7] tabular-nums">
                {psiSummary.totalRows}
              </div>
              <div className="mt-0.5 text-[11px] text-[#64748B]">
                ACME · CFI · SPICE (Explorer →)
              </div>
            </Link>

            <Link
              href="/ignis"
              className="rounded-lg bg-[#F8FAFC] border border-[#FDE68A] hover:border-[#D97706] p-3.5 transition-colors block"
            >
              <div className="flex items-center justify-between text-[11px] font-mono-telemetry uppercase tracking-wider text-[#D97706]">
                <span>Solid Test Rows</span>
                <Flame className="w-3.5 h-3.5 text-[#D97706]" />
              </div>
              <div className="mt-2 font-mono-telemetry text-2xl font-semibold text-[#D97706] tabular-nums">
                {solidSummary.totalRows}
              </div>
              <div className="mt-0.5 text-[11px] text-[#64748B]">
                BASS-II same-row checks →
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Main Searchable & Filterable Data Table */}
      <div data-tour="knowledge-table" className="min-w-0">
        <KnowledgeTable
          records={records}
          onSelectRecord={(record) => setSelectedRecord(record)}
        />
      </div>

      {/* Inspection Slide-Over Drawer */}
      <ExperimentDetailsDrawer
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}
