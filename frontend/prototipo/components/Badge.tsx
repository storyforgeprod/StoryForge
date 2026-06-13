import React from 'react'

export interface BadgeProps {
  children: React.ReactNode
  className?: string
}

/**
 * storyForge Badge — accent-coloured label pill.
 * Requires `@storyforge/ui/styles`.
 */
export function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span className={['badge', className].filter(Boolean).join(' ')}>
      {children}
    </span>
  )
}
