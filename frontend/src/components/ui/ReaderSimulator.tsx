import { useState, useMemo } from 'react'
import {
  Eye,
  Brain,
  Heart,
  HelpCircle,
  Zap,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  BookOpen,
  Users
} from 'lucide-react'
import type {
  ReaderState,
  ActiveQuestion,
  TwistImpactPrediction,
  Chapter,
  Character
} from '@/types/project'

interface ReaderSimulatorProps {
  readerStates: ReaderState[]
  twistPredictions: TwistImpactPrediction[]
  chapters: Chapter[]
  characters: Character[]
  onSimulateChapter: (chapterId: string) => void
  isSimulating?: boolean
  simulatingChapterId?: string
}

interface EmotionBarProps {
  label: string
  value: number
  color: string
  icon: React.ReactNode
}

function EmotionBar({ label, value, color, icon }: EmotionBarProps) {
  const percentage = value * 100

  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-secondary">{label}</span>
          <span className="text-xs font-medium text-text-primary">{percentage.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color.replace('bg-', 'bg-').replace('/20', '')}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export function ReaderSimulator({
  readerStates,
  twistPredictions,
  chapters,
  characters,
  onSimulateChapter,
  isSimulating = false,
  simulatingChapterId: _simulatingChapterId
}: ReaderSimulatorProps) {
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  const [expandedQuestions, setExpandedQuestions] = useState(true)
  const [expandedTwists, setExpandedTwists] = useState(true)

  // Get reader state for selected chapter
  const selectedState = useMemo(() => {
    if (!selectedChapterId) {
      // Default to most recent state
      return readerStates[readerStates.length - 1] || null
    }
    return readerStates.find(s => s.chapterId === selectedChapterId) || null
  }, [readerStates, selectedChapterId])

  // Get all unanswered questions
  const unansweredQuestions = useMemo(() => {
    const allQuestions: ActiveQuestion[] = []
    for (const state of readerStates) {
      for (const q of state.activeQuestions) {
        if (!q.answeredInChapterId && !allQuestions.find(existing => existing.id === q.id)) {
          allQuestions.push(q)
        }
      }
    }
    return allQuestions.sort((a, b) => b.intensity - a.intensity)
  }, [readerStates])

  // Get character attachment ranking
  const characterAttachments = useMemo(() => {
    if (!selectedState) return []
    return Object.entries(selectedState.emotionalState.attachment)
      .map(([charId, level]) => {
        const character = characters.find(c => c.id === charId)
        return { character, level }
      })
      .filter(item => item.character)
      .sort((a, b) => b.level - a.level)
  }, [selectedState, characters])

  // Calculate emotional journey data for chart
  const emotionalJourney = useMemo(() => {
    return readerStates.map(state => ({
      chapterNumber: state.chapterNumber,
      tension: state.emotionalState.tension,
      curiosity: state.emotionalState.curiosity,
      engagement: state.engagementLevel
    }))
  }, [readerStates])

  const getChapterTitle = (id: string) => {
    const chapter = chapters.find(c => c.id === id)
    return chapter ? `Ch ${chapter.number}: ${chapter.title}` : id
  }

  const unanalyzedChapters = chapters.filter(ch =>
    !readerStates.find(s => s.chapterId === ch.id)
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-2">
          <Eye className="w-5 h-5 text-accent" />
          Reader Experience Simulator
        </h3>
        <p className="text-sm text-text-secondary">
          Predict how readers will experience your story
        </p>
      </div>

      {/* Chapter Selector */}
      <div className="p-4 border-b border-border">
        <div className="flex gap-2">
          <select
            value={selectedChapterId || ''}
            onChange={(e) => setSelectedChapterId(e.target.value || null)}
            className="input flex-1"
          >
            <option value="">Latest Chapter</option>
            {readerStates.map(state => (
              <option key={state.chapterId} value={state.chapterId}>
                Chapter {state.chapterNumber}
              </option>
            ))}
          </select>
          {unanalyzedChapters.length > 0 && (
            <button
              onClick={() => onSimulateChapter(unanalyzedChapters[0].id)}
              disabled={isSimulating}
              className="btn-secondary flex items-center gap-2"
            >
              {isSimulating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Simulate
            </button>
          )}
        </div>
        {unanalyzedChapters.length > 0 && (
          <p className="text-xs text-yellow-400 mt-2">
            {unanalyzedChapters.length} chapter{unanalyzedChapters.length !== 1 ? 's' : ''} not yet simulated
          </p>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {!selectedState ? (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-50" />
            <p className="text-text-secondary">No reader simulation data yet</p>
            <p className="text-sm text-text-secondary mt-1">
              Simulate a chapter to see predicted reader experience
            </p>
          </div>
        ) : (
          <>
            {/* Emotional State Dashboard */}
            <div className="card p-4">
              <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
                <Heart className="w-4 h-4 text-pink-400" />
                Reader Emotional State
              </h4>
              <div className="space-y-3">
                <EmotionBar
                  label="Tension"
                  value={selectedState.emotionalState.tension}
                  color="bg-red-500/20"
                  icon={<Zap className="w-4 h-4 text-red-400" />}
                />
                <EmotionBar
                  label="Curiosity"
                  value={selectedState.emotionalState.curiosity}
                  color="bg-purple-500/20"
                  icon={<HelpCircle className="w-4 h-4 text-purple-400" />}
                />
                <EmotionBar
                  label="Satisfaction"
                  value={selectedState.emotionalState.satisfaction}
                  color="bg-green-500/20"
                  icon={<CheckCircle className="w-4 h-4 text-green-400" />}
                />
                <EmotionBar
                  label="Confusion"
                  value={selectedState.emotionalState.confusion}
                  color="bg-yellow-500/20"
                  icon={<AlertCircle className="w-4 h-4 text-yellow-400" />}
                />
              </div>

              {/* Engagement & Pacing */}
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">
                    {(selectedState.engagementLevel * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-text-secondary">Engagement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-text-primary capitalize">
                    {selectedState.readingPaceEstimate}
                  </div>
                  <div className="text-xs text-text-secondary">Reading Pace</div>
                </div>
              </div>
            </div>

            {/* Emotional Journey Chart */}
            {emotionalJourney.length > 1 && (
              <div className="card p-4">
                <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  Emotional Journey
                </h4>
                <div className="h-32 relative">
                  <svg className="w-full h-full" viewBox={`0 0 ${emotionalJourney.length * 60} 100`} preserveAspectRatio="none">
                    {/* Tension line */}
                    <polyline
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      points={emotionalJourney.map((point, i) =>
                        `${i * 60 + 30},${100 - point.tension * 80}`
                      ).join(' ')}
                    />
                    {/* Curiosity line */}
                    <polyline
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="2"
                      points={emotionalJourney.map((point, i) =>
                        `${i * 60 + 30},${100 - point.curiosity * 80}`
                      ).join(' ')}
                    />
                    {/* Engagement line */}
                    <polyline
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                      points={emotionalJourney.map((point, i) =>
                        `${i * 60 + 30},${100 - point.engagement * 80}`
                      ).join(' ')}
                    />
                    {/* Chapter markers */}
                    {emotionalJourney.map((point, i) => (
                      <text
                        key={i}
                        x={i * 60 + 30}
                        y="98"
                        textAnchor="middle"
                        className="fill-text-secondary text-[10px]"
                      >
                        {point.chapterNumber}
                      </text>
                    ))}
                  </svg>
                </div>
                <div className="flex justify-center gap-4 mt-2 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-red-500" /> Tension
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-purple-500" /> Curiosity
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-0.5 bg-cyan-400 border-dashed" /> Engagement
                  </span>
                </div>
              </div>
            )}

            {/* Active Questions */}
            <div className="card">
              <button
                onClick={() => setExpandedQuestions(!expandedQuestions)}
                className="w-full flex items-center justify-between p-4"
              >
                <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-400" />
                  Active Reader Questions
                  <span className="text-xs font-normal text-text-secondary bg-surface-elevated px-2 py-0.5 rounded">
                    {unansweredQuestions.length}
                  </span>
                </h4>
                {expandedQuestions ? (
                  <ChevronDown className="w-4 h-4 text-text-secondary" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-text-secondary" />
                )}
              </button>
              {expandedQuestions && (
                <div className="px-4 pb-4 space-y-2">
                  {unansweredQuestions.length === 0 ? (
                    <p className="text-sm text-text-secondary italic">No active questions tracked</p>
                  ) : (
                    unansweredQuestions.map(q => (
                      <div key={q.id} className="bg-surface-elevated rounded-lg p-3">
                        <p className="text-sm text-text-primary">{q.question}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-text-secondary">
                            Raised in {getChapterTitle(q.raisedInChapterId)}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            q.intensity > 0.7 ? 'bg-red-500/20 text-red-400' :
                            q.intensity > 0.4 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            Intensity: {(q.intensity * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Character Attachments */}
            {characterAttachments.length > 0 && (
              <div className="card p-4">
                <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-pink-400" />
                  Reader Character Attachment
                </h4>
                <div className="space-y-2">
                  {characterAttachments.slice(0, 5).map(({ character, level }) => (
                    <div key={character!.id} className="flex items-center gap-3">
                      <span className="text-sm text-text-primary w-24 truncate">
                        {character!.name}
                      </span>
                      <div className="flex-1 h-2 bg-surface-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-500 to-red-500 rounded-full"
                          style={{ width: `${level * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-secondary w-12 text-right">
                        {(level * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Twist Predictions */}
            {twistPredictions.length > 0 && (
              <div className="card">
                <button
                  onClick={() => setExpandedTwists(!expandedTwists)}
                  className="w-full flex items-center justify-between p-4"
                >
                  <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    Twist Impact Predictions
                  </h4>
                  {expandedTwists ? (
                    <ChevronDown className="w-4 h-4 text-text-secondary" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-text-secondary" />
                  )}
                </button>
                {expandedTwists && (
                  <div className="px-4 pb-4 space-y-3">
                    {twistPredictions.map((twist, i) => (
                      <div key={i} className="bg-surface-elevated rounded-lg p-3">
                        <p className="text-sm text-text-primary font-medium mb-2">
                          {twist.twistDescription}
                        </p>
                        <div className="grid grid-cols-2 gap-4 mb-2">
                          <div>
                            <span className="text-xs text-text-secondary">Surprise</span>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-yellow-500 rounded-full"
                                  style={{ width: `${twist.predictedSurpriseLevel * 100}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-yellow-400">
                                {(twist.predictedSurpriseLevel * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-text-secondary">Satisfaction</span>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500 rounded-full"
                                  style={{ width: `${twist.predictedSatisfactionLevel * 100}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-green-400">
                                {(twist.predictedSatisfactionLevel * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-text-secondary italic">{twist.reasoning}</p>
                        {twist.foreshadowingRefs.length > 0 && (
                          <p className="text-xs text-accent mt-2">
                            Foreshadowed in: {twist.foreshadowingRefs.map(ref => getChapterTitle(ref)).join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Known Facts Summary */}
            {selectedState.knownFacts.length > 0 && (
              <div className="card p-4">
                <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  What the Reader Knows
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {selectedState.knownFacts.slice(0, 10).map((fact, i) => (
                    <p key={i} className="text-xs text-text-secondary flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                      {fact}
                    </p>
                  ))}
                  {selectedState.knownFacts.length > 10 && (
                    <p className="text-xs text-accent">
                      +{selectedState.knownFacts.length - 10} more facts...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Predicted Reactions */}
            {selectedState.predictedReactions.length > 0 && (
              <div className="card p-4">
                <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Predicted Reader Reactions
                </h4>
                <div className="space-y-2">
                  {selectedState.predictedReactions.map((reaction, i) => (
                    <p key={i} className="text-sm text-text-secondary bg-surface-elevated rounded-lg p-2">
                      "{reaction}"
                    </p>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ReaderSimulator
