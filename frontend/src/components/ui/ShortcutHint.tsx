import { SHORTCUTS, formatShortcut } from '@/hooks/useKeyboardShortcuts'

interface ShortcutHintProps {
  shortcut: keyof typeof SHORTCUTS
  className?: string
}

// Display a keyboard shortcut hint as a styled kbd element
export function ShortcutHint({ shortcut, className = '' }: ShortcutHintProps) {
  const def = SHORTCUTS[shortcut]
  return (
    <kbd className={`ml-auto text-xs text-text-secondary bg-surface-elevated px-1.5 py-0.5 rounded border border-border font-mono ${className}`}>
      {formatShortcut(def)}
    </kbd>
  )
}

// Inline shortcut hint for use in tooltips or inline text
export function ShortcutHintInline({ shortcut, className = '' }: ShortcutHintProps) {
  const def = SHORTCUTS[shortcut]
  return (
    <span className={`text-xs text-text-secondary ${className}`}>
      ({formatShortcut(def)})
    </span>
  )
}
