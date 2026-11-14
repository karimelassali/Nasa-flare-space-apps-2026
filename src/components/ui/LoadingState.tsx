import { Loader2 } from 'lucide-react';
import { Card } from './card';

interface LoadingStateProps {
  label?: string;
  sublabel?: string;
}

export function LoadingState({
  label = 'Retrieving & Synthesizing NASA Evidence...',
  sublabel = 'Cross-referencing PSI/NTRS boundary conditions and verifying citation IDs.',
}: LoadingStateProps) {
  return (
    <Card aria-live="polite" className="p-5 flex-row items-center gap-4">
      <div className="w-9 h-9 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#D97706] shrink-0">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="font-display text-sm font-semibold text-[#0F172A]">
          {label}
        </span>
        <span className="font-mono-telemetry text-xs text-[#64748B]">
          {sublabel}
        </span>
      </div>
    </Card>
  );
}
