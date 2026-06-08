'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  RealtimeChannel,
  RealtimePostgresDeletePayload,
  RealtimePostgresInsertPayload,
} from '@supabase/supabase-js';
import type { BoardActivityEvent } from '@/types/board';
import { rowToActivity } from '@/lib/db/board-activity';
import { apiFetch } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';

type UseBoardActivityOptions = {
  boardId: string;
  enabled: boolean;
  activityLastReadAt?: string | null;
};

function sortActivity(events: BoardActivityEvent[]): BoardActivityEvent[] {
  return [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function useBoardActivity({
  boardId,
  enabled,
  activityLastReadAt = null,
}: UseBoardActivityOptions) {
  const [activity, setActivity] = useState<BoardActivityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const activityLastReadAtRef = useRef(activityLastReadAt);

  useEffect(() => {
    activityLastReadAtRef.current = activityLastReadAt;
  }, [activityLastReadAt]);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    try {
      const data = await apiFetch<{ activity: BoardActivityEvent[] }>(
        `/api/boards/${boardId}/activity`,
      );
      setActivity(sortActivity(data.activity));
    } catch {
      setActivity([]);
    } finally {
      setLoading(false);
    }
  }, [boardId, enabled]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function loadActivity() {
      setLoading(true);
      try {
        const data = await apiFetch<{ activity: BoardActivityEvent[] }>(
          `/api/boards/${boardId}/activity`,
        );
        if (!cancelled) {
          setActivity(sortActivity(data.activity));
        }
      } catch {
        if (!cancelled) {
          setActivity([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadActivity();

    return () => {
      cancelled = true;
    };
  }, [boardId, enabled]);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    let channel: RealtimeChannel | null = null;

    channel = supabase
      .channel(`board-activity:${boardId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'board_activity',
          filter: `board_id=eq.${boardId}`,
        },
        (payload: RealtimePostgresInsertPayload<Parameters<typeof rowToActivity>[0]>) => {
          const row = payload.new;
          setActivity((current) => {
            if (current.some((event) => event.id === row.id)) {
              return current;
            }

            const event = rowToActivity(row);
            const lastReadAt = activityLastReadAtRef.current;
            return sortActivity([
              {
                ...event,
                isRead: lastReadAt
                  ? new Date(event.createdAt).getTime() <= new Date(lastReadAt).getTime()
                  : false,
                isHidden: false,
              },
              ...current,
            ]);
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'board_activity',
          filter: `board_id=eq.${boardId}`,
        },
        (payload: RealtimePostgresDeletePayload<{ id?: string }>) => {
          const row = payload.old;
          if (!row?.id) return;
          setActivity((current) => current.filter((event) => event.id !== row.id));
        },
      )
      .subscribe();

    return () => {
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [boardId, enabled]);

  const deleteActivity = useCallback(
    async (activityId: string): Promise<boolean> => {
      if (!enabled) return false;

      const previous = activity;
      setActivity((current) => current.filter((event) => event.id !== activityId));

      try {
        await apiFetch(`/api/boards/${boardId}/activity/${activityId}`, {
          method: 'DELETE',
        });
        return true;
      } catch {
        setActivity(previous);
        return false;
      }
    },
    [activity, boardId, enabled],
  );

  const patchActivityState = useCallback(
    (activityId: string, patch: Partial<Pick<BoardActivityEvent, 'isRead' | 'isHidden'>>) => {
      setActivity((current) =>
        sortActivity(
          current.map((event) =>
            event.id === activityId ? { ...event, ...patch } : event,
          ),
        ),
      );
    },
    [],
  );

  return {
    activity: enabled ? activity : [],
    loading: enabled ? loading : false,
    refresh,
    deleteActivity,
    patchActivityState,
  };
}
