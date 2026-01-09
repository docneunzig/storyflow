import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-surface-elevated',
        className
      )}
    />
  )
}

// Project card skeleton for the project list
export function ProjectCardSkeleton() {
  return (
    <div className="card p-4 flex items-center gap-4">
      {/* Icon skeleton */}
      <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />

      <div className="flex-1 space-y-2">
        {/* Title skeleton */}
        <Skeleton className="h-5 w-48" />

        {/* Meta info skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* Delete button placeholder */}
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
  )
}

// Character card skeleton
export function CharacterCardSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      {/* Header with avatar and name */}
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      {/* Description */}
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />

      {/* Tags */}
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  )
}

// Scene card skeleton
export function SceneCardSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />

      <div className="flex items-center gap-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}

// Chapter card skeleton
export function ChapterCardSkeleton() {
  return (
    <div className="p-3 rounded-lg border border-border space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-5 w-32" />
      </div>

      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  )
}

// Table row skeleton
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 p-3 border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === 0 ? 'w-40' : 'w-24')}
        />
      ))}
    </div>
  )
}

// List skeleton wrapper
interface ListSkeletonProps {
  count?: number
  children: React.ReactNode
}

export function ListSkeleton({ count = 3, children }: ListSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ opacity: 1 - (i * 0.2) }}>
          {children}
        </div>
      ))}
    </div>
  )
}

// Grid skeleton wrapper
interface GridSkeletonProps {
  count?: number
  columns?: number
  children: React.ReactNode
}

export function GridSkeleton({ count = 6, columns = 3, children }: GridSkeletonProps) {
  return (
    <div className={cn(
      'grid gap-4',
      columns === 2 && 'grid-cols-1 sm:grid-cols-2',
      columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      columns === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ opacity: 1 - (i * 0.1) }}>
          {children}
        </div>
      ))}
    </div>
  )
}
