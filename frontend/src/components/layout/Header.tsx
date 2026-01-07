import { Link } from 'react-router-dom'
import { Settings, Download, Moon, Sun, Save, Home } from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'
import { useProjectStore } from '@/stores/projectStore'

interface HeaderProps {
  projectId?: string
}

export function Header({ projectId }: HeaderProps) {
  const { theme, toggleTheme } = useThemeStore()
  const { currentProject, saveStatus } = useProjectStore()

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 text-text-primary hover:text-accent transition-colors">
          <Home className="h-5 w-5" />
          <span className="font-semibold">Storyflow</span>
        </Link>

        {projectId && currentProject && (
          <>
            <span className="text-text-secondary">/</span>
            <h1 className="text-lg font-medium text-text-primary truncate max-w-md">
              {currentProject.metadata?.workingTitle || 'Untitled Project'}
            </h1>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Save Status */}
        {projectId && (
          <div className="flex items-center gap-2 text-sm text-text-secondary mr-4">
            <Save className="h-4 w-4" />
            <span>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Unsaved'}</span>
          </div>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md hover:bg-surface-elevated transition-colors"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-text-secondary" />
          ) : (
            <Moon className="h-5 w-5 text-text-secondary" />
          )}
        </button>

        {/* Export Button */}
        {projectId && (
          <Link
            to={`/projects/${projectId}/export`}
            className="p-2 rounded-md hover:bg-surface-elevated transition-colors"
            aria-label="Export"
          >
            <Download className="h-5 w-5 text-text-secondary" />
          </Link>
        )}

        {/* Settings Button */}
        <button
          className="p-2 rounded-md hover:bg-surface-elevated transition-colors"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5 text-text-secondary" />
        </button>
      </div>
    </header>
  )
}
