'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { GuardedLink } from '@/components/shared/GuardedLink';
import { Archive, Eye, EyeOff, MessageSquare, Pencil, Trash2, X } from 'lucide-react';
import type { BoardComment } from '@/types/board';
import { EditorSectionBadge } from '@/components/board/EditorSectionBadge';
import {
  EDITOR_SECTION_META,
  type EditorSectionName,
} from '@/lib/editor-sections';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';
import {
  collaborationListItemClassName,
  CollaborationUnseenIndicator,
} from '@/components/board/CollaborationUnseenIndicator';
import { showToast } from '@/components/shared/toast-store';
import { lockBodyScroll } from '@/lib/body-scroll-lock';

type PanelFilter = 'all' | 'unread' | 'hidden';

type BoardCommentsPanelProps = {
  open: boolean;
  boardTitle: string;
  comments: BoardComment[];
  loading: boolean;
  posting: boolean;
  isOwner: boolean;
  currentUserId: string | null;
  onClose: () => void;
  onPost: (body: string) => Promise<boolean>;
  currentSection?: EditorSectionName;
  onGoToSection?: (section: EditorSectionName) => void;
  onUpdate?: (commentId: string, body: string) => Promise<boolean>;
  onDelete: (commentId: string) => Promise<boolean>;
  onMarkAllRead?: () => Promise<boolean>;
  onToggleRead?: (commentId: string, isRead: boolean) => Promise<boolean>;
  onHide?: (commentId: string) => Promise<boolean>;
  onUnhide?: (commentId: string) => Promise<boolean>;
  returnFocusRef?: React.RefObject<HTMLButtonElement | null>;
};

