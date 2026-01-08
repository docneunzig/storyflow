import { useState, useEffect, useCallback } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Footer } from './Footer'
import { CommandPalette } from '@/components/ui/CommandPalette'
import { SettingsModal } from '@/components/ui/SettingsModal'
import { useProjectStore } from '@/stores/projectStore'
import { toast } from '@/components/ui/Toaster'

export function Layout() {
  const { projectId } = useParams<{ projectId: string }>()
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { saveStatus, setSaveStatus } = useProjectStore()

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
  }, [saveStatus])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header projectId={projectId} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar projectId={projectId} />
        <main className="flex-1 overflow-auto p-6" role="main" aria-label="Main content">
          <Outlet />
        </main>
      </div>
      <Footer />

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
    </div>
  )
}
