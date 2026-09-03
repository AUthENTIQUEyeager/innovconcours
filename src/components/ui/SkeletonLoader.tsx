import React from 'react'

interface SkeletonLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
  className?: string
  radius?: string
}

export const SkeletonLoader = ({
  width = '100%',
  height = '1rem',
  radius = 'sm',
  className = '',
  ...props
}: SkeletonLoaderProps) => {
  const radiusClass = {
    xs: 'rounded-xs',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  }[radius] || 'rounded-sm'

  return (
    <div
      className={`animate-pulse bg-ink/5 ${radiusClass} ${className}`}
      style={{ width: typeof width === 'number' ? `${width}px` : width, height: typeof height === 'number' ? `${height}px` : height }}
      {...props}
    />
  )
}

SkeletonLoader.displayName = 'SkeletonLoader'