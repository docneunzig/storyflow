import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Settings, Download, Moon, Sun, Save, Home } from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'
import { useProjectStore } from '@/stores/projectStore'
import { SettingsModal } from '@/components/ui/SettingsModal'

interface HeaderProps {
  projectId?: string
}

export function Header({ projectId }: HeaderProps) {
  const { theme, toggleTheme } = useThemeStore()
  const { currentProject, saveStatus } = useProjectStore()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

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
              <h1 className="text-sm sm:text-lg font-medium text-text-primary truncate">
                {currentProject.metadata?.workingTitle || 'Untitled Project'}
              </h1>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Save Status */}
          {projectId && (
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-text-secondary mr-1 sm:mr-4">
              <Save className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Unsaved'}</span>
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
