/**
 * Verifies AI generation configuration.
 *
 * Usage:
 *   node --env-file=.env.local scripts/verify-generate.mjs
 */

const apiKey = process.env.GEMINI_API_KEY?.trim();
const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

if (!apiKey) {
  console.log('GEMINI_API_KEY is not set.');
  console.log('Board generation will use the demo/mock fallback via POST /api/generate/draft.');
  console.log('');
  console.log('To enable Gemini: add GEMINI_API_KEY to .env.local and restart npm run dev.');
  console.log('Get a free key: https://aistudio.google.com/apikey');
  process.exit(0);
}

console.log('GEMINI_API_KEY is set. Testing free-tier model chain...');

let workingModel = null;

for (const model of models) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Reply with the word OK only.' }] }],
      generationConfig: { maxOutputTokens: 10 },
    }),
  });

  if (response.ok) {
    workingModel = model;
    console.log(`✓ ${model} reachable`);
    break;
  }

  const body = await response.text();
  console.log(`✗ ${model} failed (${response.status}): ${body.slice(0, 120).replace(/\s+/g, ' ')}`);
}

if (!workingModel) {
  console.error('');
  console.error('No Gemini free-tier models are reachable right now.');
  console.error('POST /api/generate/draft will fall back to demo generation until one recovers.');
  process.exit(1);
}

console.log('');
console.log(`Gemini API reachable (${workingModel}). POST /api/generate/draft will return source: "gemini".`);
console.log('Fallback chain: gemini-2.5-flash → gemini-2.5-flash-lite → demo generation');
