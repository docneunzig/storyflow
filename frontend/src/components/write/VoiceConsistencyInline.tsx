import { useState, useMemo, useCallback } from 'react'
import { AlertTriangle, X, ChevronDown, ChevronUp, MessageSquare, Sparkles, Check, EyeOff, Wand2, Loader2 } from 'lucide-react'
import type { Chapter, Character, CharacterVoiceDNA } from '@/types/project'
import { useAIGeneration } from '@/hooks/useAIGeneration'

interface DialogueDeviation {
  characterId: string
  characterName: string
  dialogue: string
  lineNumber: number
  matchScore: number
  deviations: { type: string; description: string }[]
  suggestions: string[]
  status: 'pending' | 'ignored' | 'fixed'
}

interface VoiceConsistencyInlineProps {
  chapter: Chapter
  characters: Character[]
  voiceDNA: Record<string, CharacterVoiceDNA>
  onFixDialogue?: (lineNumber: number, originalDialogue: string, fixedDialogue: string) => void
}

// Parse dialogue from chapter content with line tracking
function parseDialogue(content: string): { speaker: string | null; dialogue: string; lineNumber: number }[] {
  if (!content) return []

  const lines = content.split('\n')
  const dialogues: { speaker: string | null; dialogue: string; lineNumber: number }[] = []

  // Patterns to match dialogue
  // Pattern 1: "Dialogue," Character said.
  // Pattern 2: Character said, "Dialogue."
  // Pattern 3: "Dialogue."
  const dialoguePatterns = [
    // "Dialogue," Name said
    /"([^"]+)"\s*[,.]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:said|asked|replied|whispered|shouted|yelled|muttered|exclaimed|murmured|called|cried|hissed|growled|snapped|laughed|sighed)/gi,
    // Name said, "Dialogue"
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:said|asked|replied|whispered|shouted|yelled|muttered|exclaimed|murmured|called|cried|hissed|growled|snapped|laughed|sighed)[,:]?\s*"([^"]+)"/gi,
  ]

  lines.forEach((line, index) => {
    const lineNum = index + 1

    // Try each pattern
    for (const pattern of dialoguePatterns) {
      pattern.lastIndex = 0
      let match

      while ((match = pattern.exec(line)) !== null) {
        // Determine which capture group has dialogue vs speaker based on pattern
        if (match[2] && /^[A-Z]/.test(match[2]) && !/^[A-Z]/.test(match[1].charAt(0))) {
          // Pattern 1: dialogue first, then speaker
          dialogues.push({
            speaker: match[2].trim(),
            dialogue: match[1].trim(),
            lineNumber: lineNum,
          })
        } else if (match[1] && /^[A-Z]/.test(match[1])) {
          // Pattern 2: speaker first, then dialogue
          dialogues.push({
            speaker: match[1].trim(),
            dialogue: match[2]?.trim() || '',
            lineNumber: lineNum,
          })
        }
      }
    }

    // Also match standalone quoted dialogue (no attribution)
    const standalonePattern = /"([^"]{10,})"/g
    let standaloneMatch: RegExpExecArray | null
    while ((standaloneMatch = standalonePattern.exec(line)) !== null) {
      const matchedDialogue = standaloneMatch[1].trim()
      // Check if this wasn't already captured
      const alreadyCaptured = dialogues.some(
        d => d.lineNumber === lineNum && d.dialogue === matchedDialogue
      )
      if (!alreadyCaptured) {
        dialogues.push({
          speaker: null,
          dialogue: matchedDialogue,
          lineNumber: lineNum,
        })
      }
    }
  })

  return dialogues
}

