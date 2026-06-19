'use client';

import { useState, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import { showToast } from '@/components/shared/toast-store';
import { apiFetch } from '@/lib/api-client';
import type { Board } from '@/types/board';
import { reloadBoards } from '@/lib/board-store';
import { getServerAuthSnapshot, readAuthState, subscribeAuth } from '@/lib/auth-store';
import { cn } from '@/lib/utils';
import { appPrimaryButtonClass } from '@/components/shared/app-surface-styles';

type RemixBoardButtonProps = {
  boardId: string;
  boardTitle: string;
  variant?: 'compact' | 'primary';
  className?: string;
  label?: string;
  loadingLabel?: string;
};

export function RemixBoardButton({
  boardId,
  boardTitle,
  variant = 'compact',
  className,
  label = 'Remix',
  loadingLabel = 'Remixing…',
}: RemixBoardButtonProps) {
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

  if (variant === 'primary') {
    return (
      <button
        type="button"
        onClick={handleRemix}
        disabled={loading}
        className={cn(appPrimaryButtonClass, 'group disabled:opacity-60', className)}
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        {loading ? loadingLabel : label}
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleRemix}
      disabled={loading}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-full border border-(--border) bg-(--surface-elevated) px-3 text-xs font-medium text-(--text-strong) shadow-[var(--shadow-card)] transition hover:bg-(--surface-subtle) disabled:opacity-60',
        className,
      )}
    >
      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      {loading ? loadingLabel : label}
    </button>
  );
}
