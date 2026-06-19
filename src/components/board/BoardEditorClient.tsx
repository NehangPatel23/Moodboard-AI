'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import type {
  Board,
  BoardActivityEvent,
  NoteType,
  PaletteItem,
  ReferenceItem,
  TypographyItem,
  TypographyRole,
} from '@/types/board';
import {
  applyRemoteBoard,
  deleteBoardById,
  duplicateBoardById,
  getBoardStoreSnapshot,
  getServerBoardStoreSnapshot,
  isBoardStoreResolving,
  subscribeBoards,
  persistBoardRemote,
} from '@/lib/board-store';
import { useBoardRealtime, type BoardPresenceUser } from '@/lib/realtime/use-board-realtime';
import {
  useBoardFieldSync,
  useRemoteFieldValues,
  type BoardFieldPatch,
} from '@/lib/realtime/use-board-field-sync';
import { buildFieldId, parseFieldId } from '@/lib/realtime/collaborator-fields';
import { useBoardComments } from '@/lib/realtime/use-board-comments';
import { useBoardActivity } from '@/lib/realtime/use-board-activity';
import { useBoardCollaborationState } from '@/lib/realtime/use-board-collaboration-state';
import type { BlockedNavigation } from '@/lib/board-editor-navigation-guard';
import { useBoardEditorNavigationGuard } from '@/lib/use-board-editor-navigation-guard';
import { useBoardAutoSave } from '@/lib/use-board-auto-save';
import { autosaveIntervalToMs } from '@/lib/autosave-interval';
import { lockBodyScroll } from '@/lib/body-scroll-lock';
import { subscribeEditorQuickAction, type EditorQuickAction } from '@/lib/editor-quick-actions';
import {
  DEFAULT_APP_SETTINGS,
  readAppSettings,
  subscribeAppSettings,
} from '@/lib/settings-store';
import {
  getServerAuthSnapshot,
  readAuthState,
  subscribeAuth,
} from '@/lib/auth-store';
import { BoardCommentsPanel } from '@/components/board/BoardCommentsPanel';
import { BoardActivityPanel } from '@/components/board/BoardActivityPanel';
import { BoardSnapshotsPanel } from '@/components/board/BoardSnapshotsPanel';
import { BoardReplayBanner } from '@/components/board/BoardReplayBanner';
import { BoardReplayCallout, BoardReplaySectionBlock } from '@/components/board/BoardReplayCallout';
import { BoardEditorSkeleton } from '@/components/board/BoardEditorSkeleton';
import { BoardEditorToolbar } from '@/components/board/BoardEditorToolbar';
import { CollaboratorFieldHighlight } from '@/components/board/CollaboratorFieldHighlight';
import { SaveTemplateModal } from '@/components/board/SaveTemplateModal';
import { RemoteUpdateBanner } from '@/components/board/RemoteUpdateBanner';
import { ReferenceImageDisplay } from '@/components/board/ReferenceImageDisplay';
import { ReferenceImageSearchButton } from '@/components/board/ReferenceImageSearchButton';
import { AiGenerateButton } from '@/components/shared/AiGenerateButton';
import { getReferenceSourceLabel, isPexelsReference, isUnsplashReference } from '@/lib/reference-source-label';
import {
  REFERENCE_IMAGE_SOURCE,
  REFERENCE_IMAGE_SOURCE_CUSTOM,
  REFERENCE_IMAGE_SOURCE_UPLOAD,
  buildReferenceImageUrl,
  sanitizeReferenceItem,
} from '@/lib/reference-images';
import { fetchBrandSuggestions, fetchPaletteSuggestions, fetchReferenceImageUpload, fetchTypographySuggestions } from '@/lib/ai';
import { useDocumentTitle } from '@/lib/use-document-title';
import { formatDateTime } from '@/lib/utils';
import {
  getFirstReplaySectionIndex,
  getNextReplaySectionIndex,
  getPreviousReplaySectionIndex,
  getReplayChangesForEditorSection,
  getReplaySectionIndices,
  findChangeByLabel,
  sectionHasReplayChanges,
  snapToReplaySectionIndex,
} from '@/lib/board-replay';
import {
  EDITOR_SECTION_META,
  EDITOR_SECTION_ORDER,
  getEditorSectionIndex,
  type EditorSectionName,
} from '@/lib/editor-sections';
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';
import { CollaborateModal } from '@/components/shared/CollaborateModal';
import { ExportModal } from '@/components/shared/ExportModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Trash2,
  X,
  ClipboardList, 
  Lightbulb, 
  Tag,
} from 'lucide-react';
import { showToast } from '@/components/shared/toast-store';
import {
  editorFieldClass,
  editorGhostButtonClass,
  editorIconButtonClass,
  editorLabelClass,
  editorPanelClass,
  editorSelectClass,
  editorSubtleSurfaceClass,
  presenceAccentForUser,
} from '@/components/board/board-editor-styles';

type BoardEditorClientProps = {
  boardId: string;
};

type RemovalKind = 'palette' | 'typography' | 'reference' | 'note';
type BoardAction = 'duplicate' | 'share' | 'export' | 'view';

type PendingContinue =
  | { kind: 'board-action'; action: BoardAction }
  | BlockedNavigation;

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

const fontOptions = [
  'Inter',
  'DM Sans',
  'Manrope',
  'Sora',
  'Plus Jakarta Sans',
  'IBM Plex Sans',
  'Bodoni Moda',
  'Cormorant Garamond',
  'Playfair Display',
  'Libre Baskerville',
  'Merriweather',
];

const panelClass = editorPanelClass;
const fieldClass = editorFieldClass;

const noteToneClasses: Record<
  NoteType,
  {
    accent: string;
    badge: string;
    card: string;
  }
> = {
  idea: {
    accent: 'bg-amber-400/80',
    badge: 'border-transparent bg-amber-100 text-amber-950 dark:bg-amber-300/18 dark:text-amber-50',
    card: 'border-amber-200 bg-amber-50/90 dark:border-amber-300/25 dark:bg-amber-300/10',
  },
  instruction: {
    accent: 'bg-sky-400/80',
    badge: 'border-transparent bg-sky-100 text-sky-950 dark:bg-sky-300/18 dark:text-sky-50',
    card: 'border-sky-200 bg-sky-50/90 dark:border-sky-300/25 dark:bg-sky-300/10',
  },
  keyword: {
    accent: 'bg-violet-400/80',
    badge: 'border-transparent bg-violet-100 text-violet-950 dark:bg-violet-300/18 dark:text-violet-50',
    card: 'border-violet-200 bg-violet-50/90 dark:border-violet-300/25 dark:bg-violet-300/10',
  },
};

function NoteTypeIcon({ type }: { type: NoteType }) {
  const className = 'h-3.5 w-3.5 shrink-0';

  switch (type) {
    case 'idea':
      return <Lightbulb className={className} />;
    case 'instruction':
      return <ClipboardList className={className} />;
    case 'keyword':
      return <Tag className={className} />;
    default:
      return null;
  }
}

function EditorTabPill({
  label,
  description,
  icon: Icon,
  active,
  onClick,
  index,
  replayHighlight = false,
  replayDisabled = false,
  presenceUsers = [],
  currentUserId = null,
}: {
  label: string;
  description: string;
  icon: typeof EDITOR_SECTION_META.overview.icon;
  active: boolean;
  onClick: () => void;
  index: number;
  replayHighlight?: boolean;
  replayDisabled?: boolean;
  presenceUsers?: BoardPresenceUser[];
  currentUserId?: string | null;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={replayDisabled}
      aria-pressed={active}
      aria-label={`Edit ${label} section`}
      className={[
        'relative flex min-w-40 items-start gap-3 rounded-3xl border px-4 py-3 text-left transition',
        'border-(--border) bg-(--surface) text-(--text-strong)',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
        'hover:bg-(--surface-subtle)',
        active ? 'bg-(--surface-subtle) shadow-sm' : '',
        replayHighlight ? 'border-amber-400/70 ring-1 ring-amber-400/30' : '',
        replayDisabled ? 'cursor-not-allowed opacity-45 hover:bg-(--surface)' : '',
      ].join(' ')}
    >
      {replayHighlight ? (
        <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
      ) : null}
      <div
        className={[
          'mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border',
          'border-(--border) bg-(--surface-elevated)',
        ].join(' ')}
      >
        <Icon
          className={active ? 'h-4 w-4 text-(--text-strong)' : 'h-4 w-4 text-(--text-muted)'}
        />
      </div>

      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
          <span>
            {index + 1}. {label}
          </span>
          {presenceUsers.length > 0 ? (
            <span className="inline-flex items-center gap-1">
              {presenceUsers.map((user) => {
                const isCurrentUser = user.userId === currentUserId;
                const displayName = isCurrentUser ? 'You' : user.name;
                const statusLabel = user.status === 'editing' ? 'editing' : 'viewing';

                return (
                  <span
                    key={user.userId}
                    className="h-2 w-2 shrink-0 rounded-full ring-1 ring-(--background)"
                    style={{ backgroundColor: presenceAccentForUser(user.userId) }}
                    title={`${displayName} (${statusLabel})`}
                    aria-label={`${displayName} is ${statusLabel} this section`}
                  />
                );
              })}
            </span>
          ) : null}
        </p>
        <p className="mt-1 text-xs text-(--text-muted)">{description}</p>
      </div>
    </button>
  );
}

