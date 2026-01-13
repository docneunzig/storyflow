import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = 'md',
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-6',
      iconWrapper: 'p-2',
      icon: 'h-5 w-5',
      title: 'text-sm',
      description: 'text-xs max-w-xs',
    },
    md: {
      container: 'py-12',
      iconWrapper: 'p-4',
      icon: 'h-8 w-8',
      title: 'text-lg',
      description: 'text-sm max-w-sm',
    },
    lg: {
      container: 'py-16',
      iconWrapper: 'p-6',
      icon: 'h-12 w-12',
      title: 'text-xl',
      description: 'text-base max-w-md',
    },
  }

  const classes = sizeClasses[size]

  return (
    <div className={`flex flex-col items-center justify-center text-center ${classes.container}`}>
      <div className={`rounded-full bg-surface-elevated ${classes.iconWrapper} mb-4`}>
        <Icon className={`${classes.icon} text-text-secondary`} />
      </div>
      <h3 className={`font-medium text-text-primary mb-2 ${classes.title}`}>
        {title}
      </h3>
      {description && (
        <p className={`text-text-secondary mb-4 ${classes.description}`}>
          {description}
        </p>
      )}
      {action}
    </div>
  )
}
