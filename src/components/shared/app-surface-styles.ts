/**
 * Shared semantic surface tokens for landing, dashboard, discover, templates, and settings.
 * Board editor tokens remain in board-editor-styles.ts — import from here for app-wide shells.
 */

import {
  creationSectionClass,
  creationTemplateCardClass,
  dashboardCardClass,
  dashboardPreviewFallbackHex,
  dashboardPreviewLabelClass,
  editorSettingsCardClass,
  editorSettingsNestedClass,
} from '@/components/board/board-editor-styles';

export {
  creationSectionClass,
  creationTemplateCardClass,
  dashboardCardClass,
  dashboardPreviewFallbackHex,
  dashboardPreviewLabelClass,
  editorSettingsCardClass,
  editorSettingsNestedClass,
};

/** Page / section shells */
export const appSectionClass = creationSectionClass;

export const appElevatedCardClass =
  'overflow-hidden rounded-[1.75rem] border border-(--border) bg-(--surface-elevated) shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]';

export const appHeroSectionClass =
  'relative overflow-hidden rounded-[2.5rem] border border-(--border) bg-(--surface-elevated) p-6 shadow-[var(--shadow-card)] md:p-10';

export const appFeatureCardClass =
  'rounded-[1.75rem] border border-(--border) bg-(--surface-elevated) p-5 shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]';

export const appGlassPanelClass =
  'rounded-[1.75rem] border border-(--border) bg-(--surface)! shadow-[var(--shadow-card)] backdrop-blur-sm';

/** Buttons */
export const appPrimaryButtonClass =
  'group inline-flex h-11 items-center justify-center gap-2 rounded-full border border-transparent bg-(--text-strong)! px-5 text-sm font-medium text-(--background)! shadow-[var(--shadow-button)] transition hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)';

export const appOutlineButtonClass =
  'inline-flex h-11 items-center justify-center gap-2 rounded-full border border-(--border) bg-(--surface-elevated) px-5 text-sm font-medium text-(--text-strong) shadow-[var(--shadow-card)] transition hover:bg-(--surface-subtle) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)';

/** Overlays & modals */
export const appModalScrimClass = 'bg-[var(--overlay-scrim)] backdrop-blur-sm';

export const appOverlayBadgeClass =
  'inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white backdrop-blur-sm';

/** Board preview tiles (dashboard + discover) */
export const appPreviewTileClass =
  'relative aspect-square overflow-hidden rounded-[1rem] bg-(--surface-subtle) shadow-[var(--inset-highlight)]';

export const appPreviewTileOverlayClass =
  'absolute inset-0 bg-linear-to-tr from-black/12 via-transparent to-transparent';

export const appPreviewTileFooterClass =
  'absolute inset-x-0 bottom-0 h-14 bg-linear-to-t from-black/25 to-transparent';

export const appPreviewLabelClass = dashboardPreviewLabelClass;

export const appPreviewFallbackHex = dashboardPreviewFallbackHex;

export const appSoftPanelClass = 'rounded-[1.35rem] border border-(--border) bg-(--surface-soft)';
export const appSwatchInsetClass =
  'shadow-[inset_0_0_0_1px_var(--border)]';

export const appColorPickerTileClass =
  'rounded-2xl border border-(--border) shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)';

/** Typography */
export const appSectionLabelClass =
  'text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)';

export const appDisplayHeadingClass =
  '[font-family:var(--font-display),serif] tracking-[-0.04em] text-(--text-strong)';

export const appHeroGradientClass =
  'pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_0%,color-mix(in_srgb,var(--accent)_22%,transparent),transparent_58%),radial-gradient(90%_70%_at_100%_0%,color-mix(in_srgb,var(--ring)_24%,transparent),transparent_52%),radial-gradient(80%_60%_at_50%_100%,color-mix(in_srgb,var(--accent-strong)_18%,transparent),transparent_58%)]';
