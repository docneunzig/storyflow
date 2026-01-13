import { ChevronDown, ChevronUp } from 'lucide-react'
import { CircularProgress } from '@/components/ui/CircularProgress'
import { QUALITY_DIMENSIONS } from './constants'
import type { DimensionScore } from './types'

interface DimensionCardProps {
  dimensionScore: DimensionScore
  isExpanded: boolean
  onToggleExpanded: () => void
}

export function DimensionCard({
  dimensionScore,
  isExpanded,
  onToggleExpanded,
}: DimensionCardProps) {
  const dimension = QUALITY_DIMENSIONS.find(d => d.id === dimensionScore.dimensionId)
  if (!dimension) return null

  return (
    <div className="bg-surface-elevated rounded-lg border border-border overflow-hidden">
      <button
        onClick={onToggleExpanded}
        className="w-full p-4 flex items-center gap-4 hover:bg-surface transition-colors"
        aria-expanded={isExpanded}
      >
        <div className={`${dimension.color}`}>
          {dimension.icon}
        </div>
        <div className="flex-1 text-left">
          <h4 className="text-sm font-medium text-text-primary">{dimension.name}</h4>
          <p className="text-xs text-text-secondary">{dimension.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <CircularProgress
            value={dimensionScore.score}
            size="sm"
            showLabel={true}
          />
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-text-secondary" />
          ) : (
            <ChevronDown className="h-4 w-4 text-text-secondary" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border/50">
          <p className="text-sm text-text-secondary mt-3">{dimensionScore.feedback}</p>
          {dimensionScore.suggestions.length > 0 && (
            <div className="mt-3">
              <h5 className="text-xs font-medium text-text-primary mb-2">Suggestions:</h5>
              <ul className="space-y-1">
                {dimensionScore.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-sm text-text-secondary flex items-start gap-2">
                    <span className="text-accent">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
