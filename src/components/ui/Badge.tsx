import React from 'react'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  className?: string
}

export const Badge = ({
  variant = 'default',
  className = '',
  ...props
}: BadgeProps) => {
  const base = 'inline-flex items-center rounded-full border font-medium text-xs px-2.5 py-0.5 transition-colors duration-200'

  const variantClass = {
    default: 'border-ink/30 text-ink/60 hover:bg-ink/5',
    primary: 'border-gold-dark/30 text-gold-dark hover:bg-gold/5',
    secondary: 'border-ink/30 text-ink/60 hover:bg-ink/5',
    success: 'border-validated/30 text-validated hover:bg-validated/5',
    warning: 'border-gold/30 text-gold-dark hover:bg-gold/5',
    error: 'border-seal/30 text-seal hover:bg-seal/5'
  }[variant]

  return (
    <span
      className={[base, variantClass, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

Badge.displayName = 'Badge'