import { getTemplateById } from '@/lib/ai';
import { createBoardFromPrompt } from '@/lib/board-store';
import { enrichBoardReferences } from '@/lib/enrich-board-references';
import {
  BOARD_REFERENCE_COUNT,
  REFERENCE_IMAGE_SOURCE,
  buildReferenceImageUrl,
  padReferencesToCount,
} from '@/lib/reference-images';
import { createId } from '@/lib/utils';
import type { Board, BoardTemplate, NoteType, TypographyRole } from '@/types/board';

export type AIGeneratedDraftPayload = {
  title: string;
  summary: string;
  mood: string;
  tone: string[];
  tags: string[];
  palette: { label: string; hex: string; usage: string }[];
  typography: { role: TypographyRole; fontName: string; note: string }[];
  notes: { text: string; type: NoteType }[];
  references: { title: string; category: string; source?: string }[];
  followUpPrompt: string;
};

export type GenerationSource = 'gemini' | 'mock';

export type GeneratedBoardResult = {
  board: Board;
  followUpPrompt: string;
  source: GenerationSource;
  /** Shown when Gemini failed and demo/mock generation was used instead. */
  notice?: string;
};

/** Free-tier models in priority order. 2.0-* models have 0 quota on free tier — excluded. */
export const GEMINI_FREE_TIER_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'] as const;

const RETRYABLE_GEMINI_STATUSES = new Set([429, 500, 502, 503, 504]);

const SYSTEM_PROMPT = `You are a senior creative director. Given a user prompt, produce structured creative direction for a moodboard.

Return valid JSON only with this exact shape:
{
  "title": "short board title (max 5 words)",
  "summary": "1-2 sentence creative summary",
  "mood": "2-4 word mood phrase",
  "tone": ["3-5 tone adjectives"],
  "tags": ["3-6 lowercase tags"],
  "palette": [
    { "label": "color name", "hex": "#RRGGBB", "usage": "where to use it" }
  ],
  "typography": [
    { "role": "heading", "fontName": "Google Font name", "note": "usage note" },
    { "role": "body", "fontName": "Google Font name", "note": "usage note" },
    { "role": "accent", "fontName": "Google Font name", "note": "usage note" }
  ],
  "notes": [
    { "text": "creative note", "type": "idea" | "instruction" | "keyword" }
  ],
  "references": [
    { "title": "reference title", "category": "Interior|Product|Portrait|Editorial|Detail", "source": "Pexels" }
  ],
  "followUpPrompt": "one sentence refinement prompt for the user"
}

Rules:
- palette must have exactly 4 colors with valid hex codes
- typography must have heading, body, and accent roles
- notes must have 3 items with mixed types
- references must have exactly ${BOARD_REFERENCE_COUNT} items with varied categories (Interior, Product, Portrait, Editorial, Detail, Campaign)
- keep output premium, specific, and actionable`;

function nowIso(): string {
  return new Date().toISOString();
}

function buildBoardFromPayload(prompt: string, payload: AIGeneratedDraftPayload): Board {
  const boardId = createId('board');

  return {
    id: boardId,
    title: payload.title.trim() || 'Untitled Board',
    prompt: prompt.trim(),
    summary: payload.summary.trim(),
    mood: payload.mood.trim(),
    tone: payload.tone.filter(Boolean).slice(0, 6),
    tags: payload.tags.filter(Boolean).slice(0, 8),
    palette: payload.palette.slice(0, 6).map((item, index) => ({
      id: `${boardId}-palette-${index}`,
      label: item.label,
      hex: item.hex,
      usage: item.usage,
    })),
    typography: payload.typography.slice(0, 4).map((item, index) => ({
      id: `${boardId}-typography-${index}`,
      role: item.role,
      fontName: item.fontName,
      note: item.note,
    })),
    notes: payload.notes.slice(0, 6).map((item, index) => ({
      id: `${boardId}-note-${index}`,
      text: item.text,
      type: item.type,
      position: { x: 0, y: 0 },
    })),
    references: padReferencesToCount(
      payload.references.slice(0, BOARD_REFERENCE_COUNT).map((item, index) => ({
        id: `${boardId}-reference-${index}`,
        title: item.title,
        imageUrl: buildReferenceImageUrl({
          title: item.title,
          category: item.category,
          mood: payload.mood,
          prompt: prompt.trim(),
          palette: payload.palette,
          seed: `${boardId}-${index}`,
        }),
        category: item.category,
        source: item.source ?? REFERENCE_IMAGE_SOURCE,
      })),
      {
        prompt: prompt.trim(),
        mood: payload.mood,
        palette: payload.palette,
      },
    ),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    isFavorite: false,
    visibility: 'private',
  };
}

function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced?.[1] ?? trimmed).trim();
}

function parseModelContent(content: string): AIGeneratedDraftPayload {
  const parsed = JSON.parse(extractJsonText(content)) as AIGeneratedDraftPayload;

  if (!parsed.title || !parsed.summary || !parsed.mood) {
    throw new Error('Incomplete AI response');
  }

  return parsed;
}

function buildFollowUpPromptFromTemplate(template: BoardTemplate, board: Board): string {
  const tone = board.tone.length ? board.tone.join(', ') : 'balanced';
  const palette = board.palette.length
    ? board.palette
        .map((item) => item.label.toLowerCase())
        .slice(0, 3)
        .join(', ')
    : 'a refined neutral palette';

  return `Refine the ${template.name.toLowerCase()} direction with a ${board.mood} mood, ${tone} tone, and a palette centered on ${palette}.`;
}

