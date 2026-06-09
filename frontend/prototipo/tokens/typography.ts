/**
 * storyForge — Typography tokens
 */

import type { Variant } from './colors'

export interface TypographyScale {
  fontBody: string
  fontHead: string
  fontMono: string
  headWeight: number
  headTracking: string
  googleFonts: string
}

export const typography: Record<Variant, TypographyScale> = {
  studio: {
    fontBody:     '"Plus Jakarta Sans", system-ui, sans-serif',
    fontHead:     '"Plus Jakarta Sans", system-ui, sans-serif',
    fontMono:     '"JetBrains Mono", monospace',
    headWeight:   800,
    headTracking: '-0.035em',
    googleFonts:  'Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500',
  },
  neon: {
    fontBody:     '"Space Grotesk", system-ui, sans-serif',
    fontHead:     '"Space Grotesk", system-ui, sans-serif',
    fontMono:     '"JetBrains Mono", monospace',
    headWeight:   700,
    headTracking: '-0.04em',
    googleFonts:  'Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500',
  },
  editorial: {
    fontBody:     '"Plus Jakarta Sans", system-ui, sans-serif',
    fontHead:     '"Bricolage Grotesque", system-ui, sans-serif',
    fontMono:     '"JetBrains Mono", monospace',
    headWeight:   800,
    headTracking: '-0.04em',
    googleFonts:  'Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Bricolage+Grotesque:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500',
  },
}
