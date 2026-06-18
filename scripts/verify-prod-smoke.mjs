/**
 * Production smoke checks for Sprint N portfolio deploy.
 *
 * Usage:
 *   npx playwright install chromium
 *   node scripts/verify-prod-smoke.mjs
 */

import { chromium } from 'playwright';

const BASE_URL = (process.env.BASE_URL ?? 'https://moodboard-ai-omega.vercel.app').replace(/\/$/, '');

const checks = [];

function pass(name, detail) {
  checks.push({ name, ok: true, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail) {
  checks.push({ name, ok: false, detail });
  console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

async function fetchText(path) {
  const response = await fetch(`${BASE_URL}${path}`, { redirect: 'follow' });
  return { status: response.status, text: await response.text(), url: response.url };
}

async function main() {
  console.log(`Production smoke test — ${BASE_URL}\n`);

  const signIn = await fetchText('/sign-in');
  if (signIn.status === 200) {
    pass('Sign-in page loads', `HTTP ${signIn.status}`);
  } else {
    fail('Sign-in page loads', `HTTP ${signIn.status}`);
  }

  const oauthPatterns = [/Continue with Google/i, /Continue with GitHub/i, /signInWithOAuth/i, /OAuthButtons/i];
  const oauthHit = oauthPatterns.find((pattern) => pattern.test(signIn.text));
  if (!oauthHit) {
    pass('OAuth UI removed from sign-in HTML/JS bundles');
  } else {
    fail('OAuth UI removed from sign-in HTML/JS bundles', `Matched ${oauthHit}`);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    if (await page.getByRole('button', { name: /Forgot password/i }).isVisible().catch(() => false)) {
      pass('Forgot password link present');
    } else {
      fail('Forgot password link present');
    }

    if (await page.getByRole('button', { name: /Explore with the demo account/i }).isVisible().catch(() => false)) {
      pass('Demo account shortcut present');
    } else {
      fail('Demo account shortcut present');
    }

    await page.getByRole('button', { name: /Explore with the demo account/i }).click();
    await page.waitForURL(/\/app/, { timeout: 45_000 });
    pass('Demo sign-in succeeds');

    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    if (await page.getByText(/Your name|Workspace name/i).first().isVisible().catch(() => false)) {
      pass('Settings page loads after sign-in');
    } else {
      fail('Settings page loads after sign-in');
    }
  } finally {
    await browser.close();
  }

  const discover = await fetchText('/discover');
  if (discover.status === 200) {
    pass('Discover page loads', `HTTP ${discover.status}`);
  } else {
    fail('Discover page loads', `HTTP ${discover.status}`);
  }

  const discoverApi = await fetch(`${BASE_URL}/api/discover`);
  if (discoverApi.ok) {
    const payload = await discoverApi.json();
    const boards = Array.isArray(payload?.boards) ? payload.boards : Array.isArray(payload) ? payload : [];
    const count = boards.length;
    if (count > 0) {
      pass('Discover API returns public boards', `${count} board(s)`);
    } else {
      fail('Discover API returns public boards', '0 boards — run npm run db:seed-demo-boards against prod Supabase');
    }
  } else {
    fail('Discover API returns public boards', `HTTP ${discoverApi.status}`);
  }

  const callback = await fetch(`${BASE_URL}/auth/callback`, { redirect: 'manual' });
  const location = callback.headers.get('location') ?? '';
  if (callback.status >= 300 && callback.status < 400 && location.includes('/sign-in')) {
    pass('Auth callback route reachable', 'redirects to sign-in when code missing');
  } else {
    fail('Auth callback route reachable', `HTTP ${callback.status}, location=${location || 'none'}`);
  }

  console.log('\nManual Supabase checks (dashboard):');
  console.log('  • Site URL = https://moodboard-ai-omega.vercel.app');
  console.log('  • Redirect URLs include https://moodboard-ai-omega.vercel.app/auth/callback');
  console.log('  • Migration 024 applied if avatar upload fails (avatar-uploads bucket + avatar_image_url column)');

  const failed = checks.filter((check) => !check.ok);
  console.log(`\n${checks.length - failed.length}/${checks.length} automated checks passed.`);

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