export function BoardCommentsPanel({
  open,
  boardTitle,
  comments,
  loading,
  posting,
  isOwner,
  currentUserId,
  onClose,
  onPost,
  currentSection = 'overview',
  onGoToSection,
  onUpdate,
  onDelete,
  onMarkAllRead,
  onToggleRead,
  onHide,
  onUnhide,
  returnFocusRef,
}: BoardCommentsPanelProps) {
  const [draft, setDraft] = useState('');
  const [filter, setFilter] = useState<PanelFilter>('all');
  const [pendingDelete, setPendingDelete] = useState<BoardComment | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isUnreadComment = useCallback(
    (comment: BoardComment) =>
      !comment.isHidden && comment.userId !== currentUserId && !comment.isRead,
    [currentUserId],
  );

  const visibleComments = useMemo(() => {
    if (filter === 'hidden') {
      return comments.filter((comment) => comment.isHidden);
    }
    if (filter === 'unread') {
      return comments.filter((comment) => isUnreadComment(comment));
    }
    return comments.filter((comment) => !comment.isHidden);
  }, [comments, filter, isUnreadComment]);

  const unreadCount = useMemo(
    () => comments.filter((comment) => isUnreadComment(comment)).length,
    [comments, isUnreadComment],
  );

  const hiddenCount = useMemo(
    () => comments.filter((comment) => comment.isHidden).length,
    [comments],
  );

  useEffect(() => {
    if (!open) return;

    const unlockBodyScroll = lockBodyScroll();
    textareaRef.current?.focus();

    return () => {
      unlockBodyScroll();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pendingDelete) {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open, pendingDelete]);

  const handleClose = () => {
    setPendingDelete(null);
    onClose();
    window.setTimeout(() => returnFocusRef?.current?.focus(), 0);
  };

  if (!open || typeof document === 'undefined') return null;

  const composerSectionMeta = EDITOR_SECTION_META[currentSection];

  const handleSubmit = async () => {
    const text = draft.trim();
    if (!text) return;

    const ok = await onPost(text);
    if (ok) {
      setDraft('');
      showToast('Comment posted.', 'success');
      return;
    }

    showToast('Failed to post comment.', 'destructive');
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;

    const ok = await onDelete(pendingDelete.id);
    setPendingDelete(null);
    if (ok) {
      showToast('Comment deleted.', 'success');
      return;
    }

    showToast('Failed to delete comment.', 'destructive');
  };

  const canEditComment = (comment: BoardComment) =>
    Boolean(onUpdate && (isOwner || comment.userId === currentUserId));

  const startEditing = (comment: BoardComment) => {
    setEditingCommentId(comment.id);
    setEditDraft(comment.body);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditDraft('');
  };

  const handleSaveEdit = async () => {
    if (!editingCommentId || !onUpdate) return;

    const text = editDraft.trim();
    if (!text) {
      showToast('Comment cannot be empty.', 'destructive');
      return;
    }

    setSavingEdit(true);
    const ok = await onUpdate(editingCommentId, text);
    setSavingEdit(false);

    if (ok) {
      cancelEditing();
      showToast('Comment updated.', 'success');
      return;
    }

    showToast('Failed to update comment.', 'destructive');
  };

  const isEdited = (comment: BoardComment) =>
    new Date(comment.updatedAt).getTime() > new Date(comment.createdAt).getTime() + 1000;

  const handleMarkAllRead = async () => {
    if (!onMarkAllRead) return;
    const ok = await onMarkAllRead();
    if (ok) {
      showToast('Comments marked as seen.', 'success');
    }
  };

  const handleToggleRead = async (comment: BoardComment) => {
    if (!onToggleRead) return;
    const nextRead = !comment.isRead;
    const ok = await onToggleRead(comment.id, nextRead);
    if (!ok) {
      showToast('Failed to update read state.', 'destructive');
    }
  };

  const handleHide = async (comment: BoardComment) => {
    if (!onHide) return;
    const ok = await onHide(comment.id);
    if (ok) {
      showToast('Comment hidden from your view.', 'success');
      return;
    }
    showToast('Failed to hide comment.', 'destructive');
  };

  const handleUnhide = async (comment: BoardComment) => {
    if (!onUnhide) return;
    const ok = await onUnhide(comment.id);
    if (ok) {
      showToast('Comment restored.', 'success');
      setFilter('all');
    } else {
      showToast('Failed to restore comment.', 'destructive');
    }
  };

  const handleViewInSection = async (comment: BoardComment) => {
    if (!onGoToSection) return;

    if (isUnreadComment(comment) && onToggleRead) {
      const ok = await onToggleRead(comment.id, true);
      if (!ok) {
        showToast('Failed to update read state.', 'destructive');
      }
    }

    onGoToSection(comment.section);
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        <button
          type="button"
          aria-label="Close comments"
          className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
          onClick={handleClose}
        />

        <aside
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="board-comments-title"
          className="relative flex h-full w-full max-w-md flex-col border-l border-(--border) bg-(--background) shadow-[var(--shadow-elevated)]"
        >
          <header className="flex items-start justify-between gap-3 border-b border-(--border) px-5 py-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                Comments
              </p>
              <h2 id="board-comments-title" className="mt-1 text-lg font-semibold text-(--text-strong)">
                {boardTitle}
              </h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleClose}
              tooltip="Close comments"
              tooltipSide="bottom"
              className="rounded-full border-(--border) bg-transparent"
              aria-label="Close comments panel"
            >
              <X className="h-4 w-4" />
            </Button>
          </header>

          <div className="flex flex-wrap items-center gap-2 border-b border-(--border) px-5 py-3">
            <Button
              type="button"
              size="sm"
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className="rounded-full"
            >
              All
            </Button>
            <Button
              type="button"
              size="sm"
              variant={filter === 'unread' ? 'default' : 'outline'}
              onClick={() => setFilter('unread')}
              className="rounded-full"
            >
              Unread{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={filter === 'hidden' ? 'default' : 'outline'}
              onClick={() => setFilter('hidden')}
              className="rounded-full"
            >
              Hidden{hiddenCount > 0 ? ` (${hiddenCount})` : ''}
            </Button>
            {onMarkAllRead && unreadCount > 0 && filter !== 'hidden' ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => void handleMarkAllRead()}
                className="ml-auto rounded-full"
              >
                Mark all as seen
              </Button>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {loading ? (
              <div className="space-y-3" aria-busy="true" aria-label="Loading comments">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            ) : visibleComments.length === 0 ? (
              <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 text-center">
                <MessageSquare className="h-8 w-8 text-(--text-muted)" aria-hidden="true" />
                <p className="text-sm text-(--text-muted)">
                  {filter === 'unread'
                    ? 'No unread comments.'
                    : filter === 'hidden'
                      ? 'No hidden comments.'
                      : 'No comments yet. Start the thread.'}
                </p>
                {filter === 'unread' ? (
                  <GuardedLink href="/settings#collaboration" className="text-sm text-(--text-strong) underline">
                    Adjust retention in settings
                  </GuardedLink>
                ) : null}
              </div>
            ) : (
              <ul className="space-y-3">
                {visibleComments.map((comment) => {
                  const unread = isUnreadComment(comment);

                  return (
                  <li
                    key={comment.id}
                    className={collaborationListItemClassName()}
                    aria-label={unread ? `Unseen comment by ${comment.authorName}` : undefined}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-(--text-strong)">
                            {comment.authorName}
                          </p>
                          <EditorSectionBadge section={comment.section} showIcon />
                          {unread ? <CollaborationUnseenIndicator /> : null}
                        </div>
                        <p className="text-xs text-(--text-muted)">
                          {formatDateTime(comment.createdAt)}
                          {isEdited(comment) ? ' (edited)' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {filter === 'hidden' ? (
                          onUnhide ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleUnhide(comment)}
                              tooltip="Restore comment to your feed"
                              tooltipSide="bottom"
                              className="h-8 rounded-full px-2 text-xs"
                            >
                              Restore
                            </Button>
                          ) : null
                        ) : (
                          <>
                            {onToggleRead ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => void handleToggleRead(comment)}
                                tooltip={comment.isRead ? 'Mark as unread' : 'Mark as read'}
                                tooltipSide="bottom"
                                className="h-8 w-8 rounded-full text-(--text-muted) hover:text-(--text-strong)"
                                aria-label={
                                  comment.isRead
                                    ? `Mark comment by ${comment.authorName} as unread`
                                    : `Mark comment by ${comment.authorName} as read`
                                }
                              >
                                {comment.isRead ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            ) : null}
                            {onHide ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => void handleHide(comment)}
                                tooltip="Hide from your view"
                                tooltipSide="bottom"
                                className="h-8 w-8 rounded-full text-(--text-muted) hover:text-(--text-strong)"
                                aria-label={`Hide comment by ${comment.authorName} from your view`}
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            ) : null}
                            {canEditComment(comment) ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => startEditing(comment)}
                                tooltip="Edit comment"
                                tooltipSide="bottom"
                                className="h-8 w-8 rounded-full text-(--text-muted) hover:text-(--text-strong)"
                                aria-label={`Edit comment by ${comment.authorName}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            ) : null}
                            {isOwner ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setPendingDelete(comment)}
                                tooltip="Delete comment"
                                tooltipSide="bottom"
                                className="h-8 w-8 rounded-full text-(--text-muted) hover:text-red-600"
                                aria-label={`Delete comment by ${comment.authorName}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                    {editingCommentId === comment.id ? (
                      <div className="mt-3 space-y-3">
                        <Textarea
                          value={editDraft}
                          onChange={(event) => setEditDraft(event.target.value)}
                          rows={3}
                          className="min-h-24 rounded-2xl border-(--border) bg-(--background)"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={cancelEditing}
                            disabled={savingEdit}
                            className="rounded-full"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void handleSaveEdit()}
                            disabled={savingEdit || !editDraft.trim()}
                            className="rounded-full"
                          >
                            {savingEdit ? 'Saving…' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-(--text)">
                          {comment.body}
                        </p>
                        {onGoToSection ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => void handleViewInSection(comment)}
                            tooltip={`Jump to ${EDITOR_SECTION_META[comment.section].label}`}
                            tooltipSide="bottom"
                            className="mt-2 h-8 rounded-full px-2 text-xs text-(--text-muted) hover:text-(--text-strong)"
                          >
                            View in {EDITOR_SECTION_META[comment.section].label}
                          </Button>
                        ) : null}
                      </>
                    )}
                  </li>
                  );
                })}
              </ul>
            )}
          </div>

          <footer className="border-t border-(--border) px-5 py-4">
            <p className="mb-3 text-xs text-(--text-muted)">
              Commenting from{' '}
              <span className="font-medium text-(--text-strong)">{composerSectionMeta.label}</span>
            </p>
            <label htmlFor="board-comment-input" className="sr-only">
              Add a comment
            </label>
            <Textarea
              id="board-comment-input"
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              placeholder="Leave feedback for the team..."
              className="min-h-24 rounded-2xl border-(--border) bg-(--background)"
            />
            <div className="mt-3 flex justify-end">
              <Button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={posting || !draft.trim()}
                className="rounded-full"
              >
                {posting ? 'Posting...' : 'Post comment'}
              </Button>
            </div>
          </footer>
        </aside>
      </div>

      <ConfirmationModal
        open={pendingDelete !== null}
        title="Delete this comment?"
        description="This removes the comment for everyone on the board. This cannot be undone."
        confirmLabel="Delete comment"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </>,
    document.body,
  );
}
