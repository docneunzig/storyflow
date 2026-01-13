import { useState, useEffect, useCallback } from 'react'

export interface OnlineStatus {
  isOnline: boolean
  wasOffline: boolean
  lastOnline: Date | null
}

/**
 * Hook to monitor online/offline status
 * Returns current online state and whether the connection was recently restored
 */
export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [wasOffline, setWasOffline] = useState(false)
  const [lastOnline, setLastOnline] = useState<Date | null>(null)

  const handleOnline = useCallback(() => {
    setIsOnline(true)
    setWasOffline(true)
    setLastOnline(new Date())
    // Clear "was offline" flag after 5 seconds
    setTimeout(() => setWasOffline(false), 5000)
  }, [])

  const handleOffline = useCallback(() => {
    setIsOnline(false)
    setWasOffline(false)
  }, [])

  useEffect(() => {
    // Set initial state
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine)
      if (navigator.onLine) {
        setLastOnline(new Date())
      }
    }

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  return {
    isOnline,
    wasOffline,
    lastOnline,
  }
}
