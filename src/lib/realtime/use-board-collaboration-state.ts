'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import type {
  BoardCollaborationStateResponse,
  CollaborationItemStateInput,
} from '@/types/board';

type UseBoardCollaborationStateOptions = {
  boardId: string;
  enabled: boolean;
};

export function useBoardCollaborationState({ boardId, enabled }: UseBoardCollaborationStateOptions) {
  const [state, setState] = useState<BoardCollaborationStateResponse>({
    commentsLastReadAt: null,
    activityLastReadAt: null,
    unreadComments: 0,
    unreadActivity: 0,
  });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    try {
      const data = await apiFetch<BoardCollaborationStateResponse>(
        `/api/boards/${boardId}/collaboration-state`,
      );
      setState(data);
    } catch {
      setState({
        commentsLastReadAt: null,
        activityLastReadAt: null,
        unreadComments: 0,
        unreadActivity: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [boardId, enabled]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function loadState() {
      setLoading(true);
      try {
        const data = await apiFetch<BoardCollaborationStateResponse>(
          `/api/boards/${boardId}/collaboration-state`,
        );
        if (!cancelled) {
          setState(data);
        }
      } catch {
        if (!cancelled) {
          setState({
            commentsLastReadAt: null,
            activityLastReadAt: null,
            unreadComments: 0,
            unreadActivity: 0,
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadState();

    return () => {
      cancelled = true;
    };
  }, [boardId, enabled]);

  const patchState = useCallback(
    async (body: Record<string, unknown>): Promise<boolean> => {
      if (!enabled) return false;

      try {
        const data = await apiFetch<BoardCollaborationStateResponse>(
          `/api/boards/${boardId}/collaboration-state`,
          {
            method: 'PATCH',
            body: JSON.stringify(body),
          },
        );
        setState(data);
        return true;
      } catch {
        return false;
      }
    },
    [boardId, enabled],
  );

  const markCommentsRead = useCallback(async (): Promise<boolean> => {
    return patchState({ markCommentsRead: true });
  }, [patchState]);

  const markActivityRead = useCallback(async (): Promise<boolean> => {
    return patchState({ markActivityRead: true });
  }, [patchState]);

  const setItemState = useCallback(
    async (item: CollaborationItemStateInput): Promise<boolean> => {
      return patchState({ item });
    },
    [patchState],
  );

  const setItemRead = useCallback(
    async (type: CollaborationItemStateInput['type'], id: string, isRead: boolean): Promise<boolean> => {
      return setItemState({ type, id, isRead });
    },
    [setItemState],
  );

  const hideItem = useCallback(
    async (type: CollaborationItemStateInput['type'], id: string): Promise<boolean> => {
      return setItemState({ type, id, isHidden: true });
    },
    [setItemState],
  );

  const unhideItem = useCallback(
    async (type: CollaborationItemStateInput['type'], id: string): Promise<boolean> => {
      return setItemState({ type, id, isHidden: false });
    },
    [setItemState],
  );

  return {
    ...state,
    loading: enabled ? loading : false,
    refresh,
    markCommentsRead,
    markActivityRead,
    setItemRead,
    hideItem,
    unhideItem,
  };
}
