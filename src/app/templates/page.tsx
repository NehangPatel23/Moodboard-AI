'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Clock3,
  Search,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { loadBoards, saveBoards, upsertBoard } from '@/lib/board-store';
import { generateBoardDraftFromTemplate, getBoardTemplates } from '@/lib/ai';
import {
  hydrateTemplateMetadataStore,
  loadTemplateMetadata,
  recordTemplateOpen,
  recordTemplateUse,
  subscribeTemplateMetadata,
} from '@/lib/template-metadata';
import type { BoardTemplate } from '@/types/board';

type TemplateSort = 'recent' | 'popular' | 'alphabetical';

const SORT_OPTIONS: Array<{ value: TemplateSort; label: string }> = [
  { value: 'recent', label: 'Recently used' },
  { value: 'popular', label: 'Most popular' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

function normalizeText(value: string): string {
  return value.toLowerCase().trim();
}

function formatRelativeTime(value: string | null): string {
  if (!value) return 'Never';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Never';

  const delta = Date.now() - date.getTime();
  const seconds = Math.max(0, Math.floor(delta / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
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

function getTemplateSearchText(template: BoardTemplate): string {
  return [template.name, template.description, template.prompt, template.mood, template.summary, ...template.tags]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function getTemplateUsageLabel(usageCount: number): string {
  return `Used in ${usageCount} board${usageCount === 1 ? '' : 's'}`;
}

function getTemplateStatValue(value: number): string {
  return value.toString().padStart(2, '0');
}

function TemplateSwatchStrip({ palette }: { palette?: BoardTemplate['palette'] }) {
  const swatches = palette?.slice(0, 4) ?? [];

  if (!swatches.length) {
    return (
      <div className="grid grid-cols-4 gap-2">
        <div className="h-12 rounded-2xl border border-slate-200 bg-slate-100" />
        <div className="h-12 rounded-2xl border border-slate-200 bg-slate-100" />
        <div className="h-12 rounded-2xl border border-slate-200 bg-slate-100" />
        <div className="h-12 rounded-2xl border border-slate-200 bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {swatches.map((item) => (
        <div key={`${item.label}-${item.hex}`} className="space-y-2">
          <div
            className="h-12 rounded-2xl border border-slate-200"
            style={{ backgroundColor: item.hex }}
            aria-hidden="true"
          />
          <p className="text-[11px] text-slate-500">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

function StatChip({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.24em] text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-lg font-medium tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function TemplateCard({
  template,
  active,
  usageCount,
  lastOpenedAt,
  onPreview,
  onUseTemplate,
  isCreating,
}: {
  template: BoardTemplate;
  active: boolean;
  usageCount: number;
  lastOpenedAt: string | null;
  onPreview: () => void;
  onUseTemplate: () => void;
  isCreating: boolean;
}) {
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onPreview();
    }
  };

  const paletteCount = template.palette?.length ?? 0;
  const typographyCount = template.typography?.length ?? 0;
  const referenceCount = template.references?.length ?? 0;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onPreview}
      onKeyDown={handleKeyDown}
      aria-pressed={active}
      aria-label={`Preview template ${template.name}`}
      className={cn(
        'group cursor-pointer text-left transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2',
        'rounded-[1.75rem]',
      )}
    >
      <Card className={cn('h-full overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm')}>
        <div className="h-1.5 bg-linear-to-r from-slate-200 via-[#cbd7c8] to-[#d7c4b3]" />
        <CardContent className="space-y-5 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <h3 className="[font-family:var(--font-display),serif] text-2xl tracking-tight text-slate-950">
                {template.name}
              </h3>
              <p className="text-sm leading-6 text-slate-500">{template.description}</p>
            </div>

            {active ? <Badge variant="secondary">Selected</Badge> : <Badge variant="secondary">Preview</Badge>}
          </div>

          <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">Mood</p>
            <p className="[font-family:var(--font-display),serif] mt-2 text-xl tracking-tight text-slate-950">
              {template.mood ?? template.name}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">{template.summary ?? template.prompt}</p>
          </div>

          <p className="text-sm leading-6 text-slate-600">{getBestForSummary(template)}</p>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatChip label="Used" value={getTemplateStatValue(usageCount)} icon={<Clock3 className="h-3.5 w-3.5" />} />
            <StatChip label="Refs" value={getTemplateStatValue(referenceCount)} />
            <StatChip label="Type" value={getTemplateStatValue(typographyCount)} />
            <StatChip label="Palette" value={getTemplateStatValue(paletteCount)} />
          </div>

          <TemplateSwatchStrip palette={template.palette} />

          <div className="flex flex-wrap gap-2">
            {template.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium tracking-wide text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="space-y-1">
              <span className="block text-xs uppercase tracking-[0.24em] text-slate-400">{getTemplateUsageLabel(usageCount)}</span>
              <span className="block text-[11px] text-slate-500">Last opened {formatRelativeTime(lastOpenedAt)}</span>
            </div>

            <Button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onUseTemplate();
              }}
              disabled={isCreating}
              className="rounded-full bg-slate-950 px-4 text-white shadow-sm hover:bg-slate-800"
            >
              {isCreating && active ? 'Creating...' : 'Use template'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </article>
  );
}

function CompactTemplateCard({
  template,
  active,
  usageCount,
  lastOpenedAt,
  onPreview,
}: {
  template: BoardTemplate;
  active: boolean;
  usageCount: number;
  lastOpenedAt: string | null;
  onPreview: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPreview}
      aria-pressed={active}
      className={cn(
        'group flex w-full flex-col items-start gap-4 rounded-3xl border p-4 text-left transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2',
        active ? 'border-slate-300 bg-slate-50' : 'border-slate-200 bg-white hover:bg-slate-50',
      )}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate [font-family:var(--font-display),serif] text-xl tracking-tight text-slate-950">{template.name}</p>
          <p className="line-clamp-2 text-sm leading-6 text-slate-500">{getBestForSummary(template)}</p>
        </div>
        {active ? <Badge variant="secondary">Selected</Badge> : <Badge variant="secondary">Open</Badge>}
      </div>

      <div className="flex w-full flex-wrap items-center gap-2 text-[11px] text-slate-500">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
          {getTemplateUsageLabel(usageCount)}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
          Last opened {formatRelativeTime(lastOpenedAt)}
        </span>
      </div>
    </button>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-slate-400">{eyebrow}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-slate-950">{title}</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const router = useRouter();
  const templates = useMemo(() => getBoardTemplates(), []);
  const templateMetadata = useSyncExternalStore(subscribeTemplateMetadata, loadTemplateMetadata, loadTemplateMetadata);
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<TemplateSort>('recent');
  const [activeTemplateId, setActiveTemplateId] = useState<string>(templates[0]?.id ?? '');
  const [isCreating, setIsCreating] = useState(false);

  useMemo(() => hydrateTemplateMetadataStore(), []);

  const filterOptions = useMemo(() => {
    const counts = new Map<string, number>();

    for (const template of templates) {
      for (const tag of template.tags) {
        const key = tag.toLowerCase();
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag]) => tag);
  }, [templates]);

  const templateRows = useMemo(
    () =>
      templates.map((template) => {
        const metadata = templateMetadata[template.id] ?? {
          usageCount: 0,
          lastOpenedAt: null,
          lastUsedAt: null,
        };

        return {
          template,
          metadata,
          searchText: getTemplateSearchText(template),
        };
      }),
    [templateMetadata, templates],
  );

  const visibleTemplates = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    const normalizedFilters = activeFilters.map((item) => normalizeText(item));

    return templateRows.filter(({ template, searchText }) => {
      const matchesQuery = !normalizedQuery || searchText.includes(normalizedQuery);
      const matchesFilters =
        normalizedFilters.length === 0 ||
        normalizedFilters.every((filter) =>
          template.tags.some((tag) => normalizeText(tag) === filter) || normalizeText(template.mood ?? '').includes(filter),
        );

      return matchesQuery && matchesFilters;
    });
  }, [activeFilters, query, templateRows]);

  const sortedAllTemplates = useMemo(() => {
    const next = [...visibleTemplates];

    return next.sort((a, b) => {
      if (sortMode === 'alphabetical') {
        return a.template.name.localeCompare(b.template.name);
      }

      if (sortMode === 'popular') {
        return (
          b.metadata.usageCount - a.metadata.usageCount ||
          (b.metadata.lastUsedAt ?? b.metadata.lastOpenedAt ?? '').localeCompare(
            a.metadata.lastUsedAt ?? a.metadata.lastOpenedAt ?? '',
          ) || a.template.name.localeCompare(b.template.name)
        );
      }

      return (
        (b.metadata.lastOpenedAt ?? b.metadata.lastUsedAt ?? '').localeCompare(
          a.metadata.lastOpenedAt ?? a.metadata.lastUsedAt ?? '',
        ) || b.metadata.usageCount - a.metadata.usageCount || a.template.name.localeCompare(b.template.name)
      );
    });
  }, [sortMode, visibleTemplates]);

  const activeTemplate =
    sortedAllTemplates.find((item) => item.template.id === activeTemplateId) ??
    visibleTemplates.find((item) => item.template.id === activeTemplateId) ??
    sortedAllTemplates[0] ??
    visibleTemplates[0] ??
    templateRows[0] ??
    null;

  const recentlyUsedTemplates = useMemo(() => {
    return [...visibleTemplates]
      .filter((item) => item.metadata.lastOpenedAt)
      .sort(
        (a, b) =>
          (b.metadata.lastOpenedAt ?? '').localeCompare(a.metadata.lastOpenedAt ?? '') ||
          b.metadata.usageCount - a.metadata.usageCount ||
          a.template.name.localeCompare(b.template.name),
      )
      .slice(0, 3);
  }, [visibleTemplates]);

  const popularTemplates = useMemo(() => {
    return [...visibleTemplates]
      .sort(
        (a, b) =>
          b.metadata.usageCount - a.metadata.usageCount ||
          (b.metadata.lastUsedAt ?? b.metadata.lastOpenedAt ?? '').localeCompare(
            a.metadata.lastUsedAt ?? a.metadata.lastOpenedAt ?? '',
          ) || a.template.name.localeCompare(b.template.name),
      )
      .slice(0, 3);
  }, [visibleTemplates]);

  const handlePreviewTemplate = (templateId: string) => {
    const nextTemplate = templates.find((template) => template.id === templateId);
    if (!nextTemplate) return;

    recordTemplateOpen(templateId);
    setActiveTemplateId(templateId);
  };

  const handleUseTemplate = async (template: BoardTemplate) => {
    if (isCreating) return;

    setActiveTemplateId(template.id);
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

  const visibleCount = visibleTemplates.length;
  const activeUsageCount = activeTemplate ? (templateMetadata[activeTemplate.template.id]?.usageCount ?? 0) : 0;
  const activeLastOpenedAt = activeTemplate ? templateMetadata[activeTemplate.template.id]?.lastOpenedAt ?? null : null;

  return (
    <div className="space-y-8">
      <section className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
              Templates
            </Badge>
            <h1 className="[font-family:var(--font-display),serif] text-[clamp(2.8rem,6vw,5rem)] leading-[0.94] tracking-[-0.04em] text-slate-950">
              Browse starting points for creative direction boards.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
              Search, filter, and sort curated templates, then preview the details that matter before creating a board.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-slate-400 md:block">
              Curated directions
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
              {visibleCount} visible
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/app/new')}
              className="rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950"
            >
              Create board
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
          <div className="space-y-3">
            <label htmlFor="template-search" className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-400">
              Search templates
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="template-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, prompt, mood, or tags"
                aria-label="Search templates"
                className="h-12 rounded-[1.25rem] pl-11"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-400">Sort</p>
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSortMode(option.value)}
                    aria-pressed={sortMode === option.value}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm font-medium transition',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2',
                      sortMode === option.value ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-950',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setQuery('');
                setActiveFilters([]);
                setSortMode('recent');
              }}
              className="rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950"
            >
              Reset filters
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-slate-400">Filter chips</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveFilters([])}
              aria-pressed={activeFilters.length === 0}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2',
                activeFilters.length === 0
                  ? 'border-slate-950 bg-slate-950 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950',
              )}
            >
              All
            </button>
            {filterOptions.map((filter) => {
              const active = activeFilters.includes(filter);

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => {
                    setActiveFilters((current) =>
                      current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter],
                    );
                  }}
                  aria-pressed={active}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-medium transition capitalize',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2',
                    active
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950',
                  )}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-4xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2">
                <CardTitle className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-slate-950">
                  Recently used
                </CardTitle>
                <CardDescription>
                  Templates you opened or used most recently will appear here.
                </CardDescription>
              </div>
              <Badge variant="secondary">{recentlyUsedTemplates.length} shown</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentlyUsedTemplates.length ? (
              recentlyUsedTemplates.map(({ template, metadata }) => (
                <CompactTemplateCard
                  key={`recent-${template.id}`}
                  template={template}
                  active={activeTemplate?.template.id === template.id}
                  usageCount={metadata.usageCount}
                  lastOpenedAt={metadata.lastOpenedAt}
                  onPreview={() => handlePreviewTemplate(template.id)}
                />
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
                No recently used templates yet. Open or create a template to see it here.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-4xl border border-slate-200 bg-white shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2">
                <CardTitle className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-slate-950">
                  Popular templates
                </CardTitle>
                <CardDescription>
                  Ranked by how often they have been used to create boards.
                </CardDescription>
              </div>
              <Badge variant="secondary">Top picks</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {popularTemplates.length ? (
              popularTemplates.map(({ template, metadata }) => (
                <CompactTemplateCard
                  key={`popular-${template.id}`}
                  template={template}
                  active={activeTemplate?.template.id === template.id}
                  usageCount={metadata.usageCount}
                  lastOpenedAt={metadata.lastOpenedAt}
                  onPreview={() => handlePreviewTemplate(template.id)}
                />
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
                Popular templates will appear once a few boards have been created.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4" aria-label="Templates list">
          <SectionHeading
            eyebrow="All templates"
            title="Browse everything"
            description="The main library respects your search, filter, and sort choices so you can move quickly through the catalog."
          />

          {sortedAllTemplates.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {sortedAllTemplates.map(({ template, metadata }) => {
                const active = activeTemplate?.template.id === template.id;

                return (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    active={active}
                    usageCount={metadata.usageCount}
                    lastOpenedAt={metadata.lastOpenedAt}
                    onPreview={() => handlePreviewTemplate(template.id)}
                    onUseTemplate={() => void handleUseTemplate(template)}
                    isCreating={isCreating}
                  />
                );
              })}
            </div>
          ) : (
            <Card className="rounded-4xl border border-slate-200 bg-white shadow-sm">
              <CardContent className="space-y-4 p-6">
                <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
                  No results
                </Badge>
                <h3 className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-slate-950">
                  Nothing matches those filters.
                </h3>
                <p className="max-w-2xl text-sm leading-6 text-slate-500">
                  Try clearing the search, removing a filter chip, or changing the sort mode to reveal more templates.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <Button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setActiveFilters([]);
                      setSortMode('recent');
                    }}
                    className="rounded-full bg-slate-950 px-5 text-white shadow-sm hover:bg-slate-800"
                  >
                    Clear filters
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/app/new')}
                    className="rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                  >
                    Create a board
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        <aside className="space-y-5">
          <div className="sticky top-6 rounded-[2.25rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
            {activeTemplate ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">Preview</Badge>
                  <Badge variant="secondary">{activeTemplate.template.tags[0] ?? 'Template'}</Badge>
                  <Badge variant="secondary">{getTemplateUsageLabel(activeUsageCount)}</Badge>
                </div>

                <div className="space-y-2">
                  <h2 className="[font-family:var(--font-display),serif] text-4xl tracking-tight text-slate-950">
                    {activeTemplate.template.name}
                  </h2>
                  <p className="text-sm leading-6 text-slate-500">{activeTemplate.template.description}</p>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">Best for</p>
                  <p className="[font-family:var(--font-display),serif] mt-2 text-2xl tracking-tight text-slate-950">
                    {getBestForSummary(activeTemplate.template)}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{activeTemplate.template.summary ?? activeTemplate.template.prompt}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <StatChip label="Usage" value={getTemplateStatValue(activeUsageCount)} icon={<Sparkles className="h-3.5 w-3.5" />} />
                  <StatChip label="References" value={getTemplateStatValue(activeTemplate.template.references?.length ?? 0)} />
                  <StatChip label="Typography" value={getTemplateStatValue(activeTemplate.template.typography?.length ?? 0)} />
                  <StatChip label="Palette" value={getTemplateStatValue(activeTemplate.template.palette?.length ?? 0)} />
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">Prompt</p>
                  <p className="rounded-3xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                    {activeTemplate.template.prompt}
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">Palette</p>
                  <TemplateSwatchStrip palette={activeTemplate.template.palette} />
                </div>

                {activeTemplate.template.typography?.length ? (
                  <div className="space-y-3">
                    <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">Typography</p>
                    <div className="space-y-3">
                      {activeTemplate.template.typography.slice(0, 3).map((item) => (
                        <div
                          key={`${activeTemplate.template.id}-${item.fontName}-${item.role}`}
                          className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <Badge variant="secondary">{item.role}</Badge>
                          <p className="[font-family:var(--font-display),serif] mt-2 text-xl tracking-tight text-slate-950">
                            {item.fontName}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-500">{item.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {activeTemplate.template.references?.length ? (
                  <div className="space-y-3">
                    <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">References</p>
                    <p className="text-sm leading-6 text-slate-600">
                      {activeTemplate.template.references.length} visual reference
                      {activeTemplate.template.references.length === 1 ? '' : 's'} included.
                    </p>
                  </div>
                ) : null}

                {activeTemplate.template.notes?.length ? (
                  <div className="space-y-3">
                    <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">Notes</p>
                    <ul className="space-y-2">
                      {activeTemplate.template.notes.slice(0, 3).map((item) => (
                        <li
                          key={`${activeTemplate.template.id}-${item.type}-${item.text}`}
                          className="rounded-[1.25rem] border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-600"
                        >
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={() => void handleUseTemplate(activeTemplate.template)}
                    disabled={isCreating}
                    className="rounded-full bg-slate-950 px-5 text-white shadow-sm hover:bg-slate-800"
                  >
                    {isCreating ? 'Creating board...' : 'Use template'}
                    <Sparkles className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/app/new')}
                    className="rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                  >
                    Open create board
                  </Button>
                </div>

                <p className="text-xs leading-5 text-slate-400" aria-live="polite">
                  Last opened {formatRelativeTime(activeLastOpenedAt)}. Changes are saved locally when a board is created.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Badge variant="outline">No templates</Badge>
                <h2 className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-slate-950">
                  Nothing to preview yet.
                </h2>
                <p className="text-sm leading-6 text-slate-500">
                  Template browsing is ready once template data exists.
                </p>
              </div>
            )}
          </div>

          <p className="px-2 pt-4 text-xs leading-5 text-slate-400" aria-live="polite">
            {isCreating
              ? 'Creating a board from the selected template...'
              : 'Select a template to preview it here.'}
          </p>
        </aside>
      </div>
    </div>
  );
}