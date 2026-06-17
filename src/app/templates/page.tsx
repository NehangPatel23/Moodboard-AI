'use client';

import { Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageLabel } from '@/components/shared/PageLabel';
import { cn } from '@/lib/utils';
import { loadBoards, saveBoards, subscribeBoards, upsertBoard } from '@/lib/board-store';
import { readAppSettings } from '@/lib/settings-store';
import {
  fetchGeneratedBoardDraftFromTemplate,
  getBoardTemplates,
  runProgressiveBoardGeneration,
} from '@/lib/ai';
import { type GenerationPhase } from '@/components/creation/GenerationPreview';
import { TemplateGenerationPanel } from '@/components/creation/TemplateGenerationPanel';
import { TemplateUseTemplateButton } from '@/components/creation/TemplateUseTemplateButton';
import {
  hydrateTemplateMetadataStore,
  loadTemplateMetadata,
  recordTemplateOpen,
  recordTemplateUse,
  subscribeTemplateMetadata,
} from '@/lib/template-metadata';
import type { Board, BoardTemplate } from '@/types/board';
import {
  appModalScrimClass,
  appOutlineButtonClass,
  appPrimaryButtonClass,
  appSoftPanelClass,
  appSectionClass,
  appSwatchInsetClass,
} from '@/components/shared/app-surface-styles';

const outerPanelClass = appSectionClass;

const softPanelClass = appSoftPanelClass;

const primaryButtonClass = appPrimaryButtonClass;

const outlineButtonClass = appOutlineButtonClass;

/** Keep the completed preview visible before navigating to the editor. */
const BOARD_READY_REDIRECT_MS = 4000;

function normalizeText(value: string): string {
  return value.toLowerCase().trim();
}

function getBestForSummary(template: BoardTemplate): string {
  const haystack = normalizeText([template.name, template.description, template.prompt, ...template.tags].join(' '));

  if (haystack.includes('wellness')) {
    return 'Best for calm luxury brands, skincare, spa concepts, and elevated editorial systems.';
  }

  if (haystack.includes('fashion') || haystack.includes('editorial')) {
    return 'Best for campaign launches, bold visual systems, and expressive editorial storytelling.';
  }

  if (haystack.includes('fintech') || haystack.includes('product')) {
    return 'Best for product-led landing pages, trust-first interfaces, and structured SaaS messaging.';
  }

  return 'Best for polished concepting, creative direction, and early-stage brand exploration.';
}

function getFontFamily(fontName: string): string {
  const trimmed = fontName.trim();

  if (!trimmed) {
    return 'var(--font-sans), system-ui, sans-serif';
  }

  const serifFonts = new Set([
    'Bodoni Moda',
    'Cormorant Garamond',
    'Playfair Display',
    'Libre Baskerville',
    'Merriweather',
  ]);

  const monoFonts = new Set(['IBM Plex Mono', 'Space Mono', 'Courier New']);

  if (serifFonts.has(trimmed)) {
    return `'${trimmed}', var(--font-display), Georgia, serif`;
  }

  if (monoFonts.has(trimmed)) {
    return `'${trimmed}', 'Courier New', Courier, monospace`;
  }

  return `'${trimmed}', var(--font-sans), system-ui, sans-serif`;
}

