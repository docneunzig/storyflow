import { useState, useEffect, useMemo } from 'react'
import { AlertTriangle, X, ChevronDown, ChevronUp, BookOpen, Sparkles } from 'lucide-react'
import type { WikiEntry, Chapter } from '@/types/project'

interface ConsistencyViolation {
  rule: WikiEntry
  matchedText: string
  reason: string
  severity: 'warning' | 'error'
}

interface WikiConsistencyWarningProps {
  chapter: Chapter
  wikiEntries: WikiEntry[]
  isVisible?: boolean
  onDismiss?: () => void
}

// Extract keywords from a rule description for matching
function extractRuleKeywords(rule: WikiEntry): { keywords: string[]; negations: string[] } {
  const description = rule.description.toLowerCase()
  const name = rule.name.toLowerCase()

  const keywords: string[] = []
  const negations: string[] = []

  // Common patterns for rules
  // "X requires Y" - look for X without Y
  const requiresMatch = description.match(/(\w+)\s+requires?\s+(\w+)/i)
  if (requiresMatch) {
    keywords.push(requiresMatch[1])
    negations.push(requiresMatch[2])
  }

  // "X must have Y" - look for X without Y
  const mustHaveMatch = description.match(/(\w+)\s+must\s+(?:have|include|use)\s+(\w+)/i)
  if (mustHaveMatch) {
    keywords.push(mustHaveMatch[1])
    negations.push(mustHaveMatch[2])
  }

  // "Only X can Y" - look for non-X doing Y
  const onlyMatch = description.match(/only\s+(\w+)\s+can\s+(\w+)/i)
  if (onlyMatch) {
    keywords.push(onlyMatch[2]) // The action
  }

  // "X cannot Y" or "X never Y" - look for X doing Y
  const cannotMatch = description.match(/(\w+)\s+(?:cannot|can't|never|must not)\s+(\w+)/i)
  if (cannotMatch) {
    keywords.push(cannotMatch[1])
    keywords.push(cannotMatch[2])
  }

  // Add rule name keywords
  const nameWords = name.split(/\s+/).filter(w => w.length > 3)
  keywords.push(...nameWords)

  // Common magic-related keywords
  if (description.includes('magic') || description.includes('spell') || description.includes('cast')) {
    keywords.push('magic', 'spell', 'cast', 'enchant', 'conjure', 'summon')
  }

  // Common gesture-related keywords
  if (description.includes('gesture')) {
    negations.push('gesture', 'wave', 'motion', 'movement', 'hand')
  }

  return {
    keywords: [...new Set(keywords)],
    negations: [...new Set(negations)],
  }
}

// Check if content violates a rule
function checkRuleViolation(content: string, rule: WikiEntry): ConsistencyViolation | null {
  const contentLower = content.toLowerCase()
  const { keywords, negations } = extractRuleKeywords(rule)

  // Look for sentences containing keywords
  const sentences = content.split(/[.!?]+/).filter(s => s.trim())

  for (const sentence of sentences) {
    const sentenceLower = sentence.toLowerCase()

    // Check if sentence contains any keywords
    const hasKeyword = keywords.some(kw => sentenceLower.includes(kw))
    if (!hasKeyword) continue

    // Check for specific patterns that indicate violation

    // Pattern: "cast" or "magic" without "gesture", "wave", "motion" etc
    const hasMagicAction = /\b(cast|casting|casts|conjure|conjuring|summon|summoning|spell|magic)\b/i.test(sentence)
    const hasGesture = /\b(gesture|gestures|gestured|wave|waved|waving|motion|motioned|hand|hands|finger|fingers|arm|arms)\b/i.test(sentence)

    // If rule is about gestures being required for magic
    if (rule.description.toLowerCase().includes('gesture') &&
        rule.description.toLowerCase().includes('require') &&
        hasMagicAction && !hasGesture) {
      // Look for "without gesture" patterns or just missing gesture
      const isViolation = !hasGesture || /without\s+(?:any\s+)?gesture/i.test(sentence)
      if (isViolation) {
        return {
          rule,
          matchedText: sentence.trim(),
          reason: `This passage describes magic being used but doesn't mention the required gestures. Rule: "${rule.name}"`,
          severity: 'warning',
        }
      }
    }

    // Pattern: Check for negation words in rules
    if (negations.length > 0) {
      const missingNegation = negations.every(neg => !sentenceLower.includes(neg))
      if (missingNegation && hasKeyword) {
        // Check if this really looks like a violation
        const magicWords = ['cast', 'spell', 'magic', 'conjure', 'summon', 'enchant']
        const isMagicScene = magicWords.some(w => sentenceLower.includes(w))

        if (isMagicScene) {
          return {
            rule,
            matchedText: sentence.trim(),
            reason: `This passage may conflict with the rule "${rule.name}": ${rule.description}`,
            severity: 'warning',
          }
        }
      }
    }
  }

  return null
}

export function WikiConsistencyWarning({
  chapter,
  wikiEntries,
  isVisible = true,
  onDismiss,
}: WikiConsistencyWarningProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  // Get only rules from wiki entries
  const rules = useMemo(() =>
    wikiEntries.filter(entry => entry.category === 'rules'),
    [wikiEntries]
  )

  // Check for violations
  const violations = useMemo(() => {
    if (!chapter.content || rules.length === 0) return []

    const found: ConsistencyViolation[] = []
    for (const rule of rules) {
      const violation = checkRuleViolation(chapter.content, rule)
      if (violation) {
        found.push(violation)
      }
    }
    return found
  }, [chapter.content, rules])

  // Reset dismissed state when violations change
  useEffect(() => {
    if (violations.length > 0) {
      setDismissed(false)
    }
  }, [violations.length])

  if (!isVisible || dismissed || violations.length === 0) {
    return null
  }

  return (
    <div className="bg-warning/10 border border-warning/30 rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-warning/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
          <span className="font-medium text-warning">
            Wiki Consistency Warning{violations.length > 1 ? 's' : ''} ({violations.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onDismiss && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setDismissed(true)
                onDismiss()
              }}
              className="p-1 rounded hover:bg-warning/20 transition-colors"
              aria-label="Dismiss warnings"
            >
              <X className="h-4 w-4 text-warning" aria-hidden="true" />
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-warning" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4 text-warning" aria-hidden="true" />
          )}
        </div>
      </div>

      {/* Violations List */}
      {isExpanded && (
        <div className="border-t border-warning/30 p-3 space-y-3">
          <p className="text-sm text-text-secondary">
            The following passages may conflict with your worldbuilding rules:
          </p>
          {violations.map((violation, index) => (
            <div
              key={`${violation.rule.id}-${index}`}
              className="p-3 bg-surface rounded-lg border border-border"
            >
              <div className="flex items-start gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-warning">
                    Rule: {violation.rule.name}
                  </span>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {violation.rule.description}
                  </p>
                </div>
              </div>

              <div className="mt-2 pl-6">
                <p className="text-sm text-text-secondary mb-1">Potentially conflicting text:</p>
                <blockquote className="text-sm text-text-primary italic border-l-2 border-warning/50 pl-3 py-1 bg-warning/5 rounded-r">
                  "{violation.matchedText.substring(0, 150)}{violation.matchedText.length > 150 ? '...' : ''}"
                </blockquote>
              </div>

              <div className="mt-2 pl-6">
                <p className="text-sm text-warning flex items-center gap-1">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  {violation.reason}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
