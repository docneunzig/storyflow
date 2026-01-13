import { useMemo } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { formatWordCount } from '@/lib/utils'
import { Keyboard, Star } from 'lucide-react'
import { OnlineIndicator } from '@/components/ui/OnlineIndicator'

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

    // Calculate average quality score from quality scores
    const qualityScores = currentProject.qualityScores || []
    let averageQualityScore: number | null = null
    if (qualityScores.length > 0) {
      const total = qualityScores.reduce((sum, qs) => sum + (qs.overallScore || 0), 0)
      averageQualityScore = total / qualityScores.length
    }

    return {
      totalWords,
      totalChapters,
      completedChapters,
      averageQualityScore,
    }
  }, [currentProject])

  if (!currentProject) return null

  // Get color based on quality score
  const getQualityColor = (score: number) => {
    if (score >= 9.0) return 'text-success'
    if (score >= 7.5) return 'text-accent'
    if (score >= 6.0) return 'text-warning'
    return 'text-error'
  }

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

        {/* Quality Score */}
        {stats?.averageQualityScore !== null && stats?.averageQualityScore !== undefined && (
          <span className={`flex items-center gap-1 ${getQualityColor(stats.averageQualityScore)}`}>
            <Star className="h-3 w-3" aria-hidden="true" />
            {stats.averageQualityScore.toFixed(1)}/10
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Online Status Indicator */}
        <OnlineIndicator />

        <div className="flex items-center gap-2">
          <Keyboard className="h-3 w-3" aria-hidden="true" />
          <span>Press ? for shortcuts</span>
        </div>
      </div>
    </footer>
  )
}
