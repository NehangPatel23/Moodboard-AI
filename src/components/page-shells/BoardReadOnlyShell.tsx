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
};

export function BoardReadOnlyShell({ boardId }: BoardReadOnlyShellProps) {
  return <BoardReadOnlyClient boardId={boardId} />;
}