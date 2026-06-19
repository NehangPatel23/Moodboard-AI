# Reference Photos (Pexels + Unsplash)

MoodBoard AI resolves reference card images in this order:

```text
Pexels → Unsplash → demo SVG placeholder
```

Manual import is also supported: **Apply URL** (any `https://` image) or **Upload file** (stored in Supabase `reference-uploads`).

Back to [README](../README.md) · Pexels: [PEXELS_SETUP](PEXELS_SETUP.md) · Checklist: [MANUAL_SETUP](MANUAL_SETUP.md)

## API Keys

### Pexels (Primary)

1. Get a free key at [https://www.pexels.com/api/](https://www.pexels.com/api/)
2. Add to `.env.local` and Vercel:

```
PEXELS_API_KEY=your-pexels-api-key
```

Free tier: **200 requests/hour**, **20,000/month**.

### Unsplash (Fallback)

1. Create a developer app at [https://unsplash.com/developers](https://unsplash.com/developers)
2. Add the **Access Key** to `.env.local` and Vercel:

```
UNSPLASH_ACCESS_KEY=your-unsplash-access-key
```

Unsplash is tried when Pexels has no match or no key is configured.

See also: [`docs/PEXELS_SETUP.md`](PEXELS_SETUP.md) for Pexels-specific notes.

## How It Works

- **New boards** — after draft generation, `POST /api/generate/enrich` streams photo lookups one reference at a time.
- **Reference editor** — **Find photo** calls `POST /api/reference-images/search` (Pexels → Unsplash → placeholder). **Refresh photo** rotates results via seed.
- **Manual URL** — paste an `https://` URL and click **Apply URL** (source: Custom).
- **Upload** — **Upload file** calls `POST /api/reference-images/upload` (requires migration `014_reference_uploads_storage.sql` and `SUPABASE_SERVICE_ROLE_KEY`).
- **Fallback** — palette-based SVG placeholders when no stock photo matches.

## Production Setup

| Variable | Purpose |
|----------|---------|
| `PEXELS_API_KEY` | Primary stock photo search |
| `UNSPLASH_ACCESS_KEY` | Fallback stock photo search |
| `SUPABASE_SERVICE_ROLE_KEY` | Reference image uploads |

Run migration [`supabase/migrations/014_reference_uploads_storage.sql`](../supabase/migrations/014_reference_uploads_storage.sql) in Supabase SQL Editor for uploads.

## Attribution

Pexels and Unsplash photos are free to use under their respective licenses. Link to photographers where appropriate in production apps.
