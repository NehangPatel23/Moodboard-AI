'use client';

import dynamic from 'next/dynamic';

const BoardReadOnlyClient = dynamic(
  () => import('@/components/board/BoardReadOnlyClient').then((mod) => mod.BoardReadOnlyClient),
  {
    ssr: false,
    loading: () => null,
  },
);

type BoardReadOnlyShellProps = {
  boardId: string;
  publicView?: boolean;
};

export function BoardReadOnlyShell({ boardId, publicView }: BoardReadOnlyShellProps) {
  return <BoardReadOnlyClient boardId={boardId} publicView={publicView} />;
}