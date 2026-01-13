import { useState, useMemo, useCallback } from 'react'
import {
  Eye,
  EyeOff,
  CheckCircle,
  Lightbulb,
  Search,
  ChevronDown,
  ChevronRight,
  Sparkles,
  RefreshCw,
  X,
  Wand2,
  Check,
  Ban,
  MessageSquare,
  Activity,
  Heart,
  Zap,
} from 'lucide-react'
import { useAIGeneration } from '@/hooks/useAIGeneration'
import { AIProgressModal } from './AIProgressModal'
import type {
  ShowDontTellViolation,
  ShowDontTellAlternative,
  Chapter,
} from '@/types/project'

interface ShowDontTellAnalyzerProps {
  violations: ShowDontTellViolation[]
  chapter: Chapter | null
  onAnalyze: (chapterId: string, content: string) => void
  onApplyFix: (violationId: string, rewrite: string) => void
  onIgnoreViolation: (violationId: string) => void
  onMarkFixed: (violationId: string) => void
  isAnalyzing?: boolean
}

const VIOLATION_TYPE_CONFIG: Record<
  ShowDontTellViolation['violationType'],
  { icon: React.ReactNode; label: string; color: string; description: string }
> = {
  emotion: {
    icon: <Heart className="w-4 h-4" />,
    label: 'Emotion',
    color: 'text-pink-400',
    description: 'Emotions stated directly instead of shown through actions/reactions',
  },
  trait: {
    icon: <MessageSquare className="w-4 h-4" />,
    label: 'Trait',
    color: 'text-purple-400',
    description: 'Character traits announced rather than demonstrated',
  },
  state: {
    icon: <Activity className="w-4 h-4" />,
    label: 'State',
    color: 'text-blue-400',
    description: 'Situational states declared without sensory grounding',
  },
  reaction: {
    icon: <Zap className="w-4 h-4" />,
    label: 'Reaction',
    color: 'text-orange-400',
    description: 'Character reactions summarized instead of dramatized',
  },
}

const TECHNIQUE_LABELS: Record<ShowDontTellAlternative['technique'], string> = {
  action: 'Through Action',
  dialogue: 'Through Dialogue',
  sensory: 'Sensory Detail',
  physical: 'Physical Response',
  metaphor: 'Metaphor/Simile',
}

const SEVERITY_CONFIG: Record<
  ShowDontTellViolation['severity'],
  { color: string; bgColor: string; label: string }
> = {
  high: { color: 'text-red-400', bgColor: 'bg-red-500/20', label: 'High Impact' },
  medium: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', label: 'Medium Impact' },
  low: { color: 'text-blue-400', bgColor: 'bg-blue-500/20', label: 'Low Impact' },
}