function cloneBoard(board: Board): Board {
  return JSON.parse(JSON.stringify(board)) as Board;
}

function applyRemoval(board: Board, kind: RemovalKind, index: number): Board {
  if (kind === 'palette') {
    return { ...board, palette: board.palette.filter((_, currentIndex) => currentIndex !== index) };
  }

  if (kind === 'typography') {
    return {
      ...board,
      typography: board.typography.filter((_, currentIndex) => currentIndex !== index),
    };
  }

  if (kind === 'reference') {
    return {
      ...board,
      references: board.references.filter((_, currentIndex) => currentIndex !== index),
    };
  }

  return { ...board, notes: board.notes.filter((_, currentIndex) => currentIndex !== index) };
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

  if (serifFonts.has(trimmed)) {
    return `'${trimmed}', var(--font-display), Georgia, serif`;
  }

  return `'${trimmed}', var(--font-sans), system-ui, sans-serif`;
}

function ReferenceEditorModal({
  reference,
  board,
  onSave,
  onClose,
}: {
  reference: ReferenceItem;
  board: Board;
  onSave: (next: ReferenceItem) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(() => sanitizeReferenceItem(reference, board, 0));
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const unlockBodyScroll = lockBodyScroll();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      unlockBodyScroll();
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  const updateDraft = (patch: Partial<ReferenceItem>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const applyCustomUrl = () => {
    const url = draft.imageUrl?.trim() ?? '';
    if (!/^https:\/\/.+/i.test(url)) {
      showToast('Enter a valid https:// image URL.', 'destructive');
      return;
    }

    updateDraft({ imageUrl: url, source: REFERENCE_IMAGE_SOURCE_CUSTOM });
    showToast('Custom image URL applied.', 'success');
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await fetchReferenceImageUpload({
        file,
        boardId: board.id,
        referenceId: draft.id,
      });
      updateDraft({ imageUrl: result.imageUrl, source: REFERENCE_IMAGE_SOURCE_UPLOAD });
      showToast('Image uploaded.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      showToast(message, 'destructive');
    } finally {
      setUploading(false);
    }
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
        className="flex w-full max-w-6xl flex-col overflow-hidden rounded-4xl border border-(--border) bg-(--surface-elevated) text-(--text) shadow-[var(--shadow-elevated)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-(--border) px-6 py-5 md:px-8 md:py-6">
          <div className="space-y-2">
            <h2
              id="reference-editor-title"
              className="[font-family:var(--font-display),serif] text-[clamp(2.5rem,4vw,4rem)] leading-[0.95] tracking-[-0.04em] text-(--text-strong)"
            >
              Edit reference
            </h2>
            <p
              id="reference-editor-description"
              className="max-w-2xl text-sm leading-6 text-(--text-muted) md:text-base"
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
            tooltip="Close reference editor"
            className="h-11 w-11 rounded-full border border-(--border) bg-(--surface-elevated) text-(--text-muted) hover:bg-(--surface-subtle) hover:text-(--text-strong)"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-6 py-6 md:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4">
              <div className="overflow-hidden rounded-[1.75rem] border border-(--border) bg-(--surface-subtle) shadow-sm">
                <div className="relative aspect-16/10 w-full">
                  <ReferenceImageDisplay
                    title={draft.title}
                    category={draft.category}
                    imageUrl={draft.imageUrl}
                    source={draft.source}
                    board={board}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{draft.category}</Badge>
                <Badge variant={isPexelsReference(draft.source, draft.imageUrl) || isUnsplashReference(draft.source, draft.imageUrl) ? 'default' : 'outline'}>
                  {getReferenceSourceLabel(draft.source, draft.imageUrl)}
                </Badge>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid gap-2">
                <label className={editorLabelClass}>
                  Reference title
                </label>
                <Textarea
                  value={draft.title}
                  onChange={(e) => updateDraft({ title: e.target.value })}
                  placeholder="Reference title"
                  className="min-h-23 rounded-3xl border-(--border) bg-(--surface-elevated) text-(--text) placeholder:text-(--text-muted) focus-visible:ring-(--ring)"
                />
              </div>

              <div className="grid gap-2">
                <label className={editorLabelClass}>
                  Reference type
                </label>
                <select
                  value={draft.category}
                  onChange={(e) => updateDraft({ category: e.target.value })}
                  className="h-11 w-full rounded-2xl border border-(--border) bg-(--surface-elevated) px-4 text-sm text-(--text) outline-none focus:ring-2 focus:ring-(--ring)"
                >
                  {referenceCategoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label className={editorLabelClass}>
                  Source
                </label>
                <Input
                  value={draft.source ?? ''}
                  onChange={(e) => updateDraft({ source: e.target.value })}
                  placeholder="Generated"
                  className="border-(--border) bg-(--surface-elevated) text-(--text) placeholder:text-(--text-muted) focus-visible:ring-(--ring)"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <ReferenceImageSearchButton
                  title={draft.title}
                  category={draft.category}
                  board={board}
                  referenceId={draft.id}
                  onResolved={(imageUrl, source) => {
                    updateDraft({ imageUrl, source });
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={applyCustomUrl}
                  className="rounded-full"
                >
                  Apply URL
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="rounded-full"
                >
                  {uploading ? 'Uploading…' : 'Upload file'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (file) {
                      void handleUpload(file);
                    }
                  }}
                />
              </div>

              <div className="grid gap-2">
                <label className={editorLabelClass}>
                  Image URL
                </label>
                <Textarea
                  value={draft.imageUrl}
                  onChange={(e) => updateDraft({ imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="min-h-23 rounded-3xl border-(--border) bg-(--surface-elevated) text-(--text) placeholder:text-(--text-muted) break-all focus-visible:ring-(--ring)"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-(--border) px-6 py-5 md:px-8">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-full border-(--border) bg-(--surface-elevated) text-(--text) hover:bg-(--surface-subtle) hover:text-(--text-strong)"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => onSave(draft)}
            className="rounded-full bg-(--text-strong) text-(--background) hover:opacity-90"
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
  const searchParams = useSearchParams();
  const generationSource = searchParams.get('source') === 'gemini' ? 'gemini' : null;
  const auth = useSyncExternalStore(subscribeAuth, readAuthState, getServerAuthSnapshot);
  const boardStore = useSyncExternalStore(
    subscribeBoards,
    getBoardStoreSnapshot,
    getServerBoardStoreSnapshot,
  );
  const savedBoard = boardStore.boards.find((item) => item.id === boardId) ?? null;
  const isResolvingBoard = isBoardStoreResolving(auth.status);

  const [draft, setDraft] = useState<Board | null>(null);
  const editorBoard = useMemo(() => {
    if (draft) return draft;
    const board = boardStore.boards.find((item) => item.id === boardId);
    if (!board) return null;
    return cloneBoard(board);
  }, [draft, boardId, boardStore.boards]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<{
    kind: RemovalKind;
    index: number;
  } | null>(null);
  const [pendingContinue, setPendingContinue] = useState<PendingContinue | null>(null);
  const [unsavedChangesOpen, setUnsavedChangesOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftRevision, setDraftRevision] = useState(0);
  const editorBoardRef = useRef<Board | null>(null);
  const isSavingRef = useRef(false);
  const [editingReferenceIndex, setEditingReferenceIndex] = useState<number | null>(null);
  const [isNewReference, setIsNewReference] = useState(false);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [sectionHighlight, setSectionHighlight] = useState<EditorSectionName | null>(null);
  const sectionTabsRef = useRef<HTMLElement>(null);
  const sectionContentRef = useRef<HTMLDivElement>(null);
  const skipInitialSectionScroll = useRef(true);
  const [typographyLoading, setTypographyLoading] = useState(false);
  const [paletteLoading, setPaletteLoading] = useState(false);
  const [brandLoading, setBrandLoading] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [snapshotsOpen, setSnapshotsOpen] = useState(false);
  const [replayEvent, setReplayEvent] = useState<BoardActivityEvent | null>(null);
  const [pendingRemoteBoard, setPendingRemoteBoard] = useState<Board | null>(null);
  const [pendingRemoteSavedByName, setPendingRemoteSavedByName] = useState<string | null>(null);
  const activeSectionIndexRef = useRef(activeSectionIndex);
  const replayEventRef = useRef(replayEvent);
  const commentsButtonRef = useRef<HTMLButtonElement>(null);
  const activityButtonRef = useRef<HTMLButtonElement>(null);
  const snapshotsButtonRef = useRef<HTMLButtonElement>(null);
  const [aiActionRequest, setAiActionRequest] = useState<EditorQuickAction | null>(null);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const applyingRemotePatchRef = useRef(false);
  const fieldPatchTimersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    activeSectionIndexRef.current = activeSectionIndex;
  }, [activeSectionIndex]);

  useEffect(() => {
    replayEventRef.current = replayEvent;
  }, [replayEvent]);

  const settings = useSyncExternalStore(
    subscribeAppSettings,
    readAppSettings,
    () => DEFAULT_APP_SETTINGS,
  );

  const boardRole = savedBoard?.role ?? (savedBoard ? 'owner' : null);
  const canEditBoard = boardRole === 'owner' || boardRole === 'editor';
  const realtimeEnabled = auth.status === 'authenticated' && boardRole !== null;
  const canComment = boardRole !== null;

  const handleBlockedNavigation = useCallback((navigation: BlockedNavigation) => {
    setPendingContinue(navigation);
    setUnsavedChangesOpen(true);
  }, []);

  useBoardEditorNavigationGuard({
    isDirty,
    enabled: canEditBoard && Boolean(editorBoard) && !isResolvingBoard,
    onBlocked: handleBlockedNavigation,
  });

  const handleRemoteBoard = useCallback(
    (board: Board, savedByName: string | null) => {
      if (isDirty) {
        setPendingRemoteBoard(board);
        setPendingRemoteSavedByName(savedByName);
        return;
      }

      applyRemoteBoard(boardId, board);
      setDraft(null);
      setSaveStatus('Saved');
      setPendingRemoteBoard(null);
      setPendingRemoteSavedByName(null);
      const savedBy = savedByName?.trim() || 'A collaborator';
      if (readAppSettings().remoteSaveToastEnabled) {
        showToast(`${savedBy} saved changes. Your board was updated.`, 'default');
      }
    },
    [boardId, isDirty],
  );

  const activeSectionLabel = EDITOR_SECTION_META[EDITOR_SECTION_ORDER[activeSectionIndex]].label;

  const { applyRemotePatch } = useRemoteFieldValues();

  const {
    commentsLastReadAt,
    activityLastReadAt,
    snapshotsLastReadAt,
    unreadSnapshots,
    markCommentsRead,
    markActivityRead,
    markSnapshotsRead,
    markSnapshotRead,
    setItemRead,
    hideItem,
    unhideItem,
    refresh: refreshCollaborationState,
  } = useBoardCollaborationState({
    boardId,
    enabled: canComment,
    currentUserId: auth.user?.id ?? null,
    trackSnapshots: canEditBoard,
  });

  const {
    comments,
    loading: commentsLoading,
    posting: commentsPosting,
    postComment,
    deleteComment,
    updateComment,
    patchCommentState,
    refresh: refreshComments,
  } = useBoardComments({
    boardId,
    enabled: canComment,
    currentUserId: auth.user?.id ?? null,
    authorName: auth.user?.name ?? settings.workspaceName,
    commentsLastReadAt,
  });

  const {
    activity,
    loading: activityLoading,
    deleteActivity,
    patchActivityState,
    refresh: refreshActivity,
  } = useBoardActivity({
    boardId,
    enabled: canComment,
    currentUserId: auth.user?.id ?? null,
    activityLastReadAt,
  });

  const currentUserId = auth.user?.id ?? null;

  const unreadCommentsCount = useMemo(
    () =>
      comments.filter(
        (comment) =>
          !comment.isHidden && !comment.isRead && comment.userId !== currentUserId,
      ).length,
    [comments, currentUserId],
  );
  const unreadActivityCount = useMemo(
    () =>
      activity.filter(
        (event) => !event.isHidden && !event.isRead && event.userId !== currentUserId,
      ).length,
    [activity, currentUserId],
  );
  const unreadSnapshotsCount = canEditBoard ? unreadSnapshots : 0;

  const tabUnreadCount = unreadCommentsCount + unreadActivityCount + unreadSnapshotsCount;
  useDocumentTitle(editorBoard?.title ?? 'Board', tabUnreadCount);

  useEffect(() => {
    if (generationSource === 'gemini') {
      showToast('Board generated with Gemini.', 'success');
    }
  }, [generationSource]);

  useEffect(() => {
    return subscribeEditorQuickAction((detail) => {
      if (detail.action === 'jump-section' && typeof detail.sectionIndex === 'number') {
        setActiveSectionIndex(detail.sectionIndex);
        return;
      }

      if (detail.action === 'export') {
        setExportOpen(true);
        return;
      }

      if (detail.action === 'snapshots') {
        setSnapshotsOpen(true);
        return;
      }

      if (detail.action === 'share') {
        const owner = (boardRole ?? 'owner') === 'owner';
        if (!owner) {
          showToast('Only the board owner can manage sharing.', 'destructive');
          return;
        }
        setShareOpen(true);
        return;
      }

      if (detail.action === 'suggest-palette') {
        setAiActionRequest('suggest-palette');
        return;
      }

      if (detail.action === 'suggest-typography') {
        setAiActionRequest('suggest-typography');
        return;
      }

      if (detail.action === 'suggest-brand') {
        setAiActionRequest('suggest-brand');
      }
    });
  }, [boardRole]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const el = event.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable) {
        return;
      }

      const replay = replayEventRef.current;
      const currentSection = activeSectionIndexRef.current;

      if (replay) {
        if (event.key === 'ArrowRight' || event.key === ' ') {
          event.preventDefault();
          const next = getNextReplaySectionIndex(replay.changes, currentSection);
          if (next !== null) {
            setActiveSectionIndex(next);
          }
          return;
        }

        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          const prev = getPreviousReplaySectionIndex(replay.changes, currentSection);
          if (prev !== null) {
            setActiveSectionIndex(prev);
          }
        }
        return;
      }

      if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault();
        setActiveSectionIndex((current) => (current + 1) % EDITOR_SECTION_ORDER.length);
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setActiveSectionIndex(
          (current) => (current - 1 + EDITOR_SECTION_ORDER.length) % EDITOR_SECTION_ORDER.length,
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (skipInitialSectionScroll.current) {
      skipInitialSectionScroll.current = false;
      return;
    }

    const scrollBehavior = settings.reduceMotionEnabled ? 'auto' : 'smooth';
    sectionTabsRef.current?.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
  }, [activeSectionIndex, settings.reduceMotionEnabled]);

  useEffect(() => {
    if (
      !aiActionRequest ||
      !editorBoard ||
      !canEditBoard ||
      (aiActionRequest !== 'suggest-palette' &&
        aiActionRequest !== 'suggest-typography' &&
        aiActionRequest !== 'suggest-brand')
    ) {
      return;
    }

    let cancelled = false;
    const board = editorBoard;

    const applyDraftUpdate = (updater: (current: Board) => Board) => {
      setDraft((current) => {
        const base = current ?? cloneBoard(board);
        setIsDirty(true);
        setSaveStatus('Unsaved changes');
        return updater(cloneBoard(base));
      });
    };

    async function runAiAction() {
      try {
        if (aiActionRequest === 'suggest-palette') {
          setPaletteLoading(true);
          const result = await fetchPaletteSuggestions(board);
          if (cancelled) return;
          applyDraftUpdate((current) => ({ ...current, palette: result.palette }));
          if (result.notice) {
            showToast(result.notice, 'default');
            return;
          }
          showToast(
            result.source === 'gemini' ? 'Palette updated with Gemini.' : 'Demo palette applied.',
            'success',
          );
          return;
        }

        if (aiActionRequest === 'suggest-typography') {
          setTypographyLoading(true);
          const result = await fetchTypographySuggestions(board);
          if (cancelled) return;
          applyDraftUpdate((current) => ({ ...current, typography: result.typography }));
          if (result.notice) {
            showToast(result.notice, 'default');
            return;
          }
          showToast(
            result.source === 'gemini' ? 'Typography updated with Gemini.' : 'Demo typography applied.',
            'success',
          );
          return;
        }

        if (aiActionRequest === 'suggest-brand') {
          setBrandLoading(true);
          const result = await fetchBrandSuggestions(board);
          if (cancelled) return;
          applyDraftUpdate((current) => ({
            ...current,
            brandStrategy: {
              positioning: result.positioning,
              voice: result.voice,
              messaging: result.messaging,
            },
          }));
          if (result.notice) {
            showToast(result.notice, 'default');
            return;
          }
          showToast(
            result.source === 'gemini'
              ? 'Brand strategy updated. Save to keep it.'
              : 'Demo brand strategy applied.',
            'success',
          );
        }
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'AI suggestion failed';
        showToast(message, 'destructive');
      } finally {
        if (!cancelled) {
          setPaletteLoading(false);
          setTypographyLoading(false);
          setBrandLoading(false);
          setAiActionRequest(null);
        }
      }
    }

    void runAiAction();

    return () => {
      cancelled = true;
    };
  }, [aiActionRequest, canEditBoard, editorBoard]);

  useEffect(() => {
    editorBoardRef.current = editorBoard;
  }, [editorBoard]);

  const isReplayMode = replayEvent !== null;

  const markDirty = useCallback(() => {
    setDraftRevision((value) => value + 1);
    setIsDirty(true);
    setSaveStatus((current) => (current === 'Saving…' ? current : 'Unsaved changes'));
  }, []);

  const updateDraft = useCallback(
    (updater: (current: Board) => Board) => {
      if (!canEditBoard) return;
      setDraft((current) => {
        const base = current ?? (savedBoard ? cloneBoard(savedBoard) : null);
        if (!base) return null;
        markDirty();
        return updater(cloneBoard(base));
      });
    },
    [canEditBoard, markDirty, savedBoard],
  );

  const fieldSyncEnabled = canEditBoard && !isReplayMode && !pendingRemoteBoard;

  const handleRemoteFieldPatch = useCallback(
    (patch: BoardFieldPatch) => {
      if (applyingRemotePatchRef.current) return;

      const parsed = parseFieldId(patch.fieldId);
      applyingRemotePatchRef.current = true;

      try {
        if (parsed.kind === 'overview-summary') {
          updateDraft((current) => ({ ...current, summary: patch.value }));
        } else if (parsed.kind === 'note' && parsed.noteId) {
          updateDraft((current) => ({
            ...current,
            notes: current.notes.map((note) =>
              note.id === parsed.noteId ? { ...note, text: patch.value } : note,
            ),
          }));
        }
        applyRemotePatch(patch);
      } finally {
        applyingRemotePatchRef.current = false;
      }
    },
    [applyRemotePatch, updateDraft],
  );

  const { broadcastFieldPatch } = useBoardFieldSync({
    boardId,
    userId: auth.user?.id ?? null,
    userName: auth.user?.name ?? settings.workspaceName,
    enabled: fieldSyncEnabled,
    onRemotePatch: handleRemoteFieldPatch,
  });

  const scheduleFieldPatch = useCallback(
    (fieldId: string, value: string) => {
      if (applyingRemotePatchRef.current) return;

      const timers = fieldPatchTimersRef.current;
      if (timers[fieldId]) {
        window.clearTimeout(timers[fieldId]);
      }

      timers[fieldId] = window.setTimeout(() => {
        broadcastFieldPatch(fieldId, value);
        delete timers[fieldId];
      }, 250);
    },
    [broadcastFieldPatch],
  );

  useEffect(() => {
    return () => {
      for (const timer of Object.values(fieldPatchTimersRef.current)) {
        window.clearTimeout(timer);
      }
      fieldPatchTimersRef.current = {};
    };
  }, []);

  const { onlineUsers, connectionState: presenceConnectionState } = useBoardRealtime({
    boardId,
    userId: auth.user?.id ?? null,
    userName: auth.user?.name ?? settings.workspaceName,
    boardRole,
    localUpdatedAt: editorBoard?.updatedAt ?? null,
    isDirty,
    enabled: realtimeEnabled,
    activeSectionIndex,
    activeSectionLabel,
    activeFieldId,
    onRemoteBoard: handleRemoteBoard,
  });

  const persistDraft = useCallback(
    async (options?: { showToast?: boolean; source?: 'manual' | 'auto' }) => {
      const board = editorBoardRef.current;
      if (!board || isSavingRef.current) return false;

      isSavingRef.current = true;
      setIsSaving(true);
      setSaveStatus('Saving…');

      const saverName = auth.user?.name ?? settings.workspaceName;
      const updated = await persistBoardRemote(boardId, cloneBoard(board), {
        saveSource: options?.source ?? 'manual',
      });

      isSavingRef.current = false;
      setIsSaving(false);

      if (!updated) {
        setSaveStatus('Save failed');
        if (options?.source === 'auto') {
          showToast('Auto-save failed.', 'destructive');
        } else if (options?.showToast) {
          showToast('Save failed.', 'destructive');
        }
        return false;
      }

      setDraft({ ...updated, lastSavedByName: saverName });
      setIsDirty(false);
      setSaveStatus('Saved');
      if (options?.source === 'auto') {
        if (readAppSettings().autosaveToastEnabled) {
          showToast('Changes auto-saved.', 'success');
        }
      } else if (options?.showToast) {
        showToast('Changes saved.', 'success');
      }
      return true;
    },
    [auth.user?.name, boardId, settings.workspaceName],
  );

  const handleAutoSave = useCallback(() => {
    if (!isDirty || pendingRemoteBoard) return;
    void persistDraft({ source: 'auto' });
  }, [isDirty, pendingRemoteBoard, persistDraft]);

  useBoardAutoSave({
    enabled: canEditBoard && !isReplayMode && !pendingRemoteBoard && Boolean(editorBoard),
    isDirty,
    debounceMs: autosaveIntervalToMs(settings.autosaveInterval),
    isSaving,
    revision: String(draftRevision),
    onAutoSave: handleAutoSave,
  });

  if (isResolvingBoard) {
    return <BoardEditorSkeleton />;
  }

  if (!editorBoard) {
    return (
      <section className="rounded-[2.5rem] border border-(--border) bg-(--surface-elevated) p-8 shadow-[var(--shadow-card)]">
        <p className={editorLabelClass}>
          Board not found
        </p>
        <h1 className="[font-family:var(--font-display),serif] mt-3 text-4xl tracking-tight text-(--text-strong)">
          This board may have been deleted.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-(--text-muted)">
          The link may be outdated or the board may have been removed from your studio.
        </p>
        <div className="mt-6">
          <Button
            type="button"
            onClick={() => router.push('/app')}
            className="rounded-full bg-(--text-strong) text-(--background)"
          >
            Back to boards
          </Button>
        </div>
      </section>
    );
  }

  const sharePath = `/share/${editorBoard.id}`;
  const viewPath = `/app/boards/${editorBoard.id}/view`;
  const resolvedBoardRole = boardRole ?? 'owner';
  const isOwner = resolvedBoardRole === 'owner';
  const isEditor = resolvedBoardRole === 'editor';
  const isViewer = resolvedBoardRole === 'viewer';
  const canManageMembers = isOwner;
  const readOnly = !canEditBoard;
  const effectiveReadOnly = readOnly || isReplayMode;
  const canMutateBoard = canEditBoard && !isReplayMode;
  const replayChanges = replayEvent?.changes ?? [];
  const toneText = editorBoard.tone.join(', ');
  const tagsText = editorBoard.tags.join(', ');
  const dirtyStatus = isSaving ? 'Saving…' : isDirty ? 'Unsaved changes' : saveStatus;
  const currentReference =
    editingReferenceIndex !== null ? editorBoard.references[editingReferenceIndex] ?? null : null;
  const activeSection: EditorSectionName = EDITOR_SECTION_ORDER[activeSectionIndex];

  const handleGoToSection = (section: EditorSectionName) => {
    const index = getEditorSectionIndex(section);
    if (index < 0) return;

    setActiveSectionIndex(index);
    setSectionHighlight(section);
    window.setTimeout(() => setSectionHighlight(null), 2000);
  };

  const performBoardAction = (action: BoardAction) => {
    switch (action) {
      case 'duplicate': {
        const copy = duplicateBoardById(boardId);

        if (!copy) {
          showToast('Duplicate failed.', 'destructive');
          return;
        }

        showToast('Board duplicated.', 'success');

        window.setTimeout(() => {
          router.push(`/app/boards/${copy.id}`);
        }, 180);

        return;
      }

      case 'share':
        if (!isOwner) {
          showToast('Only the board owner can manage sharing.', 'destructive');
          return;
        }
        setShareOpen(true);
        return;

      case 'export':
        setExportOpen(true);
        return;

      case 'view':
        router.push(viewPath);
        return;
    }
  };

  const requireSavedChanges = (action: BoardAction) => {
    if (isDirty) {
      setPendingContinue({ kind: 'board-action', action });
      setUnsavedChangesOpen(true);
      return;
    }

    performBoardAction(action);
  };

  const proceedAfterSave = (pending: PendingContinue) => {
    window.setTimeout(() => {
      if ('kind' in pending) {
        performBoardAction(pending.action);
        return;
      }

      if (pending.type === 'href') {
        router.push(pending.href);
        return;
      }

      if (pending.type === 'back') {
        window.history.back();
        return;
      }

      pending.run();
    }, 150);
  };

  const handleSave = () => {
    setSaveOpen(true);
  };

  const confirmSave = async () => {
    const saved = await persistDraft({ showToast: true, source: 'manual' });
    if (saved) {
      setSaveOpen(false);
    }
  };

  const handleSaveAndContinue = async () => {
    const pending = pendingContinue;
    const saved = await persistDraft({ showToast: true, source: 'manual' });
    if (!saved) return;

    setUnsavedChangesOpen(false);
    setPendingContinue(null);

    if (pending) {
      proceedAfterSave(pending);
    }
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
    showToast(editorBoard.isFavorite ? 'Removed from favorites.' : 'Added to favorites.', 'success');
  };

  const handleToggleVisibility = () => {
    const nextVisibility = editorBoard.visibility === 'shared' ? 'private' : 'shared';
    updateDraft((current) => ({ ...current, visibility: nextVisibility }));
    showToast(
      nextVisibility === 'shared' ? 'Board set to shared.' : 'Board set to private.',
      'success',
    );
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

  const handleSuggestPalette = async () => {
    if (!editorBoard) return;

    setPaletteLoading(true);
    try {
      const result = await fetchPaletteSuggestions(editorBoard);
      updateDraft((current) => ({ ...current, palette: result.palette }));

      if (result.notice) {
        showToast(result.notice, 'default');
        return;
      }

      showToast(
        result.source === 'gemini' ? 'Palette updated with Gemini.' : 'Demo palette applied.',
        'success',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Palette suggestion failed';
      showToast(message, 'destructive');
    } finally {
      setPaletteLoading(false);
    }
  };

  const handleSuggestTypography = async () => {
    if (!editorBoard) return;

    setTypographyLoading(true);
    try {
      const result = await fetchTypographySuggestions(editorBoard);
      updateDraft((current) => ({ ...current, typography: result.typography }));

      if (result.notice) {
        showToast(result.notice, 'default');
        return;
      }

      showToast(
        result.source === 'gemini' ? 'Typography updated with Gemini.' : 'Demo typography applied.',
        'success',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Typography suggestion failed';
      showToast(message, 'destructive');
    } finally {
      setTypographyLoading(false);
    }
  };

  const handleSuggestBrand = async () => {
    if (!editorBoard) return;

    setBrandLoading(true);
    try {
      const result = await fetchBrandSuggestions(editorBoard);
      updateDraft((current) => ({
        ...current,
        brandStrategy: {
          positioning: result.positioning,
          voice: result.voice,
          messaging: result.messaging,
        },
      }));

      if (result.notice) {
        showToast(result.notice, 'default');
        return;
      }

      showToast(
        result.source === 'gemini' ? 'Brand strategy updated. Save to keep it.' : 'Demo brand strategy applied.',
        'success',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Brand suggestion failed';
      showToast(message, 'destructive');
    } finally {
      setBrandLoading(false);
    }
  };

  const handleAddReference = () => {
    updateDraft((current) => ({
      ...current,
      references: [
        {
          id: `ref_${Date.now()}`,
          title: 'New reference',
          imageUrl: buildReferenceImageUrl({
            title: 'New reference',
            category: 'Editorial',
            mood: current.mood,
            prompt: current.prompt,
            palette: current.palette,
            seed: `new-ref-${Date.now()}`,
          }),
          category: 'Editorial',
          source: REFERENCE_IMAGE_SOURCE,
        },
        ...current.references,
      ],
    }));
    setEditingReferenceIndex(0);
    setIsNewReference(true);
  };

  const handleCloseReferenceEditor = () => {
    if (isNewReference && editingReferenceIndex !== null) {
      updateDraft((current) => ({
        ...current,
        references: current.references.filter((_, index) => index !== editingReferenceIndex),
      }));
    }

    setEditingReferenceIndex(null);
    setIsNewReference(false);
  };

  const handleReloadRemote = () => {
    if (!pendingRemoteBoard) return;

    applyRemoteBoard(boardId, pendingRemoteBoard);
    setDraft(null);
    setIsDirty(false);
    setSaveStatus('Saved');
    setPendingRemoteBoard(null);
    setPendingRemoteSavedByName(null);
    showToast('Board updated with the latest changes.', 'success');
  };

  const handleKeepEditingRemote = () => {
    setPendingRemoteBoard(null);
    setPendingRemoteSavedByName(null);
  };

  const handleSaveReference = (next: ReferenceItem) => {
    if (editingReferenceIndex === null) return;

    const sanitized = sanitizeReferenceItem(next, editorBoard, editingReferenceIndex);

    updateDraft((current) => ({
      ...current,
      references: current.references.map((item, index) =>
        index === editingReferenceIndex ? sanitized : item,
      ),
    }));

    setEditingReferenceIndex(null);
    setIsNewReference(false);
    showToast('Reference saved.', 'success');
  };

  const startBoardReplay = (event: BoardActivityEvent) => {
    if (event.changes.length === 0) {
      showToast('No change details available for this save.', 'default');
      return;
    }

    setReplayEvent(event);
    setCommentsOpen(false);
    const sectionIndex = getFirstReplaySectionIndex(event.changes);
    setActiveSectionIndex(sectionIndex);
    const scrollBehavior = settings.reduceMotionEnabled ? 'auto' : 'smooth';
    window.setTimeout(() => {
      sectionTabsRef.current?.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
    }, 80);
  };

  const exitBoardReplay = () => {
    setReplayEvent(null);
  };

  const goToReplaySection = (index: number) => {
    let targetIndex = index;
    if (replayEvent) {
      const replaySections = getReplaySectionIndices(replayEvent.changes);
      if (replaySections.length > 0 && !replaySections.includes(index)) {
        const navIndex = snapToReplaySectionIndex(replayEvent.changes, index);
        targetIndex = replaySections[navIndex] ?? replaySections[0];
      }
    }

    setActiveSectionIndex(targetIndex);
    const scrollBehavior = settings.reduceMotionEnabled ? 'auto' : 'smooth';
    window.setTimeout(() => {
      sectionTabsRef.current?.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
    }, 80);
  };

  const renderSectionReplay = (section: EditorSectionName) => {
    if (!isReplayMode) return null;
    return (
      <BoardReplaySectionBlock
        changes={getReplayChangesForEditorSection(section, replayChanges)}
        className="mb-5"
      />
    );
  };

  return (
    <div className={['space-y-8 pb-10 text-(--text)', activityOpen ? 'pr-0 md:pr-[28rem]' : ''].join(' ')}>
      {pendingRemoteBoard ? (
        <RemoteUpdateBanner
          savedByName={pendingRemoteSavedByName}
          onReload={handleReloadRemote}
          onKeepEditing={handleKeepEditingRemote}
        />
      ) : null}

      {replayEvent ? (
        <BoardReplayBanner
          event={replayEvent}
          activeSectionIndex={activeSectionIndex}
          onExit={exitBoardReplay}
          onGoToSection={goToReplaySection}
        />
      ) : null}

      <section className="rounded-[2.5rem] border border-(--border) bg-(--surface-elevated) p-6 shadow-[var(--shadow-card)] md:p-8">
        <div className="flex flex-col gap-6">
        <BoardEditorToolbar
          generationSource={generationSource}
          isEditor={isEditor}
          isViewer={isViewer}
          isOwner={isOwner}
          canComment={canComment}
          canEditBoard={canEditBoard}
          canMutateBoard={canMutateBoard}
          visibility={editorBoard.visibility}
          isFavorite={editorBoard.isFavorite}
          dirtyStatus={dirtyStatus}
          isDirty={isDirty}
          isSaving={isSaving}
          unreadCommentsCount={unreadCommentsCount}
          unreadActivityCount={unreadActivityCount}
          unreadSnapshotsCount={unreadSnapshotsCount}
          reduceMotionEnabled={settings.reduceMotionEnabled}
          onlineUsers={onlineUsers}
          presenceConnectionState={presenceConnectionState}
          boardId={editorBoard.id}
          currentUserId={auth.user?.id ?? null}
          commentsOpen={commentsOpen}
          activityOpen={activityOpen}
          snapshotsOpen={snapshotsOpen}
          commentsButtonRef={commentsButtonRef}
          activityButtonRef={activityButtonRef}
          snapshotsButtonRef={snapshotsButtonRef}
          onOpenComments={() => {
            setActivityOpen(false);
            setSnapshotsOpen(false);
            setCommentsOpen(true);
          }}
          onOpenActivity={() => {
            setCommentsOpen(false);
            setSnapshotsOpen(false);
            setActivityOpen(true);
          }}
          onOpenSnapshots={() => {
            setCommentsOpen(false);
            setActivityOpen(false);
            setSnapshotsOpen(true);
          }}
          onSave={handleSave}
          onToggleFavorite={handleToggleFavorite}
          onToggleVisibility={handleToggleVisibility}
          onDuplicate={() => requireSavedChanges('duplicate')}
          onShare={() => requireSavedChanges('share')}
          onExport={() => requireSavedChanges('export')}
          onView={() => requireSavedChanges('view')}
          onDelete={() => {
            showToast('You are about to permanently delete this board.', 'destructive');
            setDeleteOpen(true);
          }}
          onSaveAsTemplate={isOwner && canEditBoard ? () => setSaveTemplateOpen(true) : undefined}
        />

          <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
            <div className="space-y-3">
              <label className={editorLabelClass}>
                Board title
              </label>
              {isReplayMode && findChangeByLabel(replayChanges, 'Title') ? (
                <BoardReplayCallout
                  change={findChangeByLabel(replayChanges, 'Title')!}
                  variant="inline"
                  className="mb-2"
                />
              ) : null}
              <Textarea
                value={editorBoard.title}
                readOnly={effectiveReadOnly}
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    title: event.target.value.slice(0, TITLE_LIMIT),
                  }))
                }
                rows={2}
                maxLength={TITLE_LIMIT}
                className="min-h-24 rounded-[1.75rem] border-(--border) bg-(--surface-elevated) px-4 py-4 text-[clamp(2.6rem,5vw,4.8rem)] leading-[0.95] tracking-tight text-(--text-strong) shadow-none placeholder:text-(--text-muted) focus-visible:ring-(--ring)"
                placeholder="Untitled board"
              />
              <p className="text-xs text-(--text-muted)">
                Up to {TITLE_LIMIT} characters • {editorBoard.title.length}/{TITLE_LIMIT}
              </p>
            </div>

            <aside className="rounded-4xl border border-(--border) bg-(--surface-subtle) p-5">
              <p className={editorLabelClass}>
                Prompt
              </p>
              <p className="mt-3 text-sm leading-6 text-(--text)">{editorBoard.prompt}</p>
              <div className="mt-5 grid gap-3 text-xs text-(--text-muted)">
                <p>Updated {formatDateTime(editorBoard.updatedAt)}</p>
                {editorBoard.lastSavedByName ? (
                  <p>Last saved by {editorBoard.lastSavedByName}</p>
                ) : null}
                <p>Board ID {editorBoard.id}</p>
                <p>Creative direction canvas</p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <nav
        ref={sectionTabsRef}
        aria-label="Editor sections"
        className="scroll-mt-24 rounded-[2rem] border border-(--border) bg-(--surface-elevated) px-4 py-4 shadow-[var(--shadow-card)] md:scroll-mt-28 md:px-5"
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {EDITOR_SECTION_ORDER.map((section, index) => {
              const meta = EDITOR_SECTION_META[section];
              const hasReplayChanges =
                isReplayMode && sectionHasReplayChanges(replayChanges, section);
              const othersOnSection = onlineUsers.filter(
                (user) =>
                  user.userId !== auth.user?.id && user.sectionIndex === index,
              );
              return (
                <EditorTabPill
                  key={section}
                  label={meta.label}
                  description={meta.description}
                  icon={meta.icon}
                  active={index === activeSectionIndex}
                  replayHighlight={hasReplayChanges}
                  replayDisabled={isReplayMode && !hasReplayChanges}
                  presenceUsers={!isReplayMode ? othersOnSection : []}
                  currentUserId={auth.user?.id ?? null}
                  onClick={() => {
                    if (isReplayMode) {
                      if (hasReplayChanges) {
                        goToReplaySection(index);
                      }
                      return;
                    }
                    setActiveSectionIndex(index);
                  }}
                  index={index}
                />
              );
            })}
          </div>

          <p className="text-center text-sm leading-6 text-(--text-muted)" aria-live="polite">
            {isReplayMode
              ? 'Use ← → or Space to move through changed sections.'
              : 'Use ← → or Space to move through sections.'}
          </p>
        </div>
      </nav>

      <div
        ref={sectionContentRef}
        className={[
          'space-y-6 rounded-[2rem] transition-shadow',
          sectionHighlight === activeSection
            ? `ring-2 ${EDITOR_SECTION_META[activeSection].ringClass} ring-offset-2 ring-offset-(--background)`
            : '',
        ].join(' ')}
      >
        {activeSection === 'overview' ? (
          <Card className={panelClass}>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong)">
                  Direction, tone, and summary
                </CardTitle>
                <CardDescription className="max-w-2xl text-(--text-muted)">
                  Adjust the core idea before refining palette, type, and references.
                </CardDescription>
              </div>

              {canMutateBoard ? (
                <AiGenerateButton
                  loading={brandLoading}
                  onClick={() => void handleSuggestBrand()}
                  idleLabel="Suggest brand"
                  loadingLabel="Suggesting…"
                />
              ) : null}
            </CardHeader>

            <CardContent className="space-y-5">
              {renderSectionReplay('overview')}
              <div className="grid gap-2">
                <label className={editorLabelClass}>
                  Mood
                </label>
                <Input
                  value={editorBoard.mood}
                  readOnly={effectiveReadOnly}
                  onChange={(e) => updateDraft((current) => ({ ...current, mood: e.target.value }))}
                  placeholder="calm luxury"
                  className={fieldClass}
                />
              </div>

              <div className="grid gap-2">
                <label className={editorLabelClass}>
                  Creative summary
                </label>
                <CollaboratorFieldHighlight
                  fieldId={buildFieldId('overview-summary')}
                  onlineUsers={onlineUsers}
                  currentUserId={currentUserId}
                >
                  <Textarea
                    value={editorBoard.summary}
                    readOnly={effectiveReadOnly}
                    onFocus={() => setActiveFieldId(buildFieldId('overview-summary'))}
                    onBlur={() => setActiveFieldId(null)}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateDraft((current) => ({ ...current, summary: value }));
                      scheduleFieldPatch(buildFieldId('overview-summary'), value);
                    }}
                    className="min-h-42.5 rounded-3xl border-(--border) bg-(--surface-elevated) text-(--text) placeholder:text-(--text-muted) focus-visible:ring-(--ring)"
                  />
                </CollaboratorFieldHighlight>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <label className={editorLabelClass}>
                    Tone descriptors
                  </label>
                  <Input
                    value={toneText}
                    readOnly={effectiveReadOnly}
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
                  <label className={editorLabelClass}>
                    Tags
                  </label>
                  <Input
                    value={tagsText}
                    readOnly={effectiveReadOnly}
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

              {editorBoard.brandStrategy ? (
                <div className="space-y-4 border-t border-(--border) pt-5">
                  <p className={editorLabelClass}>Brand strategy suggestions</p>
                  <div className={`space-y-3 ${editorSubtleSurfaceClass}`}>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-(--text-muted)">
                        Positioning
                      </p>
                      <p className="mt-2 text-sm leading-6 text-(--text)">
                        {editorBoard.brandStrategy.positioning}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-(--text-muted)">
                        Voice
                      </p>
                      <p className="mt-2 text-sm leading-6 text-(--text)">
                        {editorBoard.brandStrategy.voice}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-(--text-muted)">
                        Messaging pillars
                      </p>
                      <ul className="mt-2 space-y-2">
                        {editorBoard.brandStrategy.messaging.map((message) => (
                          <li
                            key={message}
                            className="rounded-full border border-(--border) bg-(--surface-elevated) px-3 py-1.5 text-sm text-(--text)"
                          >
                            {message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {activeSection === 'references' ? (
          <Card className={panelClass}>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong)">
                  Inspiration grid
                </CardTitle>
                <CardDescription className="max-w-2xl text-(--text-muted)">
                  Visual references that support the mood and composition.
                </CardDescription>
              </div>

              {canMutateBoard ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddReference}
                  className={editorGhostButtonClass}
                >
                  <Plus className="h-4 w-4" />
                  Add reference
                </Button>
              ) : null}
            </CardHeader>

            <CardContent>
              {renderSectionReplay('references')}
              {editorBoard.references.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {editorBoard.references.map((reference, index) => (
                    <article
                      key={reference.id}
                      className="group relative overflow-hidden rounded-[1.75rem] border border-(--border) bg-(--surface-elevated) transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
                    >
                      {effectiveReadOnly ? (
                        <div className="block w-full text-left">
                          <div className="relative aspect-4/3 w-full overflow-hidden">
                            <ReferenceImageDisplay
                              title={reference.title}
                              category={reference.category}
                              imageUrl={reference.imageUrl}
                              source={reference.source}
                              board={draft ?? editorBoard}
                              index={index}
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent" />
                          </div>

                          <div className="space-y-2 p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary">{reference.category}</Badge>
                              {reference.source ? (
                                <span className="text-xs text-(--text-muted)">{reference.source}</span>
                              ) : null}
                            </div>

                            <p className="line-clamp-2 text-sm leading-6 text-(--text)">
                              {reference.title}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <Tooltip
                          content={`Edit reference ${reference.title}`}
                          triggerClassName="block w-full"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setIsNewReference(false);
                              setEditingReferenceIndex(index);
                            }}
                            aria-label={`Edit reference ${reference.title}`}
                            className="block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring)"
                          >
                            <div className="relative aspect-4/3 w-full overflow-hidden">
                              <ReferenceImageDisplay
                                title={reference.title}
                                category={reference.category}
                                imageUrl={reference.imageUrl}
                                source={reference.source}
                                board={draft ?? editorBoard}
                                index={index}
                              />
                              <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent" />
                            </div>

                            <div className="space-y-2 p-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary">{reference.category}</Badge>
                                {reference.source ? (
                                  <span className="text-xs text-(--text-muted)">{reference.source}</span>
                                ) : null}
                              </div>

                              <p className="line-clamp-2 text-sm leading-6 text-(--text)">
                                {reference.title}
                              </p>
                            </div>
                          </button>
                        </Tooltip>
                      )}

                      {canMutateBoard ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRequestRemoval('reference', index)}
                          aria-label={`Remove reference ${reference.title}`}
                          tooltip={`Remove reference ${reference.title}`}
                          tooltipTriggerClassName="absolute right-3 top-3 z-20"
                          className="h-9 w-9 rounded-full border border-(--border) bg-(--surface-elevated) text-(--text-muted) opacity-100 transition hover:bg-(--surface-subtle) hover:text-(--text)"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.75rem] border border-dashed border-(--border) bg-(--surface-subtle) px-5 py-10 text-center text-sm text-(--text-muted)">
                  No references yet.
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {activeSection === 'notes' ? (
          <Card className={panelClass}>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong)">
                  Sticky notes
                </CardTitle>
                <CardDescription className="max-w-2xl text-(--text-muted)">
                  Capture short ideas, instructions, and keywords.
                </CardDescription>
              </div>

              {canMutateBoard ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddNote}
                  className={editorGhostButtonClass}
                >
                  <Plus className="h-4 w-4" />
                  Add note
                </Button>
              ) : null}
            </CardHeader>

            <CardContent>
              {renderSectionReplay('notes')}
              <div className="grid gap-4 md:grid-cols-2">
                {editorBoard.notes.map((note, index) => (
                  <Card
                    key={note.id}
                    className="overflow-hidden rounded-[1.75rem] border border-(--border) bg-(--surface-elevated) shadow-[var(--shadow-card)]"
                  >
                    <div className={`h-1.5 ${noteToneClasses[note.type].accent}`} />

                    <CardHeader className="flex flex-row items-start justify-between gap-3 pb-4">
                      <div className="space-y-2">
                        <Badge
                          variant="secondary"
                          className={`gap-1.5 text-(--text-strong)! ${noteToneClasses[note.type].badge}`}
                        >
                          <NoteTypeIcon type={note.type} />
                          {note.type}
                        </Badge>

                        <p className="text-xs uppercase tracking-[0.28em] text-(--text-muted)">
                          Note {index + 1}
                        </p>
                      </div>

                      {canMutateBoard ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRequestRemoval('note', index)}
                          aria-label={`Remove note ${index + 1}`}
                          tooltip={`Remove note ${index + 1}`}
                          className={editorIconButtonClass}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <label className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                          Note type
                        </label>
                        <select
                          value={note.type}
                          disabled={effectiveReadOnly}
                          onChange={(e) =>
                            updateDraft((current) => ({
                              ...current,
                              notes: current.notes.map((item, currentIndex) =>
                                currentIndex === index ? { ...item, type: e.target.value as NoteType } : item,
                              ),
                            }))
                          }
                          className={editorSelectClass}
                        >
                          {noteTypeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid gap-2">
                        <label className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                          Note text
                        </label>
                        <CollaboratorFieldHighlight
                          fieldId={buildFieldId('note', note.id)}
                          onlineUsers={onlineUsers}
                          currentUserId={currentUserId}
                        >
                          <Textarea
                            value={note.text}
                            readOnly={effectiveReadOnly}
                            onFocus={() => setActiveFieldId(buildFieldId('note', note.id))}
                            onBlur={() => setActiveFieldId(null)}
                            onChange={(event) => {
                              const value = event.target.value;
                              updateDraft((current) => ({
                                ...current,
                                notes: current.notes.map((item, currentIndex) =>
                                  currentIndex === index ? { ...item, text: value } : item,
                                ),
                              }));
                              scheduleFieldPatch(buildFieldId('note', note.id), value);
                            }}
                            className={`min-h-35 rounded-3xl ${fieldClass}`}
                          />
                        </CollaboratorFieldHighlight>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {!editorBoard.notes.length ? (
                <div className="rounded-[1.75rem] border border-dashed border-(--border) bg-(--surface-subtle) px-5 py-10 text-center text-sm text-(--text-muted)">
                  No notes yet.
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {activeSection === 'palette' ? (
          <Card className={panelClass}>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong)">
                  Color direction
                </CardTitle>
                <CardDescription className="max-w-2xl text-(--text-muted)">
                  Fine-tune the colors and usage notes for the board.
                </CardDescription>
              </div>

              {canMutateBoard ? (
                <div className="flex flex-wrap gap-2">
                  <AiGenerateButton
                    loading={paletteLoading}
                    onClick={() => void handleSuggestPalette()}
                    idleLabel="Suggest palette"
                    loadingLabel="Suggesting…"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddPalette}
                    className={editorGhostButtonClass}
                  >
                    <Plus className="h-4 w-4" />
                    Add color
                  </Button>
                </div>
              ) : null}
            </CardHeader>

            <CardContent className="space-y-4">
              {renderSectionReplay('palette')}
              {editorBoard.palette.map((item: PaletteItem, index) => (
                <Card
                  key={item.id}
                  className="relative rounded-[1.75rem] border border-(--border) bg-(--surface-subtle)"
                >
                  {canMutateBoard ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRequestRemoval('palette', index)}
                      aria-label={`Remove color ${item.label}`}
                      tooltip={`Remove color ${item.label}`}
                      className="absolute right-4 top-4 z-10 h-9 w-9 rounded-full border border-(--border) bg-(--surface-elevated) text-(--text-muted) transition hover:bg-(--surface-subtle) hover:text-(--text)"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}

                  <CardContent className="space-y-4 p-4">
                    <div
                      className="mr-14 h-24 overflow-hidden rounded-3xl border border-(--border) shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                      style={{ backgroundColor: item.hex }}
                    />

                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <label className={editorLabelClass}>
                          Color name
                        </label>
                        <Input
                          value={item.label}
                          readOnly={effectiveReadOnly}
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
                        <label className={editorLabelClass}>
                          Color hex
                        </label>
                        <div className="flex items-center gap-3">
                          <Tooltip content={`Pick color for ${item.label}`}>
                            <div className="flex h-11 w-14 items-center justify-center rounded-2xl border border-(--border) bg-(--surface-elevated) p-1">
                              <input
                                type="color"
                                value={item.hex}
                                disabled={effectiveReadOnly}
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
                          </Tooltip>
                          <Input
                            value={item.hex}
                            readOnly={effectiveReadOnly}
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
                        <label className={editorLabelClass}>
                          Usage note
                        </label>
                        <Input
                          value={item.usage}
                          readOnly={effectiveReadOnly}
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {activeSection === 'typography' ? (
          <Card className={panelClass}>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong)">
                  Type system
                </CardTitle>
                <CardDescription className="max-w-2xl text-(--text-muted)">
                  Pair the fonts with short notes for the design direction.
                </CardDescription>
              </div>

              {canMutateBoard ? (
                <div className="flex flex-wrap gap-2">
                  <AiGenerateButton
                    loading={typographyLoading}
                    onClick={() => void handleSuggestTypography()}
                    idleLabel="Suggest typography"
                    loadingLabel="Suggesting…"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTypography}
                    className={editorGhostButtonClass}
                  >
                    <Plus className="h-4 w-4" />
                    Add row
                  </Button>
                </div>
              ) : null}
            </CardHeader>

            <CardContent className="space-y-4">
              {renderSectionReplay('typography')}
              {editorBoard.typography.map((item: TypographyItem, index) => {
                const presetValue = fontOptions.includes(item.fontName)
                  ? item.fontName
                  : '__custom__';

                const previewFontFamily = getFontFamily(item.fontName);

                return (
                  <Card
                    key={item.id}
                    className="relative rounded-[1.75rem] border border-(--border) bg-(--surface-subtle)"
                  >
                    {canMutateBoard ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRequestRemoval('typography', index)}
                        aria-label={`Remove ${item.role} typography`}
                        tooltip={`Remove ${item.role} typography`}
                        className="absolute right-4 top-4 z-10 h-9 w-9 rounded-full border border-(--border) bg-(--surface-elevated) text-(--text-muted) transition hover:bg-(--surface-subtle) hover:text-(--text)"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}

                    <CardContent className="space-y-4 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <Badge variant="secondary">{item.role}</Badge>
                      </div>

                      <div className="grid gap-2">
                        <label className={editorLabelClass}>
                          Type badge
                        </label>
                        <select
                          value={item.role}
                          disabled={effectiveReadOnly}
                          onChange={(e) =>
                            updateDraft((current) => ({
                              ...current,
                              typography: current.typography.map((type, currentIndex) =>
                                currentIndex === index
                                  ? { ...type, role: e.target.value as TypographyRole }
                                  : type,
                              ),
                            }))
                          }
                          className="h-11 w-full rounded-2xl border border-(--border) bg-(--surface-elevated) px-4 text-sm text-(--text) outline-none focus:ring-2 focus:ring-(--ring)"
                        >
                          {typographyRoleOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid gap-2">
                        <label className={editorLabelClass}>
                          Font preset
                        </label>
                        <select
                          value={presetValue}
                          disabled={effectiveReadOnly}
                          onChange={(e) => {
                            const nextValue = e.target.value;
                            if (nextValue === '__custom__') return;

                            updateDraft((current) => ({
                              ...current,
                              typography: current.typography.map((type, currentIndex) =>
                                currentIndex === index
                                  ? { ...type, fontName: nextValue }
                                  : type,
                              ),
                            }));
                          }}
                          className="h-11 w-full rounded-2xl border border-(--border) bg-(--surface-elevated) px-4 text-sm text-(--text) outline-none focus:ring-2 focus:ring-(--ring)"
                        >
                          <option value="__custom__">Custom / typed below</option>
                          {fontOptions.map((font) => (
                            <option key={font} value={font}>
                              {font}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid gap-2">
                        <label className={editorLabelClass}>
                          Font name
                        </label>
                        <Input
                          value={item.fontName}
                          readOnly={effectiveReadOnly}
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
                        <label className={editorLabelClass}>
                          Usage note
                        </label>
                        <Input
                          value={item.note}
                          readOnly={effectiveReadOnly}
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

                      <div className="rounded-3xl border border-(--border) bg-(--surface-elevated) p-4 shadow-none">
                        <p className={editorLabelClass}>
                          Preview
                        </p>

                        <p
                          className="mt-3 text-3xl leading-tight text-(--text-strong)"
                          style={{ fontFamily: previewFontFamily }}
                        >
                          The quick brown fox
                        </p>

                        <p
                          className="mt-2 text-sm leading-6 text-(--text-muted)"
                          style={{ fontFamily: previewFontFamily }}
                        >
                          {item.note || 'Usage note preview'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        ) : null}
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

      <ConfirmationModal
        open={unsavedChangesOpen}
        title="Save changes before leaving"
        description="You have unsaved changes on this board. Save your changes before navigating away."
        confirmLabel="Save changes"
        cancelLabel="Stay on board"
        onConfirm={handleSaveAndContinue}
        onCancel={() => {
          setUnsavedChangesOpen(false);
          setPendingContinue(null);
        }}
      />

      {canMutateBoard && editingReferenceIndex !== null && currentReference ? (
        <ReferenceEditorModal
          key={currentReference.id}
          reference={currentReference}
          board={editorBoard}
          onSave={handleSaveReference}
          onClose={handleCloseReferenceEditor}
        />
      ) : null}

      <CollaborateModal
        open={shareOpen}
        boardId={editorBoard.id}
        boardTitle={editorBoard.title}
        sharePath={sharePath}
        canManageMembers={canManageMembers}
        onCopied={() => {
          showToast('Link copied.', 'success');
        }}
        onClose={() => setShareOpen(false)}
      />

      <ExportModal
        open={exportOpen}
        board={editorBoard}
        onExported={(format, detail) => {
          setExportOpen(false);
          const label =
            format === 'png'
              ? 'PNG'
              : format === 'pdf'
                ? 'PDF'
                : format === 'design-system'
                  ? detail
                    ? `design system (${detail.toUpperCase()})`
                    : 'design system'
                  : 'JSON';
          showToast(`Board exported as ${label}.`, 'success');
        }}
        onClose={() => setExportOpen(false)}
      />

      <BoardCommentsPanel
        open={commentsOpen}
        boardTitle={editorBoard.title}
        comments={comments}
        loading={commentsLoading}
        posting={commentsPosting}
        isOwner={isOwner}
        currentUserId={auth.user?.id ?? null}
        onClose={() => setCommentsOpen(false)}
        currentSection={activeSection}
        onGoToSection={handleGoToSection}
        onPost={async (body) => {
          const ok = await postComment(body, activeSection);
          if (ok) {
            void refreshCollaborationState();
          }
          return ok;
        }}
        onUpdate={updateComment}
        onDelete={deleteComment}
        onMarkAllRead={async () => {
          const ok = await markCommentsRead();
          if (ok) {
            await refreshComments();
          }
          return ok;
        }}
        onToggleRead={async (commentId, isRead) => {
          patchCommentState(commentId, { isRead });
          const ok = await setItemRead('comment', commentId, isRead);
          if (!ok) {
            await refreshComments();
          }
          return ok;
        }}
        onHide={async (commentId) => {
          patchCommentState(commentId, { isHidden: true });
          return hideItem('comment', commentId);
        }}
        onUnhide={async (commentId) => {
          patchCommentState(commentId, { isHidden: false });
          return unhideItem('comment', commentId);
        }}
        returnFocusRef={commentsButtonRef}
      />

      <BoardActivityPanel
        open={activityOpen}
        boardTitle={editorBoard.title}
        activity={activity}
        loading={activityLoading}
        isOwner={isOwner}
        currentUserId={currentUserId}
        activeReplayId={replayEvent?.id ?? null}
        onClose={() => setActivityOpen(false)}
        onReplayOnBoard={startBoardReplay}
        onDelete={deleteActivity}
        onMarkAllRead={async () => {
          const ok = await markActivityRead();
          if (ok) {
            await refreshActivity();
          }
          return ok;
        }}
        onToggleRead={async (activityId, isRead) => {
          patchActivityState(activityId, { isRead });
          const ok = await setItemRead('activity', activityId, isRead);
          if (!ok) {
            await refreshActivity();
          }
          return ok;
        }}
        onHide={async (activityId) => {
          patchActivityState(activityId, { isHidden: true });
          return hideItem('activity', activityId);
        }}
        onUnhide={async (activityId) => {
          patchActivityState(activityId, { isHidden: false });
          return unhideItem('activity', activityId);
        }}
        returnFocusRef={activityButtonRef}
      />

      <BoardSnapshotsPanel
        open={snapshotsOpen}
        board={editorBoard}
        canEdit={canMutateBoard}
        isOwner={isOwner}
        onClose={() => setSnapshotsOpen(false)}
        onMarkAllRead={async () => {
          const ok = await markSnapshotsRead();
          if (ok) {
            void refreshCollaborationState();
          }
          return ok;
        }}
        onMarkSnapshotRead={async (snapshotId) => {
          const ok = await markSnapshotRead(snapshotId);
          if (ok) {
            void refreshCollaborationState();
          }
          return ok;
        }}
        onSnapshotsChanged={() => {
          void refreshCollaborationState();
        }}
        snapshotsLastReadAt={snapshotsLastReadAt}
        currentUserId={currentUserId}
        onRestored={(board) => {
          setDraft(cloneBoard(board));
          setIsDirty(false);
          setSaveStatus('Saved');
          void refreshActivity();
        }}
        returnFocusRef={snapshotsButtonRef}
      />

      <SaveTemplateModal
        key={saveTemplateOpen ? `save-template-${editorBoard.id}` : 'save-template-closed'}
        open={saveTemplateOpen}
        board={editorBoard}
        onOpenChange={setSaveTemplateOpen}
      />
    </div>
  );
}