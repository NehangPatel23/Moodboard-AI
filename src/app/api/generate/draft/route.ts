import { NextResponse } from 'next/server';
import {
  generateBoardDraftFromPrompt,
  generateBoardDraftFromTemplate,
} from '@/lib/ai-generate';
import { issueEnrichPermit } from '@/lib/generate-enrich-permit';
import { checkGenerateRateLimit } from '@/lib/generate-rate-limit';
import { getAuthenticatedUser } from '@/lib/db/auth';

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

  let body: { prompt?: string; templateId?: string };
  try {
    body = (await request.json()) as { prompt?: string; templateId?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const templateId = body.templateId?.trim();
  const prompt = body.prompt?.trim() ?? '';

  try {
    if (templateId) {
      const result = await generateBoardDraftFromTemplate(templateId);
      issueEnrichPermit(user.id, result.board.id);
      return NextResponse.json(result);
    }

    if (!prompt) {
      return NextResponse.json({ error: 'prompt or templateId is required' }, { status: 400 });
    }

    if (prompt.length > 2000) {
      return NextResponse.json({ error: 'prompt is too long (max 2000 characters)' }, { status: 400 });
    }

    const result = await generateBoardDraftFromPrompt(prompt);
    issueEnrichPermit(user.id, result.board.id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed';
    const status = message === 'Template not found' ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
