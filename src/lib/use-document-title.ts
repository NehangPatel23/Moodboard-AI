'use client';

import { useEffect } from 'react';

const DEFAULT_TITLE = 'MoodBoard AI';

export function useDocumentTitle(title: string, unreadCount = 0): void {
  useEffect(() => {
    const baseTitle = title.trim() || DEFAULT_TITLE;
    const nextTitle = unreadCount > 0 ? `(${unreadCount}) ${baseTitle}` : baseTitle;
    const previousTitle = document.title;

    document.title = nextTitle;

    return () => {
      document.title = previousTitle === nextTitle ? DEFAULT_TITLE : previousTitle;
    };
  }, [title, unreadCount]);
}
