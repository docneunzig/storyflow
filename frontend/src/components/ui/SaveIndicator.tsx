import { useState, useEffect } from 'react'
import { Loader2, CheckCircle, Cloud, CloudOff, AlertCircle } from 'lucide-react'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'unsaved' | 'error'

interface SaveIndicatorProps {
  status: SaveStatus
  lastSaved?: Date | string | null
  errorMessage?: string
  className?: string
}

// Format relative time (e.g., "2 min ago", "just now")
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)

  if (diffSeconds < 10) return 'just now'
  if (diffSeconds < 60) return `${diffSeconds}s ago`
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString()
}

export function SaveIndicator({
  status,
  lastSaved,
  errorMessage,
  className = '',
}: SaveIndicatorProps) {
  const [relativeTime, setRelativeTime] = useState<string>('')

  // Update relative time every 10 seconds
  useEffect(() => {
    if (!lastSaved) return

    const date = typeof lastSaved === 'string' ? new Date(lastSaved) : lastSaved
    setRelativeTime(formatRelativeTime(date))

    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(date))
    }, 10000)

    return () => clearInterval(interval)
  }, [lastSaved])

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {status === 'saving' && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          <span className="text-text-secondary">Saving...</span>
        </>
      )}

      {status === 'saved' && (
        <>
          <CheckCircle className="h-4 w-4 text-success" />
          <span className="text-text-secondary">
            Saved {relativeTime && `(${relativeTime})`}
          </span>
        </>
      )}

      {status === 'idle' && lastSaved && (
        <>
          <Cloud className="h-4 w-4 text-text-secondary" />
          <span className="text-text-secondary">
            {relativeTime ? `Last saved ${relativeTime}` : 'All changes saved'}
          </span>
        </>
      )}

      {status === 'unsaved' && (
        <>
          <CloudOff className="h-4 w-4 text-warning" />
          <span className="text-warning">Unsaved changes</span>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertCircle className="h-4 w-4 text-error" />
          <span className="text-error">
            {errorMessage || 'Failed to save'}
          </span>
        </>
      )}
    </div>
  )
}

// Compact version for tight spaces
export function SaveIndicatorCompact({
  status,
  className = '',
}: {
  status: SaveStatus
  className?: string
}) {
  return (
    <div className={`flex items-center ${className}`} title={
      status === 'saving' ? 'Saving...' :
      status === 'saved' ? 'All changes saved' :
      status === 'unsaved' ? 'Unsaved changes' :
      status === 'error' ? 'Save failed' :
      'Ready'
    }>
      {status === 'saving' && (
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
      )}
      {status === 'saved' && (
        <CheckCircle className="h-4 w-4 text-success" />
      )}
      {status === 'idle' && (
        <Cloud className="h-4 w-4 text-text-secondary" />
      )}
      {status === 'unsaved' && (
        <CloudOff className="h-4 w-4 text-warning" />
      )}
      {status === 'error' && (
        <AlertCircle className="h-4 w-4 text-error" />
      )}
    </div>
  )
}