// Check dialogue against character voice DNA (local heuristics)
function checkVoiceConsistency(
  dialogue: string,
  characterName: string,
  voiceDNA: CharacterVoiceDNA
): { matchScore: number; deviations: { type: string; description: string }[]; suggestions: string[] } {
  const deviations: { type: string; description: string }[] = []
  const suggestions: string[] = []
  let matchScore = 1.0

  // Check sentence length
  const sentences = dialogue.split(/[.!?]+/).filter(s => s.trim())
  const avgLength = sentences.length > 0
    ? sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / sentences.length
    : 0

  if (voiceDNA.avgSentenceLength) {
    const lengthDiff = Math.abs(avgLength - voiceDNA.avgSentenceLength) / voiceDNA.avgSentenceLength
    if (lengthDiff > 0.5) {
      deviations.push({
        type: 'length',
        description: `Sentence length (${Math.round(avgLength)} words) differs significantly from ${characterName}'s typical style (${Math.round(voiceDNA.avgSentenceLength)} words)`,
      })
      matchScore -= 0.15
      suggestions.push(avgLength > voiceDNA.avgSentenceLength
        ? 'Try breaking up sentences into shorter phrases'
        : 'Consider combining some thoughts into longer, flowing sentences')
    }
  }

  // Check for prohibited vocabulary
  const dialogueLower = dialogue.toLowerCase()
  const usedProhibited = (voiceDNA.prohibitedVocabulary || []).filter(word =>
    dialogueLower.includes(word.toLowerCase())
  )
  if (usedProhibited.length > 0) {
    deviations.push({
      type: 'vocabulary',
      description: `Uses words ${characterName} would never say: "${usedProhibited.join('", "')}"`,
    })
    matchScore -= 0.2 * usedProhibited.length
    suggestions.push(`Replace "${usedProhibited[0]}" with a word more fitting for ${characterName}'s voice`)
  }

  // Check contraction usage
  const hasContractions = /\b(don't|won't|can't|couldn't|wouldn't|shouldn't|isn't|aren't|wasn't|weren't|I'm|you're|we're|they're|he's|she's|it's|that's|there's|what's|who's|how's|I've|you've|we've|they've|I'll|you'll|we'll|they'll|I'd|you'd|we'd|they'd)\b/i.test(dialogue)
  const contractionRatio = voiceDNA.contractionRatio || 0.5

  if (hasContractions && contractionRatio < 0.2) {
    deviations.push({
      type: 'pattern',
      description: `${characterName} typically uses formal speech without contractions`,
    })
    matchScore -= 0.1
    suggestions.push('Expand contractions to match formal speech pattern')
  } else if (!hasContractions && contractionRatio > 0.7 && dialogue.length > 30) {
    deviations.push({
      type: 'pattern',
      description: `${characterName} typically uses casual speech with contractions`,
    })
    matchScore -= 0.1
    suggestions.push('Add contractions for more natural, casual speech')
  }

  // Check for catchphrases (bonus if present)
  const usesCatchphrase = (voiceDNA.catchphrases || []).some(phrase =>
    dialogueLower.includes(phrase.toLowerCase())
  )
  if (usesCatchphrase) {
    matchScore = Math.min(1.0, matchScore + 0.1)
  }

  // Check for unique vocabulary (bonus if present)
  const usesUniqueVocab = (voiceDNA.uniqueVocabulary || []).some(word =>
    dialogueLower.includes(word.toLowerCase())
  )
  if (usesUniqueVocab) {
    matchScore = Math.min(1.0, matchScore + 0.1)
  }

  // Check question frequency
  const hasQuestion = dialogue.includes('?')
  const questionFreq = voiceDNA.questionFrequency || 0.3
  if (hasQuestion && questionFreq < 0.1) {
    deviations.push({
      type: 'pattern',
      description: `${characterName} rarely asks questions in dialogue`,
    })
    matchScore -= 0.1
  }

  // Check exclamation frequency
  const hasExclamation = dialogue.includes('!')
  const exclamationFreq = voiceDNA.exclamationFrequency || 0.2
  if (hasExclamation && exclamationFreq < 0.1) {
    deviations.push({
      type: 'pattern',
      description: `${characterName} rarely uses exclamations`,
    })
    matchScore -= 0.1
  }

  return {
    matchScore: Math.max(0, Math.min(1, matchScore)),
    deviations,
    suggestions,
  }
}

