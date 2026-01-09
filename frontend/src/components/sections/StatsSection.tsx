import { useMemo, useState, useEffect } from 'react'
import {
  BookOpen,
  Users,
  Film,
  FileText,
  Target,
  TrendingUp,
  BookMarked,
  BarChart3,
  PieChart,
  Zap,
  Calendar,
  LineChart,
  Star,
  EyeOff
} from 'lucide-react'
import type { Project, ChapterQualityScore } from '@/types/project'
import { useProjectStore } from '@/stores/projectStore'
import { getSessionTrackingEnabled } from '@/components/ui/SettingsModal'

interface SectionProps {
  project: Project
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subtext?: string
  color?: string
}

function StatCard({ icon, label, value, subtext, color = 'text-accent' }: StatCardProps) {
  return (
    <div className="card">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg bg-surface-elevated ${color}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          {subtext && (
            <p className="text-xs text-text-secondary mt-1">{subtext}</p>
          )}
        </div>
      </div>
    </div>
  )
}

interface ProgressBarProps {
  label: string
  current: number
  total: number
  color?: string
}

function ProgressBar({ label, current, total, color = 'bg-accent' }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-primary font-medium">{current} / {total} ({percentage}%)</span>
      </div>
      <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export function StatsSection({ project }: SectionProps) {
  // Get session start word count from store
  const sessionStartWordCount = useProjectStore((state) => state.sessionStartWordCount)
  const sessionStartTime = useProjectStore((state) => state.sessionStartTime)

  // Check if session tracking is enabled
  const [isSessionTrackingEnabled, setIsSessionTrackingEnabled] = useState(getSessionTrackingEnabled)

  // Listen for settings changes
  useEffect(() => {
    const checkSetting = () => setIsSessionTrackingEnabled(getSessionTrackingEnabled())
    // Check on focus/visibility change in case user changed setting
    window.addEventListener('focus', checkSetting)
    document.addEventListener('visibilitychange', checkSetting)
    return () => {
      window.removeEventListener('focus', checkSetting)
      document.removeEventListener('visibilitychange', checkSetting)
    }
  }, [])

  // Calculate statistics from project data
  const stats = useMemo(() => {
    const chapters = project.chapters || []
    const scenes = project.scenes || []
    const characters = project.characters || []
    const plotBeats = project.plot?.beats || []
    const wikiEntries = project.worldbuildingEntries || []
    const relationships = project.relationships || []
    const spec = project.specification

    // Word counts
    const totalWords = chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0)
    const targetWords = spec?.targetWordCount || 80000
    const wordProgress = targetWords > 0 ? Math.round((totalWords / targetWords) * 100) : 0

    // Chapter statistics
    const totalChapters = spec?.targetChapterCount || chapters.length || 1
    const draftedChapters = chapters.filter(ch =>
      ch.status === 'draft' || ch.status === 'revision' || ch.status === 'final' || ch.status === 'locked'
    ).length
    const finalChapters = chapters.filter(ch => ch.status === 'final' || ch.status === 'locked').length

    // Scene statistics
    const totalScenes = scenes.length
    const draftedScenes = scenes.filter(s =>
      s.status === 'drafted' || s.status === 'revised' || s.status === 'locked'
    ).length
    const estimatedSceneWords = scenes.reduce((sum, s) => sum + (s.estimatedWordCount || 0), 0)

    // Character statistics
    const totalCharacters = characters.length
    const protagonists = characters.filter(c => c.role === 'protagonist').length
    const antagonists = characters.filter(c => c.role === 'antagonist').length
    const supportingCharacters = characters.filter(c => c.role === 'supporting').length

    // Plot beat statistics
    const totalBeats = plotBeats.length
    const completedBeats = plotBeats.filter(b =>
      b.status === 'drafted' || b.status === 'revised' || b.status === 'locked'
    ).length

    // Calculate average chapter length
    const avgChapterLength = chapters.length > 0
      ? Math.round(totalWords / chapters.length)
      : 0

    // Estimate completion based on current pace
    const wordsRemaining = Math.max(0, targetWords - totalWords)
    const avgWordsPerChapter = avgChapterLength || (spec?.chapterLengthRange?.min || 2000)
    const estimatedChaptersRemaining = Math.ceil(wordsRemaining / avgWordsPerChapter)

    return {
      // Words
      totalWords,
      targetWords,
      wordProgress,
      wordsRemaining,
      avgChapterLength,
      estimatedSceneWords,

      // Chapters
      totalChapters,
      draftedChapters,
      finalChapters,
      existingChapters: chapters.length,
      estimatedChaptersRemaining,

      // Scenes
      totalScenes,
      draftedScenes,

      // Characters
      totalCharacters,
      protagonists,
      antagonists,
      supportingCharacters,
      totalRelationships: relationships.length,

      // Plot
      totalBeats,
      completedBeats,

      // Wiki
      totalWikiEntries: wikiEntries.length,

      // Project info
      projectPhase: project.metadata?.currentPhase || 'specification',
      genre: spec?.genre?.join(', ') || 'Not set',
      audience: spec?.targetAudience || 'Not set',
    }
  }, [project])

  // Calculate words written this session
  const wordsToday = useMemo(() => {
    return Math.max(0, stats.totalWords - sessionStartWordCount)
  }, [stats.totalWords, sessionStartWordCount])

  // Calculate session duration
  const sessionDuration = useMemo(() => {
    if (!sessionStartTime) return 'Just started'
    const elapsed = Date.now() - sessionStartTime
    const minutes = Math.floor(elapsed / 60000)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m session`
    }
    return `${minutes}m session`
  }, [sessionStartTime])

  // Calculate rolling 7-day average
  const dailyAverageStats = useMemo(() => {
    const wordsPerDay = project.statistics?.wordsPerDay || []

    // Get the last 7 days of data
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

    const last7Days = wordsPerDay.filter(d => d.date >= sevenDaysAgoStr)
    const totalWordsLast7Days = last7Days.reduce((sum, d) => sum + d.count, 0)

    // Calculate average (divide by 7 for rolling average, not by number of days with data)
    const daysWithData = last7Days.length
    const dailyAverage = daysWithData > 0 ? Math.round(totalWordsLast7Days / 7) : 0

    return {
      dailyAverage,
      daysWithData,
      totalWordsLast7Days,
    }
  }, [project.statistics?.wordsPerDay])

  // Calculate status breakdown for pie chart visualization
  const chapterStatusBreakdown = useMemo(() => {
    const chapters = project.chapters || []
    return {
      outline: chapters.filter(c => c.status === 'outline').length,
      draft: chapters.filter(c => c.status === 'draft').length,
      revision: chapters.filter(c => c.status === 'revision').length,
      final: chapters.filter(c => c.status === 'final').length,
      locked: chapters.filter(c => c.status === 'locked').length,
    }
  }, [project.chapters])

  const sceneStatusBreakdown = useMemo(() => {
    const scenes = project.scenes || []
    return {
      outline: scenes.filter(s => s.status === 'outline').length,
      drafted: scenes.filter(s => s.status === 'drafted').length,
      revised: scenes.filter(s => s.status === 'revised').length,
      locked: scenes.filter(s => s.status === 'locked').length,
    }
  }, [project.scenes])

  // Quality trend data from quality scores
  const qualityTrendData = useMemo(() => {
    const qualityScores = project.qualityScores || []
    if (qualityScores.length === 0) return null

    // Group by chapter and sort by revision/timestamp
    const scoresByChapter = new Map<string, ChapterQualityScore[]>()
    qualityScores.forEach(score => {
      const existing = scoresByChapter.get(score.chapterId) || []
      existing.push(score)
      scoresByChapter.set(score.chapterId, existing)
    })

    // Sort each chapter's scores by revision number and timestamp
    scoresByChapter.forEach((scores) => {
      scores.sort((a, b) => {
        if (a.revisionNumber !== b.revisionNumber) {
          return a.revisionNumber - b.revisionNumber
        }
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      })
    })

    // Calculate overall trend across all chapters
    const allScoresSorted = [...qualityScores].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    // Calculate average score, min, max, and improvement
    const scores = allScoresSorted.map(s => s.overallScore)
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length
    const minScore = Math.min(...scores)
    const maxScore = Math.max(...scores)
    const firstScore = scores[0]
    const lastScore = scores[scores.length - 1]
    const improvement = lastScore - firstScore

    // Get chapter name from project chapters
    const getChapterName = (chapterId: string) => {
      const chapter = project.chapters?.find(c => c.id === chapterId)
      return chapter ? `Ch. ${chapter.number}: ${chapter.title}` : chapterId
    }

    return {
      totalCritiques: qualityScores.length,
      avgScore: Math.round(avgScore * 10) / 10,
      minScore: Math.round(minScore * 10) / 10,
      maxScore: Math.round(maxScore * 10) / 10,
      improvement: Math.round(improvement * 10) / 10,
      isImproving: improvement > 0,
      allScoresSorted,
      scoresByChapter,
      getChapterName,
    }
  }, [project.qualityScores, project.chapters])

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">Statistics</h1>
      <p className="text-text-secondary mb-6">
        Track your writing progress and maintain motivation.
      </p>

      {/* Session Stats Card - prominently featured */}
      {isSessionTrackingEnabled ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            icon={<Zap className="h-5 w-5" />}
            label="Words Today"
            value={wordsToday.toLocaleString()}
            subtext={sessionDuration}
            color="text-yellow-400"
          />
          <StatCard
            icon={<Calendar className="h-5 w-5" />}
            label="Daily Average"
            value={dailyAverageStats.dailyAverage.toLocaleString()}
            subtext={`Rolling 7-day avg (${dailyAverageStats.daysWithData} days tracked)`}
            color="text-cyan-400"
          />
          <StatCard
            icon={<FileText className="h-5 w-5" />}
            label="Total Words"
            value={stats.totalWords.toLocaleString()}
            subtext={`${stats.wordProgress}% of ${stats.targetWords.toLocaleString()} target`}
            color="text-accent"
          />
        </div>
      ) : (
        <div className="mb-6 p-4 bg-surface border border-border rounded-lg">
          <div className="flex items-center gap-3 text-text-secondary">
            <EyeOff className="h-5 w-5" />
            <div>
              <p className="font-medium">Session Tracking Disabled</p>
              <p className="text-sm">Enable session tracking in Settings to see words written today and session duration.</p>
            </div>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          label="Chapters"
          value={stats.existingChapters}
          subtext={`${stats.finalChapters} finalized of ${stats.totalChapters} target`}
          color="text-success"
        />
        <StatCard
          icon={<Film className="h-5 w-5" />}
          label="Scenes"
          value={stats.totalScenes}
          subtext={`${stats.draftedScenes} drafted, ~${stats.estimatedSceneWords.toLocaleString()} est. words`}
          color="text-warning"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Characters"
          value={stats.totalCharacters}
          subtext={`${stats.protagonists} protagonist, ${stats.antagonists} antagonist`}
          color="text-purple-400"
        />
      </div>

      {/* Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Word Count Progress */}
        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Word Count Progress
          </h2>
          <ProgressBar
            label="Words Written"
            current={stats.totalWords}
            total={stats.targetWords}
            color="bg-accent"
          />
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
            <div>
              <p className="text-sm text-text-secondary">Words Remaining</p>
              <p className="text-lg font-semibold text-text-primary">{stats.wordsRemaining.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Avg Chapter Length</p>
              <p className="text-lg font-semibold text-text-primary">{stats.avgChapterLength.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Chapter & Scene Progress */}
        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            Content Progress
          </h2>
          <ProgressBar
            label="Chapters Created"
            current={stats.existingChapters}
            total={stats.totalChapters}
            color="bg-success"
          />
          <ProgressBar
            label="Scenes Drafted"
            current={stats.draftedScenes}
            total={stats.totalScenes}
            color="bg-warning"
          />
          <ProgressBar
            label="Plot Beats Completed"
            current={stats.completedBeats}
            total={stats.totalBeats}
            color="bg-purple-500"
          />
        </div>
      </div>

      {/* Daily Words Line Chart */}
      {(project.statistics?.wordsPerDay || []).length > 0 && (
        <div className="card mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <LineChart className="h-5 w-5 text-cyan-400" />
            Daily Writing Activity
            <span className="text-sm font-normal text-text-secondary">(words per day)</span>
          </h2>

          {/* Chart */}
          <div className="relative h-48 bg-surface-elevated rounded-lg p-4 mb-4">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-4 bottom-8 w-12 flex flex-col justify-between text-xs text-text-secondary">
              {(() => {
                const wordsPerDay = project.statistics?.wordsPerDay || []
                const maxWords = Math.max(...wordsPerDay.map(d => d.count), 100)
                const step = Math.ceil(maxWords / 4)
                return [4, 3, 2, 1, 0].map((i) => (
                  <span key={i}>{(step * i).toLocaleString()}</span>
                ))
              })()}
            </div>

            {/* Chart area */}
            <div className="ml-14 h-full relative">
              <svg
                className="w-full h-full"
                viewBox="0 0 400 160"
                preserveAspectRatio="none"
              >
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={i}
                    x1="0"
                    y1={160 - (i / 4) * 160}
                    x2="400"
                    y2={160 - (i / 4) * 160}
                    stroke="currentColor"
                    strokeOpacity="0.1"
                    strokeWidth="1"
                  />
                ))}

                {/* Area fill */}
                {(() => {
                  const wordsPerDay = project.statistics?.wordsPerDay || []
                  if (wordsPerDay.length === 0) return null
                  const maxWords = Math.max(...wordsPerDay.map(d => d.count), 100)
                  const sortedDays = [...wordsPerDay].sort((a, b) => a.date.localeCompare(b.date))

                  const points = sortedDays.map((day, idx) => {
                    const x = sortedDays.length > 1
                      ? (idx / (sortedDays.length - 1)) * 400
                      : 200
                    const y = 160 - (day.count / maxWords) * 160
                    return `${x},${y}`
                  })

                  return (
                    <polygon
                      points={`0,160 ${points.join(' ')} 400,160`}
                      className="fill-cyan-400/20"
                    />
                  )
                })()}

                {/* Line */}
                {(() => {
                  const wordsPerDay = project.statistics?.wordsPerDay || []
                  if (wordsPerDay.length < 2) return null
                  const maxWords = Math.max(...wordsPerDay.map(d => d.count), 100)
                  const sortedDays = [...wordsPerDay].sort((a, b) => a.date.localeCompare(b.date))

                  return (
                    <polyline
                      points={sortedDays.map((day, idx) => {
                        const x = (idx / (sortedDays.length - 1)) * 400
                        const y = 160 - (day.count / maxWords) * 160
                        return `${x},${y}`
                      }).join(' ')}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-cyan-400"
                    />
                  )
                })()}

                {/* Data points */}
                {(() => {
                  const wordsPerDay = project.statistics?.wordsPerDay || []
                  const maxWords = Math.max(...wordsPerDay.map(d => d.count), 100)
                  const sortedDays = [...wordsPerDay].sort((a, b) => a.date.localeCompare(b.date))

                  return sortedDays.map((day, idx) => {
                    const x = sortedDays.length > 1
                      ? (idx / (sortedDays.length - 1)) * 400
                      : 200
                    const y = 160 - (day.count / maxWords) * 160
                    return (
                      <g key={day.date}>
                        <circle
                          cx={x}
                          cy={y}
                          r="5"
                          className="fill-cyan-400"
                        />
                        <title>{day.date}: {day.count.toLocaleString()} words</title>
                      </g>
                    )
                  })
                })()}
              </svg>
            </div>
          </div>

          {/* X-axis - date labels */}
          <div className="flex justify-between text-xs text-text-secondary px-14">
            {(() => {
              const wordsPerDay = project.statistics?.wordsPerDay || []
              if (wordsPerDay.length === 0) return null
              const sortedDays = [...wordsPerDay].sort((a, b) => a.date.localeCompare(b.date))
              const firstDate = sortedDays[0]?.date
              const lastDate = sortedDays[sortedDays.length - 1]?.date
              return (
                <>
                  <span>{firstDate}</span>
                  <span>{wordsPerDay.length} day{wordsPerDay.length !== 1 ? 's' : ''} tracked</span>
                  <span>{lastDate}</span>
                </>
              )
            })()}
          </div>

          {/* Summary stats */}
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-text-secondary">Best Day</p>
              <p className="text-lg font-bold text-success">
                {Math.max(...(project.statistics?.wordsPerDay || []).map(d => d.count), 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">7-Day Average</p>
              <p className="text-lg font-bold text-cyan-400">
                {dailyAverageStats.dailyAverage.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Total (Period)</p>
              <p className="text-lg font-bold text-text-primary">
                {(project.statistics?.wordsPerDay || []).reduce((sum, d) => sum + d.count, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Writing Activity Heat Map Calendar */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-success" />
          Writing Activity
          <span className="text-sm font-normal text-text-secondary">(last 12 weeks)</span>
        </h2>

        {(() => {
          const wordsPerDay = project.statistics?.wordsPerDay || []
          const wordsMap = new Map(wordsPerDay.map(d => [d.date, d.count]))

          // Get max words for heat intensity calculation
          const maxWords = Math.max(...wordsPerDay.map(d => d.count), 1)

          // Generate last 12 weeks of dates (84 days)
          const today = new Date()
          const weeks: { date: Date; dateStr: string; words: number }[][] = []

          // Start from 11 weeks ago, aligned to Sunday
          const startDate = new Date(today)
          startDate.setDate(startDate.getDate() - 83)
          // Align to Sunday
          startDate.setDate(startDate.getDate() - startDate.getDay())

          let currentWeek: { date: Date; dateStr: string; words: number }[] = []
          const currentDate = new Date(startDate)

          while (currentDate <= today) {
            const dateStr = currentDate.toISOString().split('T')[0]
            const words = wordsMap.get(dateStr) || 0

            currentWeek.push({
              date: new Date(currentDate),
              dateStr,
              words,
            })

            // If Sunday (end of week) or last day
            if (currentDate.getDay() === 6 || currentDate >= today) {
              weeks.push(currentWeek)
              currentWeek = []
            }

            currentDate.setDate(currentDate.getDate() + 1)
          }

          // Month labels
          const monthLabels: { month: string; week: number }[] = []
          let lastMonth = -1
          weeks.forEach((week, idx) => {
            const firstDay = week[0]
            if (firstDay) {
              const month = firstDay.date.getMonth()
              if (month !== lastMonth) {
                monthLabels.push({
                  month: firstDay.date.toLocaleDateString('en', { month: 'short' }),
                  week: idx,
                })
                lastMonth = month
              }
            }
          })

          // Get intensity level (0-4)
          const getIntensity = (words: number): number => {
            if (words === 0) return 0
            if (words < maxWords * 0.25) return 1
            if (words < maxWords * 0.5) return 2
            if (words < maxWords * 0.75) return 3
            return 4
          }

          const intensityColors = [
            'bg-surface-elevated',  // 0 - no activity
            'bg-success/20',        // 1 - low
            'bg-success/40',        // 2 - medium-low
            'bg-success/60',        // 3 - medium-high
            'bg-success',           // 4 - high
          ]

          const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

          return (
            <>
              {/* Month labels */}
              <div className="flex mb-1 ml-8">
                {monthLabels.map((label, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-text-secondary"
                    style={{
                      marginLeft: idx === 0 ? `${label.week * 14}px` : `${(label.week - (monthLabels[idx - 1]?.week || 0)) * 14 - 24}px`,
                    }}
                  >
                    {label.month}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="flex">
                {/* Day labels */}
                <div className="flex flex-col gap-[2px] mr-1">
                  {dayLabels.map((day, idx) => (
                    <div
                      key={day}
                      className="h-3 text-[10px] text-text-secondary flex items-center"
                      style={{ visibility: idx % 2 === 1 ? 'visible' : 'hidden' }}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Weeks */}
                <div className="flex gap-[2px]">
                  {weeks.map((week, weekIdx) => (
                    <div key={weekIdx} className="flex flex-col gap-[2px]">
                      {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                        const day = week.find(d => d.date.getDay() === dayOfWeek)
                        if (!day || day.date > today) {
                          return <div key={dayOfWeek} className="w-3 h-3" />
                        }
                        const intensity = getIntensity(day.words)
                        return (
                          <div
                            key={dayOfWeek}
                            className={`w-3 h-3 rounded-sm ${intensityColors[intensity]} cursor-pointer transition-transform hover:scale-125`}
                            title={`${day.dateStr}: ${day.words.toLocaleString()} words`}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <div className="text-xs text-text-secondary">
                  {wordsPerDay.length} day{wordsPerDay.length !== 1 ? 's' : ''} with writing activity
                </div>
                <div className="flex items-center gap-1 text-xs text-text-secondary">
                  <span>Less</span>
                  {intensityColors.map((color, idx) => (
                    <div key={idx} className={`w-3 h-3 rounded-sm ${color}`} />
                  ))}
                  <span>More</span>
                </div>
              </div>
            </>
          )
        })()}
      </div>

      {/* Words per Chapter Bar Chart */}
      {(project.chapters || []).length > 0 && (
        <div className="card mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />
            Words per Chapter
            <span className="text-sm font-normal text-text-secondary">(target vs actual)</span>
          </h2>
          <div className="space-y-3">
            {(project.chapters || []).map((chapter) => {
              const actualWords = chapter.wordCount || 0
              const targetMin = project.specification?.chapterLengthRange?.min || 2000
              const targetMax = project.specification?.chapterLengthRange?.max || 5000
              const targetAvg = Math.round((targetMin + targetMax) / 2)
              const maxWidth = Math.max(actualWords, targetAvg)
              const actualPercent = maxWidth > 0 ? Math.min((actualWords / maxWidth) * 100, 100) : 0
              const targetPercent = maxWidth > 0 ? Math.min((targetAvg / maxWidth) * 100, 100) : 0
              const isAboveTarget = actualWords >= targetMin
              const isBelowMin = actualWords < targetMin

              return (
                <div key={chapter.id} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-text-primary font-medium truncate max-w-[200px]">
                      Ch. {chapter.number}: {chapter.title || 'Untitled'}
                    </span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`font-medium ${isAboveTarget ? 'text-success' : isBelowMin ? 'text-error' : 'text-warning'}`}>
                        {actualWords.toLocaleString()} words
                      </span>
                      <span className="text-text-secondary">
                        / {targetAvg.toLocaleString()} target
                      </span>
                    </div>
                  </div>
                  <div className="h-6 bg-surface-elevated rounded relative overflow-hidden">
                    {/* Target marker line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-text-secondary/50 z-10"
                      style={{ left: `${targetPercent}%` }}
                      title={`Target: ${targetAvg.toLocaleString()} words`}
                    />
                    {/* Actual words bar */}
                    <div
                      className={`h-full transition-all duration-300 ${
                        isAboveTarget ? 'bg-success' : isBelowMin ? 'bg-error' : 'bg-warning'
                      }`}
                      style={{ width: `${actualPercent}%` }}
                    />
                    {/* Min/Max range indicator */}
                    <div className="absolute top-1 right-2 text-[10px] text-text-secondary">
                      Range: {targetMin.toLocaleString()}-{targetMax.toLocaleString()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center gap-4 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-success" />
              <span>Above target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-warning" />
              <span>Approaching target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-error" />
              <span>Below minimum</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-0.5 h-3 bg-text-secondary/50" />
              <span>Target avg</span>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chapter Status Breakdown with Pie Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-accent" />
            Chapter Status
          </h2>

          {/* SVG Pie Chart */}
          {(() => {
            const statuses = [
              { name: 'Outline', count: chapterStatusBreakdown.outline, color: '#6b7280' },  // gray
              { name: 'Draft', count: chapterStatusBreakdown.draft, color: '#f59e0b' },      // warning/amber
              { name: 'Revision', count: chapterStatusBreakdown.revision, color: '#3b82f6' }, // accent/blue
              { name: 'Final', count: chapterStatusBreakdown.final, color: '#22c55e' },       // success/green
              { name: 'Locked', count: chapterStatusBreakdown.locked, color: '#a855f7' },     // purple
            ]
            const total = statuses.reduce((sum, s) => sum + s.count, 0)

            if (total === 0) {
              return (
                <div className="flex items-center justify-center h-32 text-text-secondary text-sm">
                  No chapters yet
                </div>
              )
            }

            // Calculate pie segments
            let currentAngle = -90 // Start from top
            const segments = statuses
              .filter(s => s.count > 0)
              .map((status) => {
                const percentage = status.count / total
                const angle = percentage * 360
                const startAngle = currentAngle
                const endAngle = currentAngle + angle
                currentAngle = endAngle

                // Convert angles to radians and calculate arc path
                const startRad = (startAngle * Math.PI) / 180
                const endRad = (endAngle * Math.PI) / 180
                const radius = 50
                const cx = 60
                const cy = 60

                const x1 = cx + radius * Math.cos(startRad)
                const y1 = cy + radius * Math.sin(startRad)
                const x2 = cx + radius * Math.cos(endRad)
                const y2 = cy + radius * Math.sin(endRad)

                const largeArc = angle > 180 ? 1 : 0

                // For single segment (100%), draw a circle instead
                if (percentage >= 0.999) {
                  return {
                    ...status,
                    percentage,
                    path: `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.001} ${cy - radius} Z`,
                  }
                }

                return {
                  ...status,
                  percentage,
                  path: `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
                }
              })

            return (
              <div className="flex items-center gap-4">
                {/* Pie Chart SVG */}
                <svg width="120" height="120" viewBox="0 0 120 120" className="flex-shrink-0">
                  {segments.map((segment, idx) => (
                    <path
                      key={idx}
                      d={segment.path}
                      fill={segment.color}
                      stroke="var(--color-surface)"
                      strokeWidth="2"
                    >
                      <title>{segment.name}: {segment.count} ({Math.round(segment.percentage * 100)}%)</title>
                    </path>
                  ))}
                  {/* Center circle for donut effect */}
                  <circle cx="60" cy="60" r="25" fill="var(--color-surface)" />
                  <text x="60" y="65" textAnchor="middle" className="fill-text-primary text-lg font-bold">
                    {total}
                  </text>
                </svg>

                {/* Legend */}
                <div className="flex-1 space-y-1">
                  {statuses.map((status) => (
                    <div key={status.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: status.color }} />
                        <span className="text-text-secondary">{status.name}</span>
                      </div>
                      <span className="font-medium text-text-primary">{status.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>

        {/* Scene Status Breakdown */}
        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-warning" />
            Scene Status
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Outline</span>
              <span className="text-sm font-medium text-text-primary bg-surface-elevated px-2 py-0.5 rounded">
                {sceneStatusBreakdown.outline}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Drafted</span>
              <span className="text-sm font-medium text-warning bg-warning/10 px-2 py-0.5 rounded">
                {sceneStatusBreakdown.drafted}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Revised</span>
              <span className="text-sm font-medium text-accent bg-accent/10 px-2 py-0.5 rounded">
                {sceneStatusBreakdown.revised}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Locked</span>
              <span className="text-sm font-medium text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">
                {sceneStatusBreakdown.locked}
              </span>
            </div>
          </div>
        </div>

        {/* Character Breakdown */}
        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-400" />
            Character Breakdown
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Protagonists</span>
              <span className="text-sm font-medium text-accent bg-accent/10 px-2 py-0.5 rounded">
                {stats.protagonists}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Antagonists</span>
              <span className="text-sm font-medium text-error bg-error/10 px-2 py-0.5 rounded">
                {stats.antagonists}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Supporting</span>
              <span className="text-sm font-medium text-success bg-success/10 px-2 py-0.5 rounded">
                {stats.supportingCharacters}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Relationships</span>
              <span className="text-sm font-medium text-pink-400 bg-pink-400/10 px-2 py-0.5 rounded">
                {stats.totalRelationships}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Project Overview */}
      <div className="card">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <BookMarked className="h-5 w-5 text-accent" />
          Project Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-text-secondary">Current Phase</p>
            <p className="text-base font-medium text-text-primary capitalize">{stats.projectPhase}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Genre</p>
            <p className="text-base font-medium text-text-primary">{stats.genre || 'Not set'}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Target Audience</p>
            <p className="text-base font-medium text-text-primary">{stats.audience}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Wiki Entries</p>
            <p className="text-base font-medium text-text-primary">{stats.totalWikiEntries}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Plot Beats</p>
            <p className="text-base font-medium text-text-primary">{stats.totalBeats}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Est. Chapters Remaining</p>
            <p className="text-base font-medium text-text-primary">{stats.estimatedChaptersRemaining}</p>
          </div>
        </div>
      </div>

      {/* Quality Trend Chart */}
      <div className="card mt-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <LineChart className="h-5 w-5 text-accent" />
          Quality Trend
          <span className="text-xs font-normal text-text-secondary ml-2">
            (scores over revisions)
          </span>
        </h2>

        {qualityTrendData ? (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 bg-surface-elevated rounded-lg">
              <div>
                <p className="text-xs text-text-secondary">Total Critiques</p>
                <p className="text-xl font-bold text-text-primary">{qualityTrendData.totalCritiques}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Average Score</p>
                <p className={`text-xl font-bold ${
                  qualityTrendData.avgScore >= 8 ? 'text-success' :
                  qualityTrendData.avgScore >= 6 ? 'text-warning' : 'text-error'
                }`}>
                  {qualityTrendData.avgScore}/10
                </p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Min Score</p>
                <p className="text-xl font-bold text-error">{qualityTrendData.minScore}/10</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Max Score</p>
                <p className="text-xl font-bold text-success">{qualityTrendData.maxScore}/10</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Improvement</p>
                <p className={`text-xl font-bold ${
                  qualityTrendData.isImproving ? 'text-success' : 'text-error'
                }`}>
                  {qualityTrendData.isImproving ? '+' : ''}{qualityTrendData.improvement}
                </p>
              </div>
            </div>

            {/* Quality Trend Line Chart (SVG) */}
            <div className="mb-6">
              <div className="relative h-48 bg-surface-elevated rounded-lg p-4">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-4 bottom-8 w-8 flex flex-col justify-between text-xs text-text-secondary">
                  <span>10</span>
                  <span>8</span>
                  <span>6</span>
                  <span>4</span>
                  <span>2</span>
                  <span>0</span>
                </div>

                {/* Chart area */}
                <div className="ml-10 h-full relative">
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 400 160"
                    preserveAspectRatio="none"
                  >
                    {/* Grid lines */}
                    {[0, 2, 4, 6, 8, 10].map((value) => (
                      <line
                        key={value}
                        x1="0"
                        y1={160 - (value / 10) * 160}
                        x2="400"
                        y2={160 - (value / 10) * 160}
                        stroke="currentColor"
                        strokeOpacity="0.1"
                        strokeWidth="1"
                      />
                    ))}

                    {/* Trend line */}
                    {qualityTrendData.allScoresSorted.length > 1 && (
                      <polyline
                        points={qualityTrendData.allScoresSorted.map((score, idx) => {
                          const x = (idx / (qualityTrendData.allScoresSorted.length - 1)) * 400
                          const y = 160 - (score.overallScore / 10) * 160
                          return `${x},${y}`
                        }).join(' ')}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-accent"
                      />
                    )}

                    {/* Data points */}
                    {qualityTrendData.allScoresSorted.map((score, idx) => {
                      const x = qualityTrendData.allScoresSorted.length > 1
                        ? (idx / (qualityTrendData.allScoresSorted.length - 1)) * 400
                        : 200
                      const y = 160 - (score.overallScore / 10) * 160
                      return (
                        <g key={idx}>
                          <circle
                            cx={x}
                            cy={y}
                            r="6"
                            className={`${
                              score.overallScore >= 8 ? 'fill-success' :
                              score.overallScore >= 6 ? 'fill-warning' : 'fill-error'
                            }`}
                          />
                          <title>
                            {qualityTrendData.getChapterName(score.chapterId)} - Rev {score.revisionNumber}: {score.overallScore}/10
                          </title>
                        </g>
                      )
                    })}
                  </svg>
                </div>
              </div>

              {/* X-axis legend */}
              <div className="flex justify-between text-xs text-text-secondary mt-2 px-10">
                <span>First Critique</span>
                <span>→ Revisions Over Time →</span>
                <span>Latest</span>
              </div>
            </div>

            {/* Per-Chapter Scores */}
            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-400" />
                Scores by Chapter
              </h3>
              <div className="space-y-3">
                {Array.from(qualityTrendData.scoresByChapter.entries()).map(([chapterId, scores]) => {
                  const latestScore = scores[scores.length - 1]
                  const firstScore = scores[0]
                  const improvement = scores.length > 1 ? latestScore.overallScore - firstScore.overallScore : 0

                  return (
                    <div key={chapterId} className="p-3 bg-surface-elevated rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text-primary">
                          {qualityTrendData.getChapterName(chapterId)}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${
                            latestScore.overallScore >= 8 ? 'text-success' :
                            latestScore.overallScore >= 6 ? 'text-warning' : 'text-error'
                          }`}>
                            {latestScore.overallScore}/10
                          </span>
                          {scores.length > 1 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              improvement > 0 ? 'bg-success/20 text-success' :
                              improvement < 0 ? 'bg-error/20 text-error' : 'bg-surface text-text-secondary'
                            }`}>
                              {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Revision history mini-chart */}
                      <div className="flex items-center gap-1">
                        {scores.map((score, idx) => (
                          <div
                            key={idx}
                            className={`flex-1 h-2 rounded-full ${
                              score.overallScore >= 8 ? 'bg-success' :
                              score.overallScore >= 6 ? 'bg-warning' : 'bg-error'
                            }`}
                            title={`Rev ${score.revisionNumber}: ${score.overallScore}/10`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-text-secondary mt-1">
                        <span>{scores.length} revision{scores.length !== 1 ? 's' : ''}</span>
                        <span>Latest: {new Date(latestScore.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <LineChart className="h-12 w-12 text-text-secondary mx-auto mb-3 opacity-50" />
            <p className="text-text-secondary">No quality scores yet</p>
            <p className="text-xs text-text-secondary mt-1">
              Get critiques in the Review section to see quality trends
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
