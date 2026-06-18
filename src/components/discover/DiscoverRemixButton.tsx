'use client';

import { useState, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { showToast } from '@/components/shared/toast-store';
import { apiFetch } from '@/lib/api-client';
import type { Board } from '@/types/board';
import { reloadBoards } from '@/lib/board-store';
import { getServerAuthSnapshot, readAuthState, subscribeAuth } from '@/lib/auth-store';

type DiscoverRemixButtonProps = {
  boardId: string;
  boardTitle: string;
};

export function DiscoverRemixButton({ boardId, boardTitle }: DiscoverRemixButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useSyncExternalStore(subscribeAuth, readAuthState, getServerAuthSnapshot);
  const [loading, setLoading] = useState(false);

  const handleRemix = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (auth.status !== 'authenticated') {
      router.push(`/sign-in?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<{ board: Board }>(`/api/boards/${boardId}/remix`, {
        method: 'POST',
      });
      await reloadBoards();
      showToast(`Remixed “${boardTitle}” into your studio.`, 'success');
      router.push(`/app/boards/${data.board.id}`);
    } catch {
      showToast('Remix failed.', 'destructive');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleRemix}
      disabled={loading}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-(--border) bg-(--surface-elevated) px-3 text-xs font-medium text-(--text-strong) shadow-[var(--shadow-card)] transition hover:bg-(--surface-subtle) disabled:opacity-60"
    >
      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      {loading ? 'Remixing…' : 'Remix'}
    </button>
  );
}
