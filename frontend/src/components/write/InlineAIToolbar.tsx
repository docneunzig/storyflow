import { useState, useEffect, useRef } from 'react'
import { Sparkles, ArrowUpRight, ArrowDownRight, RefreshCw, X, Wand2 } from 'lucide-react'

interface InlineAIToolbarProps {
  selectedText: string
  selectionRect: DOMRect | null
  onExpand: () => void
  onCondense: () => void
  onRewrite: () => void
  onAlternatives: () => void
  onClose: () => void
  isGenerating?: boolean
}

export function InlineAIToolbar({
  selectedText,
  selectionRect,
  onExpand,
  onCondense,
  onRewrite,
  onAlternatives,
  onClose,
  isGenerating = false,
}: InlineAIToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  // Calculate position based on selection
  useEffect(() => {
    if (selectionRect && toolbarRef.current) {
      const toolbarHeight = toolbarRef.current.offsetHeight
      const toolbarWidth = toolbarRef.current.offsetWidth

      // Position above the selection
      let top = selectionRect.top - toolbarHeight - 8
      let left = selectionRect.left + (selectionRect.width / 2) - (toolbarWidth / 2)

      // If too close to top, position below
      if (top < 10) {
        top = selectionRect.bottom + 8
      }

      // Keep within viewport horizontally
      if (left < 10) left = 10
      if (left + toolbarWidth > window.innerWidth - 10) {
        left = window.innerWidth - toolbarWidth - 10
      }

      setPosition({ top, left })
    }
  }, [selectionRect])

  if (!selectedText || !selectionRect) return null

  const wordCount = selectedText.trim().split(/\s+/).length

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{ top: position.top, left: position.left }}
    >
      <div className="flex items-center gap-1 p-1.5 bg-surface border border-border rounded-lg shadow-xl">
        {/* AI Label */}
        <div className="flex items-center gap-1 px-2 py-1 text-xs text-accent border-r border-border mr-1">
          <Sparkles className="h-3 w-3" />
          <span>AI</span>
        </div>

        {/* Expand */}
        <button
          onClick={onExpand}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-text-primary hover:bg-surface-elevated rounded transition-colors disabled:opacity-50"
          title="Expand selection with more detail"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
          <span>Expand</span>
        </button>

        {/* Condense */}
        <button
          onClick={onCondense}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-text-primary hover:bg-surface-elevated rounded transition-colors disabled:opacity-50"
          title="Condense selection to be more concise"
        >
          <ArrowDownRight className="h-3.5 w-3.5" />
          <span>Condense</span>
        </button>

        {/* Rewrite */}
        <button
          onClick={onRewrite}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-text-primary hover:bg-surface-elevated rounded transition-colors disabled:opacity-50"
          title="Rewrite selection with different phrasing"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Rewrite</span>
        </button>

        {/* Generate Alternatives */}
        <button
          onClick={onAlternatives}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-text-primary hover:bg-surface-elevated rounded transition-colors disabled:opacity-50"
          title="Generate 3 alternative versions"
        >
          <Wand2 className="h-3.5 w-3.5" />
          <span>Alternatives</span>
        </button>

        {/* Word count */}
        <div className="px-2 py-1 text-xs text-text-secondary border-l border-border ml-1">
          {wordCount} word{wordCount !== 1 ? 's' : ''}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-1 text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded transition-colors ml-1"
          title="Close toolbar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// AI Action Options Modal - shown when generating alternatives
interface AIOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  options: string[]
  onSelect: (option: string) => void
  isLoading?: boolean
}

export function AIOptionsModal({
  isOpen,
  onClose,
  title,
  options,
  onSelect,
  isLoading = false,
}: AIOptionsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Sparkles className="h-8 w-8 text-accent animate-pulse mb-4" />
              <p className="text-text-secondary">Generating alternatives...</p>
            </div>
          ) : options.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary">No alternatives generated</p>
            </div>
          ) : (
            <div className="space-y-3">
              {options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => onSelect(option)}
                  className="w-full p-4 text-left bg-surface-elevated border border-border rounded-lg hover:border-accent hover:bg-accent/5 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <span className="text-xs text-accent font-medium mb-2 block">
                        Option {index + 1}
                      </span>
                      <p className="text-sm text-text-primary whitespace-pre-wrap">
                        {option}
                      </p>
                    </div>
                    <span className="text-xs text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to use
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-elevated transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