function applyTemplateToBoard(board: Board, template: BoardTemplate): Board {
  return {
    ...board,
    title: template.name,
    prompt: template.prompt,
    summary: template.summary ?? board.summary,
    mood: template.mood ?? board.mood,
    tone: template.tone?.length ? template.tone : board.tone,
    tags: template.tags.length
      ? Array.from(new Set([...template.tags, ...board.tags]))
      : board.tags,
    palette: template.palette?.length
      ? template.palette.map((item, index) => ({
          id: `${board.id}-template-palette-${index}`,
          label: item.label,
          hex: item.hex,
          usage: item.usage,
        }))
      : board.palette,
    typography: template.typography?.length
      ? template.typography.map((item, index) => ({
          id: `${board.id}-template-typography-${index}`,
          role: item.role,
          fontName: item.fontName,
          note: item.note,
        }))
      : board.typography,
    notes: template.notes?.length
      ? template.notes.map((item, index) => ({
          id: `${board.id}-template-note-${index}`,
          text: item.text,
          type: item.type,
          position: { x: 0, y: 0 },
        }))
      : board.notes,
    references: padReferencesToCount(
      template.references?.length
        ? template.references.map((item, index) => ({
            id: `${board.id}-template-reference-${index}`,
            title: item.title,
            imageUrl: buildReferenceImageUrl({
              title: item.title,
              category: item.category,
              mood: template.mood ?? board.mood,
              prompt: template.prompt,
              palette: template.palette ?? board.palette,
              seed: `${template.id}-${index}`,
            }),
            category: item.category,
            source: item.source ?? REFERENCE_IMAGE_SOURCE,
          }))
        : board.references,
      {
        prompt: template.prompt,
        mood: template.mood ?? board.mood,
        palette: template.palette ?? board.palette,
      },
    ),
  };
}

async function buildMockResult(prompt: string): Promise<GeneratedBoardResult> {
  const board = await enrichBoardReferences(createBoardFromPrompt({ prompt }));
  const followUpPrompt = `Refine the direction for ${board.title.toLowerCase()} with a ${board.mood} mood and palette centered on ${board.palette
    .map((item) => item.label.toLowerCase())
    .slice(0, 3)
    .join(', ')}.`;

  return { board, followUpPrompt, source: 'mock' };
}

function parseGeminiErrorMessage(errorText: string, status: number): string {
  try {
    const parsed = JSON.parse(errorText) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    // Not JSON — use raw text below.
  }
  return errorText.trim() || `Gemini request failed (${status})`;
}

function isRetryableGeminiFailure(status: number, errorText: string): boolean {
  if (RETRYABLE_GEMINI_STATUSES.has(status)) return true;
  const lower = errorText.toLowerCase();
  return (
    lower.includes('unavailable') ||
    lower.includes('high demand') ||
    lower.includes('quota exceeded') ||
    lower.includes('limit: 0') ||
    lower.includes('resource exhausted')
  );
}

async function callGeminiModel(
  prompt: string,
  apiKey: string,
  model: (typeof GEMINI_FREE_TIER_MODELS)[number],
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    }),
  });

  const rawBody = await response.text();

  if (!response.ok) {
    const message = parseGeminiErrorMessage(rawBody, response.status);
    const error = new Error(message) as Error & { status?: number; retryable?: boolean };
    error.status = response.status;
    error.retryable = isRetryableGeminiFailure(response.status, rawBody);
    throw error;
  }

  const data = JSON.parse(rawBody) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message?: string };
  };

  if (data.error?.message) {
    const error = new Error(data.error.message) as Error & { retryable?: boolean };
    error.retryable = isRetryableGeminiFailure(503, data.error.message);
    throw error;
  }

  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error('Empty AI response from Gemini');
  }

  return content;
}

async function callGeminiWithFallback(prompt: string, apiKey: string): Promise<string> {
  const failures: string[] = [];

  for (const model of GEMINI_FREE_TIER_MODELS) {
    try {
      return await callGeminiModel(prompt, apiKey, model);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Gemini error';
      const status = error instanceof Error ? (error as Error & { status?: number }).status : undefined;
      const retryable =
        error instanceof Error ? (error as Error & { retryable?: boolean }).retryable : false;

      failures.push(`${model}${status ? ` (${status})` : ''}: ${message}`);

      if (status === 403 || status === 401) {
        throw new Error('Gemini API key is invalid. Check GEMINI_API_KEY in .env.local.');
      }

      if (!retryable && status && status >= 400 && status < 500 && status !== 429) {
        throw new Error(message);
      }
    }
  }

  throw new Error(
    failures.at(-1) ??
      'All Gemini free-tier models are unavailable. Try again in a few minutes.',
  );
}

export async function generateBoardFromTemplate(templateId: string): Promise<GeneratedBoardResult> {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error('Template not found');
  }

  const result = await generateBoardFromPrompt(template.prompt);
  const board = await enrichBoardReferences(applyTemplateToBoard(result.board, template));

  return {
    board,
    followUpPrompt: buildFollowUpPromptFromTemplate(template, board),
    source: result.source,
  };
}

export async function generateBoardFromPrompt(prompt: string): Promise<GeneratedBoardResult> {
  const trimmed = prompt.trim();
  if (!trimmed) {
    throw new Error('Prompt is required');
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return buildMockResult(trimmed);
  }

  try {
    const content = await callGeminiWithFallback(trimmed, apiKey);
    const payload = parseModelContent(content);
    const board = await enrichBoardReferences(buildBoardFromPayload(trimmed, payload));

    return {
      board,
      followUpPrompt: payload.followUpPrompt.trim(),
      source: 'gemini',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('API key is invalid')) {
      throw error;
    }

    const mock = await buildMockResult(trimmed);
    return {
      ...mock,
      notice:
        'Gemini is busy or over quota. Used demo generation for now — try again in a few minutes.',
    };
  }
}
