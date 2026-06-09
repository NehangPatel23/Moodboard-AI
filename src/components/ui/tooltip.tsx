'use client';

import {
  cloneElement,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

/** Default delay for icon-only controls. */
export const TOOLTIP_DELAY_ICON = 450;

/** Longer delay when visible label exists but tooltip adds extra context. */
export const TOOLTIP_DELAY_SUPPLEMENTARY = 800;

type TooltipContextValue = {
  delayMs: number;
};

const TooltipContext = createContext<TooltipContextValue>({ delayMs: TOOLTIP_DELAY_ICON });

export function TooltipProvider({
  children,
  delayMs = TOOLTIP_DELAY_ICON,
}: {
  children: ReactNode;
  delayMs?: number;
}) {
  return <TooltipContext.Provider value={{ delayMs }}>{children}</TooltipContext.Provider>;
}

function getSideStyles(side: TooltipSide, rect: DOMRect): CSSProperties {
  const gap = 10;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  switch (side) {
    case 'bottom':
      return { top: rect.bottom + gap, left: centerX, transform: 'translateX(-50%)' };
    case 'left':
      return { top: centerY, left: rect.left - gap, transform: 'translate(-100%, -50%)' };
    case 'right':
      return { top: centerY, left: rect.right + gap, transform: 'translateY(-50%)' };
    case 'top':
    default:
      return { top: rect.top - gap, left: centerX, transform: 'translate(-50%, -100%)' };
  }
}

export function Tooltip({
  content,
  side = 'top',
  disabled = false,
  delayMs,
  triggerClassName,
  children,
}: {
  content: ReactNode;
  side?: TooltipSide;
  disabled?: boolean;
  /** Override provider delay (e.g. longer delay for supplementary hints). */
  delayMs?: number;
  /** Wrapper classes — use `block w-full` when the trigger should fill a grid cell. */
  triggerClassName?: string;
  children: ReactElement;
}) {
  const { delayMs: contextDelayMs } = useContext(TooltipContext);
  const effectiveDelayMs = delayMs ?? contextDelayMs;
  const [visible, setVisible] = useState(false);
  const [style, setStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();
  const showTimeoutRef = useRef<number | null>(null);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    setStyle(getSideStyles(side, el.getBoundingClientRect()));
  }, [side]);

  const show = useCallback(() => {
    if (disabled || content == null || content === '') return;

    window.clearTimeout(showTimeoutRef.current ?? undefined);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const delay = prefersReducedMotion ? 0 : effectiveDelayMs;

    showTimeoutRef.current = window.setTimeout(() => {
      updatePosition();
      setVisible(true);
    }, delay);
  }, [content, disabled, effectiveDelayMs, updatePosition]);

  const hide = useCallback(() => {
    window.clearTimeout(showTimeoutRef.current ?? undefined);
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) return;

    updatePosition();
    const handleReposition = () => updatePosition();
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);

    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [visible, updatePosition]);

  useEffect(
    () => () => {
      window.clearTimeout(showTimeoutRef.current ?? undefined);
    },
    [],
  );

  if (disabled || content == null || content === '' || !isValidElement(children)) {
    return children;
  }

  const child = children as ReactElement<{ 'aria-describedby'?: string }>;
  const describedBy = visible
    ? [tooltipId, child.props['aria-describedby']].filter(Boolean).join(' ')
    : child.props['aria-describedby'];

  const trigger = (
    <span
      ref={triggerRef}
      className={cn('max-w-full', triggerClassName ?? 'inline-flex')}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
    >
      {cloneElement(child, {
        'aria-describedby': describedBy || undefined,
      })}
    </span>
  );

  return (
    <>
      {trigger}
      {visible && typeof document !== 'undefined'
        ? createPortal(
            <div
              id={tooltipId}
              role="tooltip"
              style={style}
              className={cn(
                'pointer-events-none fixed z-[120] max-w-[16rem] rounded-xl border border-(--border)',
                'bg-(--surface-elevated)/95 px-3 py-1.5 text-xs font-medium leading-snug text-(--text-strong)',
                'shadow-[var(--shadow-elevated)] backdrop-blur-md',
              )}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
