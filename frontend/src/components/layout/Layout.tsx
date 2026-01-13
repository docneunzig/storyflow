import { useState, useEffect, useCallback } from 'react'
import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Footer } from './Footer'
import { CommandPalette } from '@/components/ui/CommandPalette'
import { SettingsModal } from '@/components/ui/SettingsModal'
import { UnsavedChangesModal } from '@/components/ui/UnsavedChangesModal'
import { FindDialog } from '@/components/ui/FindDialog'
import { AIGenerationModal } from '@/components/ui/AIGenerationModal'
import { KeyboardShortcutsModal } from '@/components/ui/KeyboardShortcutsModal'
import { VersionHistoryModal } from '@/components/ui/VersionHistoryModal'
import { WelcomeOverlay } from '@/components/ui/WelcomeOverlay'
import { useOnboarding } from '@/hooks/useOnboarding'
import { useProjectStore } from '@/stores/projectStore'
import { useLanguageStore } from '@/stores/languageStore'
import { toast } from '@/components/ui/Toaster'

// Navigation sections mapped to number keys
const NAV_SHORTCUTS: Record<string, string> = {
  '1': 'specification',
  '2': 'brainstorm',
  '3': 'plot',
  '4': 'characters',
  '5': 'scenes',
  '6': 'write',
  '7': 'review',
  '8': 'export',
}

export function Layout() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [isFindOpen, setIsFindOpen] = useState(false)
  const [isAIGenerationOpen, setIsAIGenerationOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const { saveStatus, currentProject } = useProjectStore()
  const { isFirstTime, isDismissed } = useOnboarding()
  const t = useLanguageStore((state) => state.t)

  // Show welcome overlay for first-time users
  useEffect(() => {
    if (isFirstTime && projectId && !isDismissed) {
      // Small delay to let the page render first
      const timer = setTimeout(() => setShowWelcome(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [isFirstTime, projectId, isDismissed])

  // Extract current section from URL path
  const getCurrentSection = () => {
    const pathParts = location.pathname.split('/')
    // URL format: /projects/:projectId/:section
    if (pathParts.length >= 4) {
      return pathParts[3] // section name
    }
    return undefined
  }
  const currentSection = getCurrentSection()

  // Global keyboard shortcut for command palette (Cmd+/ or Ctrl+/)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Cmd+/ or Ctrl+/
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault()
      setIsCommandPaletteOpen(prev => !prev)
    }
    // Cmd+K as alternative (common pattern)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setIsCommandPaletteOpen(prev => !prev)
    }
    // Cmd+S or Ctrl+S - Save project
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      // Dispatch a custom event that sections can listen to for immediate save
      window.dispatchEvent(new CustomEvent('storyflow:save'))
      // Show feedback based on current save status
      if (saveStatus === 'saved') {
        toast({ title: t.toasts.saved, description: t.toasts.allChangesSaved })
      } else {
        toast({ title: t.toasts.saving, description: t.toasts.savingChanges })
      }
    }
    // Cmd+1 through Cmd+7 - Navigate to sections
    if ((e.metaKey || e.ctrlKey) && NAV_SHORTCUTS[e.key] && projectId) {
      e.preventDefault()
      navigate(`/projects/${projectId}/${NAV_SHORTCUTS[e.key]}`)
    }
    // Cmd+E - Navigate to Export
    if ((e.metaKey || e.ctrlKey) && e.key === 'e' && projectId) {
      e.preventDefault()
      navigate(`/projects/${projectId}/export`)
    }
    // Cmd+F - Open Find in Document
    if ((e.metaKey || e.ctrlKey) && e.key === 'f' && projectId) {
      e.preventDefault()
      setIsFindOpen(true)
    }
    // Cmd+Enter - Open AI Generation modal
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && projectId) {
      e.preventDefault()
      setIsAIGenerationOpen(true)
    }
    // F11 - Toggle focus mode (distraction-free writing)
    if (e.key === 'F11') {
      e.preventDefault()
      const newMode = !isFocusMode
      setIsFocusMode(newMode)
      toast({
        title: newMode ? t.toasts.focusMode : t.toasts.normalMode,
        description: newMode ? t.toasts.focusModeExit : t.toasts.sidebarRestored,
      })
    }
    // Escape - Exit focus mode (in addition to closing modals)
    if (e.key === 'Escape' && isFocusMode) {
      setIsFocusMode(false)
      toast({
        title: t.toasts.normalMode,
        description: t.toasts.sidebarRestored,
      })
    }
    // Cmd+Shift+H - Open Version History
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'h' && projectId) {
      e.preventDefault()
      setIsVersionHistoryOpen(true)
    }
    // ? - Show keyboard shortcuts (when not typing in an input)
    const target = e.target as HTMLElement
    const isEditing = target.tagName === 'INPUT' ||
                      target.tagName === 'TEXTAREA' ||
                      target.isContentEditable
    if (e.key === '?' && !isEditing) {
      e.preventDefault()
      setIsShortcutsOpen(true)
    }
  }, [saveStatus, projectId, navigate, isFocusMode, t])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Calculate word count for focus mode display
  const totalWords = currentProject?.chapters?.reduce((sum, ch) => sum + (ch.wordCount || 0), 0) || 0

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with transition */}
      <div className={`transition-all duration-300 ease-in-out ${isFocusMode ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
        <Header projectId={projectId} currentSection={currentSection} />
      </div>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with transition */}
        <div className={`transition-all duration-300 ease-in-out ${isFocusMode ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
          <Sidebar projectId={projectId} />
        </div>
        <main
          className={`flex-1 overflow-auto transition-all duration-300 ease-in-out ${isFocusMode ? 'p-12 max-w-3xl mx-auto' : 'p-6'}`}
          role="main"
          aria-label={t.ariaLabels.mainContent}
        >
          <Outlet />
        </main>
      </div>
      {/* Footer with transition */}
      <div className={`transition-all duration-300 ease-in-out ${isFocusMode ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
        <Footer />
      </div>

      {/* Focus Mode Floating Toolbar */}
      {isFocusMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-2 bg-surface/90 backdrop-blur-sm border border-border rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="text-xs text-text-secondary">
            {totalWords.toLocaleString()} words
          </span>
          <div className="w-px h-4 bg-border" />
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('storyflow:save'))
              toast({ title: t.toasts.saving, description: t.toasts.savingChanges })
            }}
            className="text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            Save (⌘S)
          </button>
          <div className="w-px h-4 bg-border" />
          <button
            onClick={() => {
              setIsFocusMode(false)
              toast({
                title: t.toasts.normalMode,
                description: t.toasts.sidebarRestored,
              })
            }}
            className="text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            Exit (Esc)
          </button>
        </div>
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Unsaved Changes Warning Modal */}
      <UnsavedChangesModal />

      {/* Find Dialog */}
      <FindDialog
        isOpen={isFindOpen}
        onClose={() => setIsFindOpen(false)}
      />

      {/* AI Generation Modal */}
      <AIGenerationModal
        isOpen={isAIGenerationOpen}
        onClose={() => setIsAIGenerationOpen(false)}
        project={currentProject}
        currentSection={currentSection}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Version History Modal */}
      {projectId && (
        <VersionHistoryModal
          isOpen={isVersionHistoryOpen}
          onClose={() => setIsVersionHistoryOpen(false)}
          projectId={projectId}
        />
      )}

      {/* Welcome Overlay for first-time users */}
      {showWelcome && (
        <WelcomeOverlay onClose={() => setShowWelcome(false)} />
      )}
    </div>
  )
}
