import { History, X, Play, Wand2, Sparkles } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'
import type { Chapter, Scene } from '@/types/project'
import { UnifiedActionButton } from '@/components/ui/UnifiedActionButton'
import { STATUS_COLORS } from './constants'

interface ChapterHeaderProps {
  chapter: Chapter
  chapterScenes: Scene[]
  scenesWordCount: number
  isGenerating: boolean
  guidedMode: boolean
  onEdit: () => void
  onShowRevisionHistory: () => void
  onContinueWriting: () => void
  onGenerateChapterDraft: () => void
  onToggleGuidedMode: () => void
}

export function ChapterHeader({
  chapter,
  chapterScenes,
  scenesWordCount,
  isGenerating,
  guidedMode,
  onEdit,
  onShowRevisionHistory,
  onContinueWriting,
  onGenerateChapterDraft,
  onToggleGuidedMode,
}: ChapterHeaderProps) {
  const t = useLanguageStore((state) => state.t)

  return (
    <div className="p-4 border-b border-border">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-text-secondary mb-1">
            <span>Chapter {chapter.number}</span>
            <span className={`px-2 py-0.5 rounded border ${STATUS_COLORS[chapter.status]}`}>
              {t.status[chapter.status as keyof typeof t.status] || chapter.status}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-text-primary">
            {chapter.title}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-text-secondary">
            <span>{chapter.wordCount.toLocaleString()} {t.write.wordCount}</span>
            {chapterScenes.length > 0 && (
              <span className="ml-2 text-accent">
                ({chapterScenes.length} scene{chapterScenes.length !== 1 ? 's' : ''}, ~{scenesWordCount.toLocaleString()} est.)
              </span>
            )}
          </div>
          {/* Revision count indicator */}
          {(chapter.currentRevision || 0) > 0 && (
            <button
              onClick={onShowRevisionHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-400 border border-purple-500/30 bg-purple-500/10 rounded-lg hover:bg-purple-500/20 transition-colors"
              title="View revision history"
            >
              <History className="h-4 w-4" aria-hidden="true" />
              Rev {chapter.currentRevision}
            </button>
          )}
          <button
            onClick={onEdit}
            className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-surface-elevated transition-colors"
          >
            {t.actions.edit}
          </button>
          {/* AI Action Buttons */}
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
            {guidedMode ? (
              <button
                onClick={onToggleGuidedMode}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                <X className="h-4 w-4" />
                Exit Guided Mode
              </button>
            ) : (
              <UnifiedActionButton
                primaryAction={{
                  id: 'continue-writing',
                  label: 'Continue Writing',
                  icon: Play,
                  onClick: onContinueWriting,
                  disabled: isGenerating,
                }}
                secondaryActions={[
                  {
                    id: 'generate-draft',
                    label: 'Generate Full Draft',
                    description: 'Create a complete draft from scene outlines',
                    icon: Wand2,
                    onClick: onGenerateChapterDraft,
                    disabled: isGenerating || chapterScenes.length === 0,
                  },
                  {
                    id: 'guided-generation',
                    label: 'Guided Generation',
                    description: 'Scene-by-scene AI writing with approval workflow',
                    icon: Sparkles,
                    onClick: onToggleGuidedMode,
                    disabled: chapterScenes.length === 0,
                    variant: 'accent',
                  },
                ]}
                size="sm"
                disabled={isGenerating}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
