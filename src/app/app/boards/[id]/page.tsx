import { BoardEditorClient } from '@/components/board/BoardEditorClient';

type BoardPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BoardPage({ params }: BoardPageProps) {
  const { id } = await params;
  return <BoardEditorClient boardId={id} />;
}