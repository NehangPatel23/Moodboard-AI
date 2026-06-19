'use client';

import { Loader2 } from 'lucide-react';
import type { PendingBoardInvite } from '@/types/board';
import { Button } from '@/components/ui/button';

type PendingInviteCardProps = {
  invite: PendingBoardInvite;
  accepting?: boolean;
  declining?: boolean;
  compact?: boolean;
  onAccept: (token: string) => void;
  onDecline: (token: string) => void;
};

function roleLabel(role: PendingBoardInvite['role']) {
  return role === 'viewer' ? 'viewer' : 'editor';
}

export function PendingInviteCard({
  invite,
  accepting = false,
  declining = false,
  compact = false,
  onAccept,
  onDecline,
}: PendingInviteCardProps) {
  const busy = accepting || declining;

  return (
    <div
      className={
        compact
          ? 'space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4'
          : 'flex flex-col gap-4 rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-elevated)] p-5 sm:flex-row sm:items-center sm:justify-between'
      }
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--text-strong)]">{invite.boardTitle}</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {invite.inviterName} invited you as an{' '}
          <span className="font-medium text-[var(--text-strong)]">{roleLabel(invite.role)}</span>.
        </p>
      </div>
      <div className={compact ? 'flex flex-wrap gap-2' : 'flex shrink-0 flex-wrap gap-2'}>
        <Button
          type="button"
          className="rounded-full"
          disabled={busy}
          onClick={() => onAccept(invite.token)}
        >
          {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Accept access
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          disabled={busy}
          onClick={() => onDecline(invite.token)}
        >
          {declining ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Decline
        </Button>
      </div>
    </div>
  );
}
