import React from 'react'

type SelectProps = React.ComponentPropsWithoutRef<'select'> & {
  variant?: 'default' | 'outline' | 'filled'
  size?: 'sm' | 'md' | 'lg'
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({
    variant = 'default',
    size = 'md',
    className = '',
    children,
    ...props
  }, ref) => {
    const base = 'transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'

    const variantClass = {
      default: 'bg-paper border border-ink/30 text-ink focus:border-ink/60',
      outline: 'bg-transparent border border-ink/30 text-ink focus:border-ink/60',
      filled: 'bg-ink/5 border border-ink/30 text-ink focus:bg-ink/10 focus:border-ink/60'
    }[variant]

    const sizeClass = {
      sm: 'h-9 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-11 px-5 text-base'
    }[size]

    return (
      <select
        ref={ref}
        className={[base, variantClass, sizeClass, className].filter(Boolean).join(' ')}
        {...props}
      >
        {children}
      </select>
    )
  }
)

Select.displayName = 'Select'
