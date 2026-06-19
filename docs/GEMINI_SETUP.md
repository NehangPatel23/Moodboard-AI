# Gemini Free Tier Setup

MoodBoard AI uses **Google Gemini** (`gemini-2.5-flash`) for real board generation. The free tier is enough for a portfolio demo. Without a key, the app uses built-in demo/mock generation.

> **Note:** `gemini-2.0-flash` no longer has free-tier quota (Google returns 429 with `limit: 0`). This project uses a free-tier fallback chain instead.

### Model Fallback Chain

When generating a board, the server tries these models in order:

1. `gemini-2.5-flash` (primary)
2. `gemini-2.5-flash-lite` (fallback if primary is busy or over quota)
3. **Demo generation** (if both fail — board still created, badge shows "Demo generation")

Retryable errors (503 high demand, 429 quota, etc.) automatically try the next model. You won't see raw JSON errors in the UI anymore.

## Step 1 — Get a Free Gemini API Key

1. Go to [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **Create API key**
4. Choose **Create API key in new project** (or an existing Google Cloud project)
5. Copy the key — it looks like `AIza...`

No credit card is required for the free tier.

## Step 2 — Add the Key Locally

1. Open `.env.local` in the project root
2. Add:

```
GEMINI_API_KEY=AIza-your-key-here
```

3. **Remove** `OPENAI_API_KEY` if it is still present (no longer used)

4. Restart the dev server:

```bash
npm run dev
```

## Step 3 — Verify

```bash
npm run verify:generate
```

**Expected:**

```
GEMINI_API_KEY is set. Testing API connectivity...
Gemini API reachable. POST /api/generate/draft will return source: "gemini".
```

## Step 4 — Test in the App

1. Open [http://localhost:3000](http://localhost:3000)
2. Sign in: `admin@moodboard.ai` / `moodboard123`
3. Go to `/app/new`, enter a prompt, click **Generate board**
4. You should see **“Powered by Gemini”** (not “Demo generation”) and a live preview while references load

## Step 5 — Add to Vercel (Production)

1. Vercel → your project → **Settings → Environment Variables**
2. **Delete** `OPENAI_API_KEY` if you added it earlier
3. **Add** `GEMINI_API_KEY` = your `AIza...` key
4. Set **Sensitive: ON**
5. Apply to **Production** and **Preview**
6. **Redeploy** (env vars only apply on new deploys)

## Free Tier Limits

Google’s free tier has daily/minute rate limits. If you hit a quota error:

- Wait and try again later, or
- Remove `GEMINI_API_KEY` to use demo/mock mode (always works, no API calls)

## Troubleshooting

**`GEMINI_API_KEY is not set`** — Add the key to `.env.local` and restart `npm run dev`.

**403 / API key invalid** — Regenerate the key in AI Studio and update `.env.local` + Vercel.

**429 / quota exceeded** — Free tier limit hit; use demo mode or wait for reset.

**Demo generation only on Vercel** — `GEMINI_API_KEY` missing in Vercel env vars, or you need to redeploy.
