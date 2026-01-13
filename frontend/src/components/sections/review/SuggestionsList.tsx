import { Check, X, Edit2, ArrowUp, ArrowDown } from 'lucide-react'
import type { PrioritizedSuggestion } from './types'

interface SuggestionsListProps {
  suggestions: PrioritizedSuggestion[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onEdit: (id: string) => void
  editingId: string | null
  editingText: string
  onEditChange: (text: string) => void
  onEditSave: () => void
  onEditCancel: () => void
}

function getImpactIcon(impact: 'high' | 'medium' | 'low') {
  switch (impact) {
    case 'high':
      return <ArrowUp className="h-3 w-3 text-error" />
    case 'medium':
      return <ArrowDown className="h-3 w-3 text-warning rotate-0" style={{ transform: 'rotate(90deg)' }} />
    case 'low':
      return <ArrowDown className="h-3 w-3 text-text-secondary" />
  }
}

function getImpactColor(impact: 'high' | 'medium' | 'low') {
  switch (impact) {
    case 'high':
      return 'bg-error/10 text-error border-error/30'
    case 'medium':
      return 'bg-warning/10 text-warning border-warning/30'
    case 'low':
      return 'bg-surface-elevated text-text-secondary border-border'
  }
}

export function SuggestionsList({
  suggestions,
  onApprove,
  onReject,
  onEdit,
  editingId,
  editingText,
  onEditChange,
  onEditSave,
  onEditCancel,
}: SuggestionsListProps) {
  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary">No suggestions available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          className={`p-4 rounded-lg border ${
            suggestion.status === 'approved'
              ? 'bg-success/10 border-success/30'
              : suggestion.status === 'rejected'
              ? 'bg-error/10 border-error/30 opacity-50'
              : 'bg-surface-elevated border-border'
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Impact Badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${getImpactColor(suggestion.impact)}`}>
              {getImpactIcon(suggestion.impact)}
              {suggestion.impact}
            </span>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {editingId === suggestion.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editingText}
                    onChange={(e) => onEditChange(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={onEditSave}
                      className="px-3 py-1 text-sm bg-accent text-white rounded hover:bg-accent/90"
                    >
                      Save
                    </button>
                    <button
                      onClick={onEditCancel}
                      className="px-3 py-1 text-sm border border-border rounded hover:bg-surface"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-text-primary">{suggestion.suggestion}</p>
                  <p className="text-xs text-text-secondary mt-1">
                    {suggestion.dimensionName} • {suggestion.reason}
                  </p>
                </>
              )}
            </div>

            {/* Actions */}
            {editingId !== suggestion.id && suggestion.status === 'pending' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onApprove(suggestion.id)}
                  className="p-1.5 rounded hover:bg-success/20 text-text-secondary hover:text-success transition-colors"
                  title="Approve"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onEdit(suggestion.id)}
                  className="p-1.5 rounded hover:bg-accent/20 text-text-secondary hover:text-accent transition-colors"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onReject(suggestion.id)}
                  className="p-1.5 rounded hover:bg-error/20 text-text-secondary hover:text-error transition-colors"
                  title="Reject"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
