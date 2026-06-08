/** Shared semantic token classes for the board editor cluster. */

export const editorPanelClass =
  'rounded-[2rem] border border-(--border) bg-(--surface-elevated) shadow-[var(--shadow-card)]';

export const editorFieldClass =
  'border-(--border) bg-(--surface-elevated) text-(--text) shadow-none placeholder:text-(--text-muted) focus-visible:ring-(--ring)';

export const editorSectionClass =
  'rounded-[2.5rem] border border-(--border) bg-(--surface-elevated) p-6 shadow-[var(--shadow-card)] md:p-8';

export const editorLabelClass =
  'text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)';

export const editorCardTitleClass =
  '[font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong)';

export const editorDisplayTitleClass =
  '[font-family:var(--font-display),serif] text-[clamp(2.5rem,4vw,4rem)] leading-[0.95] tracking-[-0.04em] text-(--text-strong)';

export const editorGhostButtonClass =
  'rounded-full border-(--border) bg-(--surface-elevated) px-4 text-(--text) hover:bg-(--surface-subtle) hover:text-(--text-strong)';

export const editorPrimaryButtonClass =
  'rounded-full bg-(--text-strong) text-(--background) hover:opacity-90';

export const editorIconButtonClass =
  'h-9 w-9 rounded-full border border-(--border) bg-(--surface-elevated) text-(--text-muted) transition hover:bg-(--surface-subtle) hover:text-(--text-strong)';

export const editorIconButtonLgClass =
  'h-11 w-11 rounded-full border border-(--border) bg-(--surface-elevated) text-(--text-muted) hover:bg-(--surface-subtle) hover:text-(--text-strong)';

export const editorSelectClass =
  'h-11 w-full rounded-2xl border border-(--border) bg-(--surface-elevated) px-4 text-sm text-(--text) outline-none focus:ring-2 focus:ring-(--ring)';

export const editorSubtleSurfaceClass =
  'rounded-4xl border border-(--border) bg-(--surface-subtle) p-5';

export const editorInsetSurfaceClass =
  'overflow-hidden rounded-[1.75rem] border border-(--border) bg-(--surface-subtle)';

export const editorCardSurfaceClass =
  'rounded-[1.75rem] border border-(--border) bg-(--surface-elevated)';

export const editorNestedCardClass =
  'relative rounded-[1.75rem] border border-(--border) bg-(--surface-subtle)';

export const editorEmptyStateClass =
  'rounded-[1.75rem] border border-dashed border-(--border) bg-(--surface-subtle) px-5 py-10 text-center text-sm text-(--text-muted)';

export const editorReferenceCardClass =
  'group relative overflow-hidden rounded-[1.75rem] border border-(--border) bg-(--surface-elevated) transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]';

export const editorModalPanelClass =
  'flex w-full max-w-6xl flex-col overflow-hidden rounded-4xl border border-(--border) bg-(--surface-elevated) text-(--text) shadow-[var(--shadow-elevated)]';
