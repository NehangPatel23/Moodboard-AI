'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type {
  Board,
  NoteType,
  PaletteItem,
  ReferenceItem,
  TypographyItem,
  TypographyRole,
} from '@/types/board';
import {
  deleteBoardById,
  duplicateBoardById,
  loadBoards,
  subscribeBoards,
  updateBoard,
} from '@/lib/board-store';
import { formatDateTime } from '@/lib/utils';
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';
import { ShareModal } from '@/components/shared/ShareModal';
import { ExportModal } from '@/components/shared/ExportModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Copy,
  Download,
  ExternalLink,
  Plus,
  Share2,
  Star,
  StarOff,
  Trash2,
  X,
} from 'lucide-react';
import { showToast } from '@/components/shared/toast-store';

type BoardEditorClientProps = {
  boardId: string;
};

type RemovalKind = 'palette' | 'typography' | 'reference' | 'note';

const TITLE_LIMIT = 80;

const palettePreviewFallbacks = [
  '#d4c8b8',
  '#cbd7c8',
  '#b8c6d1',
  '#e2d5cf',
  '#d6d1c7',
  '#c7b9aa',
];

const typographyRoleOptions: { value: TypographyRole; label: string }[] = [
  { value: 'heading', label: 'Heading' },
  { value: 'body', label: 'Body' },
  { value: 'accent', label: 'Accent' },
];

const noteTypeOptions: { value: NoteType; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'instruction', label: 'Instruction' },
  { value: 'keyword', label: 'Keyword' },
];

const referenceCategoryOptions = ['Editorial', 'Lifestyle', 'Campaign', 'Product', 'UI', 'Mood'];

const panelClass =
  'rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]';

const fieldClass =
  'border-slate-200 bg-white text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:ring-slate-900';

function cloneBoard(board: Board): Board {
  return JSON.parse(JSON.stringify(board)) as Board;
}

function applyRemoval(board: Board, kind: RemovalKind, index: number): Board {
  if (kind === 'palette') {
    return { ...board, palette: board.palette.filter((_, currentIndex) => currentIndex !== index) };
  }

  if (kind === 'typography') {
    return { ...board, typography: board.typography.filter((_, currentIndex) => currentIndex !== index) };
  }

  if (kind === 'reference') {
    return { ...board, references: board.references.filter((_, currentIndex) => currentIndex !== index) };
  }

  return { ...board, notes: board.notes.filter((_, currentIndex) => currentIndex !== index) };
}

