import { NextResponse } from 'next/server';
import { generateDesignSystemTokens } from '@/lib/ai-generate-design-system';
import { getBoardAccess } from '@/lib/db/board-access';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { checkGenerateRateLimit } from '@/lib/generate-rate-limit';
import type { Board } from '@/types/board';

type DesignSystemBody = {
  boardId?: string;
  title?: string;
  prompt?: string;
  mood?: string;
  summary?: string;
  tone?: string[];
  tags?: string[];
  palette?: Board['palette'];
  typography?: Board['typography'];
  brandStrategy?: Board['brandStrategy'];
};

export async function POST(request: Request) {
  const { user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rate = checkGenerateRateLimit(user.id);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${rate.retryAfterSec} seconds.` },
      { status: 429 },
    );
  }

  let body: DesignSystemBody;
  try {
    body = (await request.json()) as DesignSystemBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const boardId = body.boardId?.trim();
  if (boardId) {
    const access = await getBoardAccess(user.id, boardId);
    if (!access.role) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

  const result = await generateDesignSystemTokens({
    title: body.title?.trim() || 'Untitled Board',
    prompt,
    mood: body.mood?.trim() || 'Balanced',
    summary: body.summary?.trim() || '',
    tone: Array.isArray(body.tone) ? body.tone.filter(Boolean) : [],
    tags: Array.isArray(body.tags) ? body.tags.filter(Boolean) : [],
    palette: Array.isArray(body.palette) ? body.palette : [],
    typography: Array.isArray(body.typography) ? body.typography : [],
    brandStrategy: body.brandStrategy ?? null,
  });

  return NextResponse.json(result);
}
