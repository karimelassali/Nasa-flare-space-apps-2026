'use client';

import { Download, FileCode2, FileText } from 'lucide-react';
import {
  buildEngineeringBriefPayload,
  generateBriefMarkdown,
  triggerBrowserDownload,
} from '@/lib/export/brief';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type {
  AIAnalysisResponse,
  MissionPreset,
  RankedEvidenceResult,
  ScenarioParameters,
} from '@/types/flare';

interface ExportControlsProps {
  question: string;
  preset: MissionPreset;
  scenario: ScenarioParameters;
  rankedResults: RankedEvidenceResult[];
  analysis: AIAnalysisResponse;
}

export function ExportControls({
  question,
  preset,
  scenario,
  rankedResults,
  analysis,
}: ExportControlsProps) {
  const handleDownloadMarkdown = () => {
    const payload = buildEngineeringBriefPayload(
      question,
      preset,
      scenario,
      rankedResults,
      analysis
    );
    const md = generateBriefMarkdown(payload);
    triggerBrowserDownload(
      `flare-research-brief-${preset.id}.md`,
      md,
      'text/markdown;charset=utf-8'
    );
  };

  const handleDownloadJson = () => {
    const payload = buildEngineeringBriefPayload(
      question,
      preset,
      scenario,
      rankedResults,
      analysis
    );
    triggerBrowserDownload(
      `flare-research-brief-${preset.id}.json`,
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8'
    );
  };

  return (
    <Card className="p-4 sm:px-5 sm:py-4 flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <span className="font-mono-telemetry text-[11px] font-medium text-[#0284C7]">
          Engineering Research Brief Export
        </span>
        <h3 className="font-display text-sm font-semibold text-[#0F172A]">
          Download Referenced Evidence Package
        </h3>
        <p className="text-xs text-[#334155]">
          Exports scenario boundaries, ranked NASA citations, limitations, and AI/fallback disclosure.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Button variant="default" onClick={handleDownloadMarkdown}>
          <FileText className="w-3.5 h-3.5" />
          <span>Export Markdown (.md)</span>
          <Download className="w-3.5 h-3.5" />
        </Button>

        <Button variant="secondary" onClick={handleDownloadJson}>
          <FileCode2 className="w-3.5 h-3.5 text-[#0284C7]" />
          <span>Export JSON (.json)</span>
          <Download className="w-3.5 h-3.5 text-[#0284C7]" />
        </Button>
      </div>
    </Card>
  );
}
