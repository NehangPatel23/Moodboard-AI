import type { ReactNode } from 'react';
import { collaboratorColorForUser } from '@/lib/realtime/collaborator-fields';
import type { BoardPresenceUser } from '@/lib/realtime/use-board-realtime';
import { cn } from '@/lib/utils';

type CollaboratorFieldHighlightProps = {
  fieldId: string;
  onlineUsers: BoardPresenceUser[];
  currentUserId: string | null;
  className?: string;
  children: ReactNode;
};

export function CollaboratorFieldHighlight({
  fieldId,
  onlineUsers,
  currentUserId,
  className,
  children,
}: CollaboratorFieldHighlightProps) {
  const editors = onlineUsers.filter(
    (user) => user.userId !== currentUserId && user.activeFieldId === fieldId,
  );

  if (editors.length === 0) {
    return <>{children}</>;
  }

  const primary = editors[0];
  const color = collaboratorColorForUser(primary.userId);
  const label =
    editors.length === 1
      ? `${primary.name} is editing`
      : `${editors.map((user) => user.name).join(', ')} are editing`;

  return (
    <div className={cn('relative', className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] ring-2 ring-offset-2 ring-offset-(--background)"
        style={{ boxShadow: `0 0 0 2px ${color}` }}
      />
      <p
        className="pointer-events-none absolute -top-2 left-3 z-10 rounded-full px-2 py-0.5 text-[10px] font-medium text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}
