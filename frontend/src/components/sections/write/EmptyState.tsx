import { Plus, BookOpen } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'

interface EmptyStateProps {
  hasChapters: boolean
  onCreateChapter: () => void
}

export function EmptyState({ hasChapters, onCreateChapter }: EmptyStateProps) {
  const t = useLanguageStore((state) => state.t)

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-lg">
        {/* Illustration */}
        <div className="relative mx-auto w-32 h-32 mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-purple-500/20 rounded-full blur-xl" />
          <div className="relative bg-surface-elevated rounded-full p-8 border border-border">
            <BookOpen className="h-16 w-16 text-accent" aria-hidden="true" />
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-text-primary mb-3">
          {!hasChapters ? t.emptyStates.startWriting : t.write.selectChapter}
        </h2>
        <p className="text-text-secondary mb-6">
          {!hasChapters
            ? t.write.createFirstChapter
            : t.write.selectChapter}
        </p>

        {!hasChapters ? (
          <button
            onClick={onCreateChapter}
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-all hover:scale-105 shadow-lg shadow-accent/20"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            {t.write.createFirstChapter}
          </button>
        ) : (
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="flex justify-center gap-3">
              <div className="px-4 py-2 bg-surface-elevated rounded-lg border border-border text-sm text-text-secondary">
                <span className="text-text-primary font-medium">↑↓</span> Navigate chapters
              </div>
              <div className="px-4 py-2 bg-surface-elevated rounded-lg border border-border text-sm text-text-secondary">
                <span className="text-text-primary font-medium">Enter</span> Open chapter
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
