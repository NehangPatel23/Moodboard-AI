'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { BoardComment } from '@/types/board';
import { apiFetch } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';

type CommentRow = {
  id: string;
  board_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};

type UseBoardCommentsOptions = {
  boardId: string;
  enabled: boolean;
  currentUserId: string | null;
  authorName: string;
};

function sortComments(comments: BoardComment[]): BoardComment[] {
  return [...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function rowToComment(row: CommentRow, authorName: string): BoardComment {
  return {
    id: row.id,
    boardId: row.board_id,
    userId: row.user_id,
    authorName,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useBoardComments({
  boardId,
  enabled,
  currentUserId,
  authorName,
}: UseBoardCommentsOptions) {
  const [comments, setComments] = useState<BoardComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const authorNameRef = useRef(authorName);
  authorNameRef.current = authorName;

  const refresh = useCallback(async () => {
    if (!enabled) {
      setComments([]);
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<{ comments: BoardComment[] }>(`/api/boards/${boardId}/comments`);
      setComments(sortComments(data.comments));
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [boardId, enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
        (payload) => {
          const row = payload.new as CommentRow;
          setComments((current) => {
            if (current.some((comment) => comment.id === row.id)) {
              return current;
            }

            const author =
              row.user_id === currentUserId ? authorNameRef.current : 'Collaborator';

            return sortComments([
              ...current,
              rowToComment(row, author),
            ]);
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
        (payload) => {
          const row = payload.old as { id?: string };
          if (!row.id) return;
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
    async (body: string): Promise<boolean> => {
      const text = body.trim();
      if (!text || !enabled || !currentUserId) return false;

      const optimisticId = `optimistic-${Date.now()}`;
      const optimistic: BoardComment = {
        id: optimisticId,
        boardId,
        userId: currentUserId,
        authorName: authorNameRef.current,
        body: text,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setPosting(true);
      setComments((current) => sortComments([...current, optimistic]));

      try {
        const data = await apiFetch<{ comment: BoardComment }>(`/api/boards/${boardId}/comments`, {
          method: 'POST',
          body: JSON.stringify({ body: text }),
        });

        setComments((current) =>
          sortComments(
            current
              .filter((comment) => comment.id !== optimisticId)
              .concat(data.comment),
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

  return {
    comments,
    loading,
    posting,
    postComment,
    deleteComment,
    refresh,
  };
}
