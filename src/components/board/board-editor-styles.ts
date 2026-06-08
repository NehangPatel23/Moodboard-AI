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

/** Collaboration / status surfaces */
export const editorUnreadBadgeClass =
  'rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-900 dark:bg-amber-900/40 dark:text-amber-100';

export const editorUnreadItemBorderClass = 'border-l-4 border-l-amber-500 border-(--border)';

export const editorReplayActiveBorderClass = 'border-amber-400/80 ring-1 ring-amber-400/40';

export const editorWarningBannerClass =
  'rounded-[1.75rem] border border-amber-300/80 bg-amber-50/95 shadow-[var(--shadow-card)] backdrop-blur-sm dark:border-amber-900/60 dark:bg-amber-950/90';

export const editorWarningLabelClass =
  'text-[10px] font-medium uppercase tracking-[0.28em] text-amber-800 dark:text-amber-300';

export const editorWarningChipActiveClass =
  'border-amber-500 bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-100';

export const editorConflictBannerClass =
  'flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100';

export const editorConflictOutlineButtonClass =
  'rounded-full border-amber-300 bg-white text-amber-950 hover:bg-amber-100 dark:border-amber-800 dark:bg-transparent dark:text-amber-100 dark:hover:bg-amber-900/50';

export const editorConflictPrimaryButtonClass =
  'rounded-full bg-amber-900 text-white hover:bg-amber-800 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-100';

export const editorReplayCalloutClass =
  'rounded-2xl border border-amber-300/70 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/20';

export const editorReplayRemovedClass =
  'rounded-[1.75rem] border border-dashed border-red-300/80 bg-red-50/60 dark:border-red-900/50 dark:bg-red-950/20';

export const editorReplayRemovedLabelClass =
  'text-[10px] font-medium uppercase tracking-[0.24em] text-red-700 dark:text-red-300';

export const editorReplayRemovedTextClass =
  'whitespace-pre-wrap text-sm leading-6 text-red-950/80 line-through dark:text-red-100/80';

export const editorReplayActionBadgeAddedClass =
  'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';

export const editorReplayActionBadgeRemovedClass = 'bg-red-500/10 text-red-700 dark:text-red-300';

export const editorReplayActionBadgeUpdatedClass = 'bg-sky-500/10 text-sky-700 dark:text-sky-300';

export const editorReplayBeforeClass =
  'rounded-xl border border-red-200/70 bg-red-50/70 px-3 py-2 dark:border-red-900/40 dark:bg-red-950/20';

export const editorReplayBeforeLabelClass =
  'text-[10px] font-medium uppercase tracking-[0.22em] text-red-700/80 dark:text-red-300/80';

export const editorReplayBeforeTextClass =
  'whitespace-pre-wrap text-sm leading-6 text-red-950/90 line-through dark:text-red-100/90';

export const editorReplayAfterClass =
  'rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3 py-2 dark:border-emerald-900/40 dark:bg-emerald-950/20';

export const editorReplayAfterLabelClass =
  'text-[10px] font-medium uppercase tracking-[0.22em] text-emerald-700/80 dark:text-emerald-300/80';

export const editorReplayAfterTextClass =
  'whitespace-pre-wrap text-sm leading-6 text-emerald-950/90 dark:text-emerald-100/90';

export const editorSettingsCardClass =
  'border border-(--border) bg-(--surface-elevated) shadow-[var(--shadow-card)]';

export const editorSettingsNestedClass =
  'rounded-3xl border border-(--border) bg-(--surface-subtle) p-4';

export const editorSettingsFieldClass = editorFieldClass;

/** Creation flow (shared with board editor tokens) */
export const creationSectionClass =
  'rounded-[2.5rem] border border-(--border) bg-(--surface-elevated) p-6 shadow-[var(--shadow-card)] md:p-8';

export const creationPanelClass =
  'rounded-[2.25rem] border border-(--border) bg-(--surface-elevated) p-6 shadow-[var(--shadow-card)]';

export const creationTemplateCardClass =
  'h-full overflow-hidden rounded-[1.75rem] border border-(--border) bg-(--surface-elevated) shadow-[var(--shadow-card)]';

export const creationTemplateInsetClass =
  'rounded-[1.35rem] border border-(--border) bg-(--surface) p-4';

export const creationTagPillClass =
  'rounded-full border border-(--border) bg-(--surface) px-3 py-1 text-[11px] font-medium tracking-wide text-(--text-muted)';

export const creationSuggestionButtonClass =
  'rounded-full border-(--border) bg-(--surface) text-(--text-muted) hover:bg-(--surface-subtle) hover:text-(--text-strong)';

export const creationPrimaryButtonClass = editorPrimaryButtonClass;

export const creationFocusRingClass =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)';
