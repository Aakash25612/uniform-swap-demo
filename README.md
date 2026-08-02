# TradeKit — Uniform & Hat Swap Demo

Photo-real **chest-up** baseball kit swaps for trade-day creatives. Uses your real media-day style headshots plus optional **OpenAI GPT Image** edits (cap + jersey only, face/body locked).

## Modes

1. **AI swap (recommended)** — paste an OpenAI API key in the studio. Calls `/api/kit-swap` → `images/edits` (`gpt-image-1.5` with fallbacks).
2. **Local remap** — no key; basic canvas color remap (not photo-real).

The key stays in `sessionStorage` only. Prefer setting `OPENAI_API_KEY` on Vercel for production so the browser never holds the key.

## Stack

- React 19 + Vite
- `/api/kit-swap` Vercel function (+ Vite middleware for local)
- Sample assets in `public/samples/`

## Run locally

```bash
npm install
npm run dev
```

Open the app → paste OpenAI key in **Swap studio** → pick a sample → choose destination team → **Generate AI kit swap**.

## Deploy (Vercel)

```bash
npx vercel
```

Optional env: `OPENAI_API_KEY` (then the UI key field can be left empty).

## Notes

- GPT Image models may require org verification in the OpenAI dashboard.
- Results are generative — always review before publishing.
- For production, move the key server-side only and add rate limits.
