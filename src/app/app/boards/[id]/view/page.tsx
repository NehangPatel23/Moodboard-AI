import { BoardReadOnlyShell } from '@/components/page-shells/BoardReadOnlyShell';

type BoardViewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BoardViewPage({ params }: BoardViewPageProps) {
  const { id } = await params;
  return <BoardReadOnlyShell boardId={id} />;
}