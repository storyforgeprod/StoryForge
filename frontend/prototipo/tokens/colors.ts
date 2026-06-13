/**
 * storyForge — Color tokens
 * Each variant has its own palette. Use `variant` prop to select.
 */

export type Variant = 'studio' | 'neon' | 'editorial'
export type Theme   = 'dark' | 'light'

export interface ColorScale {
  bg: string
  card: string
  elev: string
  elev2: string
  bd: string
  bd2: string
  fg: string
  mut: string
  mut2: string
  acc: string
  acc2: string
  onAcc: string
  accSoft: string
  accBd: string
  phA: string
  phB: string
  phTx: string
}

export const colors: Record<Variant, Record<Theme, ColorScale>> = {
  studio: {
    dark: {
      bg:      '#09090b',
      card:    '#121214',
      elev:    '#18181b',
      elev2:   '#1f1f23',
      bd:      '#26262b',
      bd2:     '#34343b',
      fg:      '#fafafa',
      mut:     '#a1a1aa',
      mut2:    '#71717a',
      acc:     'oklch(0.66 0.21 295)',
      acc2:    'oklch(0.7 0.18 330)',
      onAcc:   '#ffffff',
      accSoft: 'oklch(0.66 0.21 295 / 0.14)',
      accBd:   'oklch(0.66 0.21 295 / 0.32)',
      phA:     '#2a2a30',
      phB:     '#161619',
      phTx:    '#6b6b76',
    },
    light: {
      bg:      '#fafafa',
      card:    '#ffffff',
      elev:    '#f4f4f5',
      elev2:   '#e8e8eb',
      bd:      '#e4e4e7',
      bd2:     '#d4d4d8',
      fg:      '#18181b',
      mut:     '#52525b',
      mut2:    '#8e8e97',
      acc:     'oklch(0.55 0.22 295)',
      acc2:    'oklch(0.58 0.19 330)',
      onAcc:   '#ffffff',
      accSoft: 'oklch(0.55 0.22 295 / 0.10)',
      accBd:   'oklch(0.55 0.22 295 / 0.30)',
      phA:     '#d9d9df',
      phB:     '#efeff2',
      phTx:    '#9b9ba6',
    },
  },

  neon: {
    dark: {
      bg:      '#0a0b0a',
      card:    '#101109',
      elev:    '#14160d',
      elev2:   '#1a1d11',
      bd:      '#1f231a',
      bd2:     '#2c3122',
      fg:      '#f2f5ee',
      mut:     '#9aa394',
      mut2:    '#6b7264',
      acc:     'oklch(0.86 0.22 135)',
      acc2:    'oklch(0.85 0.2 155)',
      onAcc:   '#0a0b0a',
      accSoft: 'oklch(0.86 0.22 135 / 0.12)',
      accBd:   'oklch(0.86 0.22 135 / 0.34)',
      phA:     '#23271c',
      phB:     '#111307',
      phTx:    '#5d6650',
    },
    light: {
      bg:      '#f7f9f4',
      card:    '#ffffff',
      elev:    '#eef2e9',
      elev2:   '#e3e9da',
      bd:      '#e0e6d8',
      bd2:     '#cdd6c1',
      fg:      '#14170e',
      mut:     '#59614f',
      mut2:    '#8a917e',
      acc:     'oklch(0.58 0.16 150)',
      acc2:    'oklch(0.6 0.15 162)',
      onAcc:   '#ffffff',
      accSoft: 'oklch(0.58 0.16 150 / 0.12)',
      accBd:   'oklch(0.58 0.16 150 / 0.30)',
      phA:     '#d6ddca',
      phB:     '#eef2e6',
      phTx:    '#909a7e',
    },
  },

  editorial: {
    dark: {
      bg:      '#0c0a09',
      card:    '#16110c',
      elev:    '#1a1714',
      elev2:   '#221d18',
      bd:      '#2a241f',
      bd2:     '#382f27',
      fg:      '#faf7f2',
      mut:     '#b8aea2',
      mut2:    '#847a6e',
      acc:     'oklch(0.72 0.18 38)',
      acc2:    'oklch(0.74 0.16 55)',
      onAcc:   '#1a0f06',
      accSoft: 'oklch(0.72 0.18 38 / 0.14)',
      accBd:   'oklch(0.72 0.18 38 / 0.34)',
      phA:     '#322a22',
      phB:     '#15100b',
      phTx:    '#7a6e60',
    },
    light: {
      bg:      '#faf6f0',
      card:    '#ffffff',
      elev:    '#f4ede3',
      elev2:   '#ece0d2',
      bd:      '#e9ddcd',
      bd2:     '#d9c9b4',
      fg:      '#1c140d',
      mut:     '#6b5d4d',
      mut2:    '#9c8c77',
      acc:     'oklch(0.58 0.19 38)',
      acc2:    'oklch(0.6 0.17 55)',
      onAcc:   '#ffffff',
      accSoft: 'oklch(0.58 0.19 38 / 0.12)',
      accBd:   'oklch(0.58 0.19 38 / 0.30)',
      phA:     '#e3d6c4',
      phB:     '#f3ebdf',
      phTx:    '#a8967e',
    },
  },
}

/** Returns CSS custom property overrides for a given variant + theme */
export function getCSSVars(variant: Variant, theme: Theme): Record<string, string> {
  const c = colors[variant][theme]
  return {
    '--bg':       c.bg,
    '--card':     c.card,
    '--elev':     c.elev,
    '--elev2':    c.elev2,
    '--bd':       c.bd,
    '--bd2':      c.bd2,
    '--fg':       c.fg,
    '--mut':      c.mut,
    '--mut2':     c.mut2,
    '--acc':      c.acc,
    '--acc2':     c.acc2,
    '--on-acc':   c.onAcc,
    '--acc-soft': c.accSoft,
    '--acc-bd':   c.accBd,
    '--ph-a':     c.phA,
    '--ph-b':     c.phB,
    '--ph-tx':    c.phTx,
  }
}
