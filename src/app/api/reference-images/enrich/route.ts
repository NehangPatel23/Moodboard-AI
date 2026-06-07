import { NextResponse } from 'next/server';
import { enrichBoardReferences } from '@/lib/enrich-board-references';
import { getAuthenticatedUser } from '@/lib/db/auth';
import type { Board } from '@/types/board';

export async function POST(request: Request) {
  const { user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { board?: Board };
  try {
    body = (await request.json()) as { board?: Board };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.board || typeof body.board.id !== 'string') {
    return NextResponse.json({ error: 'board is required' }, { status: 400 });
  }

  const board = await enrichBoardReferences(body.board);
  return NextResponse.json({ board });
}
