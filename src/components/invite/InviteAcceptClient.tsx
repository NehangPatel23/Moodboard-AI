'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { reloadBoards } from '@/lib/board-store';
import { refreshPendingInvites } from '@/lib/use-pending-invites';
import { Button } from '@/components/ui/button';

type InviteAcceptPageProps = {
  token: string;
};

type InvitePreview = {
  boardTitle: string;
  role: string;
  email: string;
};

export function InviteAcceptClient({ token }: InviteAcceptPageProps) {
  const router = useRouter();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInvite() {
      try {
        const data = await apiFetch<{ invite: InvitePreview & { boardId: string } }>(
          `/api/invites/${token}`,
        );
        if (!cancelled) {
          setPreview({
            boardTitle: data.invite.boardTitle,
            role: data.invite.role,
            email: data.invite.email,
          });
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Invite unavailable');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInvite();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleAccept() {
    setAccepting(true);
    setError(null);

    try {
      const data = await apiFetch<{ boardId: string; role: string }>(`/api/invites/${token}`, {
        method: 'POST',
      });
      await reloadBoards();
      await refreshPendingInvites();
      const destination =
        data.role === 'viewer'
          ? `/app/boards/${data.boardId}/view`
          : `/app/boards/${data.boardId}`;
      router.push(destination);
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : 'Failed to accept invite');
      setAccepting(false);
    }
  }

  async function handleDecline() {
    setDeclining(true);
    setError(null);

    try {
      await apiFetch(`/api/invites/${token}/decline`, { method: 'POST' });
      await refreshPendingInvites();
      router.push('/app');
    } catch (declineError) {
      setError(declineError instanceof Error ? declineError.message : 'Failed to decline invite');
      setDeclining(false);
    }
  }

  const busy = accepting || declining;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-(--text-muted)">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading invite…
      </div>
    );
  }

  if (error && !preview) {
    return (
      <section className="rounded-[2.5rem] border border-(--border) bg-(--surface-elevated) p-8">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
          Invite unavailable
        </p>
        <h1 className="mt-3 [font-family:var(--font-display),serif] text-4xl tracking-tight text-(--text-strong)">
          This invite is no longer valid.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-(--text-muted)">{error}</p>
        <div className="mt-6">
          <Link href="/app">
            <Button className="rounded-full">Go to dashboard</Button>
          </Link>
        </div>
      </section>
    );
  }

  if (!preview) return null;

  return (
    <section className="rounded-[2.5rem] border border-(--border) bg-(--surface-elevated) p-8 md:p-10">
      <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
        Board invitation
      </p>
      <h1 className="mt-3 [font-family:var(--font-display),serif] text-4xl tracking-tight text-(--text-strong) md:text-5xl">
        You&apos;ve been given {preview.role} access
      </h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-(--text-muted)">
        Accept access to join <span className="font-medium text-(--text-strong)">{preview.boardTitle}</span>{' '}
        as an <span className="font-medium text-(--text-strong)">{preview.role}</span> ({preview.email}).
      </p>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button type="button" onClick={handleAccept} disabled={busy} className="rounded-full">
          {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Accept access
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleDecline}
          disabled={busy}
          className="rounded-full"
        >
          {declining ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Decline
        </Button>
        <Link href="/app">
          <Button variant="outline" className="rounded-full" disabled={busy}>
            Back to dashboard
          </Button>
        </Link>
      </div>
    </section>
  );
}
