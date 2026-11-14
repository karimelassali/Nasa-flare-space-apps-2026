import * as React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'cyan'
  | 'emerald'
  | 'warning'
  | 'error'
  | 'violet';

const BADGE_VARIANTS: Record<BadgeVariant, string> = {
  default:
    'bg-[#D97706]/12 text-[#D97706] border-[#D97706]/30',
  secondary:
    'bg-[#F1F5F9] text-[#334155] border-[#E2E8F0]',
  outline:
    'bg-transparent text-[#334155] border-[#E2E8F0]',
  cyan:
    'bg-[#0284C7]/10 text-[#0284C7] border-[#0284C7]/28',
  emerald:
    'bg-[#059669]/10 text-[#059669] border-[#059669]/28',
  warning:
    'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/28',
  error:
    'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/28',
  violet:
    'bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/28',
};

export interface BadgeProps extends React.ComponentProps<'span'> {
  variant?: BadgeVariant;
}

export function Badge({
  className,
  variant = 'secondary',
  ...props
}: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono-telemetry text-[11px] font-medium whitespace-nowrap leading-tight',
        BADGE_VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}
