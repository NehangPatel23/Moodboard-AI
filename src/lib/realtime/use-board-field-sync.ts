'use client';

import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient, ensureSupabaseRealtimeAuth } from '@/lib/supabase/client';
import type { FieldPresenceState } from '@/lib/realtime/collaborator-fields';
import { usePrivateRealtimePresence } from '@/lib/realtime/config';

export type BoardFieldPatch = {
  type: 'field_patch';
  fieldId: string;
  value: string;
  userId: string;
  userName: string;
  ts: number;
};

type UseBoardFieldSyncOptions = {
  boardId: string;
  userId: string | null;
  userName: string;
  enabled: boolean;
  onRemotePatch: (patch: BoardFieldPatch) => void;
};

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

export function useBoardFieldSync({
  boardId,
  userId,
  userName,
  enabled,
  onRemotePatch,
}: UseBoardFieldSyncOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscribedRef = useRef(false);
  const onRemotePatchRef = useRef(onRemotePatch);
  const userNameRef = useRef(userName);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const cancelledRef = useRef(false);
  const privateChannels = usePrivateRealtimePresence();

  useEffect(() => {
    onRemotePatchRef.current = onRemotePatch;
    userNameRef.current = userName;
  }, [onRemotePatch, userName]);

  useEffect(() => {
    if (!enabled || !userId) {
      subscribedRef.current = false;
      return;
    }

    cancelledRef.current = false;
    const supabase = createClient();
    const channelName = `board-fields:${boardId}`;

    function clearReconnectTimer() {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    }

    function scheduleReconnect() {
      if (cancelledRef.current) return;

      clearReconnectTimer();
      const delay = Math.min(
        RECONNECT_BASE_MS * 2 ** reconnectAttemptRef.current,
        RECONNECT_MAX_MS,
      );
      reconnectAttemptRef.current += 1;

      reconnectTimerRef.current = window.setTimeout(() => {
        if (!cancelledRef.current) {
          void connect();
        }
      }, delay);
    }

    async function connect() {
      await ensureSupabaseRealtimeAuth(supabase);
      if (cancelledRef.current) return;

      clearReconnectTimer();

      const existing = channelRef.current;
      if (existing) {
        subscribedRef.current = false;
        void supabase.removeChannel(existing);
        channelRef.current = null;
      }

      const channel = supabase.channel(channelName, {
        config: {
          private: privateChannels,
          broadcast: { self: false },
        },
      });

      channel.on('broadcast', { event: 'field_patch' }, ({ payload }) => {
        const patch = payload as BoardFieldPatch;
        if (!patch?.fieldId || patch.userId === userId) return;
        onRemotePatchRef.current(patch);
      });

      channel.subscribe((status) => {
        if (cancelledRef.current) {
          void supabase.removeChannel(channel);
          return;
        }

        if (status === 'SUBSCRIBED') {
          subscribedRef.current = true;
          reconnectAttemptRef.current = 0;
          channelRef.current = channel;
          return;
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          subscribedRef.current = false;
          channelRef.current = null;
          scheduleReconnect();
        }
      });
    }

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.access_token || cancelledRef.current) return;

      void (async () => {
        await supabase.realtime.setAuth(session.access_token);
        if (!subscribedRef.current && !cancelledRef.current) {
          reconnectAttemptRef.current = 0;
          void connect();
        }
      })();
    });

    function handleOnline() {
      if (cancelledRef.current) return;
      reconnectAttemptRef.current = 0;
      void connect();
    }

    window.addEventListener('online', handleOnline);
    void connect();

    return () => {
      cancelledRef.current = true;
      subscribedRef.current = false;
      authSubscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      clearReconnectTimer();

      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [boardId, enabled, privateChannels, userId]);

  const broadcastFieldPatch = (fieldId: string, value: string) => {
    if (!enabled || !userId || !channelRef.current || !subscribedRef.current) return;

    const patch: BoardFieldPatch = {
      type: 'field_patch',
      fieldId,
      value,
      userId,
      userName: userNameRef.current,
      ts: Date.now(),
    };

    void channelRef.current.send({
      type: 'broadcast',
      event: 'field_patch',
      payload: patch,
    });
  };

  return { broadcastFieldPatch };
}

export function useRemoteFieldValues() {
  const [remoteValues, setRemoteValues] = useState<Record<string, { value: string; userName: string; ts: number }>>(
    {},
  );

  const applyRemotePatch = (patch: BoardFieldPatch) => {
    setRemoteValues((current) => {
      const existing = current[patch.fieldId];
      if (existing && existing.ts >= patch.ts) {
        return current;
      }
      return {
        ...current,
        [patch.fieldId]: { value: patch.value, userName: patch.userName, ts: patch.ts },
      };
    });
  };

  const clearRemoteField = (fieldId: string) => {
    setRemoteValues((current) => {
      if (!current[fieldId]) return current;
      const next = { ...current };
      delete next[fieldId];
      return next;
    });
  };

  return { remoteValues, applyRemotePatch, clearRemoteField };
}

export type { FieldPresenceState };
