'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon, Layers3, Palette, Sparkles, Type } from 'lucide-react';
import { loadBoards, subscribeBoards } from '@/lib/board-store';
import { formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { NoteType } from '@/types/board';

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

function getFallbackReferenceImage(index: number): string {
  return FALLBACK_REFERENCE_IMAGES[index % FALLBACK_REFERENCE_IMAGES.length];
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
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2',
        active
          ? 'border-slate-200 bg-slate-100 text-slate-950 shadow-sm'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
      ].join(' ')}
    >
      <div
        className={[
          'mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border',
          active ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50',
        ].join(' ')}
      >
        <Icon className={active ? 'h-4 w-4 text-slate-900' : 'h-4 w-4 text-slate-500'} />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium">
          {index + 1}. {label}
        </p>
        <p className={active ? 'mt-1 text-xs text-slate-600' : 'mt-1 text-xs text-slate-500'}>
          {description}
        </p>
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
    <article className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
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
          {source ? <span className="text-xs text-slate-400">{source}</span> : null}
        </div>

        <p className="text-sm leading-6 text-slate-700">{title}</p>
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
    idea: 'border-amber-200 bg-amber-50',
    instruction: 'border-sky-200 bg-sky-50',
    keyword: 'border-violet-200 bg-violet-50',
  };

  return (
    <article className={`rounded-[1.75rem] border p-4 ${noteToneClasses[type]}`}>
      <Badge variant="secondary">{type}</Badge>
      <p className="mt-4 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-700">
        {text}
      </p>
    </article>
  );
}

export function BoardReadOnlyClient({ boardId }: BoardReadOnlyClientProps) {
  const router = useRouter();
  const boards = useSyncExternalStore(subscribeBoards, loadBoards, loadBoards);
  const board = boards.find((item) => item.id === boardId);

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
  }, [board, router]);

  if (!board) {
    return (
      <section className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
          Board not found
        </p>
        <h1 className="[font-family:var(--font-display),serif] mt-3 text-4xl tracking-tight text-slate-950">
          This share link is outdated.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
          The board may have been deleted or the link may no longer be valid.
        </p>
        <div className="mt-6">
          <Button
            type="button"
            onClick={() => window.location.assign('/app')}
            className="rounded-full bg-slate-950 text-white hover:bg-slate-800"
          >
            Back to boards
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-8 pb-10 text-slate-900">
      <section className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Presentation mode</Badge>
                <Badge variant="secondary">{board.visibility}</Badge>
                {board.isFavorite ? <Badge variant="secondary">Favorite</Badge> : null}
              </div>

              <h1 className="[font-family:var(--font-display),serif] text-[clamp(3rem,7vw,5.6rem)] leading-[0.94] tracking-[-0.04em] text-slate-950">
                {board.title}
              </h1>

              <p className="max-w-3xl text-sm leading-6 text-slate-500">
                Prompt: <span className="font-medium text-slate-700">{board.prompt}</span>
              </p>

              <p className="max-w-4xl text-base leading-7 text-slate-600">{board.summary}</p>

              <div className="flex flex-wrap gap-2">
                {board.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium tracking-wide text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                Updated {formatDateTime(board.updatedAt)}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/app/boards/${board.id}`}
                className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white! shadow-sm transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              >
                Open editor
              </Link>

              <Link
                href="/app"
                className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              >
                Back to boards
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
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

      <section
        className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-8"
        aria-labelledby="presentation-section-title"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
              {activeSectionMeta.label}
            </p>
            <h2
              id="presentation-section-title"
              className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-slate-950"
            >
              {activeSectionMeta.description}
            </h2>
          </div>

          <p className="text-sm leading-6 text-slate-500" aria-live="polite">
            Use ← → or Space to move through sections. Press Esc to leave presentation mode.
          </p>
        </div>

        <div className="mt-6">
          {activeSection === 'overview' ? (
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <Card className="rounded-4xl border border-slate-200 bg-slate-50 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Creative direction</Badge>
                  </div>
                  <CardTitle className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-slate-950">
                    Direction, tone, and summary
                  </CardTitle>
                  <CardDescription className="max-w-2xl text-slate-500">
                    Snapshot of the board in presentation mode.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                      Mood
                    </p>
                    <p className="text-base font-medium text-slate-900">{board.mood}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                      Tone
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {board.tone.map((item) => (
                        <Badge key={item} variant="secondary">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                      Summary
                    </p>
                    <p className="text-sm leading-7 text-slate-600">{board.summary}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                      Prompt
                    </p>
                    <p className="text-sm leading-7 text-slate-600">{board.prompt}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-4xl border border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Snapshot</Badge>
                  </div>
                  <CardTitle className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-slate-950">
                    Presentation overview
                  </CardTitle>
                  <CardDescription className="max-w-2xl text-slate-500">
                    A quick summary of the board&apos;s structure and timing.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                      Updated
                    </p>
                    <p className="mt-2 text-sm text-slate-700">{formatDateTime(board.updatedAt)}</p>
                  </div>

                  <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                      Status
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      {board.isFavorite ? 'This board is favorited.' : 'This board is not favorited.'}
                    </p>
                  </div>

                  <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                      Visibility
                    </p>
                    <p className="mt-2 text-sm text-slate-700">{board.visibility}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeSection === 'palette' ? (
            <Card className="rounded-4xl border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Palette</Badge>
                </div>
                <CardTitle className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-slate-950">
                  Color direction
                </CardTitle>
                <CardDescription className="max-w-2xl text-slate-500">
                  The board&apos;s color direction and usage notes.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {board.palette.length ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {board.palette.map((item) => (
                      <div
                        key={`${item.id}-${item.hex}`}
                        className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4"
                      >
                        <div
                          className="mb-4 h-24 rounded-[1.35rem] border border-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                          style={{ backgroundColor: item.hex }}
                        />
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-slate-900">{item.label}</p>
                          <p className="text-xs text-slate-400">{item.hex}</p>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{item.usage}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                    No palette items yet.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {activeSection === 'typography' ? (
            <Card className="rounded-4xl border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Typography</Badge>
                </div>
                <CardTitle className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-slate-950">
                  Type system
                </CardTitle>
                <CardDescription className="max-w-2xl text-slate-500">
                  Font choices and usage notes.
                </CardDescription>
              </CardHeader>

              <CardContent>
                {board.typography.length ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {board.typography.map((item) => (
                      <div
                        key={`${item.id}-${item.fontName}`}
                        className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4"
                      >
                        <Badge variant="secondary">{item.role}</Badge>
                        <p className="[font-family:var(--font-display),serif] mt-3 text-2xl tracking-tight text-slate-950">
                          {item.fontName}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{item.note}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                    No typography items yet.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {activeSection === 'references' ? (
            <Card className="rounded-4xl border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">References</Badge>
                </div>
                <CardTitle className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-slate-950">
                  Inspiration grid
                </CardTitle>
                <CardDescription className="max-w-2xl text-slate-500">
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
                  <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                    No references yet.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {activeSection === 'notes' ? (
            <Card className="rounded-4xl border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Notes</Badge>
                </div>
                <CardTitle className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-slate-950">
                  Captured ideas
                </CardTitle>
                <CardDescription className="max-w-2xl text-slate-500">
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
                  <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
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