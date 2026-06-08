# Pexels Reference Images

MoodBoard AI uses the [Pexels API](https://www.pexels.com/api/) to fetch **search-relevant stock photos** for each reference card (e.g. “Sculptural Bedside Lamp” returns lamp imagery, not random stock).

Without a key, references fall back to palette-based SVG placeholders.

## Step 1 — Get a free API key

1. Go to [https://www.pexels.com/api/](https://www.pexels.com/api/)
2. Create a free account and request an API key
3. Copy the key

Free tier: **200 requests/hour**, **20,000/month** — enough for a portfolio demo.

## Step 2 — Add locally

In `.env.local`:

```
PEXELS_API_KEY=your-pexels-api-key
```

Restart the dev server after adding the key.

## Step 3 — Add on Vercel (production)

Vercel → **Settings** → **Environment Variables**:

| Variable | Value |
|----------|-------|
| `PEXELS_API_KEY` | Your Pexels API key |

Apply to **Production** and **Preview**, then redeploy.

## How it works

- **New boards** — after `POST /api/generate/draft` returns creative direction, `POST /api/generate/enrich` streams Pexels lookups one reference at a time (NDJSON). The UI shows progress (“Finding reference 3 of 6…”).
- **Existing boards** — on load, boards with old Unsplash/SVG images are enriched via `/api/reference-images/enrich` and saved back
- **Fallback** — if Pexels is unavailable or the key is missing, palette SVG placeholders are used instead; enrich still completes with generated placeholders

## Attribution

Pexels photos are free to use. For production apps, consider linking to the photographer on Pexels per their [license](https://www.pexels.com/license/).
