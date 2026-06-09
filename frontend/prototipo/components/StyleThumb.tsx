import React from 'react'
import type { Variant } from '../tokens/colors'

export type StyleId =
  | 'bold comic'
  | 'soft cartoon'
  | 'manga ink'
  | 'retro pop'
  | 'storybook'
  | '3d toon'

export interface StyleThumbProps {
  styleId: StyleId
  /** Scene index (0-based) — used to vary composition per scene */
  n?: number
  /** Caption text overlaid at bottom of thumb */
  caption?: string
  className?: string
}

/**
 * storyForge StyleThumb — renders a distinct SVG illustration for each of the
 * 6 art styles. Use inside a 9:16 container for best results.
 */
export function StyleThumb({ styleId, n = 0, caption = '', className = '' }: StyleThumbProps) {
  const v   = n % 3
  const uid = styleId.replace(/\s/g, '') + n

  const cap = caption.slice(0, 20) || 'Scene preview'

  const accents = {
    'bold comic':   ['#FF3B30', '#007AFF', '#34C759'],
    'soft cartoon': ['#5533AA', '#AA3355', '#3377AA'],
    'manga ink':    ['#111', '#111', '#111'],
    'retro pop':    ['#E85D20', '#1A6B5C', '#C83060'],
    'storybook':    ['#FFD080', '#FFD080', '#FFD080'],
    '3d toon':      ['#FF6B6B', '#6BCB77', '#4D96FF'],
  }

  const captionBar = (fill: string, textFill: string, italic = false) => (
    <>
      <rect x="0" y="132" width="90" height="28" fill={fill} />
      <text x="45" y="150" textAnchor="middle" fontSize="7.5"
        fill={textFill} fontFamily={italic ? 'Georgia,serif' : 'sans-serif'}
        fontWeight="700" fontStyle={italic ? 'italic' : 'normal'}>
        {cap}
      </text>
    </>
  )

  if (styleId === 'bold comic') return (
    <svg viewBox="0 0 90 160" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="90" height="160" fill="#FFE320" />
      {Array.from({ length: 8 }, (_, r) =>
        Array.from({ length: 5 }, (_, c) =>
          <circle key={`${r}-${c}`} cx={c * 20 + 10} cy={r * 22 + 8} r={2.2} fill="#000" opacity=".11" />
        )
      )}
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((a, i) =>
        <line key={i}
          x1={45 + Math.cos(a * Math.PI / 180) * 12} y1={70 + Math.sin(a * Math.PI / 180) * 12}
          x2={45 + Math.cos(a * Math.PI / 180) * 50} y2={70 + Math.sin(a * Math.PI / 180) * 50}
          stroke="#000" strokeWidth="1" opacity=".2" />
      )}
      <circle cx="45" cy="57" r="21" fill="#fff" stroke="#111" strokeWidth="3" />
      <ellipse cx="37" cy="54" rx="4" ry="5" fill="#111" />
      <ellipse cx="53" cy="54" rx="4" ry="5" fill="#111" />
      <circle cx="39" cy="52" r="1.5" fill="#fff" />
      <circle cx="55" cy="52" r="1.5" fill="#fff" />
      <path d={v === 1 ? 'M37 63 Q45 56 53 63' : 'M37 65 Q45 72 53 65'}
        fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="27" y="77" width="36" height="42" rx="4" fill={accents['bold comic'][v]} stroke="#111" strokeWidth="2.5" />
      <ellipse cx="70" cy="27" rx="17" ry="12" fill="#fff" stroke="#111" strokeWidth="2" />
      <polygon points="58,36 54,45 64,38" fill="#fff" stroke="#111" strokeWidth="1.5" />
      <text x="70" y="31" textAnchor="middle" fontSize="9" fontWeight="900"
        fill="#111" fontFamily="Impact,Arial Black,sans-serif">
        {['POW!', 'ZAP!', 'WHAM'][v]}
      </text>
      {captionBar('rgba(0,0,0,0.75)', '#FFE320')}
    </svg>
  )

  if (styleId === 'soft cartoon') return (
    <svg viewBox="0 0 90 160" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="90" height="160" fill="#EDD6FF" />
      <circle cx="18" cy="36" r="16" fill="#D4B0F5" opacity=".7" />
      <circle cx="38" cy="28" r="20" fill="#C49AEE" opacity=".5" />
      <circle cx="74" cy="42" r="14" fill="#D4B0F5" opacity=".6" />
      <rect x="0" y="138" width="90" height="22" fill="#A8D8A8" opacity=".9" />
      <ellipse cx="45" cy="138" rx="46" ry="14" fill="#B8E4B0" opacity=".9" />
      <ellipse cx="45" cy="110" rx="22" ry="26" fill="#FFDCEA" />
      <circle cx="45" cy="76" r="22" fill="#FFEEC4" stroke="#F0B8D0" strokeWidth="2" />
      <circle cx="37" cy="73" r="6" fill="#fff" />
      <circle cx="53" cy="73" r="6" fill="#fff" />
      <circle cx="38" cy="74" r="4" fill={accents['soft cartoon'][v]} />
      <circle cx="54" cy="74" r="4" fill={accents['soft cartoon'][v]} />
      <circle cx="39" cy="72" r="1.5" fill="#fff" />
      <circle cx="55" cy="72" r="1.5" fill="#fff" />
      <circle cx="31" cy="80" r="5" fill="#FFB0C8" opacity=".6" />
      <circle cx="59" cy="80" r="5" fill="#FFB0C8" opacity=".6" />
      <path d="M38 86 Q45 93 52 86" fill="none" stroke="#E888B0" strokeWidth="2.5" strokeLinecap="round" />
      {captionBar('rgba(80,40,100,0.72)', '#FFE4FF')}
    </svg>
  )

  if (styleId === 'manga ink') return (
    <svg viewBox="0 0 90 160" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="90" height="160" fill="#F0EDE8" />
      {Array.from({ length: 30 }, (_, i) =>
        <line key={i} x1={i * 7 - 25} y1="0" x2={i * 7 + 55} y2="160"
          stroke="#000" strokeWidth=".35" opacity=".16" />
      )}
      {[0, 18, 36, 54, 72].map((a, i) =>
        <line key={'s' + i} x1="90" y1="0"
          x2={90 - Math.cos(a * Math.PI / 180) * 140}
          y2={Math.sin(a * Math.PI / 180) * 140}
          stroke="#000" strokeWidth={i === 2 ? '2.5' : '.8'} opacity=".28" />
      )}
      <circle cx="38" cy="54" r="19" fill="#111" />
      <rect x="24" y="72" width="28" height="50" rx="3" fill="#111" />
      <ellipse cx="46" cy="50" rx="5" ry="7" fill="#fff" />
      <ellipse cx="46" cy="52" rx="3" ry="5" fill="#111" />
      <circle cx="47" cy="49" r="1.5" fill="#fff" />
      <polygon points="30,73 38,86 45,73" fill="#fff" />
      <rect x="48" y="100" width="28" height="36" rx="3" fill="#fff" stroke="#111" strokeWidth="2" />
      <line x1="52" y1="108" x2="72" y2="108" stroke="#111" strokeWidth="1.5" />
      <line x1="52" y1="115" x2="68" y2="115" stroke="#111" strokeWidth="1.5" />
      <line x1="52" y1="122" x2="70" y2="122" stroke="#111" strokeWidth="1.5" />
      {captionBar('rgba(0,0,0,0.88)', '#fff')}
    </svg>
  )

  if (styleId === 'retro pop') return (
    <svg viewBox="0 0 90 160" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="90" height="160" fill="#F5E6C0" />
      <circle cx="72" cy="28" r="28" fill={accents['retro pop'][v]} />
      <rect x="0" y="112" width="90" height="48" fill="#1A1A2E" />
      <path d="M0 110 Q22 98 45 110 Q68 122 90 110 L90 114 Q68 126 45 114 Q22 102 0 114Z" fill="#F5E6C0" />
      <rect x="10" y="60" width="46" height="46" fill="#F5E6C0" stroke={accents['retro pop'][v]} strokeWidth="3.5" />
      {Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 4 }, (_, c) =>
          <circle key={`${r}${c}`} cx={c * 9 + 15} cy={r * 9 + 65} r="2" fill={accents['retro pop'][v]} opacity=".5" />
        )
      )}
      <text x="45" y="142" textAnchor="middle" fontSize="10" fontWeight="900"
        fill="#fff" fontFamily="Impact,Arial Black,sans-serif" letterSpacing="1">
        CHAPTER {n + 1}
      </text>
      {captionBar('rgba(0,0,0,0.5)', '#F5E6C0')}
    </svg>
  )

  if (styleId === 'storybook') return (
    <svg viewBox="0 0 90 160" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="90" height="160" fill="#1E0E06" />
      <rect x="0" y="0" width="90" height="80" fill="#6B2A10" opacity=".55" />
      <circle cx="68" cy="26" r="17" fill="#FFD080" opacity=".92" />
      <circle cx="75" cy="20" r="12" fill="#1E0E06" opacity=".75" />
      {[[12,18],[28,10],[50,20],[78,48],[18,44]].map(([x, y], i) =>
        <circle key={i} cx={x} cy={y} r="1.5" fill="#FFE8A0" opacity=".8" />
      )}
      <ellipse cx="22" cy="132" rx="36" ry="22" fill="#2D5A1E" />
      <ellipse cx="76" cy="140" rx="30" ry="20" fill="#3A6B28" />
      <rect x="0" y="142" width="90" height="18" fill="#1A3A10" />
      <rect x="42" y="102" width="6" height="32" fill="#5C3A1E" />
      <ellipse cx="45" cy="92" rx="18" ry="22" fill="#2D5A1E" />
      <ellipse cx="45" cy="86" rx="13" ry="16" fill="#3A7028" />
      <rect x="22" y="114" width="14" height="12" rx="2" fill="#FFD080" opacity=".65" />
      {captionBar('rgba(15,5,0,0.82)', '#FFD080', true)}
    </svg>
  )

  if (styleId === '3d toon') return (
    <svg viewBox="0 0 90 160" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id={`bg${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A8FE3" />
          <stop offset="100%" stopColor="#87CEEB" />
        </linearGradient>
        <radialGradient id={`sp${uid}`} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity=".9" />
          <stop offset="40%" stopColor={accents['3d toon'][v]} />
          <stop offset="100%" stopColor={['#C0392B', '#27AE60', '#1A5F9E'][v]} />
        </radialGradient>
      </defs>
      <rect width="90" height="160" fill={`url(#bg${uid})`} />
      <ellipse cx="22" cy="30" rx="18" ry="8" fill="#fff" opacity=".82" />
      <ellipse cx="30" cy="24" rx="12" ry="8" fill="#fff" opacity=".82" />
      <ellipse cx="72" cy="44" rx="14" ry="7" fill="#fff" opacity=".72" />
      <ellipse cx="45" cy="152" rx="36" ry="7" fill="#000" opacity=".14" />
      <circle cx="45" cy="88" r="36" fill={`url(#sp${uid})`} />
      <ellipse cx="34" cy="72" rx="10" ry="7" fill="#fff" opacity=".55" />
      <circle cx="37" cy="86" r="8" fill="#fff" />
      <circle cx="53" cy="86" r="8" fill="#fff" />
      <circle cx="38" cy="87" r="5" fill="#222" />
      <circle cx="54" cy="87" r="5" fill="#222" />
      <circle cx="39" cy="85" r="2" fill="#fff" />
      <circle cx="55" cy="85" r="2" fill="#fff" />
      <path d="M36 98 Q45 108 54 98" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round" />
      {captionBar('rgba(0,20,60,0.75)', '#fff')}
    </svg>
  )

  return (
    <svg viewBox="0 0 90 160" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="90" height="160" fill="#1a1a20" />
      <text x="45" y="85" textAnchor="middle" fontSize="9" fill="#666" fontFamily="sans-serif">{styleId}</text>
    </svg>
  )
}
