'use client';

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react';
import {
  Camera,
  Copy,
  Download,
  Ellipsis,
  ExternalLink,
  Globe,
  History,
  Lock,
  MessageSquare,
  Share2,
  Star,
  StarOff,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GenerationSourceBadge } from '@/components/creation/GenerationSourceBadge';
import { BoardPresenceStrip } from '@/components/board/BoardPresenceStrip';
import { editorLabelClass, editorToolbarUnreadBadgeClass } from '@/components/board/board-editor-styles';
import type { BoardPresenceUser } from '@/lib/realtime/use-board-realtime';
import type { BoardVisibility } from '@/types/board';

type BoardEditorToolbarProps = {
  generationSource: 'gemini' | null;
  isEditor: boolean;
  isViewer: boolean;
  isOwner: boolean;
  canComment: boolean;
  canEditBoard: boolean;
  canMutateBoard: boolean;
  visibility: BoardVisibility;
  isFavorite: boolean;
  dirtyStatus: string;
  isDirty: boolean;
  unreadCommentsCount: number;
  unreadActivityCount: number;
  reduceMotionEnabled?: boolean;
  onlineUsers: BoardPresenceUser[];
  currentUserId: string | null;
  commentsOpen: boolean;
  activityOpen: boolean;
  snapshotsOpen: boolean;
  commentsButtonRef: RefObject<HTMLButtonElement | null>;
  activityButtonRef: RefObject<HTMLButtonElement | null>;
  snapshotsButtonRef: RefObject<HTMLButtonElement | null>;
  onOpenComments: () => void;
  onOpenActivity: () => void;
  onOpenSnapshots: () => void;
  onSave: () => void;
  onToggleFavorite: () => void;
  onToggleVisibility: () => void;
  onDuplicate: () => void;
  onShare: () => void;
  onExport: () => void;
  onView: () => void;
  onDelete: () => void;
};

function ToolbarDivider() {
  return <div className="mx-0.5 h-8 w-px shrink-0 bg-(--border)" aria-hidden="true" />;
}

function ToolbarAction({
  label,
  icon,
  active = false,
  badgeCount = 0,
  badgePulse = false,
  onClick,
  buttonRef,
  className,
  ...rest
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  badgeCount?: number;
  badgePulse?: boolean;
  onClick: () => void;
  buttonRef?: RefObject<HTMLButtonElement | null>;
  className?: string;
} & Pick<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-haspopup' | 'aria-expanded' | 'aria-controls'
>) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={badgeCount > 0 ? `${label}, ${badgeCount} unread` : label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition',
        active
          ? 'bg-(--surface) text-(--text-strong) shadow-sm ring-1 ring-(--border)'
          : 'text-(--text) hover:bg-(--surface-subtle)',
        className,
      )}
      {...rest}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {badgeCount > 0 ? (
        <span
          className={cn(editorToolbarUnreadBadgeClass, badgePulse && 'animate-pulse')}
        >
          {badgeCount}
        </span>
      ) : null}
    </button>
  );
}

