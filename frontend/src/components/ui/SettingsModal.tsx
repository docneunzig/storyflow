import { useState, useEffect, useCallback } from 'react'
import { X, Moon, Sun, LogOut, Clock, Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useThemeStore } from '@/stores/themeStore'

// Settings storage keys
const SETTINGS_KEYS = {
  sessionTracking: 'storyflow-session-tracking',
  autosaveInterval: 'storyflow-autosave-interval',
} as const

// Get session tracking setting
export function getSessionTrackingEnabled(): boolean {
  const stored = localStorage.getItem(SETTINGS_KEYS.sessionTracking)
  return stored !== 'false' // Default to true
}

// Set session tracking setting
export function setSessionTrackingEnabled(enabled: boolean): void {
  localStorage.setItem(SETTINGS_KEYS.sessionTracking, String(enabled))
}

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [sessionTrackingEnabled, setSessionTrackingEnabledState] = useState(getSessionTrackingEnabled)

  // Update localStorage when setting changes
  const handleToggleSessionTracking = useCallback(() => {
    const newValue = !sessionTrackingEnabled
    setSessionTrackingEnabledState(newValue)
    setSessionTrackingEnabled(newValue)
  }, [sessionTrackingEnabled])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      // Clear session storage
      sessionStorage.clear()
      // Clear local storage auth-related items
      localStorage.removeItem('storyflow-auth')
      localStorage.removeItem('storyflow-session')
      // Close modal
      onClose()
      // Navigate to logout page which shows unauthenticated state
      navigate('/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Handle Escape key to close
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
            aria-label="Close settings"
          >
            <X className="h-5 w-5 text-text-secondary" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Theme Section */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Appearance</h3>
            <div className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="h-5 w-5 text-text-secondary" aria-hidden="true" />
                ) : (
                  <Sun className="h-5 w-5 text-text-secondary" aria-hidden="true" />
                )}
                <div>
                  <p className="text-text-primary font-medium">Theme</p>
                  <p className="text-sm text-text-secondary">
                    {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  theme === 'dark' ? 'bg-accent' : 'bg-gray-300'
                }`}
                aria-label="Toggle theme"
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </section>

          {/* Writing & Tracking Section */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Writing & Tracking</h3>
            <div className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-text-secondary" aria-hidden="true" />
                <div>
                  <p className="text-text-primary font-medium">Session Tracking</p>
                  <p className="text-sm text-text-secondary">
                    {sessionTrackingEnabled ? 'Track writing time and words' : 'Tracking disabled'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleSessionTracking}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  sessionTrackingEnabled ? 'bg-accent' : 'bg-gray-300'
                }`}
                aria-label="Toggle session tracking"
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    sessionTrackingEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-text-secondary mt-2 px-1">
              When enabled, your writing sessions (time spent writing and words written) are logged to help track your progress.
            </p>
          </section>

          {/* Keyboard Shortcuts Section */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Keyboard Shortcuts</h3>
            <div className="space-y-2">
              <ShortcutRow keys={['Cmd', '1-7']} description="Navigate sections" />
              <ShortcutRow keys={['Cmd', 'S']} description="Save project" />
              <ShortcutRow keys={['Cmd', 'E']} description="Export" />
              <ShortcutRow keys={['Cmd', '/']} description="Show shortcuts" />
              <ShortcutRow keys={['Esc']} description="Close modal" />
            </div>
          </section>

          {/* About Section */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">About</h3>
            <div className="p-3 bg-surface-elevated rounded-lg">
              <p className="text-text-primary font-medium">Storyflow</p>
              <p className="text-sm text-text-secondary">
                AI-Powered Novel Writing Assistant
              </p>
              <p className="text-xs text-text-secondary mt-2">
                Version 0.1.0
              </p>
            </div>
          </section>

          {/* Account Section */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Account</h3>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-3 p-3 bg-surface-elevated rounded-lg hover:bg-red-500/10 hover:border-red-500/50 border border-transparent transition-colors text-left group"
            >
              <LogOut className="h-5 w-5 text-text-secondary group-hover:text-red-500" aria-hidden="true" />
              <div>
                <p className="text-text-primary font-medium group-hover:text-red-500">
                  {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                </p>
                <p className="text-sm text-text-secondary">
                  Clear session and return to login
                </p>
              </div>
            </button>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <button
            onClick={onClose}
            className="w-full py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function ShortcutRow({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-text-secondary">{description}</span>
      <div className="flex gap-1">
        {keys.map((key, i) => (
          <kbd
            key={i}
            className="px-2 py-0.5 text-xs bg-surface border border-border rounded text-text-secondary"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  )
}
