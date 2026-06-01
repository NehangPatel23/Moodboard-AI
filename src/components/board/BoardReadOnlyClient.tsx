'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { loadBoards, subscribeBoards } from '@/lib/board-store';
import { formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { NoteType } from '@/types/board';

type BoardReadOnlyClientProps = {
  boardId: string;
};

function ReadOnlyReferenceCard({
  title,
  imageUrl,
  category,
  source,
}: {
  title: string;
  imageUrl: string;
  category: string;
  source?: string;
}) {
  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
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
      <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
        {text}
      </p>
    </article>
  );
}

export function BoardReadOnlyClient({ boardId }: BoardReadOnlyClientProps) {
  const boards = useSyncExternalStore(subscribeBoards, loadBoards, loadBoards);
  const board = boards.find((item) => item.id === boardId);

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
          <Button type="button" onClick={() => window.location.assign('/app')} className="rounded-full bg-slate-950 text-white">
            Back to boards
          </Button>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-8 pb-10 text-slate-900">
      <section className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Shared view</Badge>
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
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-6">
          <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
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

          <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
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
                <div className="grid gap-4 md:grid-cols-2">
                  {board.references.map((reference) => (
                    <ReadOnlyReferenceCard
                      key={reference.id}
                      title={reference.title}
                      imageUrl={reference.imageUrl}
                      category={reference.category}
                      source={reference.source}
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

          <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
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
        </div>

        <div className="space-y-6">
          <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
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

            <CardContent className="space-y-4">
              {board.palette.map((item) => (
                <div
                  key={`${item.id}-${item.hex}`}
                  className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4"
                >
                  <div
                    className="mb-4 h-20 rounded-[1.35rem] border border-slate-200"
                    style={{ backgroundColor: item.hex }}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.hex}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.usage}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
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

            <CardContent className="space-y-4">
              {board.typography.map((item) => (
                <div
                  key={`${item.id}-${item.fontName}`}
                  className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4"
                >
                  <Badge variant="secondary">{item.role}</Badge>
                  <p className="mt-3 [font-family:var(--font-display),serif] text-2xl tracking-tight text-slate-950">
                    {item.fontName}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.note}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}