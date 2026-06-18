'use client';

import { useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient, ensureSupabaseRealtimeAuth } from '@/lib/supabase/client';
import type { FieldPresenceState } from '@/lib/realtime/collaborator-fields';

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

export function useBoardFieldSync({
  boardId,
  userId,
  userName,
  enabled,
  onRemotePatch,
}: UseBoardFieldSyncOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onRemotePatchRef = useRef(onRemotePatch);

  useEffect(() => {
    onRemotePatchRef.current = onRemotePatch;
  }, [onRemotePatch]);

  useEffect(() => {
    if (!enabled || !userId) return;

    let cancelled = false;
    const supabase = createClient();
    const channelName = `board-fields:${boardId}`;

    async function connect() {
      await ensureSupabaseRealtimeAuth(supabase);
      if (cancelled) return;

      const channel = supabase.channel(channelName);
      channel.on('broadcast', { event: 'field_patch' }, ({ payload }) => {
        const patch = payload as BoardFieldPatch;
        if (!patch?.fieldId || patch.userId === userId) return;
        onRemotePatchRef.current(patch);
      });

      channel.subscribe();
      channelRef.current = channel;
    }

    void connect();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [boardId, enabled, userId]);

  const broadcastFieldPatch = (fieldId: string, value: string) => {
    if (!enabled || !userId || !channelRef.current) return;

    const patch: BoardFieldPatch = {
      type: 'field_patch',
      fieldId,
      value,
      userId,
      userName,
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
