import { Film, ChevronDown, ChevronUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLanguageStore } from '@/stores/languageStore'
import type { Scene } from '@/types/project'

interface ChapterScenesProps {
  projectId: string
  scenes: Scene[]
  isExpanded: boolean
  onToggleExpanded: () => void
}

export function ChapterScenes({
  projectId,
  scenes,
  isExpanded,
  onToggleExpanded,
}: ChapterScenesProps) {
  const t = useLanguageStore((state) => state.t)
  const navigate = useNavigate()

  if (scenes.length === 0) {
    return null
  }

  return (
    <div className="border-b border-border bg-surface-elevated/30">
      <button
        onClick={onToggleExpanded}
        className="w-full px-6 py-3 flex items-center justify-between hover:bg-surface-elevated/50 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="chapter-scenes-content"
      >
        <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
          <Film className="h-4 w-4" aria-hidden="true" />
          Scenes in this chapter ({scenes.length})
        </h3>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-text-secondary" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 text-text-secondary" aria-hidden="true" />
        )}
      </button>
      {isExpanded && (
        <div id="chapter-scenes-content" className="px-6 pb-4">
          <div className="flex flex-wrap gap-2">
            {scenes.map(scene => (
              <button
                key={scene.id}
                onClick={() => navigate(`/projects/${projectId}/scenes`)}
                className="px-3 py-2 bg-surface border border-border rounded-lg text-sm hover:border-accent hover:bg-accent/10 transition-colors text-left"
                title={`Go to scene: ${scene.title}`}
              >
                <span className="text-text-primary">{scene.title}</span>
                <span className="text-text-secondary ml-2">
                  ~{scene.estimatedWordCount.toLocaleString()} {t.write.wordCount}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
