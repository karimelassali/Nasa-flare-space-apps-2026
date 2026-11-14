import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Analysis Request Interrupted',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-xl bg-[#FFFFFF] border border-[#DC2626]/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/25 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
        </div>
        <div className="flex flex-col gap-0.5">
          <h4 className="font-display text-sm font-semibold text-[#0F172A]">
            {title}
          </h4>
          <p className="text-xs sm:text-sm text-[#334155]">{message}</p>
        </div>
      </div>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          <RotateCcw className="w-3.5 h-3.5 text-[#0284C7]" />
          Retry
        </Button>
      ) : null}
    </div>
  );
}
