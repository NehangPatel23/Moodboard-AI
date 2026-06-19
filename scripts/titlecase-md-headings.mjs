/**
 * Title-case markdown heading lines (capitalize first letter of each word).
 * Usage: node scripts/titlecase-md-headings.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');

const files = [
  'README.md',
  'AGENTS.md',
  'CLAUDE.md',
  'docs/AGENT_HANDOFF.md',
  'docs/ARCHITECTURE.md',
  'docs/DEPLOY.md',
  'docs/DEVELOPMENT.md',
  'docs/FEATURES.md',
  'docs/GEMINI_SETUP.md',
  'docs/MANUAL_SETUP.md',
  'docs/PEXELS_SETUP.md',
  'docs/REFERENCE_PHOTOS.md',
  'docs/ROADMAP.md',
  'docs/SUPABASE_SETUP.md',
  'docs/SYSTEMS.md',
];

const KEEP_UPPER = new Set([
  'FAQ', 'API', 'APIs', 'UI', 'CI', 'SQL', 'CLI', 'OG', 'CTA', 'CTAs', 'JSON', 'PNG', 'PDF',
  'RLS', 'OAuth', 'NDJSON', 'UX', 'AI', 'PKCE', 'SEO', 'URL', 'URLs',
]);

const BRAND = {
  'next.js': 'Next.js',
  typescript: 'TypeScript',
  moodboard: 'MoodBoard',
  github: 'GitHub',
  supabase: 'Supabase',
  vercel: 'Vercel',
  gemini: 'Gemini',
  pexels: 'Pexels',
  unsplash: 'Unsplash',
  postgres: 'Postgres',
  resend: 'Resend',
  playwright: 'Playwright',
  javascript: 'JavaScript',
};

function titleWord(word) {
  if (!word) return word;
  if (/^[\d~.+–—-]+$/.test(word)) return word;
  if (KEEP_UPPER.has(word.toUpperCase())) return word.toUpperCase();
  if (/^[A-Z0-9]{2,}$/.test(word)) return word;

  const brand = BRAND[word.toLowerCase()];
  if (brand) return brand;

  if (/^[A-Z][a-z]+[A-Z]/.test(word)) return word;
  if (word.includes('.') && /^[A-Z]/.test(word)) return word;

  return word.charAt(0).toUpperCase() + word.slice(1);
}

function titleSegment(segment) {
  if (/^\s+$/.test(segment) || segment === '—' || segment === '&' || segment === '/') {
    return segment;
  }

  if (segment.startsWith('(') && segment.endsWith(')')) {
    const inner = segment.slice(1, -1);
    return `(${inner.split(/\s+/).map(titleWord).join(' ')})`;
  }

  return titleWord(segment);
}

function titleCaseHeading(text) {
  if (text.includes('<img')) return text;

  const parts = text.split(/(\s+|—|&|\/)/);
  return parts.map(titleSegment).join('');
}

for (const file of files) {
  const full = join(ROOT, file);
  if (!existsSync(full)) continue;

  const lines = readFileSync(full, 'utf8').split('\n');
  let changed = 0;

  const out = lines.map((line) => {
    const match = line.match(/^(#{1,6}\s+)(.+)$/);
    if (!match) return line;

    const next = match[1] + titleCaseHeading(match[2]);
    if (next !== line) changed += 1;
    return next;
  });

  writeFileSync(full, out.join('\n'));
  console.log(`${file}: ${changed} headings updated`);
}
