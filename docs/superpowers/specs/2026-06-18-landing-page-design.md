# Landing Page — StoryForge

**Date:** 2026-06-18
**Status:** Approved

## Overview

Commercial landing page for StoryForge, serving as the public entry point of the product. Replaces the current `/` redirect with a full marketing page. Structure follows the Canva-style storytelling-linear pattern: hero → problem → how it works → features deep-dive → CTA. Targets potential customers who discover the product for the first time.

## Technical Scope

- **Route:** `/` (replaces current `<Navigate to="/home" | "/login">` redirect)
- **Component:** `frontend/src/features/home/routes/LandingPage.tsx`
- **Auth:** No guard — publicly accessible
- **Theming:** Uses existing CSS tokens (`var(--bg)`, `var(--acc)`, etc.) from `src/index.css`. Dark/light toggle via `useTheme()` from `@/app/providers/ThemeProvider` — works automatically.
- **Navigation:** Existing authenticated routes (`/home`, `/login`, `/register`, `/app`, `/projects`) remain unchanged. Router change: `/` renders `<LandingPage />` instead of `<Navigate>`.
- **Tailwind:** Uses mapped tokens already in `tailwind.config.js` (`bg-bg`, `text-fg`, `text-acc`, `bg-card`, `border-bd`, etc.)

## Sections (top to bottom)

### 1. Navbar

- **Left:** Logo `StoryForge` — `font-head`, "Forge" or full name with accent dot in `var(--acc)`
- **Center:** Nav links — `Features` · `How it works` · `Pricing` (smooth-scroll anchors)
- **Right:** Theme toggle (uses existing `useTheme()`) + `Get started` button → `/register`
- **Style:** `background: var(--bg)`, `border-bottom: 1px solid var(--bd)`, sticky on scroll with backdrop blur

### 2. Hero

- **Headline:** `"Turn any story into a viral Short."` — `font-head`, large (text-5xl/6xl), `color: var(--fg)`
- **Subheadline:** `"StoryForge uses AI to transform your webtoon, manhwa, or web novel into a narrated YouTube Short — in minutes."` — `color: var(--mut)`
- **CTA primary:** `"Start for free"` → `/register` — `background: var(--acc)`, `color: var(--on-acc)`, rounded-lg
- **CTA secondary:** `"See how it works ↓"` → `#how-it-works` anchor — ghost style, `border: var(--bd2)`, `color: var(--fg)`
- **Visual:** CSS phone mockup (vertical 9:16 ratio) with a fake "Short" card inside — gradient fill using `var(--acc-soft)` to `var(--card)`, decorative scene strips
- **Background:** Radial gradient centered from `var(--acc-soft)` fading to `var(--bg)`. Subtle grid or noise texture overlay at low opacity.

### 3. Social Proof Bar

- Label: `"Powered by"` — `color: var(--mut2)`, `font-mono`, small caps
- Logos as styled text pills: `Azure OpenAI` · `ElevenLabs` · `Azure Foundry` · `FFmpeg`
- `background: var(--card)`, `border-top/bottom: var(--bd)`

### 4. Problem Section

- **Headline:** `"Great stories deserve great reach."` — `font-head`, centered
- **Body:** `"Millions of readers love manga, manhwa, and web novels — but creators are stuck publishing text while video dominates feeds. StoryForge closes the gap."`
- **Style:** Max-width centered column, `color: var(--mut)` for body text

### 5. How It Works

- **Anchor:** `id="how-it-works"`
- **Section headline:** `"From text to Short in 4 steps"`
- **Steps (horizontal on desktop, vertical on mobile):**

  | # | Title | Description |
  |---|-------|-------------|
  | 1 | Paste your story | Drop any excerpt from your webtoon or novel |
  | 2 | AI writes the script | GPT-4.1 turns your text into punchy short-form narration |
  | 3 | Pick style & voice | Choose a visual style and an ElevenLabs narrator |
  | 4 | Download your Short | A vertical video, ready to upload |

- Step number: `color: var(--acc)`, `font-head`, large. Connector line between steps: `var(--bd2)`. Icon per step.
- Cards: `background: var(--card)`, `border: var(--bd)`

### 6. Features Deep-Dive

- **Anchor:** `id="features"`
- **Section headline:** `"Everything you need to go from page to feed"`
- **4 alternating text/visual blocks (left-right, right-left pattern):**

  | Feature | Headline | Description |
  |---------|----------|-------------|
  | Script AI | "Your story, rewritten for video" | Azure GPT-4.1 adapts long-form text into tight, engaging narration optimized for short-form video. |
  | Image generation | "Scenes that match your story" | Azure Foundry generates scene images from your content, bringing panels to life without manual work. |
  | Voice synthesis | "Professional narration, no microphone" | ElevenLabs voices deliver natural, expressive narration in multiple styles and languages. |
  | Video assembly | "From script to Short, automatically" | FFmpeg stitches images, narration, and captions into a vertical video ready to upload — no editing software needed. |

- Odd blocks: text left, visual right. Even blocks: visual left, text right.
- Visuals: abstract CSS/SVG decorative illustrations (waveform, image grid, video strip) — no external images required.
- Background alternates: `var(--bg)` / `var(--card)` per block.

### 7. Feature Grid

- **3 cards in a row (stacks on mobile):**

  | Icon | Title | Description |
  |------|-------|-------------|
  | Lucide `Palette` | Multiple styles | Anime, manhwa, cinematic, sketch — pick the look that fits your story |
  | Lucide `Globe` | Multiple languages | Narration in English, Spanish, and more |
  | Lucide `Zap` | Instant export | MP4 ready for YouTube Shorts, TikTok, and Reels |

- Cards: `background: var(--card)`, `border: var(--bd)`, `border-radius: var(--r-lg)`, icon in `var(--acc)`

### 8. CTA Banner

- **Background:** `var(--acc-soft)`, `border: 1px solid var(--acc-bd)`, `border-radius: var(--r-lg)`
- **Headline:** `"Start converting your stories today."`
- **Sub:** `"Join creators who are turning pages into plays."`
- **Button:** `"Create your first Short →"` → `/register` — `background: var(--acc)`, `color: var(--on-acc)`

### 9. Footer

- **Left:** Logo `StoryForge` + tagline `"AI-powered story videos"`
- **Center:** Links — Features · How it works · Login · Register
- **Right:** `© 2026 StoryForge`
- **Style:** `background: var(--card)`, `border-top: var(--bd)`, `color: var(--mut2)`

## Responsive Behavior

- **Desktop (≥1024px):** Full multi-column layouts (hero split, 4-step horizontal, alternating blocks, 3-card grid)
- **Mobile (<768px):** All sections stack vertically. Navbar collapses (hamburger or simplified). Steps become vertical list. Feature blocks stack text over visual.

## Router Change

`router.tsx` — replace the `/` route:

```tsx
// Before
<Route path="/" element={<Navigate to={...} replace />} />

// After
<Route path="/" element={<LandingPage />} />
```

The `/login` redirect for authenticated users checking `/` is removed. Authenticated users see the landing page normally — the navbar detects auth state via `useAuth()` and swaps the `Get started` button for `Go to app` (→ `/home`).

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/features/home/routes/LandingPage.tsx` | New — full landing page component |
| `frontend/src/features/home/index.ts` | Export `LandingPage` |
| `frontend/src/app/routes/router.tsx` | `/` renders `<LandingPage />` instead of `<Navigate>` |
