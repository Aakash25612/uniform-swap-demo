# TradeKit — Uniform & Hat Swap Demo

Frontend-only React demo for swapping a sports player's **uniform and hat** (chest-up) onto a new team kit while keeping the same body composition — built for trade-day creative workflows.

## Stack

- React 19 + Vite
- Pure CSS (no UI kit)
- Vercel-ready (`vercel.json` SPA rewrite)

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy (Vercel)

Connect the repo to Vercel, or:

```bash
npx vercel
```

Framework preset: Vite. Build command `npm run build`, output `dist`.

## Demo notes

- Sample players illustrate kit swaps across MLB-style franchises.
- Upload accepts **PNG / TIFF** (UI-level); swap animation is simulated for the pitch.
- Export downloads a PNG of the after-kit portrait.
- Production would replace the mock portrait with licensed assets + ML segmentation / inpainting.
