'use client';

import dynamic from 'next/dynamic';

const BoardEditorClient = dynamic(
  () => import('@/components/board/BoardEditorClient').then((mod) => mod.BoardEditorClient),
  {
    ssr: false,
    loading: () => null,
  },
);

type BoardEditorShellProps = {
  boardId: string;
};

export function BoardEditorShell({ boardId }: BoardEditorShellProps) {
  return <BoardEditorClient boardId={boardId} />;
}