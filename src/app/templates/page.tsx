'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, Search, Sparkles, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageLabel } from '@/components/shared/PageLabel';
import { cn } from '@/lib/utils';
import { loadBoards, saveBoards, subscribeBoards, upsertBoard } from '@/lib/board-store';
import { generateBoardDraftFromTemplate, getBoardTemplates } from '@/lib/ai';
import {
  hydrateTemplateMetadataStore,
  loadTemplateMetadata,
  recordTemplateOpen,
  recordTemplateUse,
  subscribeTemplateMetadata,
} from '@/lib/template-metadata';
import type { BoardTemplate } from '@/types/board';

const outerPanelClass =
  'rounded-[2.5rem] border border-(--border) bg-(--surface-elevated) shadow-[0_24px_60px_rgba(15,23,42,0.06)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.22)]';

const softPanelClass = 'rounded-[1.35rem] border border-(--border) bg-(--surface-soft)';

const primaryButtonClass =
  'rounded-full bg-(--text-strong) px-5 text-(--background)! shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60';

const softPrimaryButtonClass =
  'rounded-full bg-[color-mix(in_srgb,var(--text-strong)_88%,var(--surface)_12%)] px-5 text-(--background)! shadow-sm transition hover:bg-(--text-strong) disabled:cursor-not-allowed disabled:opacity-60';

const outlineButtonClass =
  'rounded-full border border-(--border) bg-(--surface) px-4 text-(--text) transition hover:bg-(--surface-subtle) hover:text-(--text-strong) dark:bg-[rgba(255,255,255,0.04)] dark:text-(--text) dark:hover:bg-[rgba(255,255,255,0.08)] dark:hover:text-(--text-strong)';

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
          className="h-11 flex-1 rounded-xl shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
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
}: {
  template: BoardTemplate;
  onPreview: () => void;
  onUseTemplate: () => void;
  isCreating: boolean;
}) {
  return (
    <Card className="relative flex h-full flex-col overflow-hidden rounded-[1.75rem] transition hover:-translate-y-0.5">
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
          <Button type="button" onClick={onUseTemplate} disabled={isCreating} className={cn(softPrimaryButtonClass, 'flex-1')}>
            Use template
            <Sparkles className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" onClick={onPreview} className="rounded-full px-4">
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
}: {
  template: BoardTemplate;
  onClose: () => void;
  onUseTemplate: () => void;
  isCreating: boolean;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
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
  }, [onClose]);

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
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-sm"
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
            aria-label="Close preview"
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
            <p className="rounded-3xl border border-(--border) bg-(--surface) p-4 text-sm leading-6 text-(--text) dark:bg-[rgba(255,255,255,0.03)]">
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
                    className="rounded-[1.25rem] border border-(--border) bg-(--surface) p-3 text-sm leading-6 text-(--text) dark:bg-[rgba(255,255,255,0.03)]"
                  >
                    {item.text}
                  </li>
                ))}
              </ul>
            </DetailSection>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button type="button" onClick={onUseTemplate} disabled={isCreating} className={primaryButtonClass}>
            {isCreating ? 'Creating board...' : 'Use template'}
            <Sparkles className="h-4 w-4" />
          </Button>
          <Button type="button" onClick={onClose} className={outlineButtonClass}>
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

export default function TemplatesPage() {
  const router = useRouter();
  const templates = useMemo(() => getBoardTemplates(), []);
  const boards = useSyncExternalStore(subscribeBoards, loadBoards, loadBoards);
  useSyncExternalStore(subscribeTemplateMetadata, loadTemplateMetadata, loadTemplateMetadata);
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    hydrateTemplateMetadataStore();
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

  const handlePreviewTemplate = (templateId: string) => {
    recordTemplateOpen(templateId);
    setPreviewTemplateId(templateId);
  };

  const handleUseTemplate = async (template: BoardTemplate) => {
    if (isCreating) return;

    setIsCreating(true);

    try {
      recordTemplateUse(template.id);
      const generated = generateBoardDraftFromTemplate(template.id);

      if (!generated) {
        throw new Error('Unable to create board from template.');
      }

      const existingBoards = loadBoards();
      const nextBoards = upsertBoard(existingBoards, generated.board);
      saveBoards(nextBoards);

      router.push(`/app/boards/${generated.board.id}`);
    } finally {
      setIsCreating(false);
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
        <section className="grid gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3 lg:gap-8" aria-label="Templates">
          {visibleTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={() => handlePreviewTemplate(template.id)}
              onUseTemplate={() => void handleUseTemplate(template)}
              isCreating={isCreating}
            />
          ))}
        </section>
      ) : (
        <Card className="rounded-4xl">
          <CardContent className="space-y-4 p-6">
            <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
              No results
            </Badge>
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
        />
      ) : null}
    </div>
  );
}
