import { useMemo } from 'react'
import {
  BookOpen,
  Users,
  Film,
  FileText,
  Target,
  TrendingUp,
  Clock,
  GitBranch,
  BookMarked,
  BarChart3,
  PieChart
} from 'lucide-react'
import type { Project, Chapter, Scene, Character, PlotBeat } from '@/types/project'

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">Statistics</h1>
      <p className="text-text-secondary mb-6">
        Track your writing progress and maintain motivation.
      </p>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Total Words"
          value={stats.totalWords.toLocaleString()}
          subtext={`${stats.wordProgress}% of ${stats.targetWords.toLocaleString()} target`}
          color="text-accent"
        />
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

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chapter Status Breakdown */}
        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />
            Chapter Status
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Outline</span>
              <span className="text-sm font-medium text-text-primary bg-surface-elevated px-2 py-0.5 rounded">
                {chapterStatusBreakdown.outline}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Draft</span>
              <span className="text-sm font-medium text-warning bg-warning/10 px-2 py-0.5 rounded">
                {chapterStatusBreakdown.draft}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Revision</span>
              <span className="text-sm font-medium text-accent bg-accent/10 px-2 py-0.5 rounded">
                {chapterStatusBreakdown.revision}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Final</span>
              <span className="text-sm font-medium text-success bg-success/10 px-2 py-0.5 rounded">
                {chapterStatusBreakdown.final}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Locked</span>
              <span className="text-sm font-medium text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">
                {chapterStatusBreakdown.locked}
              </span>
            </div>
          </div>
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
    </div>
  )
}
