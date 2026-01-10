import { useState, useMemo } from 'react'
import { AlertTriangle, CheckCircle, Mic, ChevronDown, ChevronUp, Lightbulb, X } from 'lucide-react'
import type { Character, Chapter, Scene } from '@/types/project'

interface VoiceInconsistency {
  id: string
  characterId: string
  characterName: string
  expectedVocabulary: string
  problematicText: string
  issueType: 'slang_in_formal' | 'formal_in_casual' | 'vocabulary_mismatch' | 'speech_pattern_violation'
  severity: 'warning' | 'error'
  suggestion: string
  context?: string
}

interface VoiceConsistencyCheckerProps {
  characters: Character[]
  chapters: Chapter[]
  scenes: Scene[]
  isOpen: boolean
  onClose: () => void
}

// Common slang words/phrases that would be inappropriate for formal vocabulary
const SLANG_PATTERNS = [
  /\b(gonna|wanna|gotta|kinda|sorta|dunno|ain't|y'all|yeah|nope|yup|nah|dude|bro|sis|chill|lit|sick|dope|cool|awesome|whatever|stuff|things|like,|you know,|basically|literally)\b/gi,
  /\b(lol|omg|btw|idk|tbh|imo|fyi|asap)\b/gi,
  /\b(super|totally|crazy|insane|massive|huge|epic|legit)\b/gi,
]

// Formal vocabulary indicators
const FORMAL_PATTERNS = [
  /\b(furthermore|therefore|consequently|nevertheless|moreover|hence|thus|accordingly|subsequently|hitherto|whereby|wherein|notwithstanding)\b/gi,
  /\b(endeavor|facilitate|utilize|implement|procure|ascertain|elucidate|substantiate|corroborate)\b/gi,
  /\b(I shall|one must|it is imperative|it behooves|permit me to)\b/gi,
]

// Extract dialogue from text (content between quotes)
function extractDialogue(text: string): { speaker: string | null; dialogue: string; context: string }[] {
  const dialogueMatches: { speaker: string | null; dialogue: string; context: string }[] = []

  // Match dialogue with potential speaker attribution
  const pattern = /(?:([A-Z][a-z]+)\s+(?:said|replied|asked|whispered|shouted|muttered|exclaimed|responded|answered|stated|declared|remarked|continued|added|noted|observed|suggested|insisted|demanded|pleaded|begged|cried|screamed|murmured|mumbled|growled|hissed|sighed|laughed|chuckled|snorted|scoffed|sneered|snarled|barked|snapped|roared|bellowed|boomed|thundered),?\s+)?[""]([^""]+)[""]/gi

  let match
  while ((match = pattern.exec(text)) !== null) {
    const startIdx = Math.max(0, match.index - 50)
    const endIdx = Math.min(text.length, match.index + match[0].length + 50)
    dialogueMatches.push({
      speaker: match[1] || null,
      dialogue: match[2],
      context: text.slice(startIdx, endIdx),
    })
  }

  return dialogueMatches
}

// Check if text contains slang
function containsSlang(text: string): string[] {
  const found: string[] = []
  for (const pattern of SLANG_PATTERNS) {
    const matches = text.match(pattern)
    if (matches) {
      found.push(...matches)
    }
  }
  return [...new Set(found)]
}

// Check if text is overly formal
function containsFormalLanguage(text: string): string[] {
  const found: string[] = []
  for (const pattern of FORMAL_PATTERNS) {
    const matches = text.match(pattern)
    if (matches) {
      found.push(...matches)
    }
  }
  return [...new Set(found)]
}

// Analyze character voice consistency
function analyzeVoiceConsistency(
  characters: Character[],
  chapters: Chapter[],
): VoiceInconsistency[] {
  const inconsistencies: VoiceInconsistency[] = []
  let idCounter = 0

  // Build character name to character map
  const characterByName = new Map<string, Character>()
  for (const char of characters) {
    characterByName.set(char.name.toLowerCase(), char)
    // Also add aliases
    for (const alias of char.aliases || []) {
      characterByName.set(alias.toLowerCase(), char)
    }
  }

  // Analyze each chapter's content
  for (const chapter of chapters) {
    if (!chapter.content) continue

    const dialogues = extractDialogue(chapter.content)

    for (const { speaker, dialogue, context } of dialogues) {
      // Try to identify the character from speaker attribution or context
      let character: Character | undefined

      if (speaker) {
        character = characterByName.get(speaker.toLowerCase())
      }

      // If we can't identify the speaker, check if any character name appears in context
      if (!character) {
        for (const char of characters) {
          if (context.toLowerCase().includes(char.name.toLowerCase())) {
            character = char
            break
          }
        }
      }

      if (!character) continue

      const vocabLevel = (character.vocabularyLevel || '').toLowerCase()

      // Check for formal character using slang
      if (vocabLevel.includes('formal') || vocabLevel.includes('academic') || vocabLevel.includes('professional') || vocabLevel.includes('eloquent')) {
        const slangFound = containsSlang(dialogue)
        if (slangFound.length > 0) {
          inconsistencies.push({
            id: `voice-${++idCounter}`,
            characterId: character.id,
            characterName: character.name,
            expectedVocabulary: character.vocabularyLevel || 'Formal',
            problematicText: dialogue,
            issueType: 'slang_in_formal',
            severity: 'warning',
            suggestion: `Replace informal language (${slangFound.join(', ')}) with more formal alternatives. For example: "gonna" → "going to", "yeah" → "yes", "stuff" → "items" or "matters".`,
            context,
          })
        }
      }

      // Check for casual character using overly formal language
      if (vocabLevel.includes('casual') || vocabLevel.includes('street') || vocabLevel.includes('slang') || vocabLevel.includes('informal')) {
        const formalFound = containsFormalLanguage(dialogue)
        if (formalFound.length > 0) {
          inconsistencies.push({
            id: `voice-${++idCounter}`,
            characterId: character.id,
            characterName: character.name,
            expectedVocabulary: character.vocabularyLevel || 'Casual',
            problematicText: dialogue,
            issueType: 'formal_in_casual',
            severity: 'warning',
            suggestion: `The formal language (${formalFound.join(', ')}) seems out of character. Consider using more casual alternatives. For example: "therefore" → "so", "endeavor" → "try".`,
            context,
          })
        }
      }

      // Check speech patterns if defined
      if (character.speechPatterns) {
        const patterns = character.speechPatterns.toLowerCase()

        // Check for specific speech pattern violations
        if (patterns.includes('stutters') && !dialogue.includes('-') && !dialogue.includes('...')) {
          // Character stutters but dialogue has no stutter markers
          // Only flag longer dialogues
          if (dialogue.length > 30) {
            inconsistencies.push({
              id: `voice-${++idCounter}`,
              characterId: character.id,
              characterName: character.name,
              expectedVocabulary: `Speech pattern: ${character.speechPatterns}`,
              problematicText: dialogue,
              issueType: 'speech_pattern_violation',
              severity: 'warning',
              suggestion: `${character.name} is noted to stutter, but this dialogue shows none. Consider adding stutter markers like "I-I didn't mean to" or hesitation markers like "I... didn't mean to".`,
              context,
            })
          }
        }
      }
    }
  }

  return inconsistencies
}

