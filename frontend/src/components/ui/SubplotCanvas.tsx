import { useState, useMemo, useCallback } from 'react'
import {
  GitBranch,
  Plus,
  AlertTriangle,
  X,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Activity,
  Circle,
  Sparkles,
  Loader2,
  Lightbulb,
  Target
} from 'lucide-react'
import type {
  Subplot,
  SubplotType,
  SubplotStatus,
  SubplotTouch,
  SubplotWarning,
  Character,
  Scene,
  Chapter,
  NovelSpecification
} from '@/types/project'
import { useAIGeneration } from '@/hooks/useAIGeneration'
import { AIProgressModal } from '@/components/ui/AIProgressModal'

// Types for AI analysis results
interface SubplotAnalysisResult {
  subplotAnalysis: {
    subplotId: string
    subplotName: string
    healthScore: number
    status: 'healthy' | 'needs-attention' | 'critical' | 'dormant'
    issues: { type: string; description: string; severity: string }[]
    suggestions: string[]
    recommendedNextTouch: {
      chapterNumber: number
      touchType: string
      description: string
      tensionTarget: number
    }
    optimalResolutionWindow: { startChapter: number; endChapter: number }
  }[]
  overallPacing: {
    assessment: string
    chaptersWithTooManySubplots: number[]
    chaptersWithNoSubplotActivity: number[]
  }
  missingSubplotTypes: string[]
  interactionOpportunities: { subplot1: string; subplot2: string; suggestion: string }[]
}

interface SubplotTouchSuggestion {
  sceneId: string | null
  chapterNumber: number
  touchType: string
  tensionLevel: number
  description: string
  characterFocus: string
  dialogueHint: string
  narrativeHint: string
  integrationWithMainPlot: string
}

interface SubplotCanvasProps {
  subplots: Subplot[]
  subplotTouches: SubplotTouch[]
  characters: Character[]
  scenes: Scene[]
  chapters: Chapter[]
  specification?: NovelSpecification
  targetChapters?: number
  onCreateSubplot: (subplot: Omit<Subplot, 'id' | 'createdAt' | 'tensionCurve'>) => void
  onUpdateSubplot: (id: string, updates: Partial<Subplot>) => void
  onDeleteSubplot: (id: string) => void
  onAddTouch: (touch: Omit<SubplotTouch, 'id'>) => void
}

const SUBPLOT_TYPES: { value: SubplotType; label: string; color: string }[] = [
  { value: 'romance', label: 'Romance', color: '#ec4899' },
  { value: 'mystery', label: 'Mystery', color: '#8b5cf6' },
  { value: 'revenge', label: 'Revenge', color: '#ef4444' },
  { value: 'redemption', label: 'Redemption', color: '#22c55e' },
  { value: 'discovery', label: 'Discovery', color: '#3b82f6' },
  { value: 'survival', label: 'Survival', color: '#f97316' },
  { value: 'rivalry', label: 'Rivalry', color: '#eab308' },
  { value: 'coming-of-age', label: 'Coming of Age', color: '#06b6d4' },
  { value: 'custom', label: 'Custom', color: '#6b7280' },
]

const STATUS_CONFIG: Record<SubplotStatus, { label: string; color: string }> = {
  setup: { label: 'Setup', color: 'text-blue-400 bg-blue-500/20' },
  developing: { label: 'Developing', color: 'text-purple-400 bg-purple-500/20' },
  escalating: { label: 'Escalating', color: 'text-orange-400 bg-orange-500/20' },
  climax: { label: 'Climax', color: 'text-red-400 bg-red-500/20' },
  resolved: { label: 'Resolved', color: 'text-green-400 bg-green-500/20' },
  abandoned: { label: 'Abandoned', color: 'text-gray-400 bg-gray-500/20' },
}

