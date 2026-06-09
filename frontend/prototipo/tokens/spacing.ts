/**
 * storyForge — Spacing & radius tokens
 */

import type { Variant } from './colors'

export interface SpacingScale {
  r:    string   // base radius
  rLg:  string   // large radius
  rSm:  string   // small radius
}

export const spacing: Record<Variant, SpacingScale> = {
  studio:    { r: '12px', rLg: '16px', rSm: '9px'  },
  neon:      { r: '12px', rLg: '18px', rSm: '10px' },
  editorial: { r: '10px', rLg: '16px', rSm: '8px'  },
}
