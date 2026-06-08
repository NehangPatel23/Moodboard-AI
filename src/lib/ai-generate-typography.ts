import {
  GEMINI_FREE_TIER_MODELS,
  type GenerationSource,
} from '@/lib/ai-generate';
import { createId } from '@/lib/utils';
import type { Board, TypographyItem, TypographyRole } from '@/types/board';

export type TypographySuggestionInput = Pick<
  Board,
  'prompt' | 'mood' | 'summary' | 'tone' | 'typography'
>;

export type TypographySuggestionResult = {
  typography: TypographyItem[];
  source: GenerationSource;
  notice?: string;
};

type TypographyPayload = {
  typography: { role: TypographyRole; fontName: string; note: string }[];
};

const TYPOGRAPHY_SYSTEM_PROMPT = `You are a senior typographer. Given moodboard context, suggest a cohesive Google Fonts type system.

Return valid JSON only with this exact shape:
{
  "typography": [
    { "role": "heading", "fontName": "Google Font name", "note": "usage note" },
    { "role": "body", "fontName": "Google Font name", "note": "usage note" },
    { "role": "accent", "fontName": "Google Font name", "note": "usage note" }
  ]
}

Rules:
- typography must include heading, body, and accent roles
- use real Google Font names
- keep notes short and actionable
- match the board mood and tone`;

function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced?.[1] ?? trimmed).trim();
}

function buildTypographyPrompt(input: TypographySuggestionInput): string {
  const current = input.typography.length
    ? input.typography
        .map((item) => `- ${item.role}: ${item.fontName} (${item.note})`)
        .join('\n')
    : 'None yet';

  return [
    `Board prompt: ${input.prompt}`,
    `Mood: ${input.mood}`,
    `Summary: ${input.summary}`,
    `Tone: ${input.tone.join(', ') || 'balanced'}`,
    '',
    'Current typography:',
    current,
    '',
    'Suggest a refined typography system for this moodboard.',
  ].join('\n');
}

function buildMockTypography(input: TypographySuggestionInput): TypographyItem[] {
  const baseId = createId('typography');
  const mood = input.mood.toLowerCase();

  if (mood.includes('lux') || mood.includes('editorial')) {
    return [
      { id: `${baseId}-0`, role: 'heading', fontName: 'Playfair Display', note: 'Hero titles and campaign headlines' },
      { id: `${baseId}-1`, role: 'body', fontName: 'Inter', note: 'UI copy and supporting paragraphs' },
      { id: `${baseId}-2`, role: 'accent', fontName: 'Cormorant Garamond', note: 'Pull quotes and editorial accents' },
    ];
  }

  if (mood.includes('tech') || mood.includes('modern')) {
    return [
      { id: `${baseId}-0`, role: 'heading', fontName: 'Space Grotesk', note: 'Product headlines and section titles' },
      { id: `${baseId}-1`, role: 'body', fontName: 'IBM Plex Sans', note: 'Body text and interface labels' },
      { id: `${baseId}-2`, role: 'accent', fontName: 'JetBrains Mono', note: 'Specs, tags, and micro labels' },
    ];
  }

  return [
    { id: `${baseId}-0`, role: 'heading', fontName: 'Fraunces', note: 'Warm display headlines' },
    { id: `${baseId}-1`, role: 'body', fontName: 'Source Sans 3', note: 'Readable body copy' },
    { id: `${baseId}-2`, role: 'accent', fontName: 'Libre Baskerville', note: 'Accent quotes and captions' },
  ];
}

async function callGeminiTypography(
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
        parts: [{ text: TYPOGRAPHY_SYSTEM_PROMPT }],
      },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
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

function payloadToTypography(payload: TypographyPayload): TypographyItem[] {
  return payload.typography.slice(0, 4).map((item) => ({
    id: createId('typography'),
    role: item.role,
    fontName: item.fontName.trim(),
    note: item.note.trim(),
  }));
}

export async function generateTypographySuggestions(
  input: TypographySuggestionInput,
): Promise<TypographySuggestionResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const prompt = buildTypographyPrompt(input);

  if (!apiKey) {
    return {
      typography: buildMockTypography(input),
      source: 'mock',
      notice: 'Add GEMINI_API_KEY for AI typography suggestions.',
    };
  }

  let lastError: Error | null = null;

  for (const model of GEMINI_FREE_TIER_MODELS) {
    try {
      const content = await callGeminiTypography(prompt, apiKey, model);
      const parsed = JSON.parse(extractJsonText(content)) as TypographyPayload;

      if (!parsed.typography?.length) {
        throw new Error('Incomplete typography response');
      }

      return {
        typography: payloadToTypography(parsed),
        source: 'gemini',
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Typography generation failed');
    }
  }

  return {
    typography: buildMockTypography(input),
    source: 'mock',
    notice: lastError?.message ?? 'Gemini unavailable. Using demo typography.',
  };
}
