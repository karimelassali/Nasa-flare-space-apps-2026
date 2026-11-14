'use client';

import { ArrowLeftRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { EvidenceRecord } from '@/types/flare';

interface ExperimentSelectorProps {
  records: EvidenceRecord[];
  selectedAId: string;
  selectedBId: string;
  onChangeA: (id: string) => void;
  onChangeB: (id: string) => void;
  onSwap: () => void;
}

export function ExperimentSelector({
  records,
  selectedAId,
  selectedBId,
  onChangeA,
  onChangeB,
  onSwap,
}: ExperimentSelectorProps) {
  return (
    <Card>
      <CardContent className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <label
            htmlFor="compare-select-a"
            className="font-mono-telemetry text-[11px] font-medium text-[#D97706]"
          >
            Experiment Record A (Baseline)
          </label>
          <select
            id="compare-select-a"
            value={selectedAId}
            onChange={(e) => onChangeA(e.target.value)}
            className="h-11 w-full min-w-0 max-w-full px-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#0F172A] focus:border-[#D97706] focus:outline-none"
          >
            {records.map((rec) => (
              <option key={rec.id} value={rec.id} disabled={rec.id === selectedBId}>
                [{rec.investigationName} · {rec.investigationId}] {rec.experimentTitle}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="secondary"
          size="default"
          onClick={onSwap}
          aria-label="Swap Record A and Record B"
          title="Swap Record A and Record B"
          className="h-11"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-[#0284C7]" />
          <span className="md:hidden">Swap A ↔ B</span>
        </Button>

        <div className="flex min-w-0 flex-col gap-1.5">
          <label
            htmlFor="compare-select-b"
            className="font-mono-telemetry text-[11px] font-medium text-[#0284C7]"
          >
            Experiment Record B (Comparison Target)
          </label>
          <select
            id="compare-select-b"
            value={selectedBId}
            onChange={(e) => onChangeB(e.target.value)}
            className="h-11 w-full min-w-0 max-w-full px-3 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#0F172A] focus:border-[#0284C7] focus:outline-none"
          >
            {records.map((rec) => (
              <option key={rec.id} value={rec.id} disabled={rec.id === selectedAId}>
                [{rec.investigationName} · {rec.investigationId}] {rec.experimentTitle}
              </option>
            ))}
          </select>
        </div>
      </CardContent>
    </Card>
  );
}
