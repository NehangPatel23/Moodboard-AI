'use client';

import { RemixBoardButton } from '@/components/shared/RemixBoardButton';

type DiscoverRemixButtonProps = {
  boardId: string;
  boardTitle: string;
};

export function DiscoverRemixButton({ boardId, boardTitle }: DiscoverRemixButtonProps) {
  return <RemixBoardButton boardId={boardId} boardTitle={boardTitle} variant="compact" />;
}
