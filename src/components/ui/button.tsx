import * as React from 'react';
import { Tooltip, type TooltipSide } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tooltip?: React.ReactNode;
  tooltipSide?: TooltipSide;
  /** Longer delay when tooltip supplements visible button text. */
  tooltipDelayMs?: number;
  /** Passed to the tooltip trigger wrapper (e.g. `absolute …` for positioned icon buttons). */
  tooltipTriggerClassName?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'bg-[var(--text-strong)] text-[var(--background)] shadow-[0_12px_30px_rgba(15,23,42,0.14)] hover:opacity-90 focus-visible:ring-[var(--ring)] dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200',
  secondary:
    'bg-[var(--surface-elevated)] text-[var(--text-strong)] hover:bg-[var(--surface-subtle)] focus-visible:ring-[var(--ring)] dark:bg-[rgba(255,255,255,0.06)] dark:text-[var(--text-strong)] dark:hover:bg-[rgba(255,255,255,0.1)]',
  outline:
    'border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-strong)] hover:bg-[var(--surface-subtle)] focus-visible:ring-[var(--ring)] dark:bg-[rgba(255,255,255,0.04)] dark:text-[var(--text-strong)] dark:hover:bg-[rgba(255,255,255,0.08)]',
  ghost:
    'bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-strong)] focus-visible:ring-[var(--ring)] dark:text-[var(--text-muted)] dark:hover:bg-[rgba(255,255,255,0.06)] dark:hover:text-[var(--text-strong)]',
  destructive: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-sm',
  icon: 'h-10 w-10',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      type = 'button',
      tooltip,
      tooltipSide,
      tooltipDelayMs,
      tooltipTriggerClassName,
      title,
      ...props
    },
    ref,
  ) => {
    const button = (
      <button
        ref={ref}
        type={type}
        title={tooltip ? undefined : title}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
          'disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );

    if (tooltip) {
      const wrappedButton = props.disabled ? (
        <span className="inline-flex">{button}</span>
      ) : (
        button
      );

      return (
        <Tooltip
          content={tooltip}
          side={tooltipSide}
          delayMs={tooltipDelayMs}
          triggerClassName={tooltipTriggerClassName}
          disabled={false}
        >
          {wrappedButton}
        </Tooltip>
      );
    }

    return button;
  },
);

Button.displayName = 'Button';

export { Button };