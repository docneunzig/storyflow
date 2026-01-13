import { History, X, Star, ArrowRight } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'
import type { Chapter, RevisionHistory } from '@/types/project'
import { getQualityColor } from './constants'

interface RevisionHistoryModalProps {
  isOpen: boolean
  chapter: Chapter
  revisions: RevisionHistory[]
  latestQualityScore: number | null
  onClose: () => void
}

export function RevisionHistoryModal({
  isOpen,
  chapter,
  revisions,
  latestQualityScore,
  onClose,
}: RevisionHistoryModalProps) {
  const t = useLanguageStore((state) => state.t)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-purple-400" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-text-primary">
              Revision History - {chapter.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
            aria-label={t.actions.close}
          >
            <X className="h-5 w-5 text-text-secondary" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {revisions.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-text-secondary mx-auto mb-4" aria-hidden="true" />
              <p className="text-text-secondary">No revision history yet</p>
              <p className="text-sm text-text-secondary mt-2">
                Revisions are recorded when chapter content changes
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current version */}
              <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-accent">
                    Current Version (Rev {chapter.currentRevision || 0})
                  </span>
                  <span className="text-xs text-text-secondary">
                    {chapter.wordCount.toLocaleString()} {t.write.wordCount}
                  </span>
                </div>
                {latestQualityScore !== null && (
                  <div className="flex items-center gap-1.5 mb-2 text-sm">
                    <Star className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
                    <span className={getQualityColor(latestQualityScore)}>
                      {latestQualityScore.toFixed(1)}/10
                    </span>
                    <span className="text-text-secondary text-xs">quality score</span>
                  </div>
                )}
                <p className="text-sm text-text-secondary line-clamp-2">
                  {chapter.content?.substring(0, 200) || 'No content'}...
                </p>
              </div>

              {/* Previous revisions */}
              {revisions.map((revision, index) => {
                const scoreAfter = index === 0
                  ? latestQualityScore
                  : revisions[index - 1].qualityScoreBefore
                const scoreBefore = revision.qualityScoreBefore

                return (
                  <div
                    key={`${revision.chapterId}-${revision.revisionNumber}`}
                    className="p-4 bg-surface-elevated border border-border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-400">
                        Revision {revision.revisionNumber}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {new Date(revision.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {/* Quality score comparison */}
                    {(scoreBefore > 0 || (scoreAfter && scoreAfter > 0)) && (
                      <div className="flex items-center gap-2 mb-2 text-sm">
                        <Star className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
                        <span className={`${scoreBefore > 0 ? getQualityColor(scoreBefore) : 'text-text-secondary'}`}>
                          {scoreBefore > 0 ? scoreBefore.toFixed(1) : '—'}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
                        <span className={`${scoreAfter && scoreAfter > 0 ? getQualityColor(scoreAfter) : 'text-text-secondary'}`}>
                          {scoreAfter && scoreAfter > 0 ? scoreAfter.toFixed(1) : '—'}
                        </span>
                        {scoreBefore > 0 && scoreAfter && scoreAfter > 0 && (
                          <span className={`text-xs ${scoreAfter > scoreBefore ? 'text-success' : scoreAfter < scoreBefore ? 'text-error' : 'text-text-secondary'}`}>
                            ({scoreAfter > scoreBefore ? '+' : ''}{(scoreAfter - scoreBefore).toFixed(1)})
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-sm text-text-secondary line-clamp-2">
                      {revision.previousContent?.substring(0, 200) || 'No content'}...
                    </p>
                    <div className="mt-2 text-xs text-text-secondary">
                      {revision.previousContent?.split(/\s+/).length.toLocaleString() || 0} {t.write.wordCount}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-elevated transition-colors"
          >
            {t.actions.close}
          </button>
        </div>
      </div>
    </div>
  )
}
