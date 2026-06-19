/**
 * Capture README portfolio screenshots from the live demo (or local dev).
 *
 * Usage:
 *   npx playwright install chromium
 *   node scripts/capture-portfolio-screenshots.mjs
 *   BASE_URL=http://localhost:3000 node scripts/capture-portfolio-screenshots.mjs
 */

import { execSync } from 'node:child_process';
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE_URL = (process.env.BASE_URL ?? 'https://moodboard-ai-omega.vercel.app').replace(/\/$/, '');
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'screenshots');
const VIEWPORT = { width: 1440, height: 900 };
const DEMO_EMAIL = 'admin@moodboard.ai';
const DEMO_PASSWORD = 'moodboard123';
const DEMO_BOARD_ID = 'demo-luxury-wellness';

async function waitForAppReady(page) {
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(800);
}

async function signInWithDemo(page) {
  await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'domcontentloaded' });
  await waitForAppReady(page);

  const demoButton = page.getByRole('button', { name: /Explore with the demo account/i });
  const emailField = page.getByRole('textbox', { name: /^Email$/i });

  await Promise.race([
    demoButton.waitFor({ state: 'visible', timeout: 45_000 }),
    emailField.waitFor({ state: 'visible', timeout: 45_000 }),
  ]);

  if (await demoButton.isVisible().catch(() => false)) {
    await demoButton.click();
  } else {
    await emailField.fill(DEMO_EMAIL);
    await page.getByLabel(/^Password$/i).fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: /^Sign in$/i }).click();
  }

  await page.waitForURL(/\/app/, { timeout: 45_000 });
  await waitForAppReady(page);
}

async function capture(page, filename) {
  const path = join(OUT_DIR, filename);
  await page.screenshot({ path, fullPage: false });
  console.log(`  ✓ ${filename}`);
}

async function bumpReadmeScreenshotCache() {
  const readmePath = join(dirname(fileURLToPath(import.meta.url)), '..', 'README.md');
  let cacheBust;
  try {
    cacheBust = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    cacheBust = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  }

  const readme = await readFile(readmePath, 'utf8');
  const updated = readme.replace(
    /(docs\/screenshots\/[a-z0-9-]+\.png)\?v=[^)]+/g,
    `$1?v=${cacheBust}`,
  );

  if (updated !== readme) {
    await writeFile(readmePath, updated);
    console.log(`  ✓ README gallery cache bust → ?v=${cacheBust}`);
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Capturing portfolio screenshots from ${BASE_URL}\n`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: VIEWPORT });

  try {
    console.log('Public pages');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    await capture(page, 'landing.png');

    await page.goto(`${BASE_URL}/discover`, { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    await capture(page, 'discover.png');

    await page.goto(`${BASE_URL}/sign-in`, { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    await capture(page, 'sign-in.png');

    await page.goto(`${BASE_URL}/about`, { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    const stackHeading = page.locator('#stack-heading');
    await stackHeading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await capture(page, 'about-stack.png');

    console.log('\nAuthenticated pages');
    await signInWithDemo(page);

    await page.goto(`${BASE_URL}/app`, { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    await page.getByRole('heading', { name: /curated spaces|welcome/i }).first().waitFor({ timeout: 15_000 }).catch(() => {});
    await capture(page, 'dashboard.png');

    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    const editorSection = page.locator('#editor');
    if (await editorSection.isVisible().catch(() => false)) {
      await editorSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
    } else {
      await page.getByRole('link', { name: /^Editor$/i }).click().catch(() => {});
      await editorSection.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(400);
    }
    await capture(page, 'settings.png');

    let editorUrl = `${BASE_URL}/app/boards/${DEMO_BOARD_ID}`;
    await page.goto(editorUrl, { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);

    if (page.url().includes('/sign-in') || (await page.getByText(/not found|couldn't find/i).isVisible().catch(() => false))) {
      await signInWithDemo(page);
      await page.goto(`${BASE_URL}/app`, { waitUntil: 'domcontentloaded' });
      await waitForAppReady(page);
      const boardLink = page.locator('a[href*="/app/boards/"]').first();
      const href = await boardLink.getAttribute('href', { timeout: 10_000 }).catch(() => null);
      if (href) {
        editorUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        await page.goto(editorUrl, { waitUntil: 'domcontentloaded' });
        await waitForAppReady(page);
      }
    }

    await page.getByRole('button', { name: /overview|palette|typography/i }).first().waitFor({ timeout: 15_000 }).catch(() => {});
    await capture(page, 'board-editor.png');

    const commentsButton = page.getByRole('button', { name: /^Comments$/i });
    if (await commentsButton.isVisible().catch(() => false)) {
      await commentsButton.click();
      await page
        .getByPlaceholder(/Leave feedback for the team/i)
        .or(page.getByRole('heading', { name: /Comments/i }))
        .first()
        .waitFor({ timeout: 10_000 })
        .catch(() => {});
      await page.waitForTimeout(500);
      await capture(page, 'collaboration.png');
    } else {
      console.log('  ⚠ collaboration.png skipped — Comments button not visible');
    }

    const boardId = editorUrl.split('/boards/')[1]?.split(/[?#]/)[0] ?? DEMO_BOARD_ID;
    await page.goto(`${BASE_URL}/share/${boardId}`, { waitUntil: 'domcontentloaded' });
    await waitForAppReady(page);
    await capture(page, 'share.png');

    await bumpReadmeScreenshotCache();

    console.log(`\nDone — screenshots saved to docs/screenshots/`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
