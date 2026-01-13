import { cn } from '@/lib/utils'

interface CircularProgressProps {
  value: number // 0-10 scale
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function CircularProgress({
  value,
  size = 'md',
  showLabel = true,
  className,
}: CircularProgressProps) {
  // Clamp value between 0 and 10
  const clampedValue = Math.min(10, Math.max(0, value))

  // Convert to percentage (0-100)
  const percentage = clampedValue * 10

  // Calculate stroke dashoffset for circular progress
  // Full circle circumference = 2 * π * radius
  // We use radius of 45 (inside a 100x100 viewBox)
  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-10 h-10', stroke: 6, fontSize: 'text-xs' },
    md: { container: 'w-14 h-14', stroke: 8, fontSize: 'text-sm' },
    lg: { container: 'w-20 h-20', stroke: 10, fontSize: 'text-base' },
  }

  // Color based on score (green >8, yellow 6-8, red <6)
  const getColor = () => {
    if (clampedValue > 8) return 'stroke-green-500'
    if (clampedValue >= 6) return 'stroke-yellow-500'
    return 'stroke-red-500'
  }

  const getTextColor = () => {
    if (clampedValue > 8) return 'text-green-500'
    if (clampedValue >= 6) return 'text-yellow-500'
    return 'text-red-500'
  }

  const config = sizeConfig[size]

  return (
    <div className={cn('relative', config.container, className)}>
      <svg
        className="transform -rotate-90 w-full h-full"
        viewBox="0 0 100 100"
      >
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          className="stroke-surface-elevated"
          strokeWidth={config.stroke}
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          className={cn('transition-all duration-500 ease-out', getColor())}
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      {/* Center label */}
      {showLabel && (
        <div className={cn(
          'absolute inset-0 flex items-center justify-center font-bold',
          config.fontSize,
          getTextColor()
        )}>
          {clampedValue.toFixed(1)}
        </div>
      )}
    </div>
  )
}
