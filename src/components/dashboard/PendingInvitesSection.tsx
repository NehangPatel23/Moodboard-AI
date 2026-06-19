'use client';

import { Loader2 } from 'lucide-react';
import { PendingInviteBoardCard } from '@/components/dashboard/PendingInviteBoardCard';
import { appDisplayHeadingClass, appSectionLabelClass } from '@/components/shared/app-surface-styles';
import { usePendingInvites } from '@/lib/use-pending-invites';

export function PendingInvitesSection() {
  const { invites, loading, count, acceptInvite, declineInvite } = usePendingInvites();

  if (loading && count === 0) {
    return (
      <section className="flex items-center gap-2 text-sm text-(--text-muted)" aria-label="Pending invitations">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking for board invitations…
      </section>
    );
  }

  if (count === 0) {
    return null;
  }

  return (
    <section className="space-y-6" aria-label="Pending invitations">
      <div>
        <p className={appSectionLabelClass}>Collaboration</p>
        <h2 className={`mt-2 text-3xl md:text-4xl ${appDisplayHeadingClass}`}>
          Pending invitations
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-(--text-muted) md:text-base">
          Accept access to add these boards to your studio.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {invites.map((invite) => (
          <PendingInviteBoardCard
            key={invite.id}
            invite={invite}
            onAccept={acceptInvite}
            onDecline={declineInvite}
          />
        ))}
      </div>
    </section>
  );
}