function getTemplateSearchText(template: BoardTemplate): string {
  return [template.name, template.description, template.prompt, template.mood, template.summary, ...template.tags]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace('#', '');
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;

  if (expanded.length !== 6 || /[^0-9a-fA-F]/.test(expanded)) {
    return null;
  }

  return {
    r: parseInt(expanded.slice(0, 2), 16),
    g: parseInt(expanded.slice(2, 4), 16),
    b: parseInt(expanded.slice(4, 6), 16),
  };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function pickTintColors(palette?: BoardTemplate['palette']): Array<{ r: number; g: number; b: number }> {
  const parsed = (palette ?? [])
    .map((item) => hexToRgb(item.hex))
    .filter((rgb): rgb is { r: number; g: number; b: number } => rgb !== null);

  const usable = parsed.filter((rgb) => {
    const luminance = relativeLuminance(rgb);
    return luminance > 0.16 && luminance < 0.9;
  });

  const source = usable.length ? usable : parsed;

  return source.slice(0, 2);
}

function getCardTintStyle(palette?: BoardTemplate['palette']): CSSProperties {
  const [first, second] = pickTintColors(palette);

  if (!first) {
    return {};
  }

  const primary = second ?? first;
  const layers = [
    `radial-gradient(130% 90% at 0% 0%, rgba(${first.r}, ${first.g}, ${first.b}, 0.16), transparent 55%)`,
    `radial-gradient(120% 90% at 100% 0%, rgba(${primary.r}, ${primary.g}, ${primary.b}, 0.1), transparent 55%)`,
  ];

  return { background: layers.join(', ') };
}

function TemplateSwatchStrip({ palette }: { palette?: BoardTemplate['palette'] }) {
  const swatches = palette?.slice(0, 5) ?? [];

  if (!swatches.length) {
    return <div className="h-11 rounded-xl border border-(--border) bg-(--surface-muted)" aria-hidden="true" />;
  }

  return (
    <div className="flex gap-1.5" aria-hidden="true">
      {swatches.map((item) => (
        <div
          key={`${item.label}-${item.hex}`}
          className={`h-11 flex-1 rounded-xl ${appSwatchInsetClass}`}
          style={{ backgroundColor: item.hex }}
        />
      ))}
    </div>
  );
}

function TemplateCard({
  template,
  onPreview,
  onUseTemplate,
  isCreating,
  isActive,
  isFocused,
}: {
  template: BoardTemplate;
  onPreview: () => void;
  onUseTemplate: () => void;
  isCreating: boolean;
  isActive?: boolean;
  isFocused?: boolean;
}) {
  return (
    <Card
      id={`template-${template.id}`}
      className={cn(
        'relative flex h-full scroll-mt-28 flex-col overflow-hidden rounded-[1.75rem] transition hover:-translate-y-0.5',
        isActive && 'ring-2 ring-(--text-strong) ring-offset-2 ring-offset-(--background)',
        isFocused &&
          !isActive &&
          'ring-2 ring-amber-400/80 ring-offset-2 ring-offset-(--background) shadow-[var(--shadow-elevated)]',
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={getCardTintStyle(template.palette)}
      />
      <CardContent className="relative z-10 flex flex-1 flex-col gap-4 p-5">
        <div className="space-y-1.5">
          <h3 className="[font-family:var(--font-display),serif] text-2xl tracking-tight text-(--text-strong)">
            {template.name}
          </h3>
          <p className="line-clamp-2 text-sm leading-6 text-(--text-muted)">{template.description}</p>
        </div>

        <TemplateSwatchStrip palette={template.palette} />

        <div className="flex flex-wrap gap-2">
          {template.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-(--border) bg-(--surface-soft) px-3 py-1 text-[11px] font-medium capitalize tracking-wide text-(--text)"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-2 pt-2">
          <TemplateUseTemplateButton
            isCreating={isCreating}
            isActive={isActive}
            onClick={onUseTemplate}
            className="flex-1"
          >
            {isActive && isCreating ? 'Creating board...' : 'Use template'}
          </TemplateUseTemplateButton>
          <Button type="button" variant="ghost" onClick={onPreview} disabled={isCreating} className="rounded-full px-4">
            Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">{label}</p>
      {children}
    </div>
  );
}

function TemplatePreviewModal({
  template,
  onClose,
  onUseTemplate,
  isCreating,
  isGeneratingThisTemplate,
  creationStatus,
  previewBoard,
  generationPhase,
  enrichProgress,
}: {
  template: BoardTemplate;
  onClose: () => void;
  onUseTemplate: () => void;
  isCreating: boolean;
  isGeneratingThisTemplate: boolean;
  creationStatus: string | null;
  previewBoard: Board | null;
  generationPhase: GenerationPhase;
  enrichProgress: { done: number; total: number };
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isCreating) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isCreating, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${template.name}`}
    >
      <button
        type="button"
        aria-label="Close preview"
        onClick={isCreating ? undefined : onClose}
        disabled={isCreating}
        className={`absolute inset-0 cursor-default ${appModalScrimClass} disabled:cursor-not-allowed`}
      />

      <div className={cn(outerPanelClass, 'relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden')}>
        <div className="overflow-y-auto p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="secondary" className="capitalize">
              {template.tags[0] ?? 'Template'}
            </Badge>
            <h2 className="[font-family:var(--font-display),serif] text-4xl tracking-tight text-(--text-strong)">
              {template.name}
            </h2>
            <p className="text-sm leading-6 text-(--text-muted)">{template.description}</p>
          </div>

          <Button
            ref={closeRef}
            type="button"
            variant="outline"
            size="icon"
            onClick={onClose}
            disabled={isCreating}
            aria-label="Close preview"
            tooltip="Close preview"
            className="shrink-0 rounded-full text-(--text) hover:text-(--text-strong)"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 space-y-6">
          <div className={cn(softPanelClass, 'p-5')}>
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">Best for</p>
            <p className="mt-2 text-sm leading-6 text-(--text)">{getBestForSummary(template)}</p>
          </div>

          <DetailSection label="Prompt">
            <p className="rounded-3xl border border-(--border) bg-(--surface-subtle) p-4 text-sm leading-6 text-(--text)">
              {template.prompt}
            </p>
          </DetailSection>

          <DetailSection label="Palette">
            <TemplateSwatchStrip palette={template.palette} />
          </DetailSection>

          {template.typography?.length ? (
            <DetailSection label="Typography">
              <div className="space-y-3">
                {template.typography.slice(0, 3).map((item) => (
                  <div key={`${template.id}-${item.fontName}-${item.role}`} className={cn(softPanelClass, 'p-4')}>
                    <Badge variant="secondary">{item.role}</Badge>
                    <p
                      className="mt-2 text-2xl tracking-tight text-(--text-strong)"
                      style={{ fontFamily: getFontFamily(item.fontName) }}
                    >
                      {item.fontName}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-(--text-muted)">{item.note}</p>
                  </div>
                ))}
              </div>
            </DetailSection>
          ) : null}

          {template.notes?.length ? (
            <DetailSection label="Notes">
              <ul className="space-y-2">
                {template.notes.slice(0, 3).map((item) => (
                  <li
                    key={`${template.id}-${item.type}-${item.text}`}
                    className="rounded-[1.25rem] border border-(--border) bg-(--surface-subtle) p-3 text-sm leading-6 text-(--text)"
                  >
                    {item.text}
                  </li>
                ))}
              </ul>
            </DetailSection>
          ) : null}
        </div>

        {isGeneratingThisTemplate && (creationStatus || previewBoard) ? (
          <TemplateGenerationPanel
            status={creationStatus}
            board={previewBoard}
            phase={generationPhase}
            enrichProgress={enrichProgress}
            className="mt-6"
          />
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <TemplateUseTemplateButton
            isCreating={isCreating}
            isActive={isGeneratingThisTemplate}
            onClick={onUseTemplate}
          />
          <Button type="button" onClick={onClose} disabled={isCreating} className={outlineButtonClass}>
            Close
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
}

function TagFilterDropdown({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (tag: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
          selected.length > 0
            ? 'border-(--text-strong) bg-(--surface) text-(--text-strong)'
            : 'border-(--border) bg-(--surface) text-(--text-muted) hover:bg-(--surface-subtle) hover:text-(--text-strong)',
        )}
      >
        Tags
        {selected.length > 0 ? <span className="text-(--text-strong)">({selected.length})</span> : null}
        <ChevronDown className={cn('h-4 w-4 transition-transform', open ? 'rotate-180' : '')} />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-multiselectable="true"
          className={cn(
            outerPanelClass,
            'absolute left-0 z-30 mt-2 max-h-72 w-56 overflow-y-auto rounded-2xl p-2',
            'bg-(--surface-muted) backdrop-blur-xl',
          )}
        >
          {options.length ? (
            options.map((option) => {
              const checked = selected.includes(option);

              return (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={checked}
                  onClick={() => onToggle(option)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium capitalize transition',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring)',
                    checked ? 'text-(--text-strong)' : 'text-(--text)',
                    'hover:bg-(--surface-subtle)',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition',
                      checked ? 'border-(--text-strong) bg-(--text-strong) text-(--background)' : 'border-(--border)',
                    )}
                  >
                    {checked ? <Check className="h-3 w-3" /> : null}
                  </span>
                  {option}
                </button>
              );
            })
          ) : (
            <p className="px-3 py-2 text-sm text-(--text-muted)">No tags yet</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function TemplatesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTimerRef = useRef<number | null>(null);
  const focusHandledRef = useRef<string | null>(null);
  const templates = useMemo(() => getBoardTemplates(), []);
  const boards = useSyncExternalStore(subscribeBoards, loadBoards, loadBoards);
  useSyncExternalStore(subscribeTemplateMetadata, loadTemplateMetadata, loadTemplateMetadata);
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [previewBoard, setPreviewBoard] = useState<Board | null>(null);
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase>('draft');
  const [enrichProgress, setEnrichProgress] = useState({ done: 0, total: 0 });
  const [creationStatus, setCreationStatus] = useState<string | null>(null);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const [focusedTemplateId, setFocusedTemplateId] = useState<string | null>(null);

  const focusParam = searchParams.get('focus');

  useEffect(() => {
    hydrateTemplateMetadataStore();
  }, []);

  useEffect(() => {
    if (!focusParam || focusHandledRef.current === focusParam) return;

    const template = templates.find((item) => item.id === focusParam);
    if (!template) return;

    focusHandledRef.current = focusParam;

    const frameId = window.requestAnimationFrame(() => {
      setQuery('');
      setActiveFilters([]);
      setFocusedTemplateId(focusParam);

      const element = document.getElementById(`template-${focusParam}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    const clearHighlight = window.setTimeout(() => {
      setFocusedTemplateId((current) => (current === focusParam ? null : current));
    }, 3200);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(clearHighlight);
    };
  }, [focusParam, templates]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current !== null) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const filterOptions = useMemo(() => {
    const counts = new Map<string, number>();

    const countTag = (tag: string) => {
      const key = tag.toLowerCase().trim();
      if (!key) return;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    };

    for (const template of templates) {
      for (const tag of template.tags) {
        countTag(tag);
      }
    }

    for (const board of boards) {
      for (const tag of board.tags) {
        countTag(tag);
      }
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag]) => tag);
  }, [boards, templates]);

  const visibleTemplates = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    const normalizedFilters = activeFilters.map((item) => normalizeText(item));

    return templates
      .filter((template) => {
        const searchText = getTemplateSearchText(template);
        const matchesQuery = !normalizedQuery || searchText.includes(normalizedQuery);
        const matchesFilters =
          normalizedFilters.length === 0 ||
          normalizedFilters.every(
            (filter) =>
              template.tags.some((tag) => normalizeText(tag) === filter) ||
              normalizeText(template.mood ?? '').includes(filter),
          );

        return matchesQuery && matchesFilters;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeFilters, query, templates]);

  const previewTemplate = useMemo(
    () => templates.find((template) => template.id === previewTemplateId) ?? null,
    [previewTemplateId, templates],
  );

  const activeCreatingTemplate = useMemo(
    () =>
      creatingTemplateId
        ? (visibleTemplates.find((template) => template.id === creatingTemplateId) ?? null)
        : null,
    [creatingTemplateId, visibleTemplates],
  );

  const isGridGenerationFocus =
    creatingTemplateId !== null && previewTemplateId !== creatingTemplateId;

  const handlePreviewTemplate = (templateId: string) => {
    recordTemplateOpen(templateId);
    setPreviewTemplateId(templateId);
  };

  const handleUseTemplate = async (template: BoardTemplate) => {
    if (isCreating) return;

    setIsCreating(true);
    setCreatingTemplateId(template.id);
    setPreviewBoard(null);
    setGenerationPhase('draft');
    setEnrichProgress({ done: 0, total: 0 });
    setCreationStatus(`Creating ${template.name}...`);

    try {
      recordTemplateUse(template.id);

      const { board: enrichedBoard } = await runProgressiveBoardGeneration(
        fetchGeneratedBoardDraftFromTemplate(template.id),
        {
          onDraft: (draft) => {
            setPreviewBoard(draft.board);
            setCreationStatus('Creative direction ready. Finding reference images...');
          },
          onEnrichStart: (total) => {
            setGenerationPhase('enriching');
            setEnrichProgress({ done: 0, total });
          },
          onEnrichProgress: (done, total, board) => {
            setPreviewBoard(board);
            setEnrichProgress({ done, total });
            setCreationStatus(`Finding reference ${done} of ${total}...`);
          },
        },
      );

      setGenerationPhase('complete');

      const board = { ...enrichedBoard, visibility: readAppSettings().defaultVisibility };
      const existingBoards = loadBoards();
      const nextBoards = upsertBoard(existingBoards, board);
      saveBoards(nextBoards);

      setCreationStatus('Board ready — opening editor...');

      redirectTimerRef.current = window.setTimeout(() => {
        redirectTimerRef.current = null;
        setIsCreating(false);
        setCreatingTemplateId(null);
        setPreviewBoard(null);
        setCreationStatus(null);
        router.push(`/app/boards/${board.id}`);
      }, BOARD_READY_REDIRECT_MS);
    } catch {
      setCreationStatus('Failed to create board from template.');
      setIsCreating(false);
      setCreatingTemplateId(null);
      setPreviewBoard(null);
    }
  };

  const toggleFilter = (filter: string) => {
    setActiveFilters((current) =>
      current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter],
    );
  };

  const handleResetFilters = () => {
    setQuery('');
    setActiveFilters([]);
  };

  const hasActiveFilters = query.trim().length > 0 || activeFilters.length > 0;

  return (
    <div className="space-y-6 pb-10 text-(--text-strong)">
      <section className={cn(outerPanelClass, 'p-6 md:p-8')}>
        <div className="flex gap-4 md:gap-6">
          <PageLabel label="Templates" />

          <div className="flex flex-1 flex-col gap-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl space-y-3">
              <h1 className="[font-family:var(--font-display),serif] text-[clamp(2.2rem,4.5vw,3.4rem)] leading-[0.96] tracking-[-0.04em] text-(--text-strong)">
                Pick a starting point.
              </h1>
              <p className="text-sm leading-6 text-(--text-muted)">
                Preview a curated template, then create a board from it in one click.
              </p>
            </div>

            <Button type="button" onClick={() => router.push('/app/new')} className={primaryButtonClass}>
              Start from scratch
            </Button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-muted)" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search templates"
              aria-label="Search templates"
              className="h-12 rounded-full pl-11"
            />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveFilters([])}
                aria-pressed={activeFilters.length === 0}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm font-medium transition',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
                  activeFilters.length === 0
                    ? 'border-(--text-strong) bg-(--text-strong) text-(--background)!'
                    : 'border-(--border) bg-(--surface) text-(--text-muted) hover:bg-(--surface-subtle) hover:text-(--text-strong)',
                )}
              >
                All
              </button>

              <span className="h-6 w-px bg-(--border)" aria-hidden="true" />

              <TagFilterDropdown options={filterOptions} selected={activeFilters} onToggle={toggleFilter} />

              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className={cn(
                    'ml-auto rounded-full border border-(--border) bg-(--surface) px-4 py-2 text-sm font-medium text-(--text-muted) transition',
                    'hover:bg-(--surface-subtle) hover:text-(--text-strong)',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
                  )}
                >
                  Reset filters
                </button>
              ) : null}
            </div>

            {activeFilters.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {activeFilters.map((filter) => (
                  <span
                    key={filter}
                    className="inline-flex items-center gap-1.5 rounded-full border border-(--text-strong) bg-(--text-strong) py-1 pl-3 pr-1.5 text-sm font-medium capitalize text-(--background)!"
                  >
                    {filter}
                    <button
                      type="button"
                      onClick={() => toggleFilter(filter)}
                      aria-label={`Remove ${filter} filter`}
                      className="flex h-5 w-5 items-center justify-center rounded-full text-(--background)! transition hover:bg-white/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          </div>
        </div>
      </section>

      {visibleTemplates.length ? (
        isGridGenerationFocus && activeCreatingTemplate ? (
          <section className="space-y-6" aria-label="Creating board from template">
            <div className="max-w-md">
              <TemplateCard
                template={activeCreatingTemplate}
                onPreview={() => handlePreviewTemplate(activeCreatingTemplate.id)}
                onUseTemplate={() => void handleUseTemplate(activeCreatingTemplate)}
                isCreating={isCreating}
                isActive
                isFocused={focusedTemplateId === activeCreatingTemplate.id}
              />
            </div>
            <TemplateGenerationPanel
              status={creationStatus}
              board={previewBoard}
              phase={generationPhase}
              enrichProgress={enrichProgress}
            />
          </section>
        ) : (
          <section className="grid gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3 lg:gap-8" aria-label="Templates">
            {visibleTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onPreview={() => handlePreviewTemplate(template.id)}
                onUseTemplate={() => void handleUseTemplate(template)}
                isCreating={isCreating}
                isActive={creatingTemplateId === template.id}
                isFocused={focusedTemplateId === template.id}
              />
            ))}
          </section>
        )
      ) : (
        <Card className="rounded-4xl">
          <CardContent className="space-y-4 p-6">
            <h3 className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong)">
              Nothing matches your search.
            </h3>
            <p className="max-w-2xl text-sm leading-6 text-(--text-muted)">
              Try clearing the search or removing a filter to see more templates.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              {hasActiveFilters ? (
                <Button type="button" onClick={handleResetFilters} className={primaryButtonClass}>
                  Clear filters
                </Button>
              ) : null}
              <Button type="button" onClick={() => router.push('/app/new')} className={outlineButtonClass}>
                Start from scratch
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {previewTemplate ? (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplateId(null)}
          onUseTemplate={() => void handleUseTemplate(previewTemplate)}
          isCreating={isCreating}
          isGeneratingThisTemplate={creatingTemplateId === previewTemplate.id}
          creationStatus={creationStatus}
          previewBoard={previewBoard}
          generationPhase={generationPhase}
          enrichProgress={enrichProgress}
        />
      ) : null}
    </div>
  );
}

function TemplatesPageFallback() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-10 w-48 animate-pulse rounded-full bg-(--surface-subtle)" />
      <div className="h-12 w-full max-w-xl animate-pulse rounded-2xl bg-(--surface-subtle)" />
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-72 animate-pulse rounded-3xl bg-(--surface-subtle)" />
        ))}
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense fallback={<TemplatesPageFallback />}>
      <TemplatesPageContent />
    </Suspense>
  );
}