export function VoiceConsistencyChecker({
  characters,
  chapters,
  scenes: _scenes,
  isOpen,
  onClose,
}: VoiceConsistencyCheckerProps) {
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set())

  const inconsistencies = useMemo(
    () => analyzeVoiceConsistency(characters, chapters),
    [characters, chapters]
  )

  const toggleIssue = (id: string) => {
    setExpandedIssues(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  if (!isOpen) return null

  const hasIssues = inconsistencies.length > 0
  const warningCount = inconsistencies.filter(i => i.severity === 'warning').length
  const errorCount = inconsistencies.filter(i => i.severity === 'error').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-3xl mx-4 animate-in fade-in zoom-in-95 duration-200 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-accent" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-text-primary">
              Voice Consistency Check
            </h2>
            {hasIssues ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-warning/20 text-warning">
                {inconsistencies.length} issue{inconsistencies.length !== 1 ? 's' : ''} found
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-success/20 text-success">
                All clear
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-text-secondary" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!hasIssues ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" aria-hidden="true" />
              <h3 className="text-lg font-medium text-text-primary mb-2">
                No Voice Inconsistencies Detected
              </h3>
              <p className="text-text-secondary max-w-md mx-auto">
                All character dialogue appears consistent with their defined vocabulary levels and speech patterns.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary mb-4">
                The following voice consistency issues were detected in your character dialogue:
              </p>

              {/* Summary */}
              <div className="flex gap-4 mb-4">
                {warningCount > 0 && (
                  <div className="flex items-center gap-1.5 text-warning">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">{warningCount} warning{warningCount !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {errorCount > 0 && (
                  <div className="flex items-center gap-1.5 text-error">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">{errorCount} error{errorCount !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {/* Issues list */}
              {inconsistencies.map(issue => (
                <div
                  key={issue.id}
                  className={`border rounded-lg overflow-hidden ${
                    issue.severity === 'error' ? 'border-error/50' : 'border-warning/50'
                  }`}
                >
                  <button
                    onClick={() => toggleIssue(issue.id)}
                    className="w-full flex items-start gap-3 p-4 hover:bg-surface-elevated/50 transition-colors text-left"
                  >
                    <AlertTriangle
                      className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        issue.severity === 'error' ? 'text-error' : 'text-warning'
                      }`}
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-text-primary">
                          {issue.characterName}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-surface-elevated text-text-secondary">
                          {issue.expectedVocabulary}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary">
                        {issue.issueType === 'slang_in_formal' && 'Informal language in formal character dialogue'}
                        {issue.issueType === 'formal_in_casual' && 'Overly formal language in casual character dialogue'}
                        {issue.issueType === 'vocabulary_mismatch' && 'Vocabulary mismatch'}
                        {issue.issueType === 'speech_pattern_violation' && 'Speech pattern not reflected'}
                      </p>
                    </div>
                    {expandedIssues.has(issue.id) ? (
                      <ChevronUp className="h-5 w-5 text-text-secondary flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-text-secondary flex-shrink-0" />
                    )}
                  </button>

                  {expandedIssues.has(issue.id) && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                      <div>
                        <p className="text-xs font-medium text-text-secondary mb-1">Problematic Dialogue:</p>
                        <p className="text-sm text-text-primary bg-surface-elevated p-2 rounded border border-border italic">
                          "{issue.problematicText}"
                        </p>
                      </div>

                      <div className="flex items-start gap-2 p-3 bg-accent/5 rounded-lg border border-accent/20">
                        <Lightbulb className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                          <p className="text-xs font-medium text-accent mb-1">Suggestion:</p>
                          <p className="text-sm text-text-secondary">{issue.suggestion}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
