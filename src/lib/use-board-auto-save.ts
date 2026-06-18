'use client';

import { useEffect, useRef } from 'react';

type UseBoardAutoSaveOptions = {
  enabled: boolean;
  isDirty: boolean;
  debounceMs: number | null;
  isSaving: boolean;
  revision: string;
  onAutoSave: () => void;
};

export function useBoardAutoSave({
  enabled,
  isDirty,
  debounceMs,
  isSaving,
  revision,
  onAutoSave,
}: UseBoardAutoSaveOptions) {
  const onAutoSaveRef = useRef(onAutoSave);

  useEffect(() => {
    onAutoSaveRef.current = onAutoSave;
  });

  useEffect(() => {
    if (!enabled || !isDirty || debounceMs === null || isSaving) {
      return;
    }

    const timer = window.setTimeout(() => {
      onAutoSaveRef.current();
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [enabled, isDirty, debounceMs, isSaving, revision]);
}
