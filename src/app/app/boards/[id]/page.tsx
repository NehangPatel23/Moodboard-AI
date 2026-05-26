import { BoardEditorShell } from '@/components/page-shells/BoardEditorShell';

type BoardPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BoardPage({ params }: BoardPageProps) {
  const { id } = await params;
  return <BoardEditorShell boardId={id} />;
}