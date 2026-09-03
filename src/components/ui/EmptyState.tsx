import React from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  className?: string
}

export const EmptyState = ({
  title,
  description,
  icon,
  className = ''
}: EmptyStateProps) => {
  return (
    <div className={`text-center space-y-4 ${className}`}>
      {icon && <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-ink/10 text-ink/50">{icon}</div>}
      <h3 className="font-display text-lg text-ink">{title}</h3>
      {description && <p className="text-sm text-ink/60">{description}</p>}
    </div>
  )
}

EmptyState.displayName = 'EmptyState'