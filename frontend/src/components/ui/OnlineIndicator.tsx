import { Wifi, WifiOff, Check } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { cn } from '@/lib/utils'

interface OnlineIndicatorProps {
  className?: string
  showLabel?: boolean
}

/**
 * Small indicator showing online/offline status
 * Shows green when online, red when offline, and briefly shows "restored" when coming back online
 */
export function OnlineIndicator({ className, showLabel = false }: OnlineIndicatorProps) {
  const { isOnline, wasOffline } = useOnlineStatus()

  // Don't show anything when online and stable (unless showLabel is true)
  if (isOnline && !wasOffline && !showLabel) {
    return null
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-all',
        isOnline
          ? wasOffline
            ? 'bg-success/10 text-success'
            : 'bg-surface-elevated text-text-secondary'
          : 'bg-error/10 text-error animate-pulse',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {isOnline ? (
        wasOffline ? (
          <>
            <Check className="h-3 w-3" aria-hidden="true" />
            <span>Connected</span>
          </>
        ) : showLabel ? (
          <>
            <Wifi className="h-3 w-3" aria-hidden="true" />
            <span>Online</span>
          </>
        ) : null
      ) : (
        <>
          <WifiOff className="h-3 w-3" aria-hidden="true" />
          <span>Offline - Changes saved locally</span>
        </>
      )}
    </div>
  )
}
