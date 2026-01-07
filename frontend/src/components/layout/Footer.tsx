import { useProjectStore } from '@/stores/projectStore'
import { formatWordCount } from '@/lib/utils'
import { Keyboard } from 'lucide-react'

export function Footer() {
  const { currentProject, statistics } = useProjectStore()

  if (!currentProject) return null

  return (
    <footer className="h-8 bg-surface border-t border-border flex items-center justify-between px-4 text-xs text-text-secondary">
      <div className="flex items-center gap-6">
        {/* Word Count */}
        <span>
          {formatWordCount(statistics?.totalWords || 0)} words
        </span>

        {/* Chapter Progress */}
        <span>
          {statistics?.chaptersCompleted || 0}/{statistics?.totalChapters || 0} chapters
        </span>

        {/* Quality Score */}
        {statistics?.averageQualityScore && (
          <span>
            Quality: {statistics.averageQualityScore.toFixed(1)}/10
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Keyboard className="h-3 w-3" />
        <span>Press Cmd+/ for shortcuts</span>
      </div>
    </footer>
  )
}
