import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Settings, Download, Moon, Sun, Home, CheckCircle, Loader2, AlertCircle, Target } from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'
import { useProjectStore } from '@/stores/projectStore'
import { SettingsModal } from '@/components/ui/SettingsModal'

// Helper to format relative time
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

interface HeaderProps {
  projectId?: string
  currentSection?: string
}

export function Header({ projectId, currentSection }: HeaderProps) {
  const { theme, toggleTheme } = useThemeStore()
  const { currentProject, saveStatus } = useProjectStore()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [, setTick] = useState(0) // Force re-render for time updates

  // Track when save completes
  useEffect(() => {
    if (saveStatus === 'saved') {
      setLastSavedAt(new Date())
    }
  }, [saveStatus])

  // Update relative time display every minute
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  // Calculate word count progress
  const wordCountProgress = useMemo(() => {
    if (!currentProject) return null
    const chapters = currentProject.chapters || []
    const currentWords = chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0)
    const targetWords = currentProject.specification?.targetWordCount || 80000
    const percent = Math.min(100, Math.round((currentWords / targetWords) * 100))
    return { current: currentWords, target: targetWords, percent }
  }, [currentProject])

  // Format section name for display
  const formatSectionName = (section?: string) => {
    if (!section) return null
    return section.charAt(0).toUpperCase() + section.slice(1)
  }

  return (
    <>
      <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-2 sm:px-4 overflow-hidden" role="banner" aria-label="Main header">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <Link to="/" className="flex items-center gap-2 text-text-primary hover:text-accent transition-colors flex-shrink-0">
            <Home className="h-5 w-5" aria-hidden="true" />
            <span className="font-semibold hidden sm:inline">Storyflow</span>
          </Link>

          {projectId && currentProject && (
            <>
              <span className="text-text-secondary hidden sm:inline">/</span>
              <Link
                to={`/projects/${projectId}/specification`}
                className="text-sm sm:text-lg font-medium text-text-primary hover:text-accent transition-colors truncate"
                title={currentProject.metadata?.workingTitle || 'Untitled Project'}
              >
                {currentProject.metadata?.workingTitle || 'Untitled Project'}
              </Link>
              {currentSection && (
                <>
                  <span className="text-text-secondary hidden sm:inline">/</span>
                  <span className="text-sm sm:text-lg font-medium text-accent truncate hidden sm:inline">
                    {formatSectionName(currentSection)}
                  </span>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Word Count Progress */}
          {projectId && wordCountProgress && (
            <div className="hidden lg:flex items-center gap-2 text-xs text-text-secondary mr-2 px-2 py-1 rounded-md bg-surface-elevated border border-border">
              <Target className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-medium">
                {wordCountProgress.current.toLocaleString()}
              </span>
              <span className="text-text-secondary/60">/</span>
              <span>{wordCountProgress.target.toLocaleString()}</span>
              <div className="w-16 h-1.5 bg-surface rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    wordCountProgress.percent >= 100
                      ? 'bg-green-500'
                      : wordCountProgress.percent >= 75
                      ? 'bg-accent'
                      : wordCountProgress.percent >= 50
                      ? 'bg-yellow-500'
                      : 'bg-text-secondary/30'
                  }`}
                  style={{ width: `${wordCountProgress.percent}%` }}
                />
              </div>
              <span className="text-[10px] font-medium">{wordCountProgress.percent}%</span>
            </div>
          )}

          {/* Save Status - Enhanced */}
          {projectId && (
            <div className="flex items-center gap-1.5 text-xs text-text-secondary mr-1 sm:mr-3">
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-accent" aria-hidden="true" />
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
                  <span className="hidden sm:inline">
                    Saved {lastSavedAt ? formatTimeAgo(lastSavedAt) : ''}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-500" aria-hidden="true" />
                  <span className="hidden sm:inline">Unsaved changes</span>
                </>
              )}
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-surface-elevated transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-text-secondary" aria-hidden="true" />
            ) : (
              <Moon className="h-5 w-5 text-text-secondary" aria-hidden="true" />
            )}
          </button>

          {/* Export Button */}
          {projectId && (
            <Link
              to={`/projects/${projectId}/export`}
              className="p-2 rounded-md hover:bg-surface-elevated transition-colors"
              aria-label="Export"
            >
              <Download className="h-5 w-5 text-text-secondary" aria-hidden="true" />
            </Link>
          )}

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-md hover:bg-surface-elevated transition-colors"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5 text-text-secondary" aria-hidden="true" />
          </button>
        </div>
      </header>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  )
}
