import * as React from 'react';
import { cn } from '@/lib/utils';

interface SeparatorProps extends React.ComponentProps<'div'> {
  orientation?: 'horizontal' | 'vertical';
}

export function Separator({
  orientation = 'horizontal',
  className,
  ...props
}: SeparatorProps) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        'shrink-0 bg-[#E2E8F0]',
        orientation === 'horizontal' ? 'h-px w-full' : 'w-px h-4',
        className
      )}
      {...props}
    />
  );
}
