# @ekko/promo

Remotion-based promo video (9:16) for EKKO Connect.

## Dev

```sh
cd apps/promo

# install (use whichever works on your machine)
corepack pnpm install     # preferred — matches workspace pnpm
npm install               # fallback

# live preview in browser
npx remotion studio
```

## Render

```sh
npx remotion render EkkoPromo out/ekko-promo.mp4
```

Add `--concurrency=4` (or higher) to render faster on multi-core machines.

## Structure

- 1080 × 1920, 30fps, 22s (660 frames)
- Scenes wired in `src/Promo.tsx` via `<Sequence>` at fixed frame offsets in `src/theme.ts`
- Brand assets live in `public/` (fonts/, logo/)

## Scenes

1. **Home screen** (0–2s) — iOS-style grid + dock; EKKO icon zooms open
2. **Logo intro** (2–5s) — glyph spring-in + wordmark
3. **Discover** (5–8s) — card stack with Maya's profile on top
4. **Full profile** (8–12s) — expands + scrolls through bio, tags, work grid
5. **Swipe + match** (12–15s) — card swipes right → "it's a match"
6. **Chat collab** (15–19s) — four messages + typing indicator
7. **Outro** (19–22s) — logo + tagline + URL