export function ShowDontTellAnalyzer({
  violations,
  chapter,
  onAnalyze,
  onApplyFix,
  onIgnoreViolation,
  onMarkFixed,
  isAnalyzing = false,
}: ShowDontTellAnalyzerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<ShowDontTellViolation['violationType'] | 'all'>(
    'all'
  )
  const [selectedSeverity, setSelectedSeverity] = useState<
    ShowDontTellViolation['severity'] | 'all'
  >('all')
  const [expandedViolations, setExpandedViolations] = useState<Set<string>>(new Set())
  const [_selectedViolation, _setSelectedViolation] = useState<ShowDontTellViolation | null>(null)
  const [showFixed, setShowFixed] = useState(false)
  const [showIgnored, setShowIgnored] = useState(false)

  // AI rewrite functionality
  const { generate, isGenerating, progress, message } = useAIGeneration()
  const [rewriteResult, setRewriteResult] = useState<{
    violationId: string
    rewrite: string
    technique: string
  } | null>(null)

  // Filter violations
  const filteredViolations = useMemo(() => {
    return violations.filter((v) => {
      // Status filter
      if (v.status === 'fixed' && !showFixed) return false
      if (v.status === 'ignored' && !showIgnored) return false
      if (v.status === 'pending') {
        // Type filter
        if (selectedType !== 'all' && v.violationType !== selectedType) return false
        // Severity filter
        if (selectedSeverity !== 'all' && v.severity !== selectedSeverity) return false
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          v.originalText.toLowerCase().includes(query) ||
          v.explanation.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [violations, selectedType, selectedSeverity, searchQuery, showFixed, showIgnored])

  // Group by status
  const pendingViolations = useMemo(
    () => filteredViolations.filter((v) => v.status === 'pending'),
    [filteredViolations]
  )
  const fixedViolations = useMemo(
    () => filteredViolations.filter((v) => v.status === 'fixed'),
    [filteredViolations]
  )
  const ignoredViolations = useMemo(
    () => filteredViolations.filter((v) => v.status === 'ignored'),
    [filteredViolations]
  )

  // Count by severity
  const severityCounts = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 }
    for (const v of violations.filter((v) => v.status === 'pending')) {
      counts[v.severity]++
    }
    return counts
  }, [violations])

  const toggleViolation = (id: string) => {
    const next = new Set(expandedViolations)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setExpandedViolations(next)
  }

  const handleAnalyze = useCallback(() => {
    if (chapter?.content) {
      onAnalyze(chapter.id, chapter.content)
    }
  }, [chapter, onAnalyze])

  const handleGenerateRewrite = useCallback(
    async (violation: ShowDontTellViolation, technique?: string) => {
      if (!chapter) return

      // Get context around the violation
      const content = chapter.content
      const start = Math.max(0, violation.position.start - 200)
      const end = Math.min(content.length, violation.position.end + 200)
      const contextBefore = content.slice(start, violation.position.start)
      const contextAfter = content.slice(violation.position.end, end)

      const result = await generate({
        agentTarget: 'showDontTell',
        action: 'rewrite-to-show',
        context: {
          tellingPassage: violation.originalText,
          contextBefore,
          contextAfter,
          violationType: violation.violationType,
          technique: technique || 'best fit',
        },
      })

      if (result) {
        try {
          const parsed = JSON.parse(result)
          setRewriteResult({
            violationId: violation.id,
            rewrite: parsed.rewrite,
            technique: parsed.technique,
          })
        } catch {
          // If parsing fails, use the result as-is
          setRewriteResult({
            violationId: violation.id,
            rewrite: result,
            technique: technique || 'auto',
          })
        }
      }
    },
    [chapter, generate]
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Eye className="w-5 h-5 text-accent" />
            Show Don't Tell Analyzer
          </h3>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !chapter?.content}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            {isAnalyzing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Analyze Chapter
          </button>
        </div>

        {/* Severity Summary */}
        {violations.length > 0 && (
          <div className="flex gap-4 mb-3">
            {(['high', 'medium', 'low'] as const).map((severity) => (
              <div
                key={severity}
                className={`flex items-center gap-2 px-3 py-1 rounded-full ${SEVERITY_CONFIG[severity].bgColor}`}
              >
                <span className={`text-sm font-medium ${SEVERITY_CONFIG[severity].color}`}>
                  {severityCounts[severity]}
                </span>
                <span className="text-xs text-text-secondary">{SEVERITY_CONFIG[severity].label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search violations..."
              className="input pl-9 w-full"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) =>
              setSelectedType(e.target.value as ShowDontTellViolation['violationType'] | 'all')
            }
            className="input w-32"
          >
            <option value="all">All Types</option>
            {Object.entries(VIOLATION_TYPE_CONFIG).map(([type, config]) => (
              <option key={type} value={type}>
                {config.label}
              </option>
            ))}
          </select>
          <select
            value={selectedSeverity}
            onChange={(e) =>
              setSelectedSeverity(e.target.value as ShowDontTellViolation['severity'] | 'all')
            }
            className="input w-36"
          >
            <option value="all">All Severity</option>
            <option value="high">High Impact</option>
            <option value="medium">Medium Impact</option>
            <option value="low">Low Impact</option>
          </select>
        </div>
      </div>

      {/* Violations List */}
      <div className="flex-1 overflow-y-auto p-4">
        {pendingViolations.length === 0 && !isAnalyzing ? (
          <div className="text-center py-8">
            <Eye className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-50" />
            <p className="text-text-secondary">No "telling" passages found</p>
            <p className="text-sm text-text-secondary mt-1">
              {chapter
                ? 'Click "Analyze Chapter" to find opportunities to show rather than tell'
                : 'Select a chapter to analyze'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingViolations.map((violation) => {
              const typeConfig = VIOLATION_TYPE_CONFIG[violation.violationType]
              const severityConfig = SEVERITY_CONFIG[violation.severity]
              const isExpanded = expandedViolations.has(violation.id)

              return (
                <div
                  key={violation.id}
                  className={`card border ${
                    violation.severity === 'high'
                      ? 'border-red-500/30'
                      : violation.severity === 'medium'
                      ? 'border-yellow-500/30'
                      : 'border-border'
                  }`}
                >
                  {/* Violation Header */}
                  <button
                    onClick={() => toggleViolation(violation.id)}
                    className="w-full flex items-start gap-3 p-3 hover:bg-surface-elevated rounded-lg transition-colors text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-text-secondary mt-1 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-text-secondary mt-1 flex-shrink-0" />
                    )}
                    <span className={`${typeConfig.color} mt-0.5 flex-shrink-0`}>
                      {typeConfig.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary font-medium line-clamp-2">
                        "{violation.originalText}"
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${severityConfig.bgColor} ${severityConfig.color}`}
                        >
                          {severityConfig.label}
                        </span>
                        <span className="text-xs text-text-secondary">{typeConfig.label}</span>
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-3">
                      {/* Explanation */}
                      <div className="bg-surface-elevated rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-text-secondary">{violation.explanation}</p>
                        </div>
                      </div>

                      {/* Alternatives */}
                      {violation.alternatives && violation.alternatives.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                            Suggested Rewrites
                          </h5>
                          {violation.alternatives.map((alt, idx) => (
                            <div
                              key={idx}
                              className="bg-surface-elevated rounded-lg p-3 border border-border hover:border-accent/50 transition-colors group"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <span className="text-xs text-accent font-medium">
                                    {TECHNIQUE_LABELS[alt.technique] || alt.technique}
                                  </span>
                                  <p className="text-sm text-text-primary mt-1 italic">
                                    "{alt.rewrite}"
                                  </p>
                                  <p className="text-xs text-text-secondary mt-2">
                                    {alt.explanation}
                                  </p>
                                </div>
                                <button
                                  onClick={() => onApplyFix(violation.id, alt.rewrite)}
                                  className="btn-ghost text-accent opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-sm"
                                >
                                  <Check className="w-4 h-4" />
                                  Apply
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* AI Rewrite Button */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGenerateRewrite(violation)}
                          disabled={isGenerating}
                          className="btn-secondary text-sm flex items-center gap-2"
                        >
                          <Wand2 className="w-4 h-4" />
                          Generate New Rewrite
                        </button>
                        <button
                          onClick={() => onIgnoreViolation(violation.id)}
                          className="btn-ghost text-sm text-text-secondary flex items-center gap-2"
                        >
                          <Ban className="w-4 h-4" />
                          Ignore
                        </button>
                        <button
                          onClick={() => onMarkFixed(violation.id)}
                          className="btn-ghost text-sm text-green-400 flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark Fixed
                        </button>
                      </div>

                      {/* AI Rewrite Result */}
                      {rewriteResult && rewriteResult.violationId === violation.id && (
                        <div className="bg-accent/10 rounded-lg p-3 border border-accent/30">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <span className="text-xs text-accent font-medium">
                                AI Generated ({rewriteResult.technique})
                              </span>
                              <p className="text-sm text-text-primary mt-1 italic">
                                "{rewriteResult.rewrite}"
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  onApplyFix(violation.id, rewriteResult.rewrite)
                                  setRewriteResult(null)
                                }}
                                className="btn-primary text-sm flex items-center gap-1"
                              >
                                <Check className="w-4 h-4" />
                                Apply
                              </button>
                              <button
                                onClick={() => setRewriteResult(null)}
                                className="btn-ghost text-sm"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Fixed Violations (collapsible) */}
        {fixedViolations.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowFixed(!showFixed)}
              className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-2"
            >
              {showFixed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showFixed ? 'Hide' : 'Show'} {fixedViolations.length} fixed issue
              {fixedViolations.length !== 1 ? 's' : ''}
            </button>
            {showFixed && (
              <div className="mt-2 space-y-2 opacity-60">
                {fixedViolations.map((v) => (
                  <div
                    key={v.id}
                    className="bg-surface-elevated rounded-lg p-3 border border-green-500/30"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <p className="text-sm text-text-primary line-through">{v.originalText}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ignored Violations (collapsible) */}
        {ignoredViolations.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowIgnored(!showIgnored)}
              className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-2"
            >
              {showIgnored ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showIgnored ? 'Hide' : 'Show'} {ignoredViolations.length} ignored issue
              {ignoredViolations.length !== 1 ? 's' : ''}
            </button>
            {showIgnored && (
              <div className="mt-2 space-y-2 opacity-40">
                {ignoredViolations.map((v) => (
                  <div key={v.id} className="bg-surface-elevated rounded-lg p-3 border border-border">
                    <p className="text-sm text-text-secondary">{v.originalText}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Progress Modal */}
      <AIProgressModal
        isOpen={isGenerating}
        onClose={() => {}}
        onCancel={() => {}}
        title="Generating Rewrite"
        status="generating"
        progress={progress}
        message={message}
      />
    </div>
  )
}

export default ShowDontTellAnalyzer