function ToolbarMenuItem({
  label,
  icon,
  destructive = false,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition',
        destructive
          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30'
          : 'text-(--text) hover:bg-(--surface-subtle)',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export function BoardEditorToolbar({
  generationSource,
  isEditor,
  isViewer,
  isOwner,
  canComment,
  canEditBoard,
  canMutateBoard,
  visibility,
  isFavorite,
  dirtyStatus,
  isDirty,
  unreadCommentsCount,
  unreadActivityCount,
  reduceMotionEnabled = false,
  onlineUsers,
  currentUserId,
  commentsOpen,
  activityOpen,
  snapshotsOpen,
  commentsButtonRef,
  activityButtonRef,
  snapshotsButtonRef,
  onOpenComments,
  onOpenActivity,
  onOpenSnapshots,
  onSave,
  onToggleFavorite,
  onToggleVisibility,
  onDuplicate,
  onShare,
  onExport,
  onView,
  onDelete,
}: BoardEditorToolbarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!moreOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMoreOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [moreOpen]);

  const showCollaboration = canComment || canEditBoard;
  const showBoardActions = canComment || canEditBoard || isOwner;
  const hasMoreItems = isOwner;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {generationSource ? <GenerationSourceBadge source={generationSource} /> : null}
        {isEditor ? <Badge variant="outline">Editor access</Badge> : null}
        {isViewer ? <Badge variant="outline">Viewer access</Badge> : null}
        {isViewer ? (
          <span className="text-sm text-(--text-muted)">
            You can view and comment on this board. Editing is disabled.
          </span>
        ) : null}
        <Badge variant="secondary">{visibility}</Badge>
        <Badge variant={isDirty ? 'outline' : 'secondary'}>{dirtyStatus}</Badge>
        <p className="sr-only" aria-live="polite">
          {unreadCommentsCount > 0
            ? `${unreadCommentsCount} unread comment${unreadCommentsCount === 1 ? '' : 's'}. `
            : ''}
          {unreadActivityCount > 0
            ? `${unreadActivityCount} unread activity update${unreadActivityCount === 1 ? '' : 's'}.`
            : ''}
        </p>
      </div>

      <div className="rounded-[1.75rem] border border-(--border) bg-(--surface-subtle) p-3 md:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
          <p id="board-controls-label" className={editorLabelClass}>
            Board controls
          </p>
          <BoardPresenceStrip users={onlineUsers} currentUserId={currentUserId} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {showCollaboration || showBoardActions ? (
            <div
              className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-2xl border border-(--border) bg-(--surface-elevated) p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              role="toolbar"
              aria-labelledby="board-controls-label"
            >
              {showCollaboration ? (
                <div className="flex flex-wrap items-center gap-1" aria-label="Collaboration">
                  {canComment ? (
                    <ToolbarAction
                      label="Comments"
                      icon={<MessageSquare className="h-4 w-4 shrink-0" />}
                      active={commentsOpen}
                      badgeCount={unreadCommentsCount}
                      badgePulse={!reduceMotionEnabled && !commentsOpen && unreadCommentsCount > 0}
                      onClick={onOpenComments}
                      buttonRef={commentsButtonRef}
                    />
                  ) : null}
                  {canComment ? (
                    <ToolbarAction
                      label="Activity"
                      icon={<History className="h-4 w-4 shrink-0" />}
                      active={activityOpen}
                      badgeCount={unreadActivityCount}
                      badgePulse={!reduceMotionEnabled && !activityOpen && unreadActivityCount > 0}
                      onClick={onOpenActivity}
                      buttonRef={activityButtonRef}
                    />
                  ) : null}
                  {canEditBoard ? (
                    <ToolbarAction
                      label="Snapshots"
                      icon={<Camera className="h-4 w-4 shrink-0" />}
                      active={snapshotsOpen}
                      onClick={onOpenSnapshots}
                      buttonRef={snapshotsButtonRef}
                    />
                  ) : null}
                </div>
              ) : null}

              {showCollaboration && showBoardActions ? <ToolbarDivider /> : null}

              {showBoardActions ? (
                <div className="flex flex-wrap items-center gap-1" aria-label="Board">
                  {isOwner ? (
                    <ToolbarAction
                      label="Share"
                      icon={<Share2 className="h-4 w-4 shrink-0" />}
                      onClick={onShare}
                    />
                  ) : null}
                  <ToolbarAction
                    label="Export"
                    icon={<Download className="h-4 w-4 shrink-0" />}
                    onClick={onExport}
                  />
                  <ToolbarAction
                    label="View"
                    icon={<ExternalLink className="h-4 w-4 shrink-0" />}
                    onClick={onView}
                  />
                  {hasMoreItems ? (
                    <>
                      <ToolbarDivider />
                      <div className="relative" ref={moreRef}>
                      <ToolbarAction
                        label="More"
                        icon={<Ellipsis className="h-4 w-4 shrink-0" />}
                        active={moreOpen}
                        onClick={() => setMoreOpen((open) => !open)}
                        aria-haspopup="menu"
                        aria-expanded={moreOpen}
                        aria-controls={moreOpen ? menuId : undefined}
                      />

                      {moreOpen ? (
                        <div
                          id={menuId}
                          role="menu"
                          className="absolute left-0 z-20 mt-2 w-56 rounded-2xl border border-(--border) bg-(--surface-elevated) p-1.5 shadow-[var(--shadow-elevated)]"
                        >
                          <ToolbarMenuItem
                            label={isFavorite ? 'Remove favorite' : 'Add favorite'}
                            icon={
                              isFavorite ? (
                                <StarOff className="h-4 w-4 shrink-0" />
                              ) : (
                                <Star className="h-4 w-4 shrink-0" />
                              )
                            }
                            onClick={() => {
                              setMoreOpen(false);
                              onToggleFavorite();
                            }}
                          />
                          <ToolbarMenuItem
                            label={visibility === 'shared' ? 'Make private' : 'Make shared'}
                            icon={
                              visibility === 'shared' ? (
                                <Lock className="h-4 w-4 shrink-0" />
                              ) : (
                                <Globe className="h-4 w-4 shrink-0" />
                              )
                            }
                            onClick={() => {
                              setMoreOpen(false);
                              onToggleVisibility();
                            }}
                          />
                          <ToolbarMenuItem
                            label="Duplicate board"
                            icon={<Copy className="h-4 w-4 shrink-0" />}
                            onClick={() => {
                              setMoreOpen(false);
                              onDuplicate();
                            }}
                          />
                          <div className="my-1 h-px bg-(--border)" />
                          <ToolbarMenuItem
                            label="Delete board"
                            icon={<Trash2 className="h-4 w-4 shrink-0" />}
                            destructive
                            onClick={() => {
                              setMoreOpen(false);
                              onDelete();
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {canMutateBoard ? (
            <Button
              type="button"
              onClick={onSave}
              disabled={!isDirty}
              className={cn(
                'h-10 min-w-[7.5rem] shrink-0 rounded-xl px-5 text-sm font-medium transition',
                isDirty
                  ? 'bg-(--text-strong) text-(--background) shadow-sm hover:opacity-90'
                  : 'border border-(--border) bg-(--surface-elevated) text-(--text)',
              )}
            >
              {isDirty ? 'Save changes' : 'Saved'}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
