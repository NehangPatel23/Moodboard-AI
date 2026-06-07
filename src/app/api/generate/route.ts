import { NextResponse } from 'next/server';
import { generateBoardFromPrompt, generateBoardFromTemplate } from '@/lib/ai-generate';
import { getConfiguredGenerationProvider } from '@/lib/generation-provider';
import { getAuthenticatedUser } from '@/lib/db/auth';
import { checkGenerateRateLimit } from '@/lib/generate-rate-limit';

export async function GET() {
  const provider = getConfiguredGenerationProvider();
  return NextResponse.json({ provider });
}

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

  if (templateId) {
    try {
      const result = await generateBoardFromTemplate(templateId);
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Generation failed';
      const status = message === 'Template not found' ? 404 : 500;
      return NextResponse.json({ error: message }, { status });
    }
  }

  if (!prompt) {
    return NextResponse.json({ error: 'prompt or templateId is required' }, { status: 400 });
  }

  if (prompt.length > 2000) {
    return NextResponse.json({ error: 'prompt is too long (max 2000 characters)' }, { status: 400 });
  }

  try {
    const result = await generateBoardFromPrompt(prompt);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
