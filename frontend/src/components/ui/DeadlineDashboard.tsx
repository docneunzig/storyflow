import { useState, useMemo } from 'react'
import {
  Calendar,
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Edit3,
  Plus,
  BarChart3,
  Flame
} from 'lucide-react'
import type {
  ProjectDeadline,
  DeadlineMilestone,
  VelocityStats,
  ProductivityInsight,
  DailyWordCount
} from '@/types/project'

interface DeadlineDashboardProps {
  deadline: ProjectDeadline | null
  velocityStats: VelocityStats | null
  currentWordCount: number
  dailyWordCounts: DailyWordCount[]
  onSetDeadline: (deadline: ProjectDeadline) => void
  onUpdateMilestone: (milestoneId: string, completed: boolean) => void
}

interface MilestoneProgressProps {
  milestone: DeadlineMilestone
  currentWords: number
  currentChapters: number
  onToggleComplete: (id: string, completed: boolean) => void
}

function MilestoneProgress({ milestone, currentWords, currentChapters, onToggleComplete }: MilestoneProgressProps) {
  const isOverdue = !milestone.completedAt && new Date(milestone.targetDate) < new Date()
  const isCompleted = !!milestone.completedAt

  let progress = 0
  if (milestone.targetWords) {
    progress = Math.min(currentWords / milestone.targetWords, 1) * 100
  } else if (milestone.targetChapters) {
    progress = Math.min(currentChapters / milestone.targetChapters, 1) * 100
  }

  return (
    <div className={`bg-surface-elevated rounded-lg p-3 border ${
      isCompleted ? 'border-green-500/30' :
      isOverdue ? 'border-red-500/30' :
      'border-border'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleComplete(milestone.id, !isCompleted)}
            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
              isCompleted
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-border hover:border-accent'
            }`}
          >
            {isCompleted && <CheckCircle className="w-3 h-3" />}
          </button>
          <span className={`text-sm font-medium ${isCompleted ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
            {milestone.name}
          </span>
        </div>
        <span className={`text-xs ${
          isCompleted ? 'text-green-400' :
          isOverdue ? 'text-red-400' :
          'text-text-secondary'
        }`}>
          {isCompleted ? 'Completed' :
           isOverdue ? 'Overdue' :
           new Date(milestone.targetDate).toLocaleDateString()}
        </span>
      </div>
      {!isCompleted && (
        <div className="h-1.5 bg-surface rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isOverdue ? 'bg-red-500' : 'bg-accent'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

function ProductivityCard({ insight }: { insight: ProductivityInsight }) {
  const iconMap = {
    positive: <TrendingUp className="w-4 h-4 text-green-400" />,
    warning: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
    suggestion: <Zap className="w-4 h-4 text-blue-400" />
  }

  const bgMap = {
    positive: 'bg-green-500/10 border-green-500/30',
    warning: 'bg-yellow-500/10 border-yellow-500/30',
    suggestion: 'bg-blue-500/10 border-blue-500/30'
  }

  return (
    <div className={`rounded-lg p-3 border ${bgMap[insight.type]}`}>
      <div className="flex items-start gap-2">
        {iconMap[insight.type]}
        <p className="text-sm text-text-primary">{insight.message}</p>
      </div>
    </div>
  )
}

export function DeadlineDashboard({
  deadline,
  velocityStats,
  currentWordCount,
  dailyWordCounts,
  onSetDeadline,
  onUpdateMilestone
}: DeadlineDashboardProps) {
  const [showSetDeadline, setShowSetDeadline] = useState(false)
  const [expandedMilestones, setExpandedMilestones] = useState(true)
  const [newDeadline, setNewDeadline] = useState({
    targetDate: '',
    targetWords: 80000,
    targetQuality: 80
  })

  // Calculate days remaining
  const daysRemaining = useMemo(() => {
    if (!deadline) return null
    const target = new Date(deadline.targetCompletionDate)
    const today = new Date()
    const diff = target.getTime() - today.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }, [deadline])

  // Calculate words remaining
  const wordsRemaining = useMemo(() => {
    if (!deadline) return null
    return Math.max(0, deadline.targetWordCount - currentWordCount)
  }, [deadline, currentWordCount])

  // Calculate required daily rate
  const requiredDailyRate = useMemo(() => {
    if (!daysRemaining || !wordsRemaining || daysRemaining <= 0) return null
    return Math.ceil(wordsRemaining / daysRemaining)
  }, [daysRemaining, wordsRemaining])

  // Calculate actual daily average (last 7 days)
  const recentDailyAverage = useMemo(() => {
    const recent = dailyWordCounts.slice(-7)
    if (recent.length === 0) return 0
    return Math.round(recent.reduce((sum, d) => sum + d.count, 0) / recent.length)
  }, [dailyWordCounts])

  // Calculate current streak
  const currentStreak = useMemo(() => {
    let streak = 0
    const sortedDays = [...dailyWordCounts].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    for (const day of sortedDays) {
      if (day.count > 0) {
        streak++
      } else {
        break
      }
    }
    return streak
  }, [dailyWordCounts])

  // Word count chart data (last 14 days)
  const chartData = useMemo(() => {
    const last14Days: { date: string; count: number }[] = []
    const today = new Date()

    for (let i = 13; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayData = dailyWordCounts.find(d => d.date === dateStr)
      last14Days.push({
        date: dateStr,
        count: dayData?.count || 0
      })
    }
    return last14Days
  }, [dailyWordCounts])

  const maxWordCount = Math.max(...chartData.map(d => d.count), 100)

  const handleCreateDeadline = () => {
    const newDeadlineObj: ProjectDeadline = {
      targetCompletionDate: newDeadline.targetDate,
      targetWordCount: newDeadline.targetWords,
      targetQualityScore: newDeadline.targetQuality / 100,
      milestones: [],
      createdAt: new Date().toISOString()
    }
    onSetDeadline(newDeadlineObj)
    setShowSetDeadline(false)
  }

  // Generate productivity insights
  const insights: ProductivityInsight[] = useMemo(() => {
    const result: ProductivityInsight[] = []

    if (velocityStats) {
      if (velocityStats.onTrack) {
        result.push({
          type: 'positive',
          message: `On track! Projected completion: ${new Date(velocityStats.projectedCompletionDate).toLocaleDateString()}`
        })
      } else if (daysRemaining && daysRemaining > 0) {
        result.push({
          type: 'warning',
          message: `Behind schedule. Increase daily output to ${requiredDailyRate} words/day to meet deadline.`
        })
      }

      if (velocityStats.bestProductivityHours.length > 0) {
        const hours = velocityStats.bestProductivityHours.slice(0, 2)
        result.push({
          type: 'suggestion',
          message: `Your most productive hours: ${hours.map(h => `${h}:00`).join(' and ')}`
        })
      }
    }

    if (currentStreak >= 7) {
      result.push({
        type: 'positive',
        message: `Amazing! You're on a ${currentStreak}-day writing streak!`
      })
    } else if (currentStreak === 0 && dailyWordCounts.length > 0) {
      result.push({
        type: 'warning',
        message: 'Your writing streak has been broken. Start fresh today!'
      })
    }

    return result
  }, [velocityStats, daysRemaining, requiredDailyRate, currentStreak, dailyWordCounts])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-accent" />
          Deadline Dashboard
        </h3>
        <p className="text-sm text-text-secondary">
          Track your writing velocity and deadline progress
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {!deadline ? (
          /* No Deadline Set */
          <div className="text-center py-8">
            {!showSetDeadline ? (
              <>
                <Calendar className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-50" />
                <p className="text-text-secondary mb-4">No deadline set</p>
                <button
                  onClick={() => setShowSetDeadline(true)}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Set Deadline
                </button>
              </>
            ) : (
              <div className="card p-4 text-left max-w-md mx-auto">
                <h4 className="font-semibold text-text-primary mb-4">Set Your Deadline</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-text-secondary block mb-1">Target Completion Date</label>
                    <input
                      type="date"
                      value={newDeadline.targetDate}
                      onChange={(e) => setNewDeadline(prev => ({ ...prev, targetDate: e.target.value }))}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary block mb-1">Target Word Count</label>
                    <input
                      type="number"
                      value={newDeadline.targetWords}
                      onChange={(e) => setNewDeadline(prev => ({ ...prev, targetWords: parseInt(e.target.value) || 0 }))}
                      className="input w-full"
                      min="1000"
                      step="1000"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-text-secondary block mb-1">Target Quality Score (%)</label>
                    <input
                      type="number"
                      value={newDeadline.targetQuality}
                      onChange={(e) => setNewDeadline(prev => ({ ...prev, targetQuality: parseInt(e.target.value) || 0 }))}
                      className="input w-full"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateDeadline}
                      disabled={!newDeadline.targetDate}
                      className="btn-primary flex-1"
                    >
                      Create Deadline
                    </button>
                    <button
                      onClick={() => setShowSetDeadline(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Deadline Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-4 text-center">
                <div className={`text-3xl font-bold ${
                  daysRemaining && daysRemaining < 0 ? 'text-red-400' :
                  daysRemaining && daysRemaining < 14 ? 'text-yellow-400' :
                  'text-text-primary'
                }`}>
                  {daysRemaining !== null ? (
                    daysRemaining < 0 ? `${Math.abs(daysRemaining)} overdue` : daysRemaining
                  ) : '-'}
                </div>
                <div className="text-xs text-text-secondary mt-1">
                  {daysRemaining !== null && daysRemaining >= 0 ? 'Days Remaining' : 'Days'}
                </div>
              </div>
              <div className="card p-4 text-center">
                <div className="text-3xl font-bold text-text-primary">
                  {wordsRemaining !== null ? wordsRemaining.toLocaleString() : '-'}
                </div>
                <div className="text-xs text-text-secondary mt-1">Words to Go</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="card p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-text-secondary">Overall Progress</span>
                <span className="text-sm font-medium text-text-primary">
                  {currentWordCount.toLocaleString()} / {deadline.targetWordCount.toLocaleString()}
                </span>
              </div>
              <div className="h-3 bg-surface-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent to-green-500 rounded-full transition-all"
                  style={{ width: `${Math.min((currentWordCount / deadline.targetWordCount) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-2 text-xs text-text-secondary">
                <span>{((currentWordCount / deadline.targetWordCount) * 100).toFixed(1)}% complete</span>
                <span>Target: {new Date(deadline.targetCompletionDate).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Velocity Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Flame className={`w-4 h-4 ${currentStreak > 0 ? 'text-orange-400' : 'text-text-secondary'}`} />
                </div>
                <div className="text-xl font-bold text-text-primary">{currentStreak}</div>
                <div className="text-xs text-text-secondary">Day Streak</div>
              </div>
              <div className="card p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Edit3 className="w-4 h-4 text-accent" />
                </div>
                <div className="text-xl font-bold text-text-primary">{recentDailyAverage}</div>
                <div className="text-xs text-text-secondary">Avg/Day</div>
              </div>
              <div className="card p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {requiredDailyRate && recentDailyAverage >= requiredDailyRate ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className="text-xl font-bold text-text-primary">{requiredDailyRate || '-'}</div>
                <div className="text-xs text-text-secondary">Needed/Day</div>
              </div>
            </div>

            {/* Word Count Chart */}
            <div className="card p-4">
              <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-accent" />
                Last 14 Days
              </h4>
              <div className="h-24 flex items-end gap-1">
                {chartData.map((day) => {
                  const height = maxWordCount > 0 ? (day.count / maxWordCount) * 100 : 0
                  const isToday = day.date === new Date().toISOString().split('T')[0]
                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center"
                    >
                      <div
                        className={`w-full rounded-t transition-all ${
                          isToday ? 'bg-accent' :
                          day.count > 0 ? 'bg-accent/50' : 'bg-surface-elevated'
                        }`}
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${day.date}: ${day.count} words`}
                      />
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-text-secondary">
                <span>14 days ago</span>
                <span>Today</span>
              </div>
            </div>

            {/* Milestones */}
            {deadline.milestones.length > 0 && (
              <div className="card">
                <button
                  onClick={() => setExpandedMilestones(!expandedMilestones)}
                  className="w-full flex items-center justify-between p-4"
                >
                  <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Milestones
                    <span className="text-xs font-normal text-text-secondary">
                      {deadline.milestones.filter(m => m.completedAt).length}/{deadline.milestones.length}
                    </span>
                  </h4>
                  {expandedMilestones ? (
                    <ChevronDown className="w-4 h-4 text-text-secondary" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-text-secondary" />
                  )}
                </button>
                {expandedMilestones && (
                  <div className="px-4 pb-4 space-y-2">
                    {deadline.milestones.map(milestone => (
                      <MilestoneProgress
                        key={milestone.id}
                        milestone={milestone}
                        currentWords={currentWordCount}
                        currentChapters={0}
                        onToggleComplete={onUpdateMilestone}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Productivity Insights */}
            {insights.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Insights
                </h4>
                {insights.map((insight, i) => (
                  <ProductivityCard key={i} insight={insight} />
                ))}
              </div>
            )}

            {/* Velocity Details */}
            {velocityStats && (
              <div className="card p-4">
                <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-accent" />
                  Writing Velocity
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-text-secondary">Draft Speed</span>
                    <p className="text-lg font-medium text-text-primary">
                      {velocityStats.avgDraftWordsPerHour} <span className="text-xs text-text-secondary">words/hr</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-text-secondary">Revision Speed</span>
                    <p className="text-lg font-medium text-text-primary">
                      {velocityStats.avgRevisionWordsPerHour} <span className="text-xs text-text-secondary">words/hr</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-text-secondary">Weekly Output</span>
                    <p className="text-lg font-medium text-text-primary">
                      {velocityStats.wordsThisWeek.toLocaleString()} <span className="text-xs text-text-secondary">words</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-text-secondary">vs Last Week</span>
                    <p className={`text-lg font-medium ${
                      velocityStats.weekOverWeekChange >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {velocityStats.weekOverWeekChange >= 0 ? '+' : ''}{velocityStats.weekOverWeekChange}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default DeadlineDashboard
