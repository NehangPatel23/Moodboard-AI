import {
  GEMINI_FREE_TIER_MODELS,
  type GenerationSource,
} from '@/lib/ai-generate';
import {
  applyDesignSystemTokenOverrides,
  buildDeterministicDesignSystemTokens,
  type DesignSystemTokenOverrides,
  type DesignSystemTokens,
} from '@/lib/export-design-system';
import type { Board } from '@/types/board';

export type DesignSystemSuggestionInput = Pick<
  Board,
  'title' | 'prompt' | 'mood' | 'summary' | 'tone' | 'tags' | 'palette' | 'typography' | 'brandStrategy'
>;

export type DesignSystemSuggestionResult = {
  tokens: DesignSystemTokens;
  overrides: DesignSystemTokenOverrides;
  source: GenerationSource;
  notice?: string;
};

type DesignSystemPayload = {
  colors: Array<{ id: string; tokenName: string; usage?: string }>;
  typography: Array<{ id: string; tokenName: string; note?: string }>;
};

const DESIGN_SYSTEM_SYSTEM_PROMPT = `You are a senior design systems engineer. Given moodboard context, suggest semantic token names for colors and typography.

Return valid JSON only with this exact shape:
{
  "colors": [
    { "id": "palette-item-id", "tokenName": "semantic-slug", "usage": "short developer usage note" }
  ],
  "typography": [
    { "id": "typography-item-id", "tokenName": "semantic-slug", "note": "short developer usage note" }
  ]
}

Rules:
- tokenName must be lowercase kebab-case (letters, numbers, hyphens only)
- use semantic names like espresso, surface-muted, font-display — not generic color-1
- include every palette and typography item id from the input
- usage/note should be concise and actionable for developers`;

function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced?.[1] ?? trimmed).trim();
}

function buildDesignSystemPrompt(input: DesignSystemSuggestionInput): string {
  const palette = input.palette.length
    ? input.palette
        .map((color) => `- id: ${color.id} | ${color.label}: ${color.hex} (${color.usage})`)
        .join('\n')
    : 'None';

  const typography = input.typography.length
    ? input.typography
        .map((item) => `- id: ${item.id} | ${item.role}: ${item.fontName} (${item.note})`)
        .join('\n')
    : 'None';

  const brand = input.brandStrategy
    ? [
        `Positioning: ${input.brandStrategy.positioning}`,
        `Voice: ${input.brandStrategy.voice}`,
      ].join('\n')
    : 'None';

  return [
    `Board title: ${input.title}`,
    `Prompt: ${input.prompt}`,
    `Mood: ${input.mood}`,
    `Summary: ${input.summary}`,
    `Tone: ${input.tone.join(', ') || 'balanced'}`,
    `Tags: ${input.tags.join(', ') || 'none'}`,
    '',
    'Palette:',
    palette,
    '',
    'Typography:',
    typography,
    '',
    'Brand strategy:',
    brand,
    '',
    'Suggest semantic design token names for every palette and typography item.',
  ].join('\n');
}

function buildMockOverrides(input: DesignSystemSuggestionInput): DesignSystemTokenOverrides {
  return {
    colors: input.palette.map((color, index) => ({
      id: color.id,
      tokenName: color.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `brand-${index + 1}`,
      usage: color.usage,
    })),
    typography: input.typography.map((item) => ({
      id: item.id,
      tokenName: item.role === 'heading' ? 'display' : item.role === 'accent' ? 'mono' : 'body',
      note: item.note,
    })),
  };
}

async function callGeminiDesignSystem(
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
        parts: [{ text: DESIGN_SYSTEM_SYSTEM_PROMPT }],
      },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
        responseMimeType: 'application/json',
      },
    }),
  });

  const rawBody = await response.text();
  if (!response.ok) {
    throw new Error(rawBody.trim() || `Gemini request failed (${response.status})`);
  }

  const data = JSON.parse(rawBody) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text?.trim()) {
    throw new Error('Empty Gemini response');
  }

  return text;
}

function normalizePayload(
  payload: DesignSystemPayload,
  input: DesignSystemSuggestionInput,
): DesignSystemTokenOverrides {
  const paletteIds = new Set(input.palette.map((color) => color.id));
  const typographyIds = new Set(input.typography.map((item) => item.id));

  return {
    colors: (payload.colors ?? [])
      .filter((item) => paletteIds.has(item.id))
      .map((item) => ({
        id: item.id,
        tokenName: item.tokenName.trim(),
        usage: item.usage?.trim(),
      })),
    typography: (payload.typography ?? [])
      .filter((item) => typographyIds.has(item.id))
      .map((item) => ({
        id: item.id,
        tokenName: item.tokenName.trim(),
        note: item.note?.trim(),
      })),
  };
}

function boardFromInput(input: DesignSystemSuggestionInput): Board {
  return {
    id: 'design-system-export',
    title: input.title,
    prompt: input.prompt,
    summary: input.summary,
    mood: input.mood,
    tone: input.tone,
    tags: input.tags,
    palette: input.palette,
    typography: input.typography,
    references: [],
    notes: [],
    brandStrategy: input.brandStrategy ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFavorite: false,
    visibility: 'private',
  };
}

export async function generateDesignSystemTokens(
  input: DesignSystemSuggestionInput,
): Promise<DesignSystemSuggestionResult> {
  const board = boardFromInput(input);
  const deterministic = buildDeterministicDesignSystemTokens(board);

  if (!input.palette.length && !input.typography.length) {
    return {
      tokens: deterministic,
      overrides: { colors: [], typography: [] },
      source: 'mock',
      notice: 'Add palette or typography before exporting a design system.',
    };
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const prompt = buildDesignSystemPrompt(input);

  if (!apiKey) {
    const overrides = buildMockOverrides(input);
    return {
      tokens: applyDesignSystemTokenOverrides(board, overrides),
      overrides,
      source: 'mock',
      notice: 'Add GEMINI_API_KEY for AI-enhanced token naming.',
    };
  }

  let lastError: Error | null = null;

  for (const model of GEMINI_FREE_TIER_MODELS) {
    try {
      const content = await callGeminiDesignSystem(prompt, apiKey, model);
      const parsed = JSON.parse(extractJsonText(content)) as DesignSystemPayload;
      const overrides = normalizePayload(parsed, input);

      if (!overrides.colors?.length && !overrides.typography?.length) {
        throw new Error('Incomplete design system response');
      }

      return {
        tokens: applyDesignSystemTokenOverrides(board, overrides),
        overrides,
        source: 'gemini',
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Design system generation failed');
    }
  }

  const overrides = buildMockOverrides(input);
  return {
    tokens: applyDesignSystemTokenOverrides(board, overrides),
    overrides,
    source: 'mock',
    notice: lastError?.message ?? 'Gemini unavailable. Using deterministic token names.',
  };
}