function ReferenceEditorModal({
  open,
  reference,
  onSave,
  onClose,
}: {
  open: boolean;
  reference: ReferenceItem | null;
  onSave: (next: ReferenceItem) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<ReferenceItem | null>(reference);

  useEffect(() => {
    setDraft(reference);
  }, [reference]);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined' || !reference || !draft) return null;

  const updateDraft = (patch: Partial<ReferenceItem>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };

  return createPortal(
    <div
      className="fixed inset-0 z-10020 flex items-center justify-center bg-black/35 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reference-editor-title"
      aria-describedby="reference-editor-description"
      onMouseDown={onClose}
    >
      <div
        className="flex w-full max-w-6xl flex-col overflow-hidden rounded-4xl border border-slate-200 bg-white text-slate-900 shadow-[0_40px_120px_rgba(15,23,42,0.18)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 md:px-8 md:py-6">
          <div className="space-y-2">
            <h2
              id="reference-editor-title"
              className="[font-family:var(--font-display),serif] text-[clamp(2.5rem,4vw,4rem)] leading-[0.95] tracking-[-0.04em] text-slate-950"
            >
              Edit reference
            </h2>
            <p
              id="reference-editor-description"
              className="max-w-2xl text-sm leading-6 text-slate-500 md:text-base"
            >
              Update the title, type, source, and image for this inspiration card.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close reference editor"
            className="h-11 w-11 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-6 py-6 md:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 shadow-sm">
                <div className="relative aspect-16/10 w-full">
                  <Image
                    src={
                      draft.imageUrl ||
                      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80'
                    }
                    alt={draft.title || 'Reference image'}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{draft.category}</Badge>
                {draft.source ? <Badge variant="outline">{draft.source}</Badge> : null}
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid gap-2">
                <label className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                  Reference title
                </label>
                <Textarea
                  value={draft.title}
                  onChange={(e) => updateDraft({ title: e.target.value })}
                  placeholder="Reference title"
                  className="min-h-23 rounded-3xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-900"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                  Reference type
                </label>
                <select
                  value={draft.category}
                  onChange={(e) => updateDraft({ category: e.target.value })}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {referenceCategoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                  Source
                </label>
                <Input
                  value={draft.source ?? ''}
                  onChange={(e) => updateDraft({ source: e.target.value })}
                  placeholder="Unsplash"
                  className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-900"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                  Image URL
                </label>
                <Textarea
                  value={draft.imageUrl}
                  onChange={(e) => updateDraft({ imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="min-h-23 rounded-3xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 break-all focus-visible:ring-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-6 py-5 md:px-8">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => onSave(draft)}
            className="rounded-full bg-slate-950 text-white hover:bg-slate-800"
          >
            Save reference
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function BoardEditorClient({ boardId }: BoardEditorClientProps) {
  const router = useRouter();
  const boards = useSyncExternalStore(subscribeBoards, loadBoards, loadBoards);
  const savedBoard = boards.find((item) => item.id === boardId) ?? null;

  const [draft, setDraft] = useState<Board | null>(() => (savedBoard ? cloneBoard(savedBoard) : null));
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<{ kind: RemovalKind; index: number } | null>(null);
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [isDirty, setIsDirty] = useState(false);
  const [editingReferenceIndex, setEditingReferenceIndex] = useState<number | null>(null);

  if (!savedBoard || !draft) {
    return (
      <section className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
          Board not found
        </p>
        <h1 className="[font-family:var(--font-display),serif] mt-3 text-4xl tracking-tight text-slate-950">
          This board may have been deleted.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
          The link may be outdated or the board may have been removed from your studio.
        </p>
        <div className="mt-6">
          <Button type="button" onClick={() => router.push('/app')} className="rounded-full bg-slate-950 text-white">
            Back to boards
          </Button>
        </div>
      </section>
    );
  }

  const sharePath = `/app/boards/${draft.id}/view`;
  const toneText = draft.tone.join(', ');
  const tagsText = draft.tags.join(', ');
  const dirtyStatus = isDirty ? 'Unsaved changes' : saveStatus;
  const currentReference = editingReferenceIndex !== null ? draft.references[editingReferenceIndex] ?? null : null;

  const markDirty = () => {
    if (!isDirty) {
      setIsDirty(true);
      setSaveStatus('Unsaved changes');
    }
  };

  const updateDraft = (updater: (current: Board) => Board) => {
    setDraft((current) => {
      if (!current) return current;
      markDirty();
      return updater(cloneBoard(current));
    });
  };

  const handleSave = () => {
    setSaveOpen(true);
  };

  const confirmSave = () => {
    if (!draft) return;

    const updated = updateBoard(boardId, () => cloneBoard(draft));
    if (!updated) {
      showToast('Save failed.', 'destructive');
      return;
    }

    setDraft(updated);
    setIsDirty(false);
    setSaveStatus('Saved');
    setSaveOpen(false);
    showToast('Changes saved.', 'success');
  };

  const handleDuplicate = () => {
    if (isDirty) {
      showToast('Save changes before duplicating.', 'destructive');
      return;
    }

    const copy = duplicateBoardById(boardId);
    if (!copy) {
      showToast('Duplicate failed.', 'destructive');
      return;
    }

    showToast('Board duplicated.', 'success');
    window.setTimeout(() => {
      router.push(`/app/boards/${copy.id}`);
    }, 180);
  };

  const handleDelete = () => {
    const deleted = deleteBoardById(boardId);
    setDeleteOpen(false);

    if (!deleted) {
      showToast('Delete failed.', 'destructive');
      return;
    }

    showToast('Board deleted successfully.', 'success');

    window.setTimeout(() => {
      router.push('/app');
    }, 450);
  };

  const handleToggleFavorite = () => {
    updateDraft((current) => ({ ...current, isFavorite: !current.isFavorite }));
    showToast(draft.isFavorite ? 'Removed from favorites.' : 'Added to favorites.', 'success');
  };

  const handleAddNote = () => {
    updateDraft((current) => ({
      ...current,
      notes: [
        {
          id: `note_${Date.now()}`,
          text: 'New note',
          type: 'idea',
          position: { x: 0, y: 0 },
        },
        ...current.notes,
      ],
    }));
    showToast('Note added.', 'success');
  };

  const handleRequestRemoval = (kind: RemovalKind, index: number) => {
    setPendingRemoval({ kind, index });
  };

  const handleConfirmRemoval = () => {
    if (!pendingRemoval) return;
    updateDraft((current) => applyRemoval(current, pendingRemoval.kind, pendingRemoval.index));
    setPendingRemoval(null);
    showToast('Item removed.', 'success');
  };

  const handleAddPalette = () => {
    updateDraft((current) => ({
      ...current,
      palette: [
        {
          id: `palette_${Date.now()}`,
          label: 'New color',
          hex: palettePreviewFallbacks[current.palette.length % palettePreviewFallbacks.length],
          usage: 'Usage note',
        },
        ...current.palette,
      ],
    }));
    showToast('Color added.', 'success');
  };

  const handleAddTypography = () => {
    updateDraft((current) => ({
      ...current,
      typography: [
        {
          id: `typography_${Date.now()}`,
          role: 'accent',
          fontName: 'Inter',
          note: 'Usage note',
        },
        ...current.typography,
      ],
    }));
    showToast('Typography row added.', 'success');
  };

  const handleAddReference = () => {
    updateDraft((current) => ({
      ...current,
      references: [
        {
          id: `ref_${Date.now()}`,
          title: 'New reference',
          imageUrl:
            'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
          category: 'Editorial',
          source: 'Unsplash',
        },
        ...current.references,
      ],
    }));
    setEditingReferenceIndex(0);
    showToast('Reference added.', 'success');
  };

  const handleSaveReference = (next: ReferenceItem) => {
    if (editingReferenceIndex === null) return;

    updateDraft((current) => ({
      ...current,
      references: current.references.map((item, index) => (index === editingReferenceIndex ? next : item)),
    }));

    setEditingReferenceIndex(null);
    showToast('Reference saved.', 'success');
  };

  return (
    <div className="space-y-8 pb-10 text-slate-900">
      <section className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Board editor</Badge>
              <Badge variant="secondary">{draft.visibility}</Badge>
              <Badge variant="secondary">{dirtyStatus}</Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={handleSave}
                disabled={!isDirty}
                className="rounded-full bg-slate-950 px-4 text-white hover:bg-slate-800"
              >
                Save
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleToggleFavorite}
                className="rounded-full border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 hover:text-slate-950"
              >
                {draft.isFavorite ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                {draft.isFavorite ? 'Unfavorite' : 'Favorite'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleDuplicate}
                className="rounded-full border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 hover:text-slate-950"
              >
                <Copy className="h-4 w-4" />
                Duplicate
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShareOpen(true);
                  showToast('Share modal opened.', 'default');
                }}
                className="rounded-full border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 hover:text-slate-950"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setExportOpen(true);
                  showToast('Export modal opened.', 'default');
                }}
                className="rounded-full border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 hover:text-slate-950"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(sharePath)}
                className="rounded-full border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 hover:text-slate-950"
              >
                <ExternalLink className="h-4 w-4" />
                View
              </Button>

              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  showToast('You are about to permanently delete this board.', 'destructive');
                  setDeleteOpen(true);
                }}
                className="rounded-full px-4"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
            <div className="space-y-3">
              <label className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                Board title
              </label>
              <Textarea
                value={draft.title}
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    title: event.target.value.slice(0, TITLE_LIMIT),
                  }))
                }
                rows={2}
                maxLength={TITLE_LIMIT}
                className="min-h-24 rounded-[1.75rem] border-slate-200 bg-white px-4 py-4 text-[clamp(2.6rem,5vw,4.8rem)] leading-[0.95] tracking-tight text-slate-950 shadow-none placeholder:text-slate-400 focus-visible:ring-slate-900"
                placeholder="Untitled board"
              />
              <p className="text-xs text-slate-400">
                Up to {TITLE_LIMIT} characters • {draft.title.length}/{TITLE_LIMIT}
              </p>
            </div>

            <aside className="rounded-4xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                Prompt
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-700">{draft.prompt}</p>
              <div className="mt-5 grid gap-3 text-xs text-slate-400">
                <p>Updated {formatDateTime(draft.updatedAt)}</p>
                <p>Board ID {draft.id}</p>
                <p>Creative direction canvas</p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <Card className={panelClass}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Creative direction</Badge>
              </div>
              <CardTitle className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-slate-950">
                Direction, tone, and summary
              </CardTitle>
              <CardDescription className="max-w-2xl text-slate-500">
                Adjust the core idea before refining palette, type, and references.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid gap-2">
                <label className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                  Mood
                </label>
                <Input
                  value={draft.mood}
                  onChange={(e) => updateDraft((current) => ({ ...current, mood: e.target.value }))}
                  placeholder="calm luxury"
                  className={fieldClass}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                  Creative summary
                </label>
                <Textarea
                  value={draft.summary}
                  onChange={(e) => updateDraft((current) => ({ ...current, summary: e.target.value }))}
                  className="min-h-42.5 rounded-3xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-900"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                    Tone descriptors
                  </label>
                  <Input
                    value={toneText}
                    onChange={(e) =>
                      updateDraft((current) => ({
                        ...current,
                        tone: e.target.value
                          .split(',')
                          .map((item) => item.trim())
                          .filter(Boolean),
                      }))
                    }
                    placeholder="minimal, warm, premium"
                    className={fieldClass}
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                    Tags
                  </label>
                  <Input
                    value={tagsText}
                    onChange={(e) =>
                      updateDraft((current) => ({
                        ...current,
                        tags: e.target.value
                          .split(',')
                          .map((item) => item.trim())
                          .filter(Boolean),
                      }))
                    }
                    placeholder="wellness, editorial, soft contrast"
                    className={fieldClass}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={panelClass}>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">References</Badge>
                </div>
                <CardTitle className="mt-2 [font-family:var(--font-display),serif] text-3xl tracking-tight text-slate-950">
                  Inspiration grid
                </CardTitle>
                <CardDescription className="max-w-2xl text-slate-500">
                  Visual references that support the mood and composition.
                </CardDescription>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleAddReference}
                className="rounded-full border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 hover:text-slate-950"
              >
                <Plus className="h-4 w-4" />
                Add reference
              </Button>
            </CardHeader>

            <CardContent>
              {draft.references.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {draft.references.map((reference, index) => (
                    <article
                      key={reference.id}
                      className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                    >
                      <button
                        type="button"
                        onClick={() => setEditingReferenceIndex(index)}
                        aria-label={`Edit reference ${reference.title}`}
                        className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                      >
                        <div className="relative aspect-4/3 w-full overflow-hidden">
                          <Image
                            src={
                              reference.imageUrl ||
                              'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80'
                            }
                            alt={reference.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent" />
                        </div>

                        <div className="space-y-2 p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{reference.category}</Badge>
                            {reference.source ? <span className="text-xs text-slate-400">{reference.source}</span> : null}
                          </div>

                          <p className="line-clamp-2 text-sm leading-6 text-slate-700">
                            {reference.title}
                          </p>
                        </div>
                      </button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRequestRemoval('reference', index)}
                        aria-label={`Remove reference ${reference.title}`}
                        className="absolute right-3 top-3 h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-600 opacity-100 transition hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                  No references yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={panelClass}>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Notes</Badge>
                </div>
                <CardTitle className="mt-2 [font-family:var(--font-display),serif] text-3xl tracking-tight text-slate-950">
                  Sticky notes
                </CardTitle>
                <CardDescription className="max-w-2xl text-slate-500">
                  Capture short ideas, instructions, and keywords.
                </CardDescription>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleAddNote}
                className="rounded-full border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 hover:text-slate-950"
              >
                <Plus className="h-4 w-4" />
                Add note
              </Button>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {draft.notes.map((note, index) => {
                  const noteToneClasses: Record<NoteType, string> = {
                    idea: 'border-amber-200 bg-amber-50',
                    instruction: 'border-sky-200 bg-sky-50',
                    keyword: 'border-violet-200 bg-violet-50',
                  };

                  return (
                    <Card key={note.id} className={`${noteToneClasses[note.type]} rounded-3xl border`}>
                      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-4">
                        <div className="space-y-2">
                          <Badge variant="secondary">{note.type}</Badge>
                          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                            Note {index + 1}
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRequestRemoval('note', index)}
                          aria-label={`Remove note ${index + 1}`}
                          className="h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="grid gap-2">
                          <label className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                            Note type
                          </label>
                          <select
                            value={note.type}
                            onChange={(e) =>
                              updateDraft((current) => ({
                                ...current,
                                notes: current.notes.map((item, currentIndex) =>
                                  currentIndex === index ? { ...item, type: e.target.value as NoteType } : item,
                                ),
                              }))
                            }
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900"
                          >
                            {noteTypeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid gap-2">
                          <label className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                            Note text
                          </label>
                          <Textarea
                            value={note.text}
                            onChange={(event) =>
                              updateDraft((current) => ({
                                ...current,
                                notes: current.notes.map((item, currentIndex) =>
                                  currentIndex === index ? { ...item, text: event.target.value } : item,
                                ),
                              }))
                            }
                            className="min-h-35 rounded-3xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-900"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {!draft.notes.length ? (
                <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                  No notes yet.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className={panelClass}>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Palette</Badge>
                </div>
                <CardTitle className="mt-2 [font-family:var(--font-display),serif] text-3xl tracking-tight text-slate-950">
                  Color direction
                </CardTitle>
                <CardDescription className="max-w-2xl text-slate-500">
                  Fine-tune the colors and usage notes for the board.
                </CardDescription>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleAddPalette}
                className="rounded-full border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 hover:text-slate-950"
              >
                <Plus className="h-4 w-4" />
                Add color
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {draft.palette.map((item: PaletteItem, index) => (
                <Card key={item.id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50">
                  <CardContent className="space-y-4 p-4">
                    <div
                      className="h-24 overflow-hidden rounded-3xl border border-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                      style={{ backgroundColor: item.hex }}
                    />

                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <label className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                          Color name
                        </label>
                        <Input
                          value={item.label}
                          onChange={(e) =>
                            updateDraft((current) => ({
                              ...current,
                              palette: current.palette.map((color, currentIndex) =>
                                currentIndex === index ? { ...color, label: e.target.value } : color,
                              ),
                            }))
                          }
                          placeholder="Ivory"
                          className={fieldClass}
                        />
                      </div>

                      <div className="grid gap-2">
                        <label className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                          Color hex
                        </label>
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white p-1">
                            <input
                              type="color"
                              value={item.hex}
                              onChange={(e) =>
                                updateDraft((current) => ({
                                  ...current,
                                  palette: current.palette.map((color, currentIndex) =>
                                    currentIndex === index ? { ...color, hex: e.target.value } : color,
                                  ),
                                }))
                              }
                              className="h-full w-full cursor-pointer rounded-xl border-0 bg-transparent p-0"
                              aria-label={`Pick color for ${item.label}`}
                            />
                          </div>
                          <Input
                            value={item.hex}
                            onChange={(e) =>
                              updateDraft((current) => ({
                                ...current,
                                palette: current.palette.map((color, currentIndex) =>
                                  currentIndex === index ? { ...color, hex: e.target.value } : color,
                                ),
                              }))
                            }
                            placeholder="#000000"
                            className={`${fieldClass} font-mono`}
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <label className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                          Usage note
                        </label>
                        <Input
                          value={item.usage}
                          onChange={(e) =>
                            updateDraft((current) => ({
                              ...current,
                              palette: current.palette.map((color, currentIndex) =>
                                currentIndex === index ? { ...color, usage: e.target.value } : color,
                              ),
                            }))
                          }
                          placeholder="Background and base surfaces"
                          className={fieldClass}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleRequestRemoval('palette', index)}
                          className="rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          <Card className={panelClass}>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Typography</Badge>
                </div>
                <CardTitle className="mt-2 [font-family:var(--font-display),serif] text-3xl tracking-tight text-slate-950">
                  Type system
                </CardTitle>
                <CardDescription className="max-w-2xl text-slate-500">
                  Pair the fonts with short notes for the design direction.
                </CardDescription>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleAddTypography}
                className="rounded-full border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-50 hover:text-slate-950"
              >
                <Plus className="h-4 w-4" />
                Add row
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {draft.typography.map((item: TypographyItem, index) => (
                <Card key={item.id} className="rounded-[1.75rem] border border-slate-200 bg-slate-50">
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Badge variant="secondary">{item.role}</Badge>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRequestRemoval('typography', index)}
                        className="rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>

                    <div className="grid gap-2">
                      <label className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                        Type badge
                      </label>
                      <select
                        value={item.role}
                        onChange={(e) =>
                          updateDraft((current) => ({
                            ...current,
                            typography: current.typography.map((type, currentIndex) =>
                              currentIndex === index ? { ...type, role: e.target.value as TypographyRole } : type,
                            ),
                          }))
                        }
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        {typographyRoleOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-2">
                      <label className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                        Font name
                      </label>
                      <Input
                        value={item.fontName}
                        onChange={(e) =>
                          updateDraft((current) => ({
                            ...current,
                            typography: current.typography.map((type, currentIndex) =>
                              currentIndex === index ? { ...type, fontName: e.target.value } : type,
                            ),
                          }))
                        }
                        placeholder="Cormorant Garamond"
                        className={fieldClass}
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                        Usage note
                      </label>
                      <Input
                        value={item.note}
                        onChange={(e) =>
                          updateDraft((current) => ({
                            ...current,
                            typography: current.typography.map((type, currentIndex) =>
                              currentIndex === index ? { ...type, note: e.target.value } : type,
                            ),
                          }))
                        }
                        placeholder="Elegant, editorial, high-trust"
                        className={fieldClass}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmationModal
        open={saveOpen}
        title="Apply these changes?"
        description="This will save the current edits to the board."
        confirmLabel="Apply changes"
        cancelLabel="Cancel"
        onConfirm={confirmSave}
        onCancel={() => setSaveOpen(false)}
      />

      <ConfirmationModal
        open={deleteOpen}
        title="Delete this board?"
        description="This removes the board from your saved boards and cannot be undone."
        confirmLabel="Delete board"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <ConfirmationModal
        open={Boolean(pendingRemoval)}
        title="Remove this item?"
        description="This change will be applied to the board after confirmation."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleConfirmRemoval}
        onCancel={() => setPendingRemoval(null)}
      />

      <ReferenceEditorModal
        open={editingReferenceIndex !== null}
        reference={currentReference}
        onSave={handleSaveReference}
        onClose={() => setEditingReferenceIndex(null)}
      />

      <ShareModal
        open={shareOpen}
        boardTitle={draft.title}
        sharePath={sharePath}
        onCopied={() => {
          setShareOpen(false);
          showToast('Share link copied.', 'success');
        }}
        onClose={() => setShareOpen(false)}
      />

      <ExportModal
        open={exportOpen}
        board={draft}
        onExported={() => {
          setExportOpen(false);
          showToast('Board exported as JSON.', 'success');
        }}
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
}