import {
  GEMINI_FREE_TIER_MODELS,
  type GenerationSource,
} from '@/lib/ai-generate';
import { createId } from '@/lib/utils';
import type { Board, PaletteItem } from '@/types/board';

export type PaletteSuggestionInput = Pick<
  Board,
  'prompt' | 'mood' | 'summary' | 'tone' | 'palette'
>;

export type PaletteSuggestionResult = {
  palette: PaletteItem[];
  source: GenerationSource;
  notice?: string;
};

type PalettePayload = {
  palette: { label: string; hex: string; usage: string }[];
};

const PALETTE_SYSTEM_PROMPT = `You are a senior color director. Given moodboard context, suggest a cohesive 4-color palette.

Return valid JSON only with this exact shape:
{
  "palette": [
    { "label": "color name", "hex": "#RRGGBB", "usage": "where to use it" }
  ]
}

Rules:
- palette must have exactly 4 colors with valid #RRGGBB hex codes
- keep labels evocative and usage notes actionable
- match the board mood and tone`;

function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced?.[1] ?? trimmed).trim();
}

function normalizeHex(hex: string): string {
  const trimmed = hex.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : '#ebe6df';
}

function buildPalettePrompt(input: PaletteSuggestionInput): string {
  const current = input.palette.length
    ? input.palette.map((item) => `- ${item.label}: ${item.hex} (${item.usage})`).join('\n')
    : 'None yet';

  return [
    `Board prompt: ${input.prompt}`,
    `Mood: ${input.mood}`,
    `Summary: ${input.summary}`,
    `Tone: ${input.tone.join(', ') || 'balanced'}`,
    '',
    'Current palette:',
    current,
    '',
    'Suggest a refined 4-color palette for this moodboard.',
  ].join('\n');
}

function buildMockPalette(input: PaletteSuggestionInput): PaletteItem[] {
  const baseId = createId('palette');
  const mood = input.mood.toLowerCase();

  if (mood.includes('lux') || mood.includes('editorial')) {
    return [
      { id: `${baseId}-0`, label: 'Ivory silk', hex: '#f5f0e8', usage: 'Backgrounds and base surfaces' },
      { id: `${baseId}-1`, label: 'Champagne', hex: '#d4c4a8', usage: 'Highlights and accents' },
      { id: `${baseId}-2`, label: 'Espresso', hex: '#3d2b1f', usage: 'Primary text and anchors' },
      { id: `${baseId}-3`, label: 'Sage mist', hex: '#9aab96', usage: 'Secondary UI and dividers' },
    ];
  }

  if (mood.includes('tech') || mood.includes('modern')) {
    return [
      { id: `${baseId}-0`, label: 'Graphite', hex: '#1a1d23', usage: 'Dark backgrounds' },
      { id: `${baseId}-1`, label: 'Cloud', hex: '#f4f6f8', usage: 'Light surfaces' },
      { id: `${baseId}-2`, label: 'Signal blue', hex: '#3b82f6', usage: 'CTAs and links' },
      { id: `${baseId}-3`, label: 'Slate', hex: '#64748b', usage: 'Secondary text' },
    ];
  }

  return [
    { id: `${baseId}-0`, label: 'Warm sand', hex: '#ebe6df', usage: 'Backgrounds' },
    { id: `${baseId}-1`, label: 'Clay', hex: '#cfc6ba', usage: 'Cards and panels' },
    { id: `${baseId}-2`, label: 'Umber', hex: '#8f8578', usage: 'Typography' },
    { id: `${baseId}-3`, label: 'Terracotta', hex: '#c17f59', usage: 'Accent moments' },
  ];
}

async function callGeminiPalette(
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
        parts: [{ text: PALETTE_SYSTEM_PROMPT }],
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

function payloadToPalette(payload: PalettePayload): PaletteItem[] {
  return payload.palette.slice(0, 6).map((item) => ({
    id: createId('palette'),
    label: item.label.trim(),
    hex: normalizeHex(item.hex),
    usage: item.usage.trim(),
  }));
}

export async function generatePaletteSuggestions(
  input: PaletteSuggestionInput,
): Promise<PaletteSuggestionResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const prompt = buildPalettePrompt(input);

  if (!apiKey) {
    return {
      palette: buildMockPalette(input),
      source: 'mock',
      notice: 'Add GEMINI_API_KEY for AI palette suggestions.',
    };
  }

  let lastError: Error | null = null;

  for (const model of GEMINI_FREE_TIER_MODELS) {
    try {
      const content = await callGeminiPalette(prompt, apiKey, model);
      const parsed = JSON.parse(extractJsonText(content)) as PalettePayload;

      if (!parsed.palette?.length) {
        throw new Error('Incomplete palette response');
      }

      return {
        palette: payloadToPalette(parsed),
        source: 'gemini',
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Palette generation failed');
    }
  }

  return {
    palette: buildMockPalette(input),
    source: 'mock',
    notice: lastError?.message ?? 'Gemini unavailable. Using demo palette.',
  };
}
