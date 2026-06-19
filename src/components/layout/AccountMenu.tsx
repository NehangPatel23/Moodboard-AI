'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { requestBoardEditorNavigation } from '@/lib/board-editor-navigation-guard';
import { WorkspaceAvatar } from '@/components/layout/WorkspaceAvatar';
import { Tooltip } from '@/components/ui/tooltip';
import { useMinSm } from '@/lib/use-media-query';
import { showToast } from '@/components/shared/toast-store';
import {
  getServerAuthSnapshot,
  readAuthState,
  signOut,
  subscribeAuth,
} from '@/lib/auth-store';

export function AccountMenu() {
  const router = useRouter();
  const auth = useSyncExternalStore(subscribeAuth, readAuthState, getServerAuthSnapshot);
  const accountLabelVisible = useMinSm();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const avatar = (
    <WorkspaceAvatar className="h-11 w-11 rounded-full text-xs" emojiClassName="text-2xl" />
  );

  if (auth.status !== 'authenticated' || !auth.user) {
    return avatar;
  }

  const user = auth.user;

  async function handleSignOut() {
    setOpen(false);

    const completeSignOut = async () => {
      await signOut();
      showToast('Signed out.', 'success');
      router.push('/');
    };

    requestBoardEditorNavigation({ type: 'run', run: () => void completeSignOut() }, () =>
      void completeSignOut(),
    );
  }

  const accountTrigger = (
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? menuId : undefined}
      aria-label="Account menu"
      className="flex items-center gap-3 rounded-full transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
    >
      <span className="hidden min-w-0 text-right leading-tight sm:block">
        <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Signed in as
        </span>
        <span className="block max-w-[10rem] truncate text-sm font-medium text-[var(--text-strong)]">
          {user.name}
        </span>
        <span className="block max-w-[10rem] truncate text-[11px] text-[var(--text-muted)]">
          {user.email}
        </span>
      </span>
      {avatar}
    </button>
  );

  return (
    <div className="relative" ref={containerRef}>
      {accountLabelVisible ? (
        accountTrigger
      ) : (
        <Tooltip content="Account menu">{accountTrigger}</Tooltip>
      )}

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-1.5 shadow-[0_20px_50px_rgba(15,23,42,0.16)]"
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-[var(--text-strong)]">{user.name}</p>
            <p className="truncate text-xs text-[var(--text-muted)]">{user.email}</p>
          </div>

          <div className="my-1 h-px bg-[var(--border)]" aria-hidden="true" />

          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[var(--text-strong)] transition',
              'hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
            )}
          >
            <LogOut className="h-4 w-4 text-[var(--text-muted)]" aria-hidden="true" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
