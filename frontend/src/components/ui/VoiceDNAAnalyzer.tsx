import { useState, useMemo } from 'react'
import {
  Mic,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Volume2,
  X,
  Info
} from 'lucide-react'
import type {
  CharacterVoiceDNA,
  VoiceDeviationWarning,
  Character
} from '@/types/project'

interface VoiceDNAAnalyzerProps {
  characters: Character[]
  voiceDNA: Record<string, CharacterVoiceDNA>
  warnings: VoiceDeviationWarning[]
  onAnalyzeCharacter: (characterId: string) => void
  onAcknowledgeWarning: (warningId: string) => void
  isAnalyzing?: boolean
  analyzingCharacterId?: string
}

interface VoiceMetricProps {
  label: string
  value: number
  maxValue?: number
  format?: 'percent' | 'number'
  description?: string
}

function VoiceMetric({ label, value, maxValue = 1, format = 'percent', description }: VoiceMetricProps) {
  const percentage = (value / maxValue) * 100

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary flex items-center gap-1">
          {label}
          {description && (
            <span className="group relative">
              <Info className="w-3 h-3 text-text-secondary cursor-help" />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-surface-elevated text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {description}
              </span>
            </span>
          )}
        </span>
        <span className="text-xs font-medium text-text-primary">
          {format === 'percent' ? `${(value * 100).toFixed(0)}%` : value.toFixed(1)}
        </span>
      </div>
      <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}

