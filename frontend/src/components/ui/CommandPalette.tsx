import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Search,
  FileText,
  GitBranch,
  Users,
  Film,
  PenTool,
  CheckSquare,
  Download,
  Book,
  BarChart2,
  TrendingUp,
  Settings,
  Moon,
  Sun,
  Home,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Command {
  id: string
  label: string
  description?: string
  icon: React.ElementType
  category: 'navigation' | 'action' | 'settings'
  keywords?: string[]
  shortcut?: string
  action: () => void
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onOpenSettings?: () => void
}

export function CommandPalette({ isOpen, onClose, onOpenSettings }: CommandPaletteProps) {
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { projectId } = useParams()

  // Check if currently in dark mode
  const isDarkMode = document.documentElement.classList.contains('dark')

  // Toggle theme function
  const toggleTheme = useCallback(() => {
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light')
    onClose()
  }, [onClose])

  // Build commands list
  const commands = useMemo<Command[]>(() => {
    const navCommands: Command[] = projectId ? [
      {
        id: 'nav-spec',
        label: 'Go to Specification',
        description: 'Project settings and genre',
        icon: FileText,
        category: 'navigation',
        keywords: ['settings', 'genre', 'project', 'spec'],
        shortcut: '1',
        action: () => { navigate(`/projects/${projectId}/specification`); onClose() },
      },
      {
        id: 'nav-plot',
        label: 'Go to Plot',
        description: 'Story structure and beats',
        icon: GitBranch,
        category: 'navigation',
        keywords: ['story', 'structure', 'beats', 'outline'],
        shortcut: '2',
        action: () => { navigate(`/projects/${projectId}/plot`); onClose() },
      },
      {
        id: 'nav-characters',
        label: 'Go to Characters',
        description: 'Character profiles and relationships',
        icon: Users,
        category: 'navigation',
        keywords: ['people', 'protagonist', 'antagonist', 'cast'],
        shortcut: '3',
        action: () => { navigate(`/projects/${projectId}/characters`); onClose() },
      },
      {
        id: 'nav-scenes',
        label: 'Go to Scenes',
        description: 'Scene blueprints and timeline',
        icon: Film,
        category: 'navigation',
        keywords: ['timeline', 'blueprint', 'sequence'],
        shortcut: '4',
        action: () => { navigate(`/projects/${projectId}/scenes`); onClose() },
      },
      {
        id: 'nav-write',
        label: 'Go to Write',
        description: 'Chapter editor and manuscript',
        icon: PenTool,
        category: 'navigation',
        keywords: ['editor', 'chapters', 'manuscript', 'writing'],
        shortcut: '5',
        action: () => { navigate(`/projects/${projectId}/write`); onClose() },
      },
      {
        id: 'nav-review',
        label: 'Go to Review',
        description: 'Consistency checks and validation',
        icon: CheckSquare,
        category: 'navigation',
        keywords: ['check', 'validate', 'consistency'],
        shortcut: '6',
        action: () => { navigate(`/projects/${projectId}/review`); onClose() },
      },
      {
        id: 'nav-export',
        label: 'Go to Export',
        description: 'Export manuscript formats',
        icon: Download,
        category: 'navigation',
        keywords: ['download', 'save', 'markdown', 'json', 'docx'],
        shortcut: '7',
        action: () => { navigate(`/projects/${projectId}/export`); onClose() },
      },
      {
        id: 'nav-wiki',
        label: 'Go to Wiki',
        description: 'Worldbuilding encyclopedia',
        icon: Book,
        category: 'navigation',
        keywords: ['world', 'lore', 'encyclopedia', 'worldbuilding'],
        action: () => { navigate(`/projects/${projectId}/wiki`); onClose() },
      },
      {
        id: 'nav-stats',
        label: 'Go to Stats',
        description: 'Writing statistics and progress',
        icon: BarChart2,
        category: 'navigation',
        keywords: ['statistics', 'progress', 'analytics', 'words'],
        action: () => { navigate(`/projects/${projectId}/stats`); onClose() },
      },
      {
        id: 'nav-market',
        label: 'Go to Market',
        description: 'Market analysis and comparisons',
        icon: TrendingUp,
        category: 'navigation',
        keywords: ['market', 'analysis', 'trends', 'competition'],
        action: () => { navigate(`/projects/${projectId}/market`); onClose() },
      },
    ] : []

    const actionCommands: Command[] = [
      {
        id: 'action-home',
        label: 'Go to Projects',
        description: 'Return to project list',
        icon: Home,
        category: 'action',
        keywords: ['home', 'projects', 'list', 'back'],
        action: () => { navigate('/'); onClose() },
      },
      {
        id: 'action-export-json',
        label: 'Export Project as JSON',
        description: 'Download full project backup',
        icon: Download,
        category: 'action',
        keywords: ['backup', 'save', 'download', 'json'],
        action: () => {
          if (projectId) {
            navigate(`/projects/${projectId}/export`)
          }
          onClose()
        },
      },
      {
        id: 'action-export-md',
        label: 'Export as Markdown',
        description: 'Download manuscript as markdown',
        icon: Download,
        category: 'action',
        keywords: ['markdown', 'md', 'text', 'manuscript'],
        action: () => {
          if (projectId) {
            navigate(`/projects/${projectId}/export`)
          }
          onClose()
        },
      },
    ]

    const settingsCommands: Command[] = [
      {
        id: 'settings-theme',
        label: isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        description: 'Toggle color theme',
        icon: isDarkMode ? Sun : Moon,
        category: 'settings',
        keywords: ['theme', 'dark', 'light', 'mode', 'appearance'],
        action: toggleTheme,
      },
      {
        id: 'settings-open',
        label: 'Open Settings',
        description: 'Application preferences',
        icon: Settings,
        category: 'settings',
        keywords: ['preferences', 'options', 'config'],
        action: () => {
          onOpenSettings?.()
          onClose()
        },
      },
    ]

    return [...navCommands, ...actionCommands, ...settingsCommands]
  }, [projectId, navigate, onClose, isDarkMode, toggleTheme, onOpenSettings])

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands

    const searchLower = search.toLowerCase()
    return commands.filter(cmd => {
      const matchLabel = cmd.label.toLowerCase().includes(searchLower)
      const matchDesc = cmd.description?.toLowerCase().includes(searchLower)
      const matchKeywords = cmd.keywords?.some(kw => kw.toLowerCase().includes(searchLower))
      return matchLabel || matchDesc || matchKeywords
    })
  }, [commands, search])

  // Group filtered commands by category
  const groupedCommands = useMemo(() => {
    const groups: { category: string; commands: Command[] }[] = []
    const categoryOrder = ['navigation', 'action', 'settings']
    const categoryLabels: Record<string, string> = {
      navigation: 'Navigation',
      action: 'Actions',
      settings: 'Settings',
    }

    for (const category of categoryOrder) {
      const cmds = filteredCommands.filter(c => c.category === category)
      if (cmds.length > 0) {
        groups.push({ category: categoryLabels[category], commands: cmds })
      }
    }
    return groups
  }, [filteredCommands])

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isOpen])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }, [filteredCommands, selectedIndex, onClose])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  if (!isOpen) return null

  let currentIndex = 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-5 w-5 text-text-secondary flex-shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-secondary focus:outline-none"
            aria-label="Search commands"
          />
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-elevated transition-colors"
            aria-label="Close command palette"
          >
            <X className="h-4 w-4 text-text-secondary" />
          </button>
        </div>

        {/* Commands List */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-text-secondary">
              No commands found for "{search}"
            </div>
          ) : (
            groupedCommands.map(group => (
              <div key={group.category}>
                <div className="px-4 py-2 text-xs font-medium text-text-secondary uppercase tracking-wide">
                  {group.category}
                </div>
                {group.commands.map(cmd => {
                  const Icon = cmd.icon
                  const index = currentIndex++
                  return (
                    <button
                      key={cmd.id}
                      data-index={index}
                      onClick={cmd.action}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                        index === selectedIndex
                          ? 'bg-accent text-white'
                          : 'hover:bg-surface-elevated text-text-primary'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5 flex-shrink-0',
                          index === selectedIndex ? 'text-white' : 'text-text-secondary'
                        )}
                        aria-hidden="true"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{cmd.label}</div>
                        {cmd.description && (
                          <div
                            className={cn(
                              'text-sm truncate',
                              index === selectedIndex ? 'text-white/70' : 'text-text-secondary'
                            )}
                          >
                            {cmd.description}
                          </div>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <kbd
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded',
                            index === selectedIndex
                              ? 'bg-white/20 text-white'
                              : 'bg-surface-elevated text-text-secondary'
                          )}
                        >
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border bg-surface-elevated/50 text-xs text-text-secondary flex items-center gap-4">
          <span>
            <kbd className="px-1 py-0.5 bg-surface rounded">↑↓</kbd> Navigate
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-surface rounded">Enter</kbd> Select
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-surface rounded">Esc</kbd> Close
          </span>
        </div>
      </div>
    </div>
  )
}
