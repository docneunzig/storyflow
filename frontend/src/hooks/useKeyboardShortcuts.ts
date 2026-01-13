import { useEffect, useCallback } from 'react'

// Keyboard shortcut actions
export interface ShortcutActions {
  onContinueWriting?: () => void
  onSave?: () => void
  onNewChapter?: () => void
  onSearch?: () => void
  onTogglePreview?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onEscape?: () => void
  onExpandSelection?: () => void
  onRewriteSelection?: () => void
  onGenerateDraft?: () => void
}

// Platform-aware modifier key display
export function getModifierKey(): string {
  if (typeof navigator === 'undefined') return 'Ctrl'
  return navigator.platform?.includes('Mac') ? 'Cmd' : 'Ctrl'
}

// Common keyboard shortcut definitions
export const SHORTCUTS = {
  save: { key: 's', mod: true, label: 'Save' },
  continueWriting: { key: 'Enter', mod: true, label: 'Continue Writing' },
  newChapter: { key: 'n', mod: true, shift: true, label: 'New Chapter' },
  search: { key: 'k', mod: true, label: 'Search' },
  togglePreview: { key: 'p', mod: true, label: 'Toggle Preview' },
  undo: { key: 'z', mod: true, label: 'Undo' },
  redo: { key: 'z', mod: true, shift: true, label: 'Redo' },
  escape: { key: 'Escape', mod: false, label: 'Cancel / Close' },
  expandSelection: { key: 'e', mod: true, label: 'Expand Selection' },
  rewriteSelection: { key: 'r', mod: true, shift: true, label: 'Rewrite Selection' },
  generateDraft: { key: 'g', mod: true, label: 'Generate Draft' },
} as const

// Format shortcut for display (e.g., "Cmd+S" or "Ctrl+S")
export function formatShortcut(shortcut: { key: string; mod?: boolean; shift?: boolean }): string {
  const parts: string[] = []
  const mod = getModifierKey()

  if (shortcut.mod) parts.push(mod)
  if (shortcut.shift) parts.push('Shift')

  // Format the key nicely
  let keyDisplay = shortcut.key
  if (keyDisplay === 'Enter') keyDisplay = 'Enter'
  else if (keyDisplay === 'Escape') keyDisplay = 'Esc'
  else keyDisplay = keyDisplay.toUpperCase()

  parts.push(keyDisplay)
  return parts.join('+')
}

// Hook for registering keyboard shortcuts
export function useKeyboardShortcuts(actions: ShortcutActions, enabled = true) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return

    // Check if user is typing in an input/textarea/contenteditable
    const target = e.target as HTMLElement
    const isEditing = target.tagName === 'INPUT' ||
                      target.tagName === 'TEXTAREA' ||
                      target.isContentEditable

    const isMod = e.metaKey || e.ctrlKey

    // Escape always works
    if (e.key === 'Escape' && actions.onEscape) {
      actions.onEscape()
      return
    }

    // Save works everywhere
    if (isMod && e.key === 's' && actions.onSave) {
      e.preventDefault()
      actions.onSave()
      return
    }

    // Continue writing (Mod+Enter)
    if (isMod && e.key === 'Enter' && actions.onContinueWriting) {
      e.preventDefault()
      actions.onContinueWriting()
      return
    }

    // Only process other shortcuts when not editing
    if (isEditing) return

    // New chapter (Mod+Shift+N)
    if (isMod && e.shiftKey && e.key.toLowerCase() === 'n' && actions.onNewChapter) {
      e.preventDefault()
      actions.onNewChapter()
      return
    }

    // Search (Mod+K)
    if (isMod && e.key.toLowerCase() === 'k' && actions.onSearch) {
      e.preventDefault()
      actions.onSearch()
      return
    }

    // Toggle preview (Mod+P)
    if (isMod && e.key.toLowerCase() === 'p' && actions.onTogglePreview) {
      e.preventDefault()
      actions.onTogglePreview()
      return
    }

    // Expand selection (Mod+E)
    if (isMod && e.key.toLowerCase() === 'e' && actions.onExpandSelection) {
      e.preventDefault()
      actions.onExpandSelection()
      return
    }

    // Rewrite selection (Mod+Shift+R)
    if (isMod && e.shiftKey && e.key.toLowerCase() === 'r' && actions.onRewriteSelection) {
      e.preventDefault()
      actions.onRewriteSelection()
      return
    }

    // Generate draft (Mod+G)
    if (isMod && e.key.toLowerCase() === 'g' && actions.onGenerateDraft) {
      e.preventDefault()
      actions.onGenerateDraft()
      return
    }
  }, [enabled, actions])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Get shortcut display text for use in tooltips/labels
export function getShortcutDisplay(shortcut: keyof typeof SHORTCUTS): string {
  const def = SHORTCUTS[shortcut]
  return formatShortcut(def)
}
