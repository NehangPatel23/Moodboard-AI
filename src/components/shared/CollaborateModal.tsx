'use client';

import { useEffect, useState } from 'react';
import { Copy, Loader2, Trash2, UserPlus } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import type { BoardInvite, BoardMember, BoardMemberRole } from '@/types/board';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';
import { showToast } from '@/components/shared/toast-store';
import { isValidEmail } from '@/lib/auth-validation';
import { authInputErrorClassName } from '@/lib/auth-validation';

type CollaborateModalProps = {
  open: boolean;
  boardId: string;
  boardTitle: string;
  sharePath: string;
  canManageMembers: boolean;
  onCopied: () => void;
  onClose: () => void;
};

type Tab = 'link' | 'people';

type PendingRemoval =
  | { type: 'member'; userId: string; name: string; role: BoardMemberRole }
  | { type: 'invite'; inviteId: string; email: string; role: BoardMemberRole };

const deleteButtonClassName =
  'rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300';

function accessLabel(role: BoardMemberRole): string {
  return role === 'viewer' ? 'view' : 'edit';
}

function validateInviteEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Enter an email address.';
  }
  if (!isValidEmail(trimmed)) {
    return 'Enter a valid email address.';
  }
  return null;
}

export function CollaborateModal({
  open,
  boardId,
  boardTitle,
  sharePath,
  canManageMembers,
  onCopied,
  onClose,
}: CollaborateModalProps) {
  const [tab, setTab] = useState<Tab>('link');
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [invites, setInvites] = useState<BoardInvite[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteEmailError, setInviteEmailError] = useState<string | null>(null);
  const [inviteRole, setInviteRole] = useState<BoardMemberRole>('editor');
  const [inviting, setInviting] = useState(false);
  const [peopleError, setPeopleError] = useState<string | null>(null);
  const [lastInvitePath, setLastInvitePath] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(null);
  const [removing, setRemoving] = useState(false);

  const fullShareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${sharePath}` : '';

  useEffect(() => {
    if (!open || !canManageMembers) return;

    let cancelled = false;

    async function loadPeople() {
      setLoadingPeople(true);
      setPeopleError(null);

      try {
        const [membersResponse, invitesResponse] = await Promise.all([
          apiFetch<{ members: BoardMember[] }>(`/api/boards/${boardId}/members`),
          apiFetch<{ invites: BoardInvite[] }>(`/api/boards/${boardId}/invites`),
        ]);

        if (!cancelled) {
          setMembers(membersResponse.members);
          setInvites(invitesResponse.invites.filter((invite) => invite.status === 'pending'));
        }
      } catch (error) {
        if (!cancelled) {
          setPeopleError(error instanceof Error ? error.message : 'Failed to load collaborators');
        }
      } finally {
        if (!cancelled) {
          setLoadingPeople(false);
        }
      }
    }

    void loadPeople();

    return () => {
      cancelled = true;
    };
  }, [boardId, canManageMembers, open]);

  function handleClose() {
    setLastInvitePath(null);
    setInviteEmail('');
    setInviteEmailError(null);
    setPeopleError(null);
    setPendingRemoval(null);
    onClose();
  }

  const visibleInvitePath =
    lastInvitePath &&
    invites.some((invite) => lastInvitePath === `/invite/${invite.token}`)
      ? lastInvitePath
      : null;

  if (!open) return null;

  async function handleCopyShareLink() {
    const urlToCopy = fullShareUrl || `${window.location.origin}${sharePath}`;

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(urlToCopy);
    } else {
      window.prompt('Copy this link', urlToCopy);
    }

    onCopied();
  }

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    if (!canManageMembers) return;

    const emailError = validateInviteEmail(inviteEmail);
    if (emailError) {
      setInviteEmailError(emailError);
      return;
    }

    setInviteEmailError(null);
    setInviting(true);
    setPeopleError(null);
    setLastInvitePath(null);

    const normalizedEmail = inviteEmail.trim().toLowerCase();

    try {
      const response = await apiFetch<
        | { type: 'member_added'; member: BoardMember }
        | { type: 'invite_created'; invitePath: string; invite: BoardInvite }
      >(`/api/boards/${boardId}/members`, {
        method: 'POST',
        body: JSON.stringify({ email: normalizedEmail, role: inviteRole }),
      });

      if (response.type === 'member_added') {
        setMembers((current) => {
          const withoutExisting = current.filter((member) => member.userId !== response.member.userId);
          return [...withoutExisting, response.member];
        });
        setInviteEmail('');
        showToast(
          `${response.member.name || response.member.email} now has ${accessLabel(response.member.role)} access.`,
          'success',
        );
      } else {
        setInvites((current) => [response.invite, ...current]);
        setLastInvitePath(response.invitePath);
        setInviteEmail('');
        showToast(
          `Invite created for ${response.invite.email} with ${accessLabel(response.invite.role)} access.`,
          'success',
        );
      }
    } catch (error) {
      setPeopleError(error instanceof Error ? error.message : 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  }

  async function handleConfirmRemoval() {
    if (!pendingRemoval) return;

    setRemoving(true);
    setPeopleError(null);

    try {
      if (pendingRemoval.type === 'member') {
        await apiFetch(`/api/boards/${boardId}/members/${pendingRemoval.userId}`, { method: 'DELETE' });
        setMembers((current) => current.filter((member) => member.userId !== pendingRemoval.userId));
        showToast(
          `${pendingRemoval.name} no longer has ${accessLabel(pendingRemoval.role)} access.`,
          'success',
        );
      } else {
        const revokedToken = invites.find((invite) => invite.id === pendingRemoval.inviteId)?.token;
        await apiFetch(`/api/boards/${boardId}/invites/${pendingRemoval.inviteId}`, { method: 'DELETE' });
        setInvites((current) => current.filter((invite) => invite.id !== pendingRemoval.inviteId));
        if (revokedToken && lastInvitePath === `/invite/${revokedToken}`) {
          setLastInvitePath(null);
        }
        showToast(
          `Revoked ${accessLabel(pendingRemoval.role)} invite for ${pendingRemoval.email}.`,
          'success',
        );
      }
      setPendingRemoval(null);
    } catch (error) {
      setPeopleError(error instanceof Error ? error.message : 'Failed to complete removal');
    } finally {
      setRemoving(false);
    }
  }

  async function handleCopyInviteLink(path: string) {
    const url = `${window.location.origin}${path}`;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      window.prompt('Copy invite link', url);
    }
    onCopied();
  }

  return (
    <div
      className="fixed inset-0 z-10050 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="collaborate-title"
      onMouseDown={handleClose}
    >
      <div
        className="w-full max-w-2xl rounded-4xl border border-(--border) bg-(--surface) p-6 text-(--text) shadow-[0_30px_80px_rgba(15,23,42,0.15)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
            Share board
          </p>
          <h2
            id="collaborate-title"
            className="[font-family:var(--font-display),serif] text-3xl tracking-tight text-(--text-strong)"
          >
            {boardTitle}
          </h2>
        </div>

        <div className="mt-5 flex gap-2" role="tablist" aria-label="Share options">
          <Button
            type="button"
            variant={tab === 'link' ? 'default' : 'outline'}
            className="rounded-full"
            onClick={() => setTab('link')}
          >
            Public link
          </Button>
          {canManageMembers ? (
            <Button
              type="button"
              variant={tab === 'people' ? 'default' : 'outline'}
              className="rounded-full"
              onClick={() => setTab('people')}
            >
              People
            </Button>
          ) : null}
        </div>

        {tab === 'link' ? (
          <div className="mt-5 space-y-3">
            <p className="text-sm leading-6 text-(--text-muted)">
              Anyone with this link can view this board (read-only). No account required.
            </p>
            <Input readOnly value={fullShareUrl} />
            <Button type="button" variant="outline" onClick={handleCopyShareLink} className="rounded-full">
              <Copy className="h-4 w-4" />
              Copy link
            </Button>
          </div>
        ) : null}

        {tab === 'people' && canManageMembers ? (
          <div className="mt-5 space-y-5">
            <form noValidate onSubmit={handleInvite} className="space-y-3">
              <p className="text-sm leading-6 text-(--text-muted)">
                Invite collaborators by email. Existing users get access immediately. For new
                users, share the invite link yourself — emails are not sent automatically.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1 space-y-2">
                  <Input
                    type="text"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={inviteEmail}
                    onChange={(event) => {
                      setInviteEmail(event.target.value);
                      if (inviteEmailError) {
                        setInviteEmailError(null);
                      }
                    }}
                    onBlur={() => {
                      if (inviteEmail.trim()) {
                        setInviteEmailError(validateInviteEmail(inviteEmail));
                      }
                    }}
                    placeholder="name@studio.com"
                    autoComplete="email"
                    aria-invalid={inviteEmailError ? true : undefined}
                    aria-describedby={inviteEmailError ? 'invite-email-error' : undefined}
                    className={cn('rounded-full', inviteEmailError && authInputErrorClassName)}
                  />
                  {inviteEmailError ? (
                    <p id="invite-email-error" className="px-1 text-sm text-red-600">
                      {inviteEmailError}
                    </p>
                  ) : null}
                </div>
                <select
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value as BoardMemberRole)}
                  className="h-10 shrink-0 rounded-full border border-(--border) bg-(--surface) px-4 text-sm text-(--text-strong) sm:w-32"
                  aria-label="Invite role"
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
                <Button type="submit" disabled={inviting} className="shrink-0 rounded-full sm:mt-0 sm:w-auto">
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Send invite
                </Button>
              </div>
            </form>

            {visibleInvitePath ? (
              <div className="rounded-2xl border border-(--border) bg-(--surface-soft) p-4">
                <p className="text-sm text-(--text-muted)">Invite link ready — share with your collaborator:</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Input readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}${visibleInvitePath}`} />
                  <Button type="button" variant="outline" className="rounded-full" onClick={() => handleCopyInviteLink(visibleInvitePath)}>
                    Copy invite link
                  </Button>
                </div>
              </div>
            ) : null}

            {peopleError ? <p className="text-sm text-red-600">{peopleError}</p> : null}

            {loadingPeople ? (
              <div className="flex items-center gap-2 text-sm text-(--text-muted)">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading collaborators…
              </div>
            ) : null}

            {!loadingPeople && members.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                  Members
                </p>
                {members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-(--border) bg-(--surface-soft) px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-(--text-strong)">{member.name}</p>
                      <p className="truncate text-xs text-(--text-muted)">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-(--surface) px-3 py-1 text-[11px] font-medium capitalize text-(--text-muted)">
                        {member.role}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={deleteButtonClassName}
                        aria-label={`Remove ${member.name}`}
                        onClick={() =>
                          setPendingRemoval({
                            type: 'member',
                            userId: member.userId,
                            name: member.name,
                            role: member.role,
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {!loadingPeople && invites.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-(--text-muted)">
                  Pending invites
                </p>
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-(--border) bg-(--surface-soft) px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-(--text-strong)">{invite.email}</p>
                      <p className="text-xs capitalize text-(--text-muted)">{invite.role} · pending</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => handleCopyInviteLink(`/invite/${invite.token}`)}
                      >
                        Copy link
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={deleteButtonClassName}
                        aria-label={`Revoke invite for ${invite.email}`}
                        onClick={() =>
                          setPendingRemoval({
                            type: 'invite',
                            inviteId: invite.id,
                            email: invite.email,
                            role: invite.role,
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <Button variant="default" type="button" onClick={handleClose} className="rounded-full">
            Close
          </Button>
        </div>
      </div>

      <ConfirmationModal
        open={Boolean(pendingRemoval)}
        title={
          pendingRemoval?.type === 'member'
            ? `Remove ${pendingRemoval.name}?`
            : 'Revoke invite?'
        }
        description={
          pendingRemoval?.type === 'member'
            ? `${pendingRemoval.name} will lose access to this board immediately.`
            : `The pending invite for ${pendingRemoval?.email ?? 'this collaborator'} will be revoked and the link will stop working.`
        }
        confirmLabel={
          removing
            ? pendingRemoval?.type === 'member'
              ? 'Removing…'
              : 'Revoking…'
            : pendingRemoval?.type === 'member'
              ? 'Remove member'
              : 'Revoke invite'
        }
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {
          if (!removing) {
            void handleConfirmRemoval();
          }
        }}
        onCancel={() => {
          if (!removing) {
            setPendingRemoval(null);
          }
        }}
      />
    </div>
  );
}
