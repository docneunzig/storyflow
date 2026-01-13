import { useState, useMemo, useCallback } from 'react'
import {
  Palette,
  Upload,
  Sparkles,
  RefreshCw,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Type,
  AlignLeft,
  Quote,
  Gauge,
  Star,
  StarOff,
  Copy,
} from 'lucide-react'
import { useAIGeneration } from '@/hooks/useAIGeneration'
import { AIProgressModal } from './AIProgressModal'
import type { StyleFingerprint } from '@/types/project'

interface StyleProfilerProps {
  fingerprints: StyleFingerprint[]
  activeStyleId: string | null
  onAnalyzeStyle: (name: string, sampleText: string, sourceName?: string) => Promise<void>
  onSetActiveStyle: (styleId: string | null) => void
  onDeleteStyle: (styleId: string) => void
  isAnalyzing?: boolean
}

// Visualization helpers
function ScoreBar({ value, label, color = 'accent' }: { value: number; label: string; color?: string }) {
  const percentage = Math.round(value * 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-primary">{percentage}%</span>
      </div>
      <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
        <div
          className={`h-full bg-${color} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function MetricDisplay({ value, label, unit = '' }: { value: number | string; label: string; unit?: string }) {
  return (
    <div className="text-center">
      <div className="text-xl font-bold text-text-primary">
        {typeof value === 'number' ? value.toFixed(1) : value}
        {unit && <span className="text-sm text-text-secondary ml-1">{unit}</span>}
      </div>
      <div className="text-xs text-text-secondary">{label}</div>
    </div>
  )
}

export function StyleProfiler({
  fingerprints,
  activeStyleId,
  onAnalyzeStyle,
  onSetActiveStyle,
  onDeleteStyle,
  isAnalyzing = false,
}: StyleProfilerProps) {
  // Input state
  const [showInput, setShowInput] = useState(false)
  const [styleName, setStyleName] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [sampleText, setSampleText] = useState('')

  // UI state
  const [expandedStyle, setExpandedStyle] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['structure']))
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // AI generation
  const { isGenerating, progress, message } = useAIGeneration()

  // Get active style
  const activeStyle = useMemo(
    () => fingerprints.find((f) => f.id === activeStyleId),
    [fingerprints, activeStyleId]
  )

  const handleAnalyze = useCallback(async () => {
    if (!styleName.trim() || !sampleText.trim()) return

    await onAnalyzeStyle(styleName.trim(), sampleText.trim(), sourceName.trim() || undefined)

    // Reset form
    setStyleName('')
    setSourceName('')
    setSampleText('')
    setShowInput(false)
  }, [styleName, sourceName, sampleText, onAnalyzeStyle])

  const toggleSection = (section: string) => {
    const next = new Set(expandedSections)
    if (next.has(section)) {
      next.delete(section)
    } else {
      next.add(section)
    }
    setExpandedSections(next)
  }

  const copyStyleSummary = useCallback((style: StyleFingerprint) => {
    const summary = `Style: ${style.name}
Source: ${style.sourceName || 'Unknown'}
Voice: ${style.authorVoice}
Sentence Length: ${style.sentenceStructure.avgLength.toFixed(1)} words avg
Vocabulary: ${(style.vocabulary.sophistication * 100).toFixed(0)}% sophistication
Distinctive markers: ${style.distinctiveMarkers.slice(0, 3).join(', ')}`

    navigator.clipboard.writeText(summary)
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Palette className="w-5 h-5 text-accent" />
            Style Profiler
          </h3>
          <button
            onClick={() => setShowInput(!showInput)}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            {showInput ? <X className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            {showInput ? 'Cancel' : 'Analyze New Style'}
          </button>
        </div>

        {/* Active Style Indicator */}
        {activeStyle && (
          <div className="bg-accent/10 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-accent" />
              <div>
                <p className="text-sm font-medium text-text-primary">Active Style: {activeStyle.name}</p>
                {activeStyle.sourceName && (
                  <p className="text-xs text-text-secondary">Based on: {activeStyle.sourceName}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => onSetActiveStyle(null)}
              className="btn-ghost text-sm text-text-secondary"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* New Style Input */}
      {showInput && (
        <div className="p-4 border-b border-border bg-surface-elevated/50">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-text-secondary mb-1 block">Style Name *</label>
                <input
                  type="text"
                  value={styleName}
                  onChange={(e) => setStyleName(e.target.value)}
                  placeholder="e.g., 'Dark Fantasy Prose'"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="text-sm text-text-secondary mb-1 block">Source (optional)</label>
                <input
                  type="text"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  placeholder="e.g., 'Patrick Rothfuss'"
                  className="input w-full"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1 block">
                Sample Text * (minimum 500 words recommended)
              </label>
              <textarea
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                placeholder="Paste a sample of the writing style you want to analyze..."
                className="input w-full h-48 resize-none"
              />
              <p className="text-xs text-text-secondary mt-1">
                {sampleText.split(/\s+/).filter(Boolean).length} words
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowInput(false)}
                className="btn-ghost text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAnalyze}
                disabled={!styleName.trim() || sampleText.split(/\s+/).filter(Boolean).length < 100 || isAnalyzing}
                className="btn-primary text-sm flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Analyze Style
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fingerprints List */}
      <div className="flex-1 overflow-y-auto p-4">
        {fingerprints.length === 0 ? (
          <div className="text-center py-8">
            <Palette className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-50" />
            <p className="text-text-secondary">No style profiles yet</p>
            <p className="text-sm text-text-secondary mt-1">
              Analyze a writing sample to create a style fingerprint
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {fingerprints.map((style) => {
              const isExpanded = expandedStyle === style.id
              const isActive = activeStyleId === style.id

              return (
                <div
                  key={style.id}
                  className={`card border ${isActive ? 'border-accent' : 'border-border'}`}
                >
                  {/* Style Header */}
                  <div className="flex items-center justify-between p-3">
                    <button
                      onClick={() => setExpandedStyle(isExpanded ? null : style.id)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-text-secondary" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-text-secondary" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text-primary">{style.name}</span>
                          {isActive && (
                            <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        {style.sourceName && (
                          <p className="text-xs text-text-secondary">Source: {style.sourceName}</p>
                        )}
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyStyleSummary(style)}
                        className="btn-ghost p-2"
                        title="Copy style summary"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {isActive ? (
                        <button
                          onClick={() => onSetActiveStyle(null)}
                          className="btn-ghost p-2"
                          title="Deactivate style"
                        >
                          <StarOff className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onSetActiveStyle(style.id)}
                          className="btn-ghost p-2 text-accent"
                          title="Set as active style"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      {confirmDelete === style.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              onDeleteStyle(style.id)
                              setConfirmDelete(null)
                            }}
                            className="btn-ghost p-2 text-red-400"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="btn-ghost p-2"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(style.id)}
                          className="btn-ghost p-2 text-text-secondary hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-4">
                      {/* Voice Description */}
                      <div className="bg-surface-elevated rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Quote className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                          <p className="text-sm text-text-primary italic">{style.authorVoice}</p>
                        </div>
                      </div>

                      {/* Key Metrics */}
                      <div className="grid grid-cols-4 gap-4 p-3 bg-surface-elevated rounded-lg">
                        <MetricDisplay
                          value={style.sentenceStructure.avgLength}
                          label="Avg Sentence"
                          unit="words"
                        />
                        <MetricDisplay
                          value={(style.vocabulary.sophistication * 100).toFixed(0)}
                          label="Vocabulary"
                          unit="%"
                        />
                        <MetricDisplay
                          value={(style.narrativeTechniques.dialogueToNarrativeRatio * 100).toFixed(0)}
                          label="Dialogue"
                          unit="%"
                        />
                        <MetricDisplay
                          value={((style.narrativeTechniques.showVsTell ?? 0.5) * 100).toFixed(0)}
                          label="Showing"
                          unit="%"
                        />
                      </div>

                      {/* Collapsible Sections */}
                      <div className="space-y-2">
                        {/* Sentence Structure */}
                        <div className="border border-border rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleSection('structure')}
                            className="w-full flex items-center justify-between p-3 hover:bg-surface-elevated transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <AlignLeft className="w-4 h-4 text-blue-400" />
                              <span className="text-sm font-medium text-text-primary">
                                Sentence Structure
                              </span>
                            </div>
                            {expandedSections.has('structure') ? (
                              <ChevronDown className="w-4 h-4 text-text-secondary" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-text-secondary" />
                            )}
                          </button>
                          {expandedSections.has('structure') && (
                            <div className="p-3 border-t border-border space-y-3">
                              <ScoreBar
                                value={style.sentenceStructure.complexity}
                                label="Complexity"
                              />
                              <ScoreBar
                                value={style.sentenceStructure.fragmentFrequency}
                                label="Fragment Usage"
                              />
                              <div className="text-xs text-text-secondary">
                                <strong>Patterns:</strong>{' '}
                                {style.sentenceStructure.patterns?.join(', ') || 'Standard'}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Vocabulary */}
                        <div className="border border-border rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleSection('vocabulary')}
                            className="w-full flex items-center justify-between p-3 hover:bg-surface-elevated transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Type className="w-4 h-4 text-purple-400" />
                              <span className="text-sm font-medium text-text-primary">
                                Vocabulary
                              </span>
                            </div>
                            {expandedSections.has('vocabulary') ? (
                              <ChevronDown className="w-4 h-4 text-text-secondary" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-text-secondary" />
                            )}
                          </button>
                          {expandedSections.has('vocabulary') && (
                            <div className="p-3 border-t border-border space-y-3">
                              <ScoreBar
                                value={style.vocabulary.sophistication}
                                label="Sophistication"
                              />
                              <ScoreBar
                                value={style.vocabulary.concreteVsAbstract ?? 0.5}
                                label="Concrete vs Abstract"
                              />
                              {style.vocabulary.favorites?.length > 0 && (
                                <div className="text-xs text-text-secondary">
                                  <strong>Favorite words:</strong>{' '}
                                  {style.vocabulary.favorites.slice(0, 5).join(', ')}
                                </div>
                              )}
                              {style.vocabulary.avoided?.length > 0 && (
                                <div className="text-xs text-text-secondary">
                                  <strong>Avoided:</strong>{' '}
                                  {style.vocabulary.avoided.slice(0, 5).join(', ')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Narrative Techniques */}
                        <div className="border border-border rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleSection('narrative')}
                            className="w-full flex items-center justify-between p-3 hover:bg-surface-elevated transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-green-400" />
                              <span className="text-sm font-medium text-text-primary">
                                Narrative Techniques
                              </span>
                            </div>
                            {expandedSections.has('narrative') ? (
                              <ChevronDown className="w-4 h-4 text-text-secondary" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-text-secondary" />
                            )}
                          </button>
                          {expandedSections.has('narrative') && (
                            <div className="p-3 border-t border-border space-y-3">
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <span className="text-text-secondary">POV:</span>{' '}
                                  <span className="text-text-primary">
                                    {style.narrativeTechniques.pov}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-text-secondary">Tense:</span>{' '}
                                  <span className="text-text-primary">
                                    {style.narrativeTechniques.tense}
                                  </span>
                                </div>
                              </div>
                              <ScoreBar
                                value={style.narrativeTechniques.streamOfConsciousness}
                                label="Stream of Consciousness"
                              />
                              <ScoreBar
                                value={style.narrativeTechniques.internalizationFrequency}
                                label="Internalization"
                              />
                              <ScoreBar
                                value={style.narrativeTechniques.sceneSummaryBalance ?? 0.5}
                                label="Scene vs Summary"
                              />
                            </div>
                          )}
                        </div>

                        {/* Rhythm */}
                        <div className="border border-border rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleSection('rhythm')}
                            className="w-full flex items-center justify-between p-3 hover:bg-surface-elevated transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Gauge className="w-4 h-4 text-orange-400" />
                              <span className="text-sm font-medium text-text-primary">
                                Rhythm & Pacing
                              </span>
                            </div>
                            {expandedSections.has('rhythm') ? (
                              <ChevronDown className="w-4 h-4 text-text-secondary" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-text-secondary" />
                            )}
                          </button>
                          {expandedSections.has('rhythm') && (
                            <div className="p-3 border-t border-border space-y-2 text-xs">
                              <div>
                                <span className="text-text-secondary">Punctuation:</span>{' '}
                                <span className="text-text-primary capitalize">
                                  {style.rhythm.punctuationStyle}
                                </span>
                              </div>
                              <div>
                                <span className="text-text-secondary">Paragraphs:</span>{' '}
                                <span className="text-text-primary capitalize">
                                  {style.rhythm.paragraphLength}
                                </span>
                              </div>
                              <div>
                                <span className="text-text-secondary">Dialogue Tags:</span>{' '}
                                <span className="text-text-primary capitalize">
                                  {style.rhythm.dialogueTagStyle}
                                </span>
                              </div>
                              {style.rhythm.pacingPattern && (
                                <div>
                                  <span className="text-text-secondary">Pacing:</span>{' '}
                                  <span className="text-text-primary">
                                    {style.rhythm.pacingPattern}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Distinctive Markers */}
                      {style.distinctiveMarkers && style.distinctiveMarkers.length > 0 && (
                        <div className="bg-surface-elevated rounded-lg p-3">
                          <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
                            Distinctive Markers
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {style.distinctiveMarkers.map((marker, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-accent/20 text-accent px-2 py-1 rounded"
                              >
                                {marker}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sample Passages */}
                      {style.samplePassages && (
                        <div className="space-y-2">
                          <h5 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                            Sample Passages
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(style.samplePassages)
                              .filter(([_, text]) => text)
                              .slice(0, 4)
                              .map(([type, text]) => (
                                <div
                                  key={type}
                                  className="bg-surface-elevated rounded-lg p-3 text-xs"
                                >
                                  <span className="text-text-secondary capitalize block mb-1">
                                    {type}:
                                  </span>
                                  <p className="text-text-primary italic line-clamp-3">
                                    "{text}"
                                  </p>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Analysis Date */}
                      <p className="text-xs text-text-secondary text-right">
                        Analyzed: {new Date(style.analyzedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* AI Progress Modal */}
      <AIProgressModal
        isOpen={isAnalyzing || isGenerating}
        onClose={() => {}}
        onCancel={() => {}}
        title="Analyzing Style"
        status="generating"
        progress={progress}
        message={message || 'Extracting style fingerprint...'}
      />
    </div>
  )
}

export default StyleProfiler
