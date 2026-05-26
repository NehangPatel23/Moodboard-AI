'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { loadBoards, subscribeBoards } from '@/lib/board-store';
import { formatDateTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { ReferenceGrid } from './ReferenceGrid';
import { StickyNote } from './StickyNote';

type BoardReadOnlyClientProps = {
  boardId: string;
};

export function BoardReadOnlyClient({ boardId }: BoardReadOnlyClientProps) {
  const boards = useSyncExternalStore(subscribeBoards, loadBoards, loadBoards);
  const board = boards.find((item) => item.id === boardId);

  if (!board) {
    return (
      <EmptyState
        title="Board not found"
        description="This share link is outdated or the board was removed."
        actionLabel="Back to boards"
        actionHref="/app"
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-slate-200 bg-white/85 p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Shared view</Badge>
              <Badge variant="secondary">{board.visibility}</Badge>
              {board.isFavorite ? <Badge variant="secondary">Favorite</Badge> : null}
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl wrap-break-word">
              {board.title}
            </h1>

            <p className="max-w-3xl text-sm leading-6 text-slate-500">
              Prompt: <span className="font-medium text-slate-700">{board.prompt}</span>
            </p>

            <p className="max-w-3xl text-base leading-7 text-slate-600">{board.summary}</p>

            <div className="flex flex-wrap gap-2">
              {board.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Updated {formatDateTime(board.updatedAt)}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/app/boards/${board.id}`}
              className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-medium text-white! shadow-sm transition hover:bg-[#020617] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
            >
              Open editor
            </Link>

            <Link
              href="/app"
              className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
            >
              Back to boards
            </Link>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card className="border-slate-200 bg-white/85">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Creative direction</Badge>
              </div>
              <CardTitle>Direction, tone, and summary</CardTitle>
              <CardDescription>Snapshot of the board in presentation mode.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Mood</p>
                <p className="text-base font-medium text-slate-950">{board.mood}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Tone</p>
                <div className="flex flex-wrap gap-2">
                  {board.tone.map((item) => (
                    <Badge key={item} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Summary</p>
                <p className="text-sm leading-7 text-slate-600">{board.summary}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Prompt</p>
                <p className="text-sm leading-7 text-slate-600">{board.prompt}</p>
              </div>
            </CardContent>
          </Card>

          <ReferenceGrid references={board.references} readOnly />

          <Card className="border-slate-200 bg-white/85">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Captured ideas and instructions from the board.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {board.notes.map((note) => (
                  <StickyNote key={note.id} note={note} readOnly />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-200 bg-white/85">
            <CardHeader>
              <CardTitle>Palette</CardTitle>
              <CardDescription>Color direction used by the board.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {board.palette.map((item) => (
                <div
                  key={`${item.id}-${item.hex}`}
                  className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4"
                >
                  <div
                    className="mb-3 h-16 rounded-2xl border border-slate-200"
                    style={{ backgroundColor: item.hex }}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-950 wrap-break-word">{item.label}</p>
                    <p className="text-xs text-slate-400 break-all">{item.hex}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500 wrap-break-word">{item.usage}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/85">
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>Font choices and usage notes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {board.typography.map((item) => (
                <div
                  key={`${item.id}-${item.fontName}`}
                  className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4"
                >
                  <Badge variant="secondary">{item.role}</Badge>
                  <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950 wrap-break-word">
                    {item.fontName}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500 wrap-break-word">{item.note}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}