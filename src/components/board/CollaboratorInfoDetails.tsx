'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Loader2, Mail } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { formatDateTime } from '@/lib/utils';
import { GuardedLink } from '@/components/shared/GuardedLink';
import { PublicProfileAvatar } from '@/components/profile/PublicProfileAvatar';

type BoardCollaboratorInfo = {
  userId: string;
  name: string;
  email: string;
  joinedAt: string | null;
  workspaceName: string;
  workspaceTagline: string;
  avatarId: string;
  avatarAccent: string;
  avatarImageUrl: string | null;
};

type CollaboratorInfoDetailsProps = {
  boardId: string;
  userId: string;
  isCurrentUser: boolean;
};

export function CollaboratorInfoDetails({
  boardId,
  userId,
  isCurrentUser,
}: CollaboratorInfoDetailsProps) {
  const [collaborator, setCollaborator] = useState<BoardCollaboratorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await apiFetch<{ collaborator: BoardCollaboratorInfo }>(
          `/api/boards/${boardId}/members/${userId}`,
        );
        if (cancelled) return;
        setCollaborator(data.collaborator);
      } catch (fetchError) {
        if (cancelled) return;
        setCollaborator(null);
        setError(fetchError instanceof Error ? fetchError.message : 'Could not load collaborator info.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [boardId, userId]);

  if (loading) {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-(--border) bg-(--surface-subtle) px-3 py-3 text-xs text-(--text-muted)">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Loading account details…
      </div>
    );
  }

  if (error || !collaborator) {
    return (
      <div className="mt-2 rounded-xl border border-(--border) bg-(--surface-subtle) px-3 py-3 text-xs leading-5 text-(--text-muted)">
        {error ?? 'Account details are unavailable.'}
      </div>
    );
  }

  const showWorkspaceName =
    collaborator.workspaceName.trim().length > 0 &&
    collaborator.workspaceName.trim() !== collaborator.name.trim();

  return (
    <div className="mt-2 rounded-xl border border-(--border) bg-(--surface-subtle) p-3">
      <div className="flex items-start gap-3">
        <PublicProfileAvatar
          profile={collaborator}
          className="h-10 w-10 shrink-0 rounded-full text-xs"
          emojiClassName="text-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-(--text-strong)">
            {isCurrentUser ? 'Your account' : collaborator.name}
          </p>
          {isCurrentUser ? (
            <p className="truncate text-xs text-(--text-muted)">{collaborator.name}</p>
          ) : null}
        </div>
      </div>

      <dl className="mt-3 space-y-2.5 text-xs">
        <div>
          <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-(--text-muted)">
            Email
          </dt>
          <dd className="mt-0.5">
            {collaborator.email ? (
              <a
                href={`mailto:${collaborator.email}`}
                className="inline-flex items-center gap-1.5 break-all text-sm text-(--text-strong) underline-offset-2 hover:underline"
              >
                <Mail className="h-3.5 w-3.5 shrink-0 text-(--text-muted)" aria-hidden="true" />
                {collaborator.email}
              </a>
            ) : (
              <span className="text-sm text-(--text-muted)">Not available</span>
            )}
          </dd>
        </div>

        {showWorkspaceName ? (
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-(--text-muted)">
              Workspace
            </dt>
            <dd className="mt-0.5 text-sm text-(--text-strong)">{collaborator.workspaceName}</dd>
          </div>
        ) : null}

        {collaborator.joinedAt ? (
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-[0.14em] text-(--text-muted)">
              On this board since
            </dt>
            <dd className="mt-0.5 text-sm text-(--text-strong)">
              {formatDateTime(collaborator.joinedAt)}
            </dd>
          </div>
        ) : null}
      </dl>

      <GuardedLink
        href={`/profile/${collaborator.userId}`}
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-(--text-strong) underline-offset-2 hover:underline"
      >
        View public profile
        <ExternalLink className="h-3 w-3" aria-hidden="true" />
      </GuardedLink>
    </div>
  );
}
