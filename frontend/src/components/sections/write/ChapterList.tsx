import { Plus, BookOpen, Edit2, Trash2, Lock } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'
import type { Chapter } from '@/types/project'
import { StatusBadge } from './StatusBadge'

interface ChapterListProps {
  chapters: Chapter[]
  selectedChapterId: string | null
  deleteConfirmId: string | null
  totalWords: number
  onSelectChapter: (id: string) => void
  onCreateChapter: () => void
  onEditChapter: (chapter: Chapter) => void
  onDeleteChapter: (id: string) => void
  onConfirmDelete: (id: string | null) => void
}

export function ChapterList({
  chapters,
  selectedChapterId,
  deleteConfirmId,
  totalWords,
  onSelectChapter,
  onCreateChapter,
  onEditChapter,
  onDeleteChapter,
  onConfirmDelete,
}: ChapterListProps) {
  const t = useLanguageStore((state) => state.t)

  return (
    <div className="w-72 border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold text-text-primary">{t.write.title}</h1>
          <button
            onClick={onCreateChapter}
            className="p-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            title={t.actions.create}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <p className="text-xs text-text-secondary">
          {chapters.length} | {totalWords.toLocaleString()} {t.write.wordCount}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chapters.length === 0 ? (
          <div className="p-4 text-center">
            <BookOpen className="h-8 w-8 text-text-secondary mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-text-secondary mb-3">{t.write.noChaptersYet}</p>
            <button
              onClick={onCreateChapter}
              className="text-sm text-accent hover:underline"
            >
              {t.write.createFirstChapter}
            </button>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {chapters.map(chapter => (
              <div
                key={chapter.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                  selectedChapterId === chapter.id
                    ? 'bg-accent/20 border border-accent/30'
                    : 'hover:bg-surface-elevated border border-transparent'
                }`}
                onClick={() => onSelectChapter(chapter.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
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
                      <StatusBadge status={chapter.status} />
                      <span className="text-xs text-text-secondary">
                        {chapter.wordCount.toLocaleString()} {t.write.wordCount}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditChapter(chapter)
                      }}
                      className="p-1 rounded hover:bg-surface transition-colors"
                      aria-label={t.actions.edit}
                      title={t.actions.edit}
                    >
                      <Edit2 className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
                    </button>
                    {deleteConfirmId === chapter.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onDeleteChapter(chapter.id)}
                          className="px-1.5 py-0.5 text-xs bg-error text-white rounded hover:bg-error/90"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => onConfirmDelete(null)}
                          className="px-1.5 py-0.5 text-xs border border-border rounded hover:bg-surface"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onConfirmDelete(chapter.id)
                        }}
                        className="p-1 rounded hover:bg-error/10 transition-colors"
                        aria-label={t.actions.delete}
                        title={t.actions.delete}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-error" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
