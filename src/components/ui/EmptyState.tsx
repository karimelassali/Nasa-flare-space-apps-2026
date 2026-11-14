import { SearchX } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from './card';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="p-8 items-center text-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#64748B]">
        <SearchX className="w-5 h-5" />
      </div>
      <h3 className="font-display text-sm font-semibold text-[#0F172A]">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[#334155] max-w-md leading-relaxed">
        {description}
      </p>
      {action ? <div className="pt-1">{action}</div> : null}
    </Card>
  );
}
