'use client';

import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import type { Board, NoteType } from '@/types/board';
import {
  deleteBoardById,
  duplicateBoardById,
  loadBoards,
  subscribeBoards,
  updateBoard,
} from '@/lib/board-store';
import { formatDateTime } from '@/lib/utils';
import { BoardHeader } from './BoardHeader';
import { CreativeDirectionPanel } from './CreativeDirectionPanel';
import { PaletteSwatches } from './PaletteSwatches';
import { TypographyPairingCard } from './TypographyPairingCard';
import { ReferenceGrid } from './ReferenceGrid';
import { StickyNote } from './StickyNote';
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';
import { EmptyState } from '@/components/shared/EmptyState';
import { ShareModal } from '@/components/shared/ShareModal';
import { ExportModal } from '@/components/shared/ExportModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { showToast } from '@/components/shared/toast-store';

type BoardEditorClientProps = {
  boardId: string;
};

type RemovalKind = 'palette' | 'typography' | 'reference' | 'note';

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

  if (!savedBoard || !draft) {
    return (
      <EmptyState
        title="Board not found"
        description="This board may have been deleted or the link is outdated."
        actionLabel="Back to boards"
        actionHref="/app"
      />
    );
  }

  const sharePath = `/app/boards/${draft.id}/view`;
  const toneText = draft.tone.join(', ');
  const tagsText = draft.tags.join(', ');

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
          hex: '#CBD5E1',
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
          imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
          category: 'Interior',
          source: 'Unsplash',
        },
        ...current.references,
      ],
    }));
    showToast('Reference added.', 'success');
  };

  const dirtyStatus = isDirty ? 'Unsaved changes' : saveStatus;

  return (
    <div className="space-y-6">
      <BoardHeader
        boardId={draft.id}
        title={draft.title}
        prompt={draft.prompt}
        updatedAt={formatDateTime(draft.updatedAt)}
        visibility={draft.visibility}
        isFavorite={draft.isFavorite}
        saveStatus={dirtyStatus}
        isDirty={isDirty}
        onTitleChange={(value) => updateDraft((current) => ({ ...current, title: value }))}
        onSave={handleSave}
        onDuplicate={handleDuplicate}
        onDelete={() => {
          showToast('You are about to permanently delete this board.', 'destructive');
          setDeleteOpen(true);
        }}
        onToggleFavorite={handleToggleFavorite}
        onShare={() => {
          setShareOpen(true);
          showToast('Share modal opened.', 'default');
        }}
        onExport={() => {
          setExportOpen(true);
          showToast('Export modal opened.', 'default');
        }}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <CreativeDirectionPanel
            summary={draft.summary}
            mood={draft.mood}
            toneText={toneText}
            tagsText={tagsText}
            onSummaryChange={(value) => updateDraft((current) => ({ ...current, summary: value }))}
            onMoodChange={(value) => updateDraft((current) => ({ ...current, mood: value }))}
            onToneChange={(value) =>
              updateDraft((current) => ({
                ...current,
                tone: value
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean),
              }))
            }
            onTagsChange={(value) =>
              updateDraft((current) => ({
                ...current,
                tags: value
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean),
              }))
            }
          />

          <ReferenceGrid
            references={draft.references}
            onAdd={handleAddReference}
            onChange={(index, next) =>
              updateDraft((current) => ({
                ...current,
                references: current.references.map((item, currentIndex) =>
                  currentIndex === index ? { ...item, ...next } : item,
                ),
              }))
            }
            onRemove={(index) => handleRequestRemoval('reference', index)}
          />

          <Card className="border-slate-200 bg-white/85">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Notes</Badge>
                </div>
                <CardTitle className="mt-2">Sticky notes</CardTitle>
                <CardDescription>Capture short ideas, instructions, and keywords.</CardDescription>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddNote}
                className="rounded-full px-4 whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                Add note
              </Button>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {draft.notes.map((note, index) => (
                  <StickyNote
                    key={note.id}
                    note={note}
                    onChange={(value) =>
                      updateDraft((current) => ({
                        ...current,
                        notes: current.notes.map((item, currentIndex) =>
                          currentIndex === index ? { ...item, text: value } : item,
                        ),
                      }))
                    }
                    onTypeChange={(value: NoteType) =>
                      updateDraft((current) => ({
                        ...current,
                        notes: current.notes.map((item, currentIndex) =>
                          currentIndex === index ? { ...item, type: value } : item,
                        ),
                      }))
                    }
                    onDelete={() => handleRequestRemoval('note', index)}
                  />
                ))}
              </div>

              {!draft.notes.length ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                  No notes yet.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <PaletteSwatches
            palette={draft.palette}
            onChange={(index, next) =>
              updateDraft((current) => ({
                ...current,
                palette: current.palette.map((item, currentIndex) =>
                  currentIndex === index ? { ...item, ...next } : item,
                ),
              }))
            }
            onAdd={handleAddPalette}
            onRemove={(index) => handleRequestRemoval('palette', index)}
          />

          <TypographyPairingCard
            typography={draft.typography}
            onChange={(index, next) =>
              updateDraft((current) => ({
                ...current,
                typography: current.typography.map((item, currentIndex) =>
                  currentIndex === index ? { ...item, ...next } : item,
                ),
              }))
            }
            onAdd={handleAddTypography}
            onRemove={(index) => handleRequestRemoval('typography', index)}
          />
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