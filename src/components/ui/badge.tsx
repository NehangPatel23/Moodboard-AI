import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'secondary' | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--text-strong)] text-[var(--background)] dark:bg-white dark:text-slate-950',
  secondary:
    'bg-[var(--surface-subtle)] text-[var(--text-strong)] dark:bg-[rgba(255,255,255,0.08)] dark:text-[var(--text-strong)]',
  outline:
    'border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-strong)] dark:bg-[rgba(255,255,255,0.05)] dark:text-[var(--text-strong)]',
};

export function Badge({ className, variant = 'secondary', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}