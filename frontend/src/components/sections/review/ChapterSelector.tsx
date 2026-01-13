import { BookOpen, Lock } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'
import type { Chapter } from '@/types/project'

interface ChapterSelectorProps {
  chapters: Chapter[]
  selectedChapterId: string | null
  onSelectChapter: (id: string) => void
}

export function ChapterSelector({
  chapters,
  selectedChapterId,
  onSelectChapter,
}: ChapterSelectorProps) {
  const t = useLanguageStore((state) => state.t)

  return (
    <div className="w-72 border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold text-text-primary">{t.review.title}</h2>
        <p className="text-xs text-text-secondary">
          {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} available
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chapters.length === 0 ? (
          <div className="p-4 text-center">
            <BookOpen className="h-8 w-8 text-text-secondary mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-text-secondary">
              No chapters yet. Create chapters in the Write section to review them.
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {chapters.map(chapter => (
              <button
                key={chapter.id}
                onClick={() => onSelectChapter(chapter.id)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedChapterId === chapter.id
                    ? 'bg-accent/20 border border-accent/30'
                    : 'hover:bg-surface-elevated border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary font-medium">
                    Ch. {chapter.number}
                  </span>
                  {chapter.status === 'locked' && (
                    <Lock className="h-3 w-3 text-purple-400" aria-hidden="true" />
                  )}
                </div>
                <h3 className="font-medium text-text-primary text-sm truncate">
                  {chapter.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-text-secondary">
                    {chapter.wordCount.toLocaleString()} words
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
