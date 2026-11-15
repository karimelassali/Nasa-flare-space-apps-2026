'use client';

import {
  AlertTriangle,
  Bot,
  FileSearch,
  ShieldAlert,
} from 'lucide-react';
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { AIAnalysisResponse, EvidenceRecord } from '@/types/flare';

interface AIAnalysisPanelProps {
  analysis: AIAnalysisResponse;
  recordsById: Map<string, EvidenceRecord>;
  onSelectCitation: (record: EvidenceRecord) => void;
}

export function AIAnalysisPanel({
  analysis,
  recordsById,
  onSelectCitation,
}: AIAnalysisPanelProps) {
  const isOfflineFallback = analysis.responseMode === 'deterministic_fallback';

  const modeBadgeLabel =
    analysis.responseMode === 'nvidia'
      ? 'AI-Selected Records · NVIDIA NIM · Text From Sources'
      : analysis.responseMode === 'gemini'
        ? 'AI-Selected Records · Google Gemini · Text From Sources'
        : analysis.responseMode === 'openai'
          ? 'AI-Selected Records · OpenAI · Text From Sources'
          : 'Retrieval-Based Summary · No LLM Configured';

  return (
    <Card className="border-[#CBD5E1]">
      <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center shrink-0">
            {isOfflineFallback ? (
              <FileSearch className="w-4 h-4 text-[#0284C7]" />
            ) : (
              <Bot className="w-4 h-4 text-[#7C3AED]" />
            )}
          </div>
          <div>
            <CardTitle className="text-base">
              Research Interpretation &amp; Uncertainty Brief
            </CardTitle>
            <CardDescription>
              AI selects relevant records; scientific text comes from stored source fields. Review each record’s provenance and limitations.
            </CardDescription>
          </div>
        </div>

        <CardAction>
          <Badge variant={isOfflineFallback ? 'cyan' : 'violet'}>
            {modeBadgeLabel}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {analysis.providerNote ? (
          <div className="rounded-lg bg-[#FFFFFF] border border-[#E2E8F0] px-3.5 py-2.5 font-mono-telemetry text-[11px] text-[#334155]">
            {analysis.providerNote}
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column: Plain Language + Observed Summary */}
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-4 flex flex-col gap-2">
              <span className="font-mono-telemetry text-[11px] uppercase tracking-wider text-[#64748B]">
                Evidence selection
              </span>
              <p className="text-sm text-[#0F172A] leading-relaxed">
                {analysis.plainLanguageExplanation}
              </p>
            </div>

            <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-4 flex flex-col gap-2.5 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono-telemetry text-[11px] uppercase tracking-wider text-[#059669]">
                  {isOfflineFallback
                    ? 'Documented Experimental Evidence'
                    : 'Source-linked evidence'}
                </span>
                {isOfflineFallback ? (
                  <ProvenanceBadge label="Experimental Observation" />
                ) : (
                  <Badge variant="violet">Stored source fields</Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-[#334155] leading-relaxed whitespace-pre-line">
                {analysis.evidenceSummary}
              </p>
            </div>
          </div>

          {/* Right Column: Engineering Implications + Epistemic Limits */}
          <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono-telemetry text-[11px] uppercase tracking-wider text-[#D97706]">
                  Cautious Engineering Implications
                </span>
                <ProvenanceBadge label="Engineering Interpretation" />
              </div>
              <ul className="flex flex-col gap-2 text-xs sm:text-sm text-[#334155] leading-relaxed">
                {analysis.engineeringImplications.map((imp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-mono-telemetry text-[#D97706] text-xs mt-0.5 shrink-0">
                      {String(i + 1).padStart(2, '0')}.
                    </span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-4 flex flex-col gap-2.5 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono-telemetry text-[11px] uppercase tracking-wider text-[#DC2626]">
                  Evidence Limitations &amp; Epistemic Boundaries
                </span>
                <ProvenanceBadge label="Research Gap" />
              </div>
              <ul className="flex flex-col gap-2 text-xs text-[#334155] leading-relaxed">
                {analysis.limitations.map((lim, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626] shrink-0 mt-0.5" />
                    <span>{lim}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Cited NASA Records */}
        <div className="flex flex-col gap-2 pt-1">
          <span className="font-mono-telemetry text-[11px] uppercase tracking-wider text-[#64748B]">
            Cited Records (IDs matched in corpus — select to inspect primary sources)
          </span>
          <div className="flex flex-wrap gap-2">
            {analysis.citedEvidenceIds.map((id) => {
              const rec = recordsById.get(id);
              if (!rec) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectCitation(rec)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#E2E8F0] hover:border-[#0284C7] font-mono-telemetry text-xs text-[#0284C7] transition-colors cursor-pointer"
                >
                  <span>{rec.id}</span>
                  <span className="text-[#334155]">({rec.investigationName})</span>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-[#FFFFFF]/80 justify-start gap-2.5 text-xs text-[#334155]">
        <ShieldAlert className="w-4 h-4 text-[#D97706] shrink-0" />
        <span>
          Pre-mission research synthesis only: never treat summarized or ranked historical records as an operational spacecraft safety clearance or emergency directive.
        </span>
      </CardFooter>
    </Card>
  );
}
