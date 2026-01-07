import { useMemo } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { formatWordCount } from '@/lib/utils'
import { Keyboard } from 'lucide-react'

export function Footer() {
  const { currentProject } = useProjectStore()

  // Compute statistics from current project data
  const stats = useMemo(() => {
    if (!currentProject) return null

    const chapters = currentProject.chapters || []
    const totalWords = chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0)
    const totalChapters = chapters.length
    const completedChapters = chapters.filter(
      ch => ch.status === 'final' || ch.status === 'locked'
    ).length

    return {
      totalWords,
      totalChapters,
      completedChapters,
    }
  }, [currentProject])

  if (!currentProject) return null

  return (
    <footer className="h-8 bg-surface border-t border-border flex items-center justify-between px-4 text-xs text-text-secondary" role="contentinfo" aria-label="Project statistics">
      <div className="flex items-center gap-6">
        {/* Word Count */}
        <span>
          {formatWordCount(stats?.totalWords || 0)} words
        </span>

        {/* Chapter Progress */}
        <span>
          {stats?.completedChapters || 0}/{stats?.totalChapters || 0} chapters
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Keyboard className="h-3 w-3" />
        <span>Press Cmd+/ for shortcuts</span>
      </div>
    </footer>
  )
}
