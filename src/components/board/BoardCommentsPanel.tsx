'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, Trash2, X } from 'lucide-react';
import type { BoardComment } from '@/types/board';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { showToast } from '@/components/shared/toast-store';

type BoardCommentsPanelProps = {
  open: boolean;
  boardTitle: string;
  comments: BoardComment[];
  loading: boolean;
  posting: boolean;
  currentUserId: string | null;
  isOwner: boolean;
  onClose: () => void;
  onPost: (body: string) => Promise<boolean>;
  onDelete: (commentId: string) => Promise<boolean>;
};

export function BoardCommentsPanel({
  open,
  boardTitle,
  comments,
  loading,
  posting,
  currentUserId,
  isOwner,
  onClose,
  onPost,
  onDelete,
}: BoardCommentsPanelProps) {
  const [draft, setDraft] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    textareaRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  if (!open || typeof document === 'undefined') return null;

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

  const handleDelete = async (commentId: string) => {
    const ok = await onDelete(commentId);
    if (ok) {
      showToast('Comment deleted.', 'success');
      return;
    }

    showToast('Failed to delete comment.', 'destructive');
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close comments"
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
        onClick={onClose}
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
            onClick={onClose}
            className="rounded-full border-(--border) bg-transparent"
            aria-label="Close comments panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="space-y-3" aria-busy="true" aria-label="Loading comments">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 text-center">
              <MessageSquare className="h-8 w-8 text-(--text-muted)" aria-hidden="true" />
              <p className="text-sm text-(--text-muted)">No comments yet. Start the thread.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {comments.map((comment) => {
                const canDelete = comment.userId === currentUserId || isOwner;
                return (
                  <li
                    key={comment.id}
                    className="rounded-2xl border border-(--border) bg-(--surface-muted) px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-(--text-strong)">{comment.authorName}</p>
                        <p className="text-xs text-(--text-muted)">{formatDateTime(comment.createdAt)}</p>
                      </div>
                      {canDelete ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => void handleDelete(comment.id)}
                          className="h-8 w-8 rounded-full text-(--text-muted) hover:text-red-600"
                          aria-label={`Delete comment by ${comment.authorName}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-(--text)">
                      {comment.body}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="border-t border-(--border) px-5 py-4">
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
    </div>,
    document.body,
  );
}
