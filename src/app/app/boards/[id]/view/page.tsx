import { BoardReadOnlyClient } from '@/components/board/BoardReadOnlyClient';

type BoardViewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BoardViewPage({ params }: BoardViewPageProps) {
  const { id } = await params;
  return <BoardReadOnlyClient boardId={id} />;
}