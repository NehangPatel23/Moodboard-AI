import { NextResponse } from 'next/server';
import { getBoardAccess } from '@/lib/db/board-access';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { checkGenerateRateLimit } from '@/lib/generate-rate-limit';
import { resolveReferenceImage } from '@/lib/resolve-reference-image';

type SearchReferenceImageBody = {
  title?: string;
  category?: string;
  mood?: string;
  prompt?: string;
  palette?: Array<{ hex: string; label?: string }>;
  boardId?: string;
  referenceId?: string;
  refreshAttempt?: number;
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

  let body: SearchReferenceImageBody;
  try {
    body = (await request.json()) as SearchReferenceImageBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  const boardId = body.boardId?.trim();
  if (boardId) {
    const access = await getBoardAccess(user.id, boardId);
    if (!access.canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const refreshAttempt =
    typeof body.refreshAttempt === 'number' && Number.isFinite(body.refreshAttempt)
      ? Math.max(0, Math.floor(body.refreshAttempt))
      : 0;
  const referenceId = body.referenceId?.trim() ?? `${boardId ?? 'board'}-${title}`;

  const resolved = await resolveReferenceImage({
    title,
    category: body.category?.trim(),
    mood: body.mood?.trim(),
    prompt: body.prompt?.trim(),
    palette: body.palette,
    seed: `${referenceId}-refresh-${refreshAttempt}`,
  });

  return NextResponse.json({
    imageUrl: resolved.imageUrl,
    source: resolved.source,
    sourceLabel: resolved.source,
    notice: resolved.notice,
  });
}