function TensionCurveChart({ tensionCurve, color }: { tensionCurve: { chapterNumber: number; tensionLevel: number }[]; color: string }) {
  if (tensionCurve.length < 2) return null

  const maxChapter = Math.max(...tensionCurve.map(p => p.chapterNumber))
  const width = 200
  const height = 60
  const padding = 10

  const points = tensionCurve.map((point) => {
    const x = padding + ((point.chapterNumber / maxChapter) * (width - 2 * padding))
    const y = height - padding - ((point.tensionLevel / 10) * (height - 2 * padding))
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="mt-2">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {tensionCurve.map((point, i) => {
        const x = padding + ((point.chapterNumber / maxChapter) * (width - 2 * padding))
        const y = height - padding - ((point.tensionLevel / 10) * (height - 2 * padding))
        return (
          <circle key={i} cx={x} cy={y} r="3" fill={color} />
        )
      })}
    </svg>
  )
}

export function SubplotCanvas({
  subplots,
  subplotTouches,
  characters,
  scenes,
  chapters,
  specification,
  targetChapters = 20,
  onCreateSubplot,
  onUpdateSubplot,
  onDeleteSubplot,
  onAddTouch: _onAddTouch
}: SubplotCanvasProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [_editingSubplot, setEditingSubplot] = useState<Subplot | null>(null)
  const [expandedSubplot, setExpandedSubplot] = useState<string | null>(null)
  const [newSubplot, setNewSubplot] = useState({
    name: '',
    description: '',
    type: 'custom' as SubplotType,
    relatedCharacterIds: [] as string[],
    status: 'setup' as SubplotStatus,
    color: '#6b7280'
  })

  // AI Integration State
  const [aiAnalysis, setAiAnalysis] = useState<SubplotAnalysisResult | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [touchSuggestions, setTouchSuggestions] = useState<Record<string, SubplotTouchSuggestion[]>>({})
  const [loadingTouchSuggestions, setLoadingTouchSuggestions] = useState<string | null>(null)

  const { generate, isGenerating, status, progress, message, cancel } = useAIGeneration()

  // AI: Analyze all subplots
  const handleAnalyzeSubplots = useCallback(async () => {
    if (subplots.length === 0) return

    try {
      const result = await generate({
        agentTarget: 'subplot',
        action: 'analyze-subplot-health',
        context: {
          specification,
          characters,
          subplots,
          subplotTouches,
          currentChapter: chapters.length,
          targetChapters,
          chaptersWritten: chapters.length
        }
      })

      if (result) {
        try {
          const parsed = JSON.parse(result) as SubplotAnalysisResult
          setAiAnalysis(parsed)
          setShowAnalysis(true)
        } catch {
          console.error('Failed to parse subplot analysis result')
        }
      }
    } catch (error) {
      console.error('Subplot analysis failed:', error)
    }
  }, [generate, subplots, subplotTouches, chapters, characters, specification, targetChapters])

  // AI: Suggest touches for a specific subplot
  const handleSuggestTouches = useCallback(async (subplot: Subplot) => {
    setLoadingTouchSuggestions(subplot.id)

    try {
      const relatedCharacters = characters.filter(c =>
        subplot.relatedCharacterIds.includes(c.id)
      )
      const existingTouches = subplotTouches.filter(t => t.subplotId === subplot.id)

      const result = await generate({
        agentTarget: 'subplot',
        action: 'suggest-subplot-touches',
        context: {
          specification,
          characters,
          subplot,
          relatedCharacters,
          existingTouches,
          upcomingScenes: scenes.slice(0, 10),
          currentChapter: chapters.length,
          targetChapters,
          mainPlotPhase: chapters.length < targetChapters * 0.25 ? 'setup'
            : chapters.length < targetChapters * 0.5 ? 'confrontation'
            : chapters.length < targetChapters * 0.75 ? 'escalation'
            : 'resolution'
        }
      })

      if (result) {
        try {
          const parsed = JSON.parse(result)
          setTouchSuggestions(prev => ({
            ...prev,
            [subplot.id]: parsed.suggestions || []
          }))
        } catch {
          console.error('Failed to parse touch suggestions')
        }
      }
    } catch (error) {
      console.error('Touch suggestion failed:', error)
    } finally {
      setLoadingTouchSuggestions(null)
    }
  }, [generate, subplotTouches, chapters, characters, scenes, specification, targetChapters])

  // Calculate warnings
  const warnings = useMemo((): SubplotWarning[] => {
    const result: SubplotWarning[] = []
    const currentChapter = chapters.length

    for (const subplot of subplots) {
      if (subplot.status === 'resolved' || subplot.status === 'abandoned') continue

      const touches = subplotTouches.filter(t => t.subplotId === subplot.id)
      const lastTouch = touches.length > 0
        ? Math.max(...touches.map(t => chapters.findIndex(c => c.id === t.chapterId) + 1))
        : 0

      // Dormant warning - not touched in 3+ chapters
      if (currentChapter - lastTouch >= 3 && lastTouch > 0) {
        result.push({
          subplotId: subplot.id,
          type: 'dormant',
          message: `"${subplot.name}" hasn't appeared in ${currentChapter - lastTouch} chapters`,
          lastTouchedChapter: lastTouch,
          currentChapter
        })
      }

      // No setup warning
      if (!subplot.setupSceneId && touches.length === 0) {
        result.push({
          subplotId: subplot.id,
          type: 'missing_setup',
          message: `"${subplot.name}" has no setup scene defined`,
          lastTouchedChapter: 0,
          currentChapter
        })
      }

      // Unresolved at end warning (if we're past 80% of chapters)
      const targetChapters = 30 // Could be from spec
      if (currentChapter > targetChapters * 0.8 && subplot.status !== 'climax') {
        result.push({
          subplotId: subplot.id,
          type: 'unresolved',
          message: `"${subplot.name}" should be reaching climax/resolution soon`,
          lastTouchedChapter: lastTouch,
          currentChapter
        })
      }
    }

    return result
  }, [subplots, subplotTouches, chapters])

  const getTypeConfig = (type: SubplotType) =>
    SUBPLOT_TYPES.find(t => t.value === type) || SUBPLOT_TYPES[SUBPLOT_TYPES.length - 1]

  const handleCreate = () => {
    onCreateSubplot({
      name: newSubplot.name,
      description: newSubplot.description,
      type: newSubplot.type,
      relatedCharacterIds: newSubplot.relatedCharacterIds,
      status: newSubplot.status,
      color: newSubplot.color,
      setupSceneId: null,
      payoffSceneId: null
    })
    setShowCreateModal(false)
    setNewSubplot({
      name: '',
      description: '',
      type: 'custom',
      relatedCharacterIds: [],
      status: 'setup',
      color: '#6b7280'
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-accent" />
            Subplot Tracker
          </h3>
          <div className="flex items-center gap-2">
            {subplots.length > 0 && (
              <button
                onClick={handleAnalyzeSubplots}
                disabled={isGenerating}
                className="btn-ghost text-sm flex items-center gap-2 text-accent hover:bg-accent/10"
                title="Analyze subplot health with AI"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                AI Analyze
              </button>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Subplot
            </button>
          </div>
        </div>
        <p className="text-sm text-text-secondary">
          Track subplot threads and their tension curves across your story
        </p>
      </div>

      {/* AI Analysis Results */}
      {showAnalysis && aiAnalysis && (
        <div className="p-4 bg-accent/5 border-b border-accent/20">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-accent flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Subplot Analysis
            </h4>
            <button
              onClick={() => setShowAnalysis(false)}
              className="text-text-secondary hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Overall Pacing */}
          <div className="mb-4 p-3 bg-surface rounded-lg">
            <h5 className="text-xs font-medium text-text-secondary mb-1">Overall Pacing</h5>
            <p className="text-sm text-text-primary">{aiAnalysis.overallPacing.assessment}</p>
          </div>

          {/* Per-Subplot Analysis */}
          <div className="space-y-2 mb-4">
            {aiAnalysis.subplotAnalysis.map(analysis => {
              const subplot = subplots.find(s => s.id === analysis.subplotId || s.name === analysis.subplotName)
              const healthColor = analysis.healthScore >= 7 ? 'text-green-400'
                : analysis.healthScore >= 5 ? 'text-yellow-400'
                : 'text-red-400'

              return (
                <div key={analysis.subplotId || analysis.subplotName} className="p-3 bg-surface rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-text-primary">
                      {subplot?.name || analysis.subplotName}
                    </span>
                    <span className={`text-sm font-semibold ${healthColor}`}>
                      {analysis.healthScore}/10
                    </span>
                  </div>
                  {analysis.issues.length > 0 && (
                    <div className="mb-2">
                      {analysis.issues.map((issue, i) => (
                        <p key={i} className="text-xs text-yellow-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {issue.description}
                        </p>
                      ))}
                    </div>
                  )}
                  {analysis.recommendedNextTouch && (
                    <div className="text-xs text-text-secondary bg-surface-elevated p-2 rounded">
                      <span className="font-medium text-accent">Next:</span>{' '}
                      Chapter {analysis.recommendedNextTouch.chapterNumber} - {analysis.recommendedNextTouch.description}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Missing Subplot Types */}
          {aiAnalysis.missingSubplotTypes.length > 0 && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-text-secondary mb-1">Suggested Subplot Types</h5>
              <div className="flex flex-wrap gap-1">
                {aiAnalysis.missingSubplotTypes.map(type => (
                  <span key={type} className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interaction Opportunities */}
          {aiAnalysis.interactionOpportunities.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-text-secondary mb-1">Interaction Opportunities</h5>
              {aiAnalysis.interactionOpportunities.slice(0, 2).map((opp, i) => (
                <p key={i} className="text-xs text-text-secondary">
                  <Lightbulb className="w-3 h-3 inline mr-1 text-yellow-400" />
                  {opp.subplot1} + {opp.subplot2}: {opp.suggestion}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="p-4 bg-yellow-500/10 border-b border-yellow-500/30">
          <h4 className="text-sm font-semibold text-yellow-400 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" />
            {warnings.length} Subplot Warning{warnings.length !== 1 ? 's' : ''}
          </h4>
          <div className="space-y-1">
            {warnings.slice(0, 3).map((warning, i) => (
              <p key={i} className="text-sm text-yellow-300">{warning.message}</p>
            ))}
          </div>
        </div>
      )}

      {/* Subplots List */}
      <div className="flex-1 overflow-y-auto p-4">
        {subplots.length === 0 ? (
          <div className="text-center py-8">
            <GitBranch className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-50" />
            <p className="text-text-secondary">No subplots yet</p>
            <p className="text-sm text-text-secondary mt-1">
              Create subplot threads to track story arcs
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {subplots.map(subplot => {
              const typeConfig = getTypeConfig(subplot.type)
              const statusConfig = STATUS_CONFIG[subplot.status]
              const isExpanded = expandedSubplot === subplot.id
              const touches = subplotTouches.filter(t => t.subplotId === subplot.id)
              const subplotWarnings = warnings.filter(w => w.subplotId === subplot.id)

              return (
                <div
                  key={subplot.id}
                  className="card border-l-4"
                  style={{ borderLeftColor: subplot.color || typeConfig.color }}
                >
                  <button
                    onClick={() => setExpandedSubplot(isExpanded ? null : subplot.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-surface-elevated rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-text-secondary" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-text-secondary" />
                      )}
                      <Circle className="w-3 h-3" style={{ color: subplot.color || typeConfig.color, fill: subplot.color || typeConfig.color }} />
                      <div className="text-left">
                        <span className="font-medium text-text-primary">{subplot.name}</span>
                        <span className="text-xs text-text-secondary ml-2">({typeConfig.label})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {subplotWarnings.length > 0 && (
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4">
                      {/* Description */}
                      {subplot.description && (
                        <p className="text-sm text-text-secondary">{subplot.description}</p>
                      )}

                      {/* Related Characters */}
                      {subplot.relatedCharacterIds.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-text-secondary mb-2">Characters Involved</h5>
                          <div className="flex flex-wrap gap-1">
                            {subplot.relatedCharacterIds.map(charId => {
                              const char = characters.find(c => c.id === charId)
                              return char ? (
                                <span key={charId} className="text-xs bg-surface-elevated px-2 py-0.5 rounded text-text-primary">
                                  {char.name}
                                </span>
                              ) : null
                            })}
                          </div>
                        </div>
                      )}

                      {/* Tension Curve */}
                      {subplot.tensionCurve.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-text-secondary mb-1 flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            Tension Curve
                          </h5>
                          <TensionCurveChart
                            tensionCurve={subplot.tensionCurve}
                            color={subplot.color || typeConfig.color}
                          />
                        </div>
                      )}

                      {/* Touches */}
                      <div>
                        <h5 className="text-xs font-medium text-text-secondary mb-2">
                          Chapter Appearances ({touches.length})
                        </h5>
                        {touches.length === 0 ? (
                          <p className="text-xs text-text-secondary italic">No chapter appearances yet</p>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {touches.map(touch => {
                              const chapter = chapters.find(c => c.id === touch.chapterId)
                              return (
                                <span
                                  key={touch.id}
                                  className="text-xs bg-surface-elevated px-2 py-0.5 rounded text-text-primary"
                                  title={`Tension: ${touch.tensionLevel}/10 - ${touch.touchType}`}
                                >
                                  Ch {chapter?.number || '?'}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {/* Status Update */}
                      <div>
                        <h5 className="text-xs font-medium text-text-secondary mb-2">Update Status</h5>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                            <button
                              key={status}
                              onClick={() => onUpdateSubplot(subplot.id, { status: status as SubplotStatus })}
                              className={`text-xs px-2 py-1 rounded transition-colors ${
                                subplot.status === status
                                  ? config.color
                                  : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
                              }`}
                            >
                              {config.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* AI Touch Suggestions */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-xs font-medium text-text-secondary flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            AI Touch Suggestions
                          </h5>
                          <button
                            onClick={() => handleSuggestTouches(subplot)}
                            disabled={loadingTouchSuggestions === subplot.id}
                            className="btn-ghost text-xs flex items-center gap-1 text-accent hover:bg-accent/10"
                          >
                            {loadingTouchSuggestions === subplot.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                            Suggest
                          </button>
                        </div>
                        {touchSuggestions[subplot.id]?.length > 0 ? (
                          <div className="space-y-2">
                            {touchSuggestions[subplot.id].slice(0, 3).map((suggestion, i) => (
                              <div key={i} className="p-2 bg-accent/5 rounded-lg border border-accent/20">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-accent">
                                    Chapter {suggestion.chapterNumber}
                                  </span>
                                  <span className="text-xs text-text-secondary">
                                    {suggestion.touchType} • Tension {suggestion.tensionLevel}/10
                                  </span>
                                </div>
                                <p className="text-xs text-text-primary mb-1">{suggestion.description}</p>
                                {suggestion.dialogueHint && (
                                  <p className="text-xs text-text-secondary italic">
                                    "{suggestion.dialogueHint}"
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-text-secondary italic">
                            Click "Suggest" to get AI recommendations
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <button
                          onClick={() => setEditingSubplot(subplot)}
                          className="btn-ghost text-xs flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteSubplot(subplot.id)}
                          className="btn-ghost text-xs flex items-center gap-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Create Subplot</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                <input
                  type="text"
                  value={newSubplot.name}
                  onChange={(e) => setNewSubplot({ ...newSubplot, name: e.target.value })}
                  placeholder="e.g., Romance B-Story"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Type</label>
                <select
                  value={newSubplot.type}
                  onChange={(e) => {
                    const type = e.target.value as SubplotType
                    const config = getTypeConfig(type)
                    setNewSubplot({ ...newSubplot, type, color: config.color })
                  }}
                  className="input w-full"
                >
                  {SUBPLOT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                <textarea
                  value={newSubplot.description}
                  onChange={(e) => setNewSubplot({ ...newSubplot, description: e.target.value })}
                  placeholder="Brief description of this subplot..."
                  className="input w-full h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Characters Involved</label>
                <div className="flex flex-wrap gap-1">
                  {characters.filter(c => c.role !== 'minor').map(char => (
                    <button
                      key={char.id}
                      onClick={() => {
                        const ids = newSubplot.relatedCharacterIds.includes(char.id)
                          ? newSubplot.relatedCharacterIds.filter(id => id !== char.id)
                          : [...newSubplot.relatedCharacterIds, char.id]
                        setNewSubplot({ ...newSubplot, relatedCharacterIds: ids })
                      }}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        newSubplot.relatedCharacterIds.includes(char.id)
                          ? 'bg-accent text-white'
                          : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {char.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleCreate}
                  disabled={!newSubplot.name.trim()}
                  className="btn-primary flex-1"
                >
                  Create Subplot
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Progress Modal */}
      <AIProgressModal
        isOpen={isGenerating}
        onClose={cancel}
        onCancel={cancel}
        title="Analyzing Subplots..."
        status={status}
        progress={progress}
        message={message}
      />
    </div>
  )
}

export default SubplotCanvas
