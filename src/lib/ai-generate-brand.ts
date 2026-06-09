import {
  GEMINI_FREE_TIER_MODELS,
  type GenerationSource,
} from '@/lib/ai-generate';
import type { Board } from '@/types/board';

export type BrandSuggestionInput = Pick<
  Board,
  'title' | 'prompt' | 'mood' | 'summary' | 'tone' | 'tags' | 'palette'
>;

export type BrandSuggestionResult = {
  positioning: string;
  voice: string;
  messaging: string[];
  source: GenerationSource;
  notice?: string;
};

type BrandPayload = {
  positioning: string;
  voice: string;
  messaging: string[];
};

const BRAND_SYSTEM_PROMPT = `You are a senior brand strategist. Given moodboard context, suggest concise brand strategy guidance.

Return valid JSON only with this exact shape:
{
  "positioning": "One paragraph brand positioning statement",
  "voice": "One paragraph brand voice description",
  "messaging": ["Short message pillar 1", "Short message pillar 2", "Short message pillar 3"]
}

Rules:
- messaging must include 3 to 5 items
- keep copy actionable for designers and marketers
- match the board mood, tone, and palette`;

function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced?.[1] ?? trimmed).trim();
}

function buildBrandPrompt(input: BrandSuggestionInput): string {
  const palette = input.palette.length
    ? input.palette.map((color) => `- ${color.label}: ${color.hex}`).join('\n')
    : 'None yet';

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
    'Suggest brand positioning, voice, and messaging pillars for this moodboard.',
  ].join('\n');
}

function buildMockBrand(input: BrandSuggestionInput): BrandPayload {
  const mood = input.mood.trim() || 'balanced';
  const title = input.title.trim() || 'this brand';

  return {
    positioning: `${title} occupies a ${mood.toLowerCase()} space — ${input.summary || 'a clear, differentiated creative direction'} — built for audiences who value intentional design and memorable experiences.`,
    voice: `Speak with ${input.tone.slice(0, 2).join(' and ') || 'clarity and warmth'}. Keep language confident but approachable, with short sentences and vivid sensory details that mirror the board's palette and mood.`,
    messaging: [
      `Lead with ${mood.toLowerCase()} creative direction`,
      'Make every touchpoint feel cohesive and considered',
      'Turn abstract mood into tangible design decisions',
    ],
  };
}

async function callGeminiBrand(
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
        parts: [{ text: BRAND_SYSTEM_PROMPT }],
      },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
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

function normalizePayload(payload: BrandPayload): BrandPayload {
  return {
    positioning: payload.positioning.trim(),
    voice: payload.voice.trim(),
    messaging: payload.messaging.map((item) => item.trim()).filter(Boolean).slice(0, 5),
  };
}

export async function generateBrandSuggestions(
  input: BrandSuggestionInput,
): Promise<BrandSuggestionResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const prompt = buildBrandPrompt(input);

  if (!apiKey) {
    const mock = buildMockBrand(input);
    return {
      ...mock,
      source: 'mock',
      notice: 'Add GEMINI_API_KEY for AI brand strategy suggestions.',
    };
  }

  let lastError: Error | null = null;

  for (const model of GEMINI_FREE_TIER_MODELS) {
    try {
      const content = await callGeminiBrand(prompt, apiKey, model);
      const parsed = JSON.parse(extractJsonText(content)) as BrandPayload;

      if (!parsed.positioning?.trim() || !parsed.voice?.trim() || !parsed.messaging?.length) {
        throw new Error('Incomplete brand response');
      }

      const normalized = normalizePayload(parsed);
      return {
        ...normalized,
        source: 'gemini',
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Brand generation failed');
    }
  }

  const mock = buildMockBrand(input);
  return {
    ...mock,
    source: 'mock',
    notice: lastError?.message ?? 'Gemini unavailable. Using demo brand strategy.',
  };
}
