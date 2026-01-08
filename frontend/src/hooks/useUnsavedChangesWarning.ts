import { useEffect, useCallback } from 'react'
import { useBlocker } from 'react-router-dom'
import { useProjectStore } from '@/stores/projectStore'

/**
 * Hook to warn users when they try to navigate away with unsaved changes.
 * Uses React Router's useBlocker for internal navigation and beforeunload for external navigation.
 */
export function useUnsavedChangesWarning() {
  const { saveStatus } = useProjectStore()
  const hasUnsavedChanges = saveStatus === 'unsaved'

  // Block internal React Router navigation
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  )

  // Handle browser close/refresh with beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        // Modern browsers ignore custom messages, but we need to return something
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const confirmNavigation = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.proceed()
    }
  }, [blocker])

  const cancelNavigation = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.reset()
    }
  }, [blocker])

  return {
    isBlocked: blocker.state === 'blocked',
    confirmNavigation,
    cancelNavigation,
    hasUnsavedChanges,
  }
}
