import { useState, useEffect, useCallback } from 'react'
import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Footer } from './Footer'
import { CommandPalette } from '@/components/ui/CommandPalette'
import { SettingsModal } from '@/components/ui/SettingsModal'
import { UnsavedChangesModal } from '@/components/ui/UnsavedChangesModal'
import { FindDialog } from '@/components/ui/FindDialog'
import { useProjectStore } from '@/stores/projectStore'
import { toast } from '@/components/ui/Toaster'

// Navigation sections mapped to number keys
const NAV_SHORTCUTS: Record<string, string> = {
  '1': 'specification',
  '2': 'plot',
  '3': 'characters',
  '4': 'scenes',
  '5': 'write',
  '6': 'review',
  '7': 'export',
}

export function Layout() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [isFindOpen, setIsFindOpen] = useState(false)
  const { saveStatus, setSaveStatus } = useProjectStore()

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
        toast({ title: 'Saved', description: 'All changes are saved' })
      } else {
        toast({ title: 'Saving...', description: 'Saving your changes' })
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
    // F11 - Toggle focus mode (distraction-free writing)
    if (e.key === 'F11') {
      e.preventDefault()
      const newMode = !isFocusMode
      setIsFocusMode(newMode)
      toast({
        title: newMode ? 'Focus Mode' : 'Normal Mode',
        description: newMode ? 'Press F11 or Escape to exit' : 'Sidebar and footer restored',
      })
    }
    // Escape - Exit focus mode (in addition to closing modals)
    if (e.key === 'Escape' && isFocusMode) {
      setIsFocusMode(false)
      toast({
        title: 'Normal Mode',
        description: 'Sidebar and footer restored',
      })
    }
  }, [saveStatus, projectId, navigate, isFocusMode])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header hidden in focus mode */}
      {!isFocusMode && <Header projectId={projectId} currentSection={currentSection} />}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar hidden in focus mode */}
        {!isFocusMode && <Sidebar projectId={projectId} />}
        <main
          className={`flex-1 overflow-auto ${isFocusMode ? 'p-12 max-w-4xl mx-auto' : 'p-6'}`}
          role="main"
          aria-label="Main content"
        >
          <Outlet />
        </main>
      </div>
      {/* Footer hidden in focus mode */}
      {!isFocusMode && <Footer />}

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
    </div>
  )
}