export function VoiceConsistencyInline({
  chapter,
  characters,
  voiceDNA,
  onFixDialogue,
}: VoiceConsistencyInlineProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [deviationStatuses, setDeviationStatuses] = useState<Record<string, DialogueDeviation['status']>>({})
  const [fixingLineNumber, setFixingLineNumber] = useState<number | null>(null)

  const { generate, isGenerating } = useAIGeneration()

  // Parse dialogue and check voice consistency
  const deviations = useMemo(() => {
    if (!chapter.content || characters.length === 0 || Object.keys(voiceDNA).length === 0) {
      return []
    }

    const dialogues = parseDialogue(chapter.content)
    const found: DialogueDeviation[] = []

    for (const { speaker, dialogue, lineNumber } of dialogues) {
      if (!speaker || !dialogue) continue

      // Find character by name (case-insensitive partial match)
      const character = characters.find(c =>
        c.name.toLowerCase().includes(speaker.toLowerCase()) ||
        speaker.toLowerCase().includes(c.name.toLowerCase()) ||
        (c.aliases || []).some(alias =>
          alias.toLowerCase().includes(speaker.toLowerCase()) ||
          speaker.toLowerCase().includes(alias.toLowerCase())
        )
      )

      if (!character) continue

      const dna = voiceDNA[character.id]
      if (!dna) continue

      const result = checkVoiceConsistency(dialogue, character.name, dna)

      // Only flag if match score is below threshold
      if (result.matchScore < 0.7 && result.deviations.length > 0) {
        const key = `${lineNumber}-${dialogue.substring(0, 20)}`
        found.push({
          characterId: character.id,
          characterName: character.name,
          dialogue,
          lineNumber,
          matchScore: result.matchScore,
          deviations: result.deviations,
          suggestions: result.suggestions,
          status: deviationStatuses[key] || 'pending',
        })
      }
    }

    return found
  }, [chapter.content, characters, voiceDNA, deviationStatuses])

  const handleResolution = useCallback((deviation: DialogueDeviation, status: DialogueDeviation['status']) => {
    const key = `${deviation.lineNumber}-${deviation.dialogue.substring(0, 20)}`
    setDeviationStatuses(prev => ({
      ...prev,
      [key]: status,
    }))
  }, [])

  const handleFixVoice = useCallback(async (deviation: DialogueDeviation) => {
    const character = characters.find(c => c.id === deviation.characterId)
    if (!character) return

    setFixingLineNumber(deviation.lineNumber)

    try {
      const result = await generate({
        agentTarget: 'character',
        action: 'fix-voice',
        context: {
          characterName: character.name,
          voiceDNA: voiceDNA[character.id],
          originalDialogue: deviation.dialogue,
          deviations: deviation.deviations,
        },
      })

      if (result && onFixDialogue) {
        // Parse the result - expect JSON with fixedDialogue field
        try {
          const parsed = JSON.parse(result)
          if (parsed.fixedDialogue) {
            onFixDialogue(deviation.lineNumber, deviation.dialogue, parsed.fixedDialogue)
            handleResolution(deviation, 'fixed')
          }
        } catch {
          // Try to use the result directly if it's not JSON
          if (result.includes('"')) {
            // Extract quoted text as the fixed dialogue
            const match = result.match(/"([^"]+)"/)
            if (match) {
              onFixDialogue(deviation.lineNumber, deviation.dialogue, match[1])
              handleResolution(deviation, 'fixed')
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fix voice:', error)
    } finally {
      setFixingLineNumber(null)
    }
  }, [characters, voiceDNA, generate, onFixDialogue, handleResolution])

  const pendingCount = deviations.filter(d => d.status === 'pending').length

  if (dismissed || deviations.length === 0) {
    return null
  }

  return (
    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-purple-500/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-purple-400" aria-hidden="true" />
          <span className="font-medium text-purple-400">
            Voice Consistency Warning{deviations.length > 1 ? 's' : ''} ({pendingCount} pending / {deviations.length} total)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setDismissed(true)
            }}
            className="p-1 rounded hover:bg-purple-500/20 transition-colors"
            aria-label="Dismiss warnings"
          >
            <X className="h-4 w-4 text-purple-400" aria-hidden="true" />
          </button>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-purple-400" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 text-purple-400" aria-hidden="true" />
          )}
        </div>
      </div>

      {/* Deviations List */}
      {isExpanded && (
        <div className="border-t border-purple-500/30 p-3 space-y-3">
          <p className="text-sm text-text-secondary">
            The following dialogue may not match the character's established voice:
          </p>
          {deviations.map((deviation, index) => (
            <div
              key={`${deviation.lineNumber}-${index}`}
              className="p-3 bg-surface rounded-lg border border-border"
            >
              <div className="flex items-start gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-purple-400">
                      {deviation.characterName}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      Line {deviation.lineNumber}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      deviation.matchScore >= 0.5
                        ? 'bg-warning/20 text-warning'
                        : 'bg-error/20 text-error'
                    }`}>
                      {Math.round(deviation.matchScore * 100)}% match
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2 pl-6">
                <blockquote className="text-sm text-text-primary italic border-l-2 border-purple-500/50 pl-3 py-1 bg-purple-500/5 rounded-r">
                  "{deviation.dialogue.substring(0, 150)}{deviation.dialogue.length > 150 ? '...' : ''}"
                </blockquote>
              </div>

              <div className="mt-2 pl-6 space-y-1">
                {deviation.deviations.map((dev, i) => (
                  <p key={i} className="text-sm text-purple-300 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                    {dev.description}
                  </p>
                ))}
              </div>

              {deviation.suggestions.length > 0 && (
                <div className="mt-2 pl-6">
                  <p className="text-sm text-text-secondary flex items-center gap-1">
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    Suggestion: {deviation.suggestions[0]}
                  </p>
                </div>
              )}

              {/* Resolution Options */}
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {deviation.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleResolution(deviation, 'ignored')}
                        className="px-3 py-1.5 text-xs bg-surface border border-border rounded-lg hover:bg-surface-elevated transition-colors flex items-center gap-1.5"
                        title="Ignore this warning"
                      >
                        <EyeOff className="h-3 w-3" aria-hidden="true" />
                        Ignore
                      </button>
                      {onFixDialogue && (
                        <button
                          onClick={() => handleFixVoice(deviation)}
                          disabled={isGenerating}
                          className="px-3 py-1.5 text-xs bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                          title="AI will rewrite dialogue to match character voice"
                        >
                          {fixingLineNumber === deviation.lineNumber ? (
                            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                          ) : (
                            <Wand2 className="h-3 w-3" aria-hidden="true" />
                          )}
                          Fix Voice
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                        deviation.status === 'ignored'
                          ? 'bg-text-secondary/10 text-text-secondary'
                          : 'bg-success/10 text-success'
                      }`}>
                        <Check className="h-3 w-3" aria-hidden="true" />
                        {deviation.status === 'ignored' ? 'Ignored' : 'Fixed'}
                      </span>
                      <button
                        onClick={() => handleResolution(deviation, 'pending')}
                        className="text-xs text-text-secondary hover:text-text-primary underline"
                      >
                        Undo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