export function VoiceDNAAnalyzer({
  characters,
  voiceDNA,
  warnings,
  onAnalyzeCharacter,
  onAcknowledgeWarning,
  isAnalyzing = false,
  analyzingCharacterId
}: VoiceDNAAnalyzerProps) {
  const [expandedCharacter, setExpandedCharacter] = useState<string | null>(null)
  const [selectedWarning, setSelectedWarning] = useState<VoiceDeviationWarning | null>(null)

  // Group warnings by character
  const warningsByCharacter = useMemo(() => {
    const grouped = new Map<string, VoiceDeviationWarning[]>()
    for (const warning of warnings.filter(w => !w.acknowledged)) {
      const existing = grouped.get(warning.characterId) || []
      grouped.set(warning.characterId, [...existing, warning])
    }
    return grouped
  }, [warnings])

  const unanalyzedCharacters = characters.filter(c =>
    !voiceDNA[c.id] && (c.role === 'protagonist' || c.role === 'antagonist' || c.role === 'supporting')
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-2">
          <Mic className="w-5 h-5 text-accent" />
          Voice DNA Analyzer
        </h3>
        <p className="text-sm text-text-secondary">
          Analyze character dialogue to build voice fingerprints and detect inconsistencies
        </p>
      </div>

      {/* Unanalyzed Characters Alert */}
      {unanalyzedCharacters.length > 0 && (
        <div className="p-4 bg-yellow-500/10 border-b border-yellow-500/30">
          <p className="text-sm text-yellow-400 mb-2">
            {unanalyzedCharacters.length} character{unanalyzedCharacters.length !== 1 ? 's' : ''} need voice analysis
          </p>
          <div className="flex flex-wrap gap-2">
            {unanalyzedCharacters.slice(0, 3).map(char => (
              <button
                key={char.id}
                onClick={() => onAnalyzeCharacter(char.id)}
                disabled={isAnalyzing}
                className="btn-secondary text-xs flex items-center gap-1"
              >
                {isAnalyzing && analyzingCharacterId === char.id ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                Analyze {char.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Warnings Section */}
      {warningsByCharacter.size > 0 && (
        <div className="p-4 bg-red-500/10 border-b border-red-500/30">
          <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" />
            Voice Deviations Detected
          </h4>
          <div className="space-y-2">
            {Array.from(warningsByCharacter.entries()).map(([charId, charWarnings]) => {
              const character = characters.find(c => c.id === charId)
              return (
                <div key={charId} className="bg-surface-elevated rounded-lg p-3 border border-red-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-text-primary">{character?.name || 'Unknown'}</span>
                    <span className="text-xs text-red-400">{charWarnings.length} issue{charWarnings.length !== 1 ? 's' : ''}</span>
                  </div>
                  {charWarnings.slice(0, 2).map(warning => (
                    <div
                      key={warning.id}
                      className="text-sm text-text-secondary cursor-pointer hover:text-text-primary transition-colors"
                      onClick={() => setSelectedWarning(warning)}
                    >
                      <span className="text-yellow-400">
                        Match: {(warning.matchScore * 100).toFixed(0)}%
                      </span>
                      {' - '}
                      "{warning.dialogueText.slice(0, 50)}..."
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Voice DNA List */}
      <div className="flex-1 overflow-y-auto p-4">
        {Object.keys(voiceDNA).length === 0 ? (
          <div className="text-center py-8">
            <Volume2 className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-50" />
            <p className="text-text-secondary">No voice profiles yet</p>
            <p className="text-sm text-text-secondary mt-1">
              Analyze character dialogue to build voice fingerprints
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(voiceDNA).map(([charId, dna]) => {
              const character = characters.find(c => c.id === charId)
              const isExpanded = expandedCharacter === charId
              const charWarnings = warningsByCharacter.get(charId) || []

              return (
                <div key={charId} className="card">
                  <button
                    onClick={() => setExpandedCharacter(isExpanded ? null : charId)}
                    className="w-full flex items-center justify-between p-4 hover:bg-surface-elevated rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-text-secondary" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-text-secondary" />
                      )}
                      <div className="text-left">
                        <span className="font-medium text-text-primary">{character?.name || 'Unknown'}</span>
                        <span className="text-xs text-text-secondary ml-2">
                          {dna.dialogueSamplesCount} samples
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {charWarnings.length > 0 && (
                        <span className="text-xs text-red-400 bg-red-500/20 px-2 py-0.5 rounded">
                          {charWarnings.length} warning{charWarnings.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4">
                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-4">
                        <VoiceMetric
                          label="Avg Sentence Length"
                          value={dna.avgSentenceLength}
                          maxValue={30}
                          format="number"
                          description="Average words per sentence"
                        />
                        <VoiceMetric
                          label="Contraction Usage"
                          value={dna.contractionRatio}
                          description="How often they use contractions"
                        />
                        <VoiceMetric
                          label="Question Frequency"
                          value={dna.questionFrequency}
                          description="How often they ask questions"
                        />
                        <VoiceMetric
                          label="Exclamation Usage"
                          value={dna.exclamationFrequency}
                          description="How often they exclaim"
                        />
                      </div>

                      {/* Vocabulary */}
                      {dna.uniqueVocabulary.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-text-secondary mb-2">Unique Vocabulary</h5>
                          <div className="flex flex-wrap gap-1">
                            {dna.uniqueVocabulary.slice(0, 10).map((word, i) => (
                              <span key={i} className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">
                                {word}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Catchphrases */}
                      {dna.catchphrases.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-text-secondary mb-2">Catchphrases</h5>
                          <div className="space-y-1">
                            {dna.catchphrases.slice(0, 3).map((phrase, i) => (
                              <p key={i} className="text-sm text-text-primary italic">"{phrase}"</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sample Dialogue */}
                      {dna.sampleDialogue.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-text-secondary mb-2">Sample Dialogue</h5>
                          <div className="bg-surface-elevated rounded-lg p-3 space-y-2">
                            {dna.sampleDialogue.slice(0, 3).map((line, i) => (
                              <p key={i} className="text-sm text-text-secondary">
                                <MessageSquare className="w-3 h-3 inline mr-2 text-accent" />
                                "{line}"
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Speech Pattern Notes */}
                      {dna.speechPatternNotes && (
                        <div>
                          <h5 className="text-xs font-medium text-text-secondary mb-2">Voice Summary</h5>
                          <p className="text-sm text-text-secondary">{dna.speechPatternNotes}</p>
                        </div>
                      )}

                      {/* Re-analyze Button */}
                      <button
                        onClick={() => onAnalyzeCharacter(charId)}
                        disabled={isAnalyzing}
                        className="btn-secondary text-sm w-full flex items-center justify-center gap-2"
                      >
                        {isAnalyzing && analyzingCharacterId === charId ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Re-analyze Voice
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Warning Detail Modal */}
      {selectedWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Voice Deviation</h3>
              <button onClick={() => setSelectedWarning(null)} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-1">Dialogue</h4>
                <p className="text-text-primary italic">"{selectedWarning.dialogueText}"</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-1">
                  Match Score: <span className={selectedWarning.matchScore < 0.5 ? 'text-red-400' : 'text-yellow-400'}>
                    {(selectedWarning.matchScore * 100).toFixed(0)}%
                  </span>
                </h4>
              </div>

              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-2">Deviations</h4>
                <ul className="space-y-1">
                  {selectedWarning.deviations.map((dev, i) => (
                    <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <span><strong className="text-text-primary">{dev.type}:</strong> {dev.description}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedWarning.suggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Suggestions</h4>
                  <ul className="space-y-1">
                    {selectedWarning.suggestions.map((sug, i) => (
                      <li key={i} className="text-sm text-green-400 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        {sug}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    onAcknowledgeWarning(selectedWarning.id)
                    setSelectedWarning(null)
                  }}
                  className="btn-primary flex-1"
                >
                  Acknowledge
                </button>
                <button
                  onClick={() => setSelectedWarning(null)}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VoiceDNAAnalyzer
