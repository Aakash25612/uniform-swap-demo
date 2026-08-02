# TradeKit — Uniform & Hat Swap Demo

Working **client-side** React demo that remaps a player's jersey and hat colors to another team kit (chest-up), while protecting skin/face. No backend required.

## What actually runs in the browser

1. Load a sample portrait or upload **PNG / TIFF**
2. Rasterize / decode the image on a canvas
3. Detect or match current kit colors
4. Remap jersey + hat pixels toward the destination team palette
5. Compare before/after and export PNG

TIFF decode uses `utif2` entirely in-browser.

## Stack

- React 19 + Vite
- Canvas color remapping (`src/lib/kitSwap.js`)
- Vercel-ready (`vercel.json`)

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

Import the GitHub repo (Vite preset, output `dist`) or:

```bash
npx vercel
```

## Limits (honest demo)

- Color remapping, not generative AI — best on clear chest-up kits with distinct team colors
- Uploaded photos use auto color detection + spatial masks; results vary by photo
- Production path: licensed kits + ML segmentation / inpainting for photo-real trades
