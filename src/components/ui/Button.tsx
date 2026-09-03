import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  disabled?: boolean
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    disabled = false,
    asChild = false,
    className = '',
    ...props
  }, ref) => {
    const base = 'transition-colors duration-200 rounded-md font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'

    const variantClass = {
      primary: 'bg-gold-dark text-paper hover:bg-gold/90',
      secondary: 'bg-ink text-paper hover:bg-ink/90',
      outline: 'border border-ink/30 text-ink hover:bg-ink/5',
      danger: 'bg-seal text-paper hover:bg-seal/90'
    }[variant]

    const sizeClass = {
      sm: 'h-9 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-11 px-5 text-base'
    }[size]

    const fullWidthClass = fullWidth ? 'w-full' : ''

    const Comp = asChild ? React.Fragment : 'button'

    return (
      <Comp
        ref={ref as any}
        className={[base, variantClass, sizeClass, fullWidthClass, className].filter(Boolean).join(' ')}
        {...props}
        disabled={disabled}
      />
    )
  }
)

Button.displayName = 'Button'