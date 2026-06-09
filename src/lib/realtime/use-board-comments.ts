'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type {
  RealtimeChannel,
  RealtimePostgresDeletePayload,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
} from '@supabase/supabase-js';
import type { BoardComment } from '@/types/board';
import { apiFetch } from '@/lib/api-client';
import { normalizeEditorSection, type EditorSectionName } from '@/lib/editor-sections';
import { isCollaborationItemReadForViewer } from '@/lib/collaboration-read-state';
import { createClient } from '@/lib/supabase/client';

type CommentRow = {
  id: string;
  board_id: string;
  user_id: string;
  body: string;
  author_name?: string | null;
  section?: string | null;
  created_at: string;
  updated_at: string;
};

type UseBoardCommentsOptions = {
  boardId: string;
  enabled: boolean;
  currentUserId: string | null;
  authorName: string;
  commentsLastReadAt?: string | null;
};

function sortComments(comments: BoardComment[]): BoardComment[] {
  return [...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function rowToComment(
  row: CommentRow,
  authorName: string,
  viewerUserId: string | null,
  commentsLastReadAt: string | null | undefined,
  isHidden = false,
): BoardComment {
  return {
    id: row.id,
    boardId: row.board_id,
    userId: row.user_id,
    authorName,
    body: row.body,
    section: normalizeEditorSection(row.section),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isRead: isCollaborationItemReadForViewer(
      viewerUserId,
      row.user_id,
      row.updated_at,
      commentsLastReadAt ?? null,
    ),
    isHidden,
  };
}

function resolveAuthorName(
  row: CommentRow,
  currentUserId: string | null,
  authorNameRef: RefObject<string>,
  authorNameByUserId: Map<string, string>,
): string {
  if (row.author_name?.trim()) {
    return row.author_name.trim();
  }

  const cached = authorNameByUserId.get(row.user_id);
  if (cached) {
    return cached;
  }

  if (row.user_id === currentUserId) {
    return authorNameRef.current;
  }

  return 'Collaborator';
}

export function useBoardComments({
  boardId,
  enabled,
  currentUserId,
  authorName,
  commentsLastReadAt = null,
}: UseBoardCommentsOptions) {
  const [comments, setComments] = useState<BoardComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const authorNameRef = useRef(authorName);
  const authorNameByUserIdRef = useRef(new Map<string, string>());
  const commentsLastReadAtRef = useRef(commentsLastReadAt);

  useEffect(() => {
    authorNameRef.current = authorName;
  }, [authorName]);

  useEffect(() => {
    commentsLastReadAtRef.current = commentsLastReadAt;
  }, [commentsLastReadAt]);

  const seedAuthorNames = useCallback((nextComments: BoardComment[]) => {
    const map = authorNameByUserIdRef.current;
    nextComments.forEach((comment) => {
      map.set(comment.userId, comment.authorName);
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<{ comments: BoardComment[] }>(`/api/boards/${boardId}/comments`);
      seedAuthorNames(data.comments);
      setComments(sortComments(data.comments));
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [boardId, enabled, seedAuthorNames]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    async function loadComments() {
      setLoading(true);
      try {
        const data = await apiFetch<{ comments: BoardComment[] }>(`/api/boards/${boardId}/comments`);
        if (!cancelled) {
          seedAuthorNames(data.comments);
          setComments(sortComments(data.comments));
        }
      } catch {
        if (!cancelled) {
          setComments([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadComments();

    return () => {
      cancelled = true;
    };
  }, [boardId, enabled, seedAuthorNames]);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    let channel: RealtimeChannel | null = null;

    channel = supabase
      .channel(`board-comments:${boardId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'board_comments',
          filter: `board_id=eq.${boardId}`,
        },
        (payload: RealtimePostgresInsertPayload<CommentRow>) => {
          const row = payload.new;
          setComments((current) => {
            if (current.some((comment) => comment.id === row.id)) {
              return current;
            }

            const author = resolveAuthorName(
              row,
              currentUserId,
              authorNameRef,
              authorNameByUserIdRef.current,
            );

            authorNameByUserIdRef.current.set(row.user_id, author);

            return sortComments([
              ...current,
              rowToComment(row, author, currentUserId, commentsLastReadAtRef.current, false),
            ]);
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'board_comments',
          filter: `board_id=eq.${boardId}`,
        },
        (payload: RealtimePostgresUpdatePayload<CommentRow>) => {
          const row = payload.new;
          setComments((current) => {
            const index = current.findIndex((comment) => comment.id === row.id);
            if (index === -1) return current;

            const author = resolveAuthorName(
              row,
              currentUserId,
              authorNameRef,
              authorNameByUserIdRef.current,
            );

            authorNameByUserIdRef.current.set(row.user_id, author);

            const updated = rowToComment(
              row,
              author,
              currentUserId,
              commentsLastReadAtRef.current,
              current[index]?.isHidden,
            );
            const next = [...current];
            next[index] = updated;
            return sortComments(next);
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'board_comments',
          filter: `board_id=eq.${boardId}`,
        },
        (payload: RealtimePostgresDeletePayload<{ id?: string }>) => {
          const row = payload.old;
          if (!row?.id) return;
          setComments((current) => current.filter((comment) => comment.id !== row.id));
        },
      )
      .subscribe();

    return () => {
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [boardId, currentUserId, enabled]);

  const postComment = useCallback(
    async (body: string, section: EditorSectionName = 'overview'): Promise<boolean> => {
      const text = body.trim();
      if (!text || !enabled || !currentUserId) return false;

      const normalizedSection = normalizeEditorSection(section);
      const optimisticId = `optimistic-${Date.now()}`;
      const optimistic: BoardComment = {
        id: optimisticId,
        boardId,
        userId: currentUserId,
        authorName: authorNameRef.current,
        body: text,
        section: normalizedSection,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isRead: true,
        isHidden: false,
      };

      setPosting(true);
      setComments((current) => sortComments([...current, optimistic]));

      try {
        const data = await apiFetch<{ comment: BoardComment }>(`/api/boards/${boardId}/comments`, {
          method: 'POST',
          body: JSON.stringify({ body: text, section: normalizedSection }),
        });

        authorNameByUserIdRef.current.set(data.comment.userId, data.comment.authorName);

        setComments((current) =>
          sortComments(
            current
              .filter((comment) => comment.id !== optimisticId)
              .concat({ ...data.comment, isRead: true, isHidden: false }),
          ),
        );
        return true;
      } catch {
        setComments((current) => current.filter((comment) => comment.id !== optimisticId));
        return false;
      } finally {
        setPosting(false);
      }
    },
    [boardId, currentUserId, enabled],
  );

  const deleteComment = useCallback(
    async (commentId: string): Promise<boolean> => {
      if (!enabled) return false;

      const previous = comments;
      setComments((current) => current.filter((comment) => comment.id !== commentId));

      try {
        await apiFetch(`/api/boards/${boardId}/comments/${commentId}`, {
          method: 'DELETE',
        });
        return true;
      } catch {
        setComments(previous);
        return false;
      }
    },
    [boardId, comments, enabled],
  );

  const updateComment = useCallback(
    async (commentId: string, body: string): Promise<boolean> => {
      const text = body.trim();
      if (!text || !enabled) return false;

      const previous = comments;
      const now = new Date().toISOString();
      setComments((current) =>
        sortComments(
          current.map((comment) =>
            comment.id === commentId
              ? { ...comment, body: text, updatedAt: now, isRead: true }
              : comment,
          ),
        ),
      );

      try {
        const data = await apiFetch<{ comment: BoardComment }>(
          `/api/boards/${boardId}/comments/${commentId}`,
          {
            method: 'PATCH',
            body: JSON.stringify({ body: text }),
          },
        );

        setComments((current) =>
          sortComments(
            current.map((comment) =>
              comment.id === commentId
                ? {
                    ...data.comment,
                    isRead: true,
                    isHidden: comment.isHidden,
                  }
                : comment,
            ),
          ),
        );
        return true;
      } catch {
        setComments(previous);
        return false;
      }
    },
    [boardId, comments, enabled],
  );

  const patchCommentState = useCallback(
    (commentId: string, patch: Partial<Pick<BoardComment, 'isRead' | 'isHidden'>>) => {
      setComments((current) =>
        sortComments(
          current.map((comment) =>
            comment.id === commentId ? { ...comment, ...patch } : comment,
          ),
        ),
      );
    },
    [],
  );

  return {
    comments: enabled ? comments : [],
    loading: enabled ? loading : false,
    posting,
    postComment,
    deleteComment,
    updateComment,
    patchCommentState,
    refresh,
  };
}
