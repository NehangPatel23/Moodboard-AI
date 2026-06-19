'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';
import { Eye, Loader2, Mail, PencilLine } from 'lucide-react';
import type { PendingBoardInvite } from '@/types/board';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/shared/toast-store';
import { dashboardCardClass } from '@/components/board/board-editor-styles';
import {
  appOverlayBadgeClass,
  appPreviewFallbackHex,
  appPreviewLabelClass,
  appPreviewTileClass,
  appPreviewTileFooterClass,
  appPreviewTileOverlayClass,
} from '@/components/shared/app-surface-styles';

type PendingInviteBoardCardProps = {
  invite: PendingBoardInvite;
  onAccept: (token: string) => Promise<{ boardId: string; role: string }>;
  onDecline: (token: string) => Promise<void>;
};

function getTileStyle(
  invite: PendingBoardInvite,
  index: number,
): CSSProperties {
  const palette = invite.palette ?? [];
  const references = invite.references ?? [];
  const paletteFallback = palette[index % Math.max(palette.length, 1)]?.hex ?? appPreviewFallbackHex;
  const reference = references[index];

  if (reference?.imageUrl) {
    return {
      backgroundImage: `linear-gradient(180deg, rgba(17, 24, 39, 0.08), rgba(17, 24, 39, 0.18)), url(${reference.imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }

  return {
    background: `linear-gradient(135deg, ${paletteFallback} 0%, rgba(255,255,255,0.9) 100%)`,
  };
}

export function PendingInviteBoardCard({ invite, onAccept, onDecline }: PendingInviteBoardCardProps) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const busy = accepting || declining;

  async function handleAccept() {
    setAccepting(true);
    try {
      const data = await onAccept(invite.token);
      showToast('Board access accepted.', 'success');
      const destination =
        data.role === 'viewer'
          ? `/app/boards/${data.boardId}/view`
          : `/app/boards/${data.boardId}`;
      router.push(destination);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to accept invitation', 'destructive');
    } finally {
      setAccepting(false);
    }
  }

  async function handleDecline() {
    setDeclining(true);
    try {
      await onDecline(invite.token);
      showToast('Invitation declined.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to decline invitation', 'destructive');
    } finally {
      setDeclining(false);
    }
  }

  return (
    <article className={`${dashboardCardClass} ring-2 ring-[var(--border)] ring-offset-2 ring-offset-[var(--background)]`}>
      <div className="relative p-4 pb-0">
        <div className="pointer-events-none absolute left-7 top-7 z-10 flex flex-wrap gap-2">
          <span className={appOverlayBadgeClass}>
            <Mail className="h-3 w-3" strokeWidth={1.75} />
            Pending
          </span>
          <span className={appOverlayBadgeClass}>
            {invite.role === 'viewer' ? (
              <>
                <Eye className="h-3 w-3" strokeWidth={1.75} />
                View
              </>
            ) : (
              <>
                <PencilLine className="h-3 w-3" strokeWidth={1.75} />
                Edit
              </>
            )}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={`${invite.id}-${index}`}
              className={`relative aspect-square overflow-hidden rounded-[1.15rem] ${appPreviewTileClass}`}
              style={getTileStyle(invite, index)}
            >
              <div className={appPreviewTileOverlayClass} />
              <div className={appPreviewTileFooterClass} />
              {!invite.references?.[index]?.imageUrl ? (
                <div className="absolute inset-0 flex items-end p-3">
                  <span className={appPreviewLabelClass}>
                    {invite.palette?.[index % Math.max(invite.palette.length, 1)]?.label ??
                      invite.boardMood ??
                      'Invite'}
                  </span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-5">
        <div className="flex flex-wrap gap-2">
          {invite.boardMood ? (
            <span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-[11px] font-medium tracking-wide text-[var(--text-muted)]">
              {invite.boardMood}
            </span>
          ) : null}
          <span className="rounded-full bg-[var(--surface-subtle)] px-3 py-1 text-[11px] font-medium tracking-wide text-[var(--text-muted)]">
            Invitation
          </span>
        </div>

        <h3 className="mt-4 [font-family:var(--font-display),serif] text-2xl leading-tight text-[var(--text-strong)]">
          {invite.boardTitle}
        </h3>

        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
          Invited by {invite.inviterName}
          {invite.boardSummary?.trim() ? ` · ${invite.boardSummary.trim()}` : null}
        </p>

        <div className="mt-auto flex flex-wrap gap-2 pt-6">
          <Button type="button" className="rounded-full" disabled={busy} onClick={() => void handleAccept()}>
            {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Accept access
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={busy}
            onClick={() => void handleDecline()}
          >
            {declining ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Decline
          </Button>
        </div>
      </div>
    </article>
  );
}
