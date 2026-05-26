'use client';

import { useEffect } from 'react';
import { hydrateBoardStore } from '@/lib/board-store';

export function BoardStoreBootstrap() {
  useEffect(() => {
    hydrateBoardStore();
  }, []);

  return null;
}