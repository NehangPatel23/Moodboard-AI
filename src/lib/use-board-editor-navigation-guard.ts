'use client';

import { useEffect, useRef } from 'react';
import {
  registerBoardEditorNavigationBlocker,
  setBoardEditorNavigationDirty,
  type BlockedNavigation,
} from '@/lib/board-editor-navigation-guard';

type UseBoardEditorNavigationGuardOptions = {
  isDirty: boolean;
  enabled: boolean;
  onBlocked: (navigation: BlockedNavigation) => void;
};

export function useBoardEditorNavigationGuard({
  isDirty,
  enabled,
  onBlocked,
}: UseBoardEditorNavigationGuardOptions) {
  const historyGuardPushed = useRef(false);

  useEffect(() => {
    setBoardEditorNavigationDirty(isDirty && enabled);
    return () => setBoardEditorNavigationDirty(false);
  }, [enabled, isDirty]);

  useEffect(() => {
    if (!enabled) {
      registerBoardEditorNavigationBlocker(null);
      return;
    }

    registerBoardEditorNavigationBlocker(onBlocked);
    return () => registerBoardEditorNavigationBlocker(null);
  }, [enabled, onBlocked]);

  useEffect(() => {
    if (!isDirty || !enabled) {
      historyGuardPushed.current = false;
      return;
    }

    if (!historyGuardPushed.current) {
      window.history.pushState({ boardEditorUnsaved: true }, '', window.location.href);
      historyGuardPushed.current = true;
    }

    const handlePopState = () => {
      window.history.pushState({ boardEditorUnsaved: true }, '', window.location.href);
      onBlocked({ type: 'back' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [enabled, isDirty, onBlocked]);

  useEffect(() => {
    if (!isDirty || !enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled, isDirty]);
}
