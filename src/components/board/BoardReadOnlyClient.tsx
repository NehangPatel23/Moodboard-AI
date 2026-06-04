'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon, Layers3, Palette, Sparkles, Type } from 'lucide-react';
import type { NoteType, TypographyRole } from '@/types/board';
import { loadBoards, subscribeBoards } from '@/lib/board-store';
import {
  DEFAULT_APP_SETTINGS,
  readAppSettings,
  subscribeAppSettings,
} from '@/lib/settings-store';
import { formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Lightbulb,
  ClipboardList,
  Tag,
} from 'lucide-react';

type BoardReadOnlyClientProps = {
  boardId: string;
};

const PRESENTATION_SECTIONS = ['overview', 'palette', 'typography', 'references', 'notes'] as const;
type PresentationSection = (typeof PRESENTATION_SECTIONS)[number];

const SECTION_META: Record<
  PresentationSection,
  {
    label: string;
    description: string;
    icon: typeof Sparkles;
  }
> = {
  overview: {
    label: 'Overview',
    description: 'Creative direction and summary.',
    icon: Sparkles,
  },
  palette: {
    label: 'Palette',
    description: 'Core color direction.',
    icon: Palette,
  },
  typography: {
    label: 'Typography',
    description: 'Font choices and usage notes.',
    icon: Type,
  },
  references: {
    label: 'References',
    description: 'Inspiration grid and visual assets.',
    icon: ImageIcon,
  },
  notes: {
    label: 'Notes',
    description: 'Captured ideas and instructions.',
    icon: Layers3,
  },
};

const FALLBACK_REFERENCE_IMAGES = [
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
];

const TYPOGRAPHY_FALLBACK_FAMILIES: Record<string, string> = {
  sora: '"Sora", var(--font-sans), sans-serif',
  inter: '"Inter", var(--font-sans), sans-serif',
  'dm sans': '"DM Sans", var(--font-sans), sans-serif',
  'bodoni moda': '"Bodoni Moda", var(--font-display), serif',
  'courier new': '"Courier New", Courier, monospace',
  'ibm plex mono': '"IBM Plex Mono", "Courier New", Courier, monospace',
};

const outerPanelClass =
  'rounded-[2.5rem] border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.22)] md:p-8';

const innerPanelClass =
  'rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] shadow-[0_10px_30px_rgba(15,23,42,0.04)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.18)]';

const softPanelClass =
  'rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-soft)] p-4';

const actionLinkClass =
  'inline-flex h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-medium text-[var(--text-strong)] transition hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] dark:bg-[rgba(255,255,255,0.04)] dark:text-[var(--text-strong)] dark:hover:bg-[rgba(255,255,255,0.08)]';

function getFallbackReferenceImage(index: number): string {
  return FALLBACK_REFERENCE_IMAGES[index % FALLBACK_REFERENCE_IMAGES.length];
}

function NoteTypeIcon({ type }: { type: NoteType }) {
  switch (type) {
    case 'idea':
      return <Lightbulb className="h-3.5 w-3.5" />;

    case 'instruction':
      return <ClipboardList className="h-3.5 w-3.5" />;

    case 'keyword':
      return <Tag className="h-3.5 w-3.5" />;

    default:
      return null;
  }
}

function getTypographyPreviewFamily(fontName: string, role: TypographyRole) {
  const normalized = fontName.trim().toLowerCase();

  for (const [key, family] of Object.entries(TYPOGRAPHY_FALLBACK_FAMILIES)) {
    if (normalized.includes(key)) return family;
  }

  if (role === 'heading') return 'var(--font-display), serif';
  if (role === 'body') return 'var(--font-sans), sans-serif';

  return 'var(--font-sans), sans-serif';
}

