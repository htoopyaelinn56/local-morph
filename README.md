# LocalMorph

LocalMorph is an offline-first image converter that runs entirely in the browser. A Rust image pipeline is compiled to WebAssembly for fast, private conversions, while the UI is built with React + Vite.

## Features

- Converts between PNG, JPG/JPEG, GIF, WEBP, BMP, ICO, TIFF, TGA, and Farbfeld (FF)
- All processing stays on-device; no uploads or servers involved
- Pre-rendered pages for common routes like `/png-to-webp` for quick load + SEO
- WASM module bundled in `public/wasm` and lazy-loaded on first use
- Handles edge cases: JPEG alpha gets blended to white; ICO resized to ≤256x256; GIFs downscaled for speed

## Prerequisites

- Node.js 18+ and npm
- Rust toolchain with `wasm-pack` (only needed if rebuilding the WASM module)

## Install and Run

```bash
npm install
npm run dev
```

Open the printed local URL from Vite.

## Build for Production

```bash
npm run build
node scripts/prerender.mjs
```

`npm run build` produces the client bundle in `dist`; `scripts/prerender.mjs` renders SSR HTML for all format routes and writes `sitemap.xml`.

You can also run the helper script:

```bash
bash scripts/build.sh
```

## Rebuilding the WASM Module

The Rust code lives in `native/`. Regenerate the WebAssembly bundle into `public/wasm` with:

```bash
bash scripts/build_wasm.sh
```

This runs `wasm-pack build --target web`, copies the output, and cleans the temp `pkg/` folder. Run this whenever you change Rust code or update dependencies.

## How It Works

- UI: React + TypeScript + Vite (rolldown) with a custom dropdown and drag-and-drop upload (`src/App.tsx`).
- Formats: central list in `src/formats.ts` keeps UI, SSR, and routing in sync.
- SSR/Prerender: `src/entry-ssr.tsx` builds titles/meta and exports routes used by `scripts/prerender.mjs` to emit static HTML under `dist/<route>/index.html`.
- WASM bridge: `public/wasm/native.js` exposes `convert_image` compiled from Rust (`native/src/lib.rs` and `native/src/image_converter.rs`).
- Assets for manual testing live in `native/assets/`.

## Notes and Limits

- ICO outputs are capped to 256×256 for compatibility.
- GIFs larger than 800px are downscaled to speed up encoding; 16-bit inputs are converted to 8-bit for GIF safety.
- JPEG outputs blend transparent pixels onto a white background.
- The WASM module loads after first paint; a short “Initializing…” state is expected on first use.

## Deployment

Serve the `dist` folder with any static host (Firebase Hosting, Netlify, Vercel static). Ensure `public/wasm` is included; it is copied during build.
