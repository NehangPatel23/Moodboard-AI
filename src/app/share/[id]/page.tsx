import { BoardReadOnlyShell } from '@/components/page-shells/BoardReadOnlyShell';

type SharePageProps = {
  params: Promise<{ id: string }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;
  return <BoardReadOnlyShell boardId={id} publicView />;
}