function PresentationPill({
  label,
  description,
  icon: Icon,
  active,
  onClick,
  index,
}: {
  label: string;
  description: string;
  icon: typeof Sparkles;
  active: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`Show ${label} section`}
      className={[
        'flex min-w-40 items-start gap-3 rounded-3xl border px-4 py-3 text-left transition',
        'border-(--border) bg-(--surface) text-(--text-strong)',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
        'hover:bg-(--surface-subtle) dark:bg-[rgba(255,255,255,0.03)] dark:hover:bg-[rgba(255,255,255,0.06)]',
        active ? 'bg-(--surface-subtle) shadow-sm dark:bg-[rgba(255,255,255,0.08)]' : '',
      ].join(' ')}
    >
      <div
        className={[
          'mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border',
          'border-(--border) bg-(--surface-elevated) dark:bg-[rgba(255,255,255,0.05)]',
        ].join(' ')}
      >
        <Icon
          className={active ? 'h-4 w-4 text-(--text-strong)' : 'h-4 w-4 text-(--text-muted)'}
        />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium">
          {index + 1}. {label}
        </p>
        <p className="mt-1 text-xs text-(--text-muted)">{description}</p>
      </div>
    </button>
  );
}

function ReadOnlyReferenceCard({
  title,
  imageUrl,
  category,
  source,
  index,
}: {
  title: string;
  imageUrl?: string;
  category: string;
  source?: string;
  index: number;
}) {
  const src = imageUrl || getFallbackReferenceImage(index);

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-(--border) bg-(--surface) shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
      <div className="relative aspect-4/3 w-full overflow-hidden">
        <Image
          src={src}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent" />
      </div>

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{category}</Badge>
          {source ? <span className="text-xs text-(--text-muted)">{source}</span> : null}
        </div>

        <p className="text-sm leading-6 text-(--text-muted)">{title}</p>
      </div>
    </article>
  );
}

function ReadOnlyNoteCard({
  text,
  type,
}: {
  text: string;
  type: NoteType;
}) {
  const noteToneClasses: Record<NoteType, string> = {
    idea: 'border-amber-200 bg-amber-50 dark:border-amber-300/30 dark:bg-amber-300/14',
    instruction: 'border-sky-200 bg-sky-50 dark:border-sky-300/30 dark:bg-sky-300/14',
    keyword: 'border-violet-200 bg-violet-50 dark:border-violet-300/30 dark:bg-violet-300/14',
  };

  return (
    <article
      className={[
        'rounded-[1.75rem] border p-4 shadow-sm',
        noteToneClasses[type],
        'text-(--text-strong)',
      ].join(' ')}
    >
      <Badge
        variant="secondary"
        className="gap-1.5"
      >
        <NoteTypeIcon type={type} />
        {type}
      </Badge>

      <p className="mt-4 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-(--text-strong)">
        {text}
      </p>
    </article>
  );
}

