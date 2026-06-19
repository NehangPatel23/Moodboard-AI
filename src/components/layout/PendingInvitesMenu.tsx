'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Loader2 } from 'lucide-react';
import { PendingInviteCard } from '@/components/shared/PendingInviteCard';
import { Tooltip } from '@/components/ui/tooltip';
import { usePendingInvites } from '@/lib/use-pending-invites';
import { showToast } from '@/components/shared/toast-store';
import { cn } from '@/lib/utils';

export function PendingInvitesMenu() {
  const router = useRouter();
  const { invites, loading, count, acceptInvite, declineInvite } = usePendingInvites();
  const [open, setOpen] = useState(false);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [action, setAction] = useState<'accept' | 'decline' | null>(null);
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

  async function handleAccept(token: string) {
    setActiveToken(token);
    setAction('accept');

    try {
      const data = await acceptInvite(token);
      showToast('Board access accepted.', 'success');
      setOpen(false);
      const destination =
        data.role === 'viewer'
          ? `/app/boards/${data.boardId}/view`
          : `/app/boards/${data.boardId}`;
      router.push(destination);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to accept invitation', 'destructive');
    } finally {
      setActiveToken(null);
      setAction(null);
    }
  }

  async function handleDecline(token: string) {
    setActiveToken(token);
    setAction('decline');

    try {
      await declineInvite(token);
      showToast('Invitation declined.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to decline invitation', 'destructive');
    } finally {
      setActiveToken(null);
      setAction(null);
    }
  }

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={menuId}
      aria-label={count > 0 ? `${count} pending board invitation${count === 1 ? '' : 's'}` : 'Board invitations'}
      className="relative flex h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-[var(--text-muted)] shadow-sm transition hover:text-[var(--text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] sm:px-4"
    >
      {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Bell className="h-4 w-4 shrink-0" />}
      <span className="hidden text-sm font-medium sm:inline">Invites</span>
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--text-strong)] px-1 text-[10px] font-semibold text-[var(--background)]">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </button>
  );

  return (
    <div ref={containerRef} className="relative">
      {count > 0 ? trigger : <Tooltip content="Board invitations">{trigger}</Tooltip>}

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Pending board invitations"
          className={cn(
            'absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(24rem,calc(100vw-2rem))] rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[0_20px_60px_rgba(15,23,42,0.12)]',
          )}
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--text-muted)]">
            Board invitations
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--text-strong)]">
            {count > 0 ? 'Accept access to join a shared board' : 'No pending invitations'}
          </p>

          <div className="mt-4 max-h-[min(24rem,60vh)] space-y-3 overflow-y-auto">
            {count === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                When someone invites you to a board, it will appear here. Invitations are sent to your
                account email — open the account menu to confirm you&apos;re signed in with the right
                address.
              </p>
            ) : (
              invites.map((invite) => (
                <PendingInviteCard
                  key={invite.id}
                  invite={invite}
                  compact
                  accepting={activeToken === invite.token && action === 'accept'}
                  declining={activeToken === invite.token && action === 'decline'}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                />
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
