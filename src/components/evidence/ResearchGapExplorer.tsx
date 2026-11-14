'use client';

import { AlertTriangle, Info } from 'lucide-react';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge';
import type { ResearchGapSummary } from '@/lib/matching/coverage';

interface ResearchGapExplorerProps {
  gaps: ResearchGapSummary[];
}

export function ResearchGapExplorer({ gaps }: ResearchGapExplorerProps) {
  return (
    <Card>
      <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="font-mono-telemetry text-[11px] text-[#DC2626] block">
            Epistemic Boundary &amp; Coverage Audit
          </span>
          <CardTitle className="text-base">Research Gap Explorer</CardTitle>
        </div>
        <CardAction>
          <ProvenanceBadge label="Research Gap" />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Mandatory Scientific Caveat */}
        <div className="rounded-lg bg-[#FFFFFF] border border-[#D97706]/30 p-3.5 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
          <p className="text-xs text-[#0F172A] leading-relaxed">
            <strong className="text-[#D97706]">Scientific Boundary Rule:</strong>{' '}
            A missing record indicates{' '}
            <span className="font-mono-telemetry text-[#D97706]">
              &ldquo;No supporting record in the currently loaded corpus.&rdquo;
            </span>{' '}
            It does <strong>NOT</strong> prove NASA never studied that condition or that a spacecraft configuration is safe or unsafe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gaps.map((gap) => (
            <div
              key={gap.id}
              className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-4 flex flex-col justify-between gap-3"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-display text-sm font-semibold text-[#0F172A] leading-snug">
                    {gap.title}
                  </h4>
                  <Badge variant={gap.severity === 'High' ? 'error' : 'warning'}>
                    {gap.severity} Priority Gap
                  </Badge>
                </div>
                <p className="text-xs text-[#334155] leading-relaxed">
                  {gap.description}
                </p>
              </div>

              <div className="pt-2.5 border-t border-[#F1F5F9] flex items-center justify-between gap-2 font-mono-telemetry text-[11px]">
                <span className="text-[#64748B] flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-[#D97706] shrink-0" />
                  {gap.caveat}
                </span>
                <span className="text-[#0284C7] shrink-0">
                  Loaded: {gap.corpusCount}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