export function BoardReadOnlyClient({ boardId }: BoardReadOnlyClientProps) {
  const router = useRouter();
  const boards = useSyncExternalStore(subscribeBoards, loadBoards, loadBoards);
  const board = boards.find((item) => item.id === boardId);

  const presentationModeEnabled = useSyncExternalStore(
    subscribeAppSettings,
    () => readAppSettings().presentationModeEnabled,
    () => DEFAULT_APP_SETTINGS.presentationModeEnabled,
  );

  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  const activeSection = PRESENTATION_SECTIONS[activeSectionIndex];
  const activeSectionMeta = SECTION_META[activeSection];

  const presentationSections = useMemo(
    () =>
      PRESENTATION_SECTIONS.map((section) => ({
        key: section,
        ...SECTION_META[section],
      })),
    [],
  );

  useEffect(() => {
    if (!presentationModeEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!board) return;

      if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        setActiveSectionIndex((current) => (current + 1) % PRESENTATION_SECTIONS.length);
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setActiveSectionIndex(
          (current) => (current - 1 + PRESENTATION_SECTIONS.length) % PRESENTATION_SECTIONS.length,
        );
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        router.push(`/app/boards/${board.id}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, router, presentationModeEnabled]);

  if (!board) {
    return (
      <section className="rounded-[2.5rem] border border-(--border) bg-(--surface-elevated) p-8 text-(--text-strong) shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
          Board not found
        </p>
        <h1 className="[font-family:var(--font-display),serif] mt-3 text-4xl tracking-tight text-(--text-strong)">
          This share link is outdated.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-(--text-muted)">
          The board may have been deleted or the link may no longer be valid.
        </p>
        <div className="mt-6">
          <Button
            type="button"
            onClick={() => router.push('/app')}
            className="rounded-full bg-(--text-strong) text-(--background) hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
          >
            Back to boards
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-8 pb-10 text-(--text-strong)">
      <section className={outerPanelClass}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{presentationModeEnabled ? 'Presentation mode' : 'Read-only'}</Badge>
                <Badge variant="secondary">{board.visibility}</Badge>
                {board.isFavorite ? <Badge variant="secondary">Favorite</Badge> : null}
              </div>

              <h1 className="[font-family:var(--font-display),serif] text-[clamp(3rem,7vw,5.6rem)] leading-[0.94] tracking-[-0.04em] text-(--text-strong)">
                {board.title}
              </h1>

              <p className="max-w-3xl text-sm leading-6 text-(--text-muted)">
                Prompt: <span className="font-medium text-(--text-strong)">{board.prompt}</span>
              </p>

              <p className="max-w-4xl text-base leading-7 text-(--text-muted)">{board.summary}</p>

              <div className="flex flex-wrap gap-2">
                {board.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-(--border) bg-(--surface) px-3 py-1 text-[11px] font-medium tracking-wide text-(--text-muted) dark:bg-[rgba(255,255,255,0.04)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="text-xs uppercase tracking-[0.24em] text-(--text-muted)">
                Updated {formatDateTime(board.updatedAt)}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={`/app/boards/${board.id}`} className={actionLinkClass}>
                Open editor
              </Link>

              <Link href="/app" className={actionLinkClass}>
                Back to boards
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-(--border) pt-5">
            <div className="flex flex-wrap gap-2" aria-label="Presentation sections">
              {presentationSections.map((section, index) => {
                const isActive = index === activeSectionIndex;
                return (
                  <PresentationPill
                    key={section.key}
                    label={section.label}
                    description={section.description}
                    icon={section.icon}
                    active={isActive}
                    onClick={() => setActiveSectionIndex(index)}
                    index={index}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className={outerPanelClass} aria-labelledby="presentation-section-title">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
              {activeSectionMeta.label}
            </p>
            <h2
              id="presentation-section-title"
              className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong)"
            >
              {activeSectionMeta.description}
            </h2>
          </div>

          <p className="text-sm leading-6 text-(--text-muted)" aria-live="polite">
            {presentationModeEnabled
              ? 'Use ← → or Space to move through sections. Press Esc to leave presentation mode.'
              : 'Select a section above to explore this board.'}
          </p>
        </div>

        <div className="mt-6">
          {activeSection === 'overview' ? (
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <Card className={innerPanelClass}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Creative direction</Badge>
                  </div>
                  <CardTitle className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong)">
                    Direction, tone, and summary
                  </CardTitle>
                  <CardDescription className="max-w-2xl text-(--text-muted)">
                    Snapshot of the board in presentation mode.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className={softPanelClass}>
                    <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                      Mood
                    </p>
                    <p className="mt-2 text-base font-medium text-(--text-strong)">{board.mood}</p>
                  </div>

                  <div className={softPanelClass}>
                    <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                      Tone
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {board.tone.map((item) => (
                        <Badge key={item} variant="secondary">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className={softPanelClass}>
                    <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                      Summary
                    </p>
                    <p className="mt-2 text-sm leading-7 text-(--text-muted)">{board.summary}</p>
                  </div>

                  <div className={softPanelClass}>
                    <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                      Prompt
                    </p>
                    <p className="mt-2 text-sm leading-7 text-(--text-muted)">{board.prompt}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className={innerPanelClass}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Snapshot</Badge>
                  </div>
                  <CardTitle className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong)">
                    Presentation overview
                  </CardTitle>
                  <CardDescription className="max-w-2xl text-(--text-muted)">
                    A quick summary of the board&apos;s structure and timing.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className={softPanelClass}>
                    <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                      Updated
                    </p>
                    <p className="mt-2 text-sm text-(--text-muted)">{formatDateTime(board.updatedAt)}</p>
                  </div>

                  <div className={softPanelClass}>
                    <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                      Status
                    </p>
                    <p className="mt-2 text-sm text-(--text-muted)">
                      {board.isFavorite ? 'This board is favorited.' : 'This board is not favorited.'}
                    </p>
                  </div>

                  <div className={softPanelClass}>
                    <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                      Visibility
                    </p>
                    <p className="mt-2 text-sm text-(--text-muted)">{board.visibility?.charAt(0)?.toUpperCase() + board.visibility?.slice(1)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeSection === 'palette' ? (
            <Card className={innerPanelClass}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Palette</Badge>
                </div>
                <CardTitle className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong)">
                  Color direction
                </CardTitle>
                <CardDescription className="max-w-2xl text-(--text-muted)">
                  The board&apos;s color direction and usage notes.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {board.palette.length ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {board.palette.map((item) => (
                      <div
                        key={`${item.id}-${item.hex}`}
                        className="rounded-[1.75rem] border border-(--border) bg-(--surface-soft) p-4"
                      >
                        <div
                          className="mb-4 h-24 rounded-[1.35rem] border border-(--border) shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                          style={{ backgroundColor: item.hex }}
                        />
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-(--text-strong)">{item.label}</p>
                          <p className="text-xs text-(--text-muted)">{item.hex}</p>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-(--text-muted)">{item.usage}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.75rem] border border-dashed border-(--border) bg-(--surface-soft) px-5 py-10 text-center text-sm text-(--text-muted)">
                    No palette items yet.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {activeSection === 'typography' ? (
            <Card className={innerPanelClass}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Typography</Badge>
                </div>
                <CardTitle className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong)">
                  Type system
                </CardTitle>
                <CardDescription className="max-w-2xl text-(--text-muted)">
                  Font choices and usage notes.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {board.typography.length ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {board.typography.map((item) => {
                      const previewFamily = getTypographyPreviewFamily(item.fontName, item.role);

                      return (
                        <div
                          key={`${item.id}-${item.fontName}`}
                          className="rounded-[1.75rem] border border-(--border) bg-(--surface-soft) p-4"
                        >
                          <Badge variant="secondary">{item.role}</Badge>

                          <p
                            className="mt-3 text-2xl tracking-tight text-(--text-strong)"
                            style={{ fontFamily: previewFamily }}
                          >
                            {item.fontName}
                          </p>

                          <p
                            className="mt-2 text-sm leading-6 text-(--text-muted)"
                            style={{ fontFamily: previewFamily }}
                          >
                            {item.note}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-[1.75rem] border border-dashed border-(--border) bg-(--surface-soft) px-5 py-10 text-center text-sm text-(--text-muted)">
                    No typography items yet.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {activeSection === 'references' ? (
            <Card className={innerPanelClass}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">References</Badge>
                </div>
                <CardTitle className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong)">
                  Inspiration grid
                </CardTitle>
                <CardDescription className="max-w-2xl text-(--text-muted)">
                  Visual references that support the mood and composition.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {board.references.length ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {board.references.map((reference, index) => (
                      <ReadOnlyReferenceCard
                        key={reference.id}
                        title={reference.title}
                        imageUrl={reference.imageUrl}
                        category={reference.category}
                        source={reference.source}
                        index={index}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.75rem] border border-dashed border-(--border) bg-(--surface-soft) px-5 py-10 text-center text-sm text-(--text-muted)">
                    No references yet.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {activeSection === 'notes' ? (
            <Card className={innerPanelClass}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Notes</Badge>
                </div>
                <CardTitle className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong)">
                  Captured ideas
                </CardTitle>
                <CardDescription className="max-w-2xl text-(--text-muted)">
                  Short notes and instructions saved from the board.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {board.notes.length ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {board.notes.map((note) => (
                      <ReadOnlyNoteCard key={note.id} text={note.text} type={note.type} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.75rem] border border-dashed border-(--border) bg-(--surface-soft) px-5 py-10 text-center text-sm text-(--text-muted)">
                    No notes yet.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>
    </div>
  );
}