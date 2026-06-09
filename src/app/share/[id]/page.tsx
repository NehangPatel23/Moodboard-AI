import type { Metadata } from 'next';
import { rowToBoard } from '@/lib/db/board-mappers';
import { createAdminClient } from '@/lib/supabase/admin';
import { BoardReadOnlyShell } from '@/components/page-shells/BoardReadOnlyShell';

type SharePageProps = {
  params: Promise<{ id: string }>;
};

async function loadPublicBoard(id: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('boards')
    .select('*')
    .eq('id', id)
    .eq('visibility', 'shared')
    .maybeSingle();

  return data ? rowToBoard(data) : null;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { id } = await params;
  const board = await loadPublicBoard(id);

  if (!board) {
    return {
      title: 'Board not found | MoodBoard AI',
      description: 'This public board is unavailable.',
    };
  }

  const description = board.summary?.trim() || board.prompt?.trim() || 'A shared creative direction board on MoodBoard AI.';
  const image = board.references.find((reference) => reference.imageUrl)?.imageUrl;

  return {
    title: `${board.title} | MoodBoard AI`,
    description,
    openGraph: {
      title: board.title,
      description,
      type: 'website',
      ...(image ? { images: [{ url: image, alt: board.title }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: board.title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;
  return <BoardReadOnlyShell boardId={id} publicView />;
}
