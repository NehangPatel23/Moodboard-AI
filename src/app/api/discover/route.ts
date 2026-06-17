import { NextResponse } from 'next/server';
import { fetchPublicBoards } from '@/lib/public-boards';

export async function GET() {
  try {
    const boards = await fetchPublicBoards();
    return NextResponse.json({ boards });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load public boards';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
