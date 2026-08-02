# TradeKit

Minimal chest-up kit swap: upload a **kit reference** (“look like”) and a **new player** photo. The server calls OpenAI `gpt-image-2` (`quality: low`) and returns the player wearing the reference kit.

## Security

- `OPENAI_API_KEY` lives only in `.env` (local) or Vercel env vars.
- Never use a `VITE_` prefix — that would embed the key in the browser bundle.
- The client never receives or sends the key (not visible in DevTools / inspect).

## Setup

```bash
cp .env.example .env
# put OPENAI_API_KEY in .env
npm install
npm run dev
```

## Deploy

Set `OPENAI_API_KEY` in Vercel → Project → Settings → Environment Variables, then deploy.
