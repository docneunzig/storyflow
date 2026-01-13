import { useEffect } from 'react'
import { X, Keyboard } from 'lucide-react'
import { getModifierKey } from '@/hooks/useKeyboardShortcuts'

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

// Shortcut categories with their shortcuts
const SHORTCUT_CATEGORIES = [
  {
    name: 'General',
    shortcuts: [
      { keys: ['mod', 'S'], description: 'Save project' },
      { keys: ['mod', 'K'], description: 'Open command palette' },
      { keys: ['mod', '/'], description: 'Open command palette (alt)' },
      { keys: ['mod', 'F'], description: 'Find in document' },
      { keys: ['mod', 'Shift', 'H'], description: 'Version history' },
      { keys: ['Esc'], description: 'Close modal / Cancel' },
      { keys: ['F11'], description: 'Toggle focus mode' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
    ],
  },
  {
    name: 'Navigation',
    shortcuts: [
      { keys: ['mod', '1'], description: 'Go to Specification' },
      { keys: ['mod', '2'], description: 'Go to Brainstorm' },
      { keys: ['mod', '3'], description: 'Go to Plot' },
      { keys: ['mod', '4'], description: 'Go to Characters' },
      { keys: ['mod', '5'], description: 'Go to Scenes' },
      { keys: ['mod', '6'], description: 'Go to Write' },
      { keys: ['mod', '7'], description: 'Go to Review' },
      { keys: ['mod', '8'], description: 'Go to Wiki' },
    ],
  },
  {
    name: 'Writing',
    shortcuts: [
      { keys: ['mod', 'Enter'], description: 'Open AI generation modal' },
      { keys: ['mod', 'G'], description: 'Generate draft' },
      { keys: ['mod', 'E'], description: 'Expand selection with AI' },
      { keys: ['mod', 'Shift', 'R'], description: 'Rewrite selection with AI' },
      { keys: ['mod', 'Shift', 'N'], description: 'New chapter' },
      { keys: ['mod', 'P'], description: 'Toggle preview' },
    ],
  },
  {
    name: 'Editing',
    shortcuts: [
      { keys: ['mod', 'Z'], description: 'Undo' },
      { keys: ['mod', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['mod', 'A'], description: 'Select all' },
      { keys: ['mod', 'C'], description: 'Copy' },
      { keys: ['mod', 'V'], description: 'Paste' },
      { keys: ['mod', 'X'], description: 'Cut' },
    ],
  },
]

function KeyCombo({ keys }: { keys: string[] }) {
  const mod = getModifierKey()

  return (
    <span className="flex items-center gap-1">
      {keys.map((key, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && <span className="text-text-secondary">+</span>}
          <kbd className="px-2 py-1 text-xs font-mono bg-surface border border-border rounded shadow-sm text-text-primary">
            {key === 'mod' ? mod : key}
          </kbd>
        </span>
      ))}
    </span>
  )
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-accent" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-text-primary">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-elevated transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-text-secondary" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {SHORTCUT_CATEGORIES.map((category) => (
              <div key={category.name}>
                <h3 className="text-sm font-semibold text-accent mb-3">
                  {category.name}
                </h3>
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-1.5"
                    >
                      <span className="text-sm text-text-secondary">
                        {shortcut.description}
                      </span>
                      <KeyCombo keys={shortcut.keys} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-text-secondary text-center">
              Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-surface border border-border rounded">?</kbd> at any time to view this help
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
