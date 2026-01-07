import { useState, useEffect, useCallback } from 'react'
import { X, Moon, Sun, Keyboard } from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, toggleTheme } = useThemeStore()

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
            <X className="h-5 w-5 text-text-secondary" />
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
                  <Moon className="h-5 w-5 text-text-secondary" />
                ) : (
                  <Sun className="h-5 w-5 text-text-secondary" />
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
