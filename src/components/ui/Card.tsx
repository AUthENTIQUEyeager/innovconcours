import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export const Card = ({ className = '', ...props }: CardProps) => {
  return (
    <div
      className={`bg-paper border border-ink/10 rounded-xl shadow-sm ${className}`}
      {...props}
    />
  )
}

Card.displayName = 'Card'