import React from 'react'

export type ButtonVariant = 'primary' | 'ghost' | 'soft'
export type ButtonSize    = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: React.ReactNode
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  ghost:   'btn-ghost',
  soft:    'btn-soft',
}

/**
 * storyForge Button — uses `.btn` CSS class from theme.css.
 * Import `@storyforge/ui/styles` in your app root for the styles to apply.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const cls = ['btn', variantClass[variant], sizeClass[size], className]
    .filter(Boolean)
    .join(' ')
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  )
}
