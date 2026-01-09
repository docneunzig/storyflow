import { useState, useMemo, useCallback } from 'react'
import { AlertTriangle, X, ChevronDown, ChevronUp, Clock, MapPin, Check, Eye, EyeOff, Wrench, Users, Link2Off } from 'lucide-react'
import type { PlotBeat, Character } from '@/types/project'

export interface PlotConsistencyIssue {
  id: string
  type: 'timeline_paradox' | 'character_location_conflict' | 'orphaned_foreshadowing' | 'orphaned_payoff'
  severity: 'warning' | 'error'
  beat1: PlotBeat
  beat2?: PlotBeat
  description: string
  suggestion: string
  status: 'pending' | 'ignored' | 'acknowledged' | 'fixed'
}

interface PlotConsistencyWarningProps {
  beats: PlotBeat[]
  characters: Character[]
  isVisible?: boolean
  onDismiss?: () => void
}

// Check for timeline paradoxes
// A paradox occurs when a later beat (higher timeline position) references or depends on
// something that happens in an earlier beat, but we check if earlier beats reference later beats
function findTimelineParadoxes(beats: PlotBeat[]): PlotConsistencyIssue[] {
  const issues: PlotConsistencyIssue[] = []

  // Sort beats by timeline position
  const sortedBeats = [...beats].sort((a, b) => a.timelinePosition - b.timelinePosition)

  for (let i = 0; i < sortedBeats.length; i++) {
    const currentBeat = sortedBeats[i]

    // Check if this beat's foreshadowing mentions beats that come before it
    // (foreshadowing should point to future, not past)
    for (const foreshadowId of currentBeat.foreshadowing || []) {
      const targetBeat = beats.find(b => b.id === foreshadowId)
      if (targetBeat && targetBeat.timelinePosition <= currentBeat.timelinePosition) {
        issues.push({
          id: `paradox-foreshadow-${currentBeat.id}-${targetBeat.id}`,
          type: 'timeline_paradox',
          severity: 'warning',
          beat1: currentBeat,
          beat2: targetBeat,
          description: `"${currentBeat.title}" (position ${currentBeat.timelinePosition}) foreshadows "${targetBeat.title}" (position ${targetBeat.timelinePosition}), but foreshadowing should point to future events.`,
          suggestion: 'Move the foreshadowed event to a later timeline position, or remove this foreshadowing reference.',
          status: 'pending',
        })
      }
    }

    // Check if this beat's payoffs reference beats that come after it
    // (payoffs should reference earlier setups)
    for (const payoffId of currentBeat.payoffs || []) {
      const targetBeat = beats.find(b => b.id === payoffId)
      if (targetBeat && targetBeat.timelinePosition >= currentBeat.timelinePosition) {
        issues.push({
          id: `paradox-payoff-${currentBeat.id}-${targetBeat.id}`,
          type: 'timeline_paradox',
          severity: 'warning',
          beat1: currentBeat,
          beat2: targetBeat,
          description: `"${currentBeat.title}" (position ${currentBeat.timelinePosition}) pays off "${targetBeat.title}" (position ${targetBeat.timelinePosition}), but payoffs should reference earlier setups.`,
          suggestion: 'Move the setup event to an earlier timeline position, or correct the payoff reference.',
          status: 'pending',
        })
      }
    }
  }

  // Check for explicit timeline position issues - earlier beat depending on later events
  // Look for text patterns suggesting dependencies
  for (let i = 0; i < sortedBeats.length; i++) {
    const currentBeat = sortedBeats[i]
    const currentText = `${currentBeat.summary} ${currentBeat.detailedDescription} ${currentBeat.userNotes}`.toLowerCase()

    // Check if this beat mentions "after" events from later beats
    for (let j = i + 1; j < sortedBeats.length; j++) {
      const laterBeat = sortedBeats[j]
      const laterTitle = laterBeat.title.toLowerCase()

      // Check if current beat references the later beat with "after" language
      if (currentText.includes(`after ${laterTitle}`) ||
          currentText.includes(`following ${laterTitle}`) ||
          currentText.includes(`because of ${laterTitle}`)) {
        issues.push({
          id: `paradox-text-${currentBeat.id}-${laterBeat.id}`,
          type: 'timeline_paradox',
          severity: 'error',
          beat1: currentBeat,
          beat2: laterBeat,
          description: `"${currentBeat.title}" (position ${currentBeat.timelinePosition}) appears to reference "${laterBeat.title}" (position ${laterBeat.timelinePosition}) as if it happened before, creating a timeline paradox.`,
          suggestion: 'Swap the timeline positions of these beats, or rewrite the dependency.',
          status: 'pending',
        })
      }
    }
  }

  return issues
}

// Check for orphaned foreshadowing/payoffs
// An orphan occurs when a beat references a foreshadowing or payoff target that doesn't exist
function findOrphanedReferences(beats: PlotBeat[]): PlotConsistencyIssue[] {
  const issues: PlotConsistencyIssue[] = []
  const beatIds = new Set(beats.map(b => b.id))

  for (const beat of beats) {
    // Check for orphaned foreshadowing references
    if (beat.foreshadowing && beat.foreshadowing.length > 0) {
      for (const targetId of beat.foreshadowing) {
        if (!beatIds.has(targetId)) {
          issues.push({
            id: `orphan-foreshadow-${beat.id}-${targetId}`,
            type: 'orphaned_foreshadowing',
            severity: 'warning',
            beat1: beat,
            description: `"${beat.title}" has a foreshadowing reference to a beat that no longer exists. The payoff for this setup has been deleted.`,
            suggestion: 'Edit this beat and remove the orphaned foreshadowing link, or recreate the payoff beat.',
            status: 'pending',
          })
        }
      }
    }

    // Check for orphaned payoff references
    if (beat.payoffs && beat.payoffs.length > 0) {
      for (const sourceId of beat.payoffs) {
        if (!beatIds.has(sourceId)) {
          issues.push({
            id: `orphan-payoff-${beat.id}-${sourceId}`,
            type: 'orphaned_payoff',
            severity: 'warning',
            beat1: beat,
            description: `"${beat.title}" references a setup beat that no longer exists. The foreshadowing for this payoff has been deleted.`,
            suggestion: 'Edit this beat and remove the orphaned payoff link, or recreate the setup beat.',
            status: 'pending',
          })
        }
      }
    }
  }

  return issues
}

// Check for character location conflicts
// A conflict occurs when the same character is involved in two beats at the same timeline position
// but in different locations
function findCharacterLocationConflicts(beats: PlotBeat[], characters: Character[]): PlotConsistencyIssue[] {
  const issues: PlotConsistencyIssue[] = []

  // Group beats by timeline position
  const beatsByPosition: Map<number, PlotBeat[]> = new Map()
  for (const beat of beats) {
    const position = beat.timelinePosition
    if (!beatsByPosition.has(position)) {
      beatsByPosition.set(position, [])
    }
    beatsByPosition.get(position)!.push(beat)
  }

  // Check each timeline position for conflicts
  for (const [position, beatsAtPosition] of beatsByPosition) {
    if (beatsAtPosition.length < 2) continue

    // Check all pairs of beats at this position
    for (let i = 0; i < beatsAtPosition.length; i++) {
      for (let j = i + 1; j < beatsAtPosition.length; j++) {
        const beat1 = beatsAtPosition[i]
        const beat2 = beatsAtPosition[j]

        // Skip if either beat doesn't have a location
        if (!beat1.location || !beat2.location) continue

        // Skip if locations are the same
        if (beat1.location.toLowerCase() === beat2.location.toLowerCase()) continue

        // Find characters that appear in both beats
        const sharedCharacters = beat1.charactersInvolved.filter(
          charId => beat2.charactersInvolved.includes(charId)
        )

        for (const charId of sharedCharacters) {
          const character = characters.find(c => c.id === charId)
          const charName = character?.name || 'Unknown character'

          issues.push({
            id: `location-${beat1.id}-${beat2.id}-${charId}`,
            type: 'character_location_conflict',
            severity: 'error',
            beat1,
            beat2,
            description: `${charName} appears in both "${beat1.title}" (at ${beat1.location}) and "${beat2.title}" (at ${beat2.location}) at the same timeline position (${position}).`,
            suggestion: `Either change the timeline position of one of these beats, or remove ${charName} from one of them, or adjust the locations.`,
            status: 'pending',
          })
        }
      }
    }
  }

  return issues
}

export function PlotConsistencyWarning({
  beats,
  characters,
  isVisible = true,
  onDismiss,
}: PlotConsistencyWarningProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [issueStatuses, setIssueStatuses] = useState<Record<string, PlotConsistencyIssue['status']>>({})

  // Find all consistency issues
  const issues = useMemo(() => {
    if (beats.length < 2) return []

    const allIssues: PlotConsistencyIssue[] = [
      ...findTimelineParadoxes(beats),
      ...findCharacterLocationConflicts(beats, characters),
      ...findOrphanedReferences(beats),
    ]

    // Apply saved statuses
    return allIssues.map(issue => ({
      ...issue,
      status: issueStatuses[issue.id] || issue.status,
    }))
  }, [beats, characters, issueStatuses])

  // Handle resolution actions
  const handleResolution = useCallback((issue: PlotConsistencyIssue, status: PlotConsistencyIssue['status']) => {
    setIssueStatuses(prev => ({
      ...prev,
      [issue.id]: status,
    }))
  }, [])

  // Count pending issues
  const pendingCount = issues.filter(i => i.status === 'pending').length
  const errorCount = issues.filter(i => i.status === 'pending' && i.severity === 'error').length

  if (!isVisible || dismissed || issues.length === 0) {
    return null
  }

  return (
    <div className={`${errorCount > 0 ? 'bg-error/10 border-error/30' : 'bg-warning/10 border-warning/30'} border rounded-lg overflow-hidden mb-4`}>
      {/* Header */}
      <div
        className={`flex items-center justify-between p-3 cursor-pointer ${errorCount > 0 ? 'hover:bg-error/5' : 'hover:bg-warning/5'} transition-colors`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className={`h-5 w-5 ${errorCount > 0 ? 'text-error' : 'text-warning'}`} aria-hidden="true" />
          <span className={`font-medium ${errorCount > 0 ? 'text-error' : 'text-warning'}`}>
            Plot Consistency Issue{issues.length > 1 ? 's' : ''} ({pendingCount} pending / {issues.length} total)
          </span>
          {errorCount > 0 && (
            <span className="text-xs bg-error/20 text-error px-2 py-0.5 rounded-full">
              {errorCount} critical
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onDismiss && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setDismissed(true)
                onDismiss()
              }}
              className={`p-1 rounded ${errorCount > 0 ? 'hover:bg-error/20' : 'hover:bg-warning/20'} transition-colors`}
              aria-label="Dismiss warnings"
            >
              <X className={`h-4 w-4 ${errorCount > 0 ? 'text-error' : 'text-warning'}`} aria-hidden="true" />
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className={`h-4 w-4 ${errorCount > 0 ? 'text-error' : 'text-warning'}`} aria-hidden="true" />
          ) : (
            <ChevronDown className={`h-4 w-4 ${errorCount > 0 ? 'text-error' : 'text-warning'}`} aria-hidden="true" />
          )}
        </div>
      </div>

      {/* Issues List */}
      {isExpanded && (
        <div className={`border-t ${errorCount > 0 ? 'border-error/30' : 'border-warning/30'} p-3 space-y-3`}>
          <p className="text-sm text-text-secondary">
            The following consistency issues were detected in your plot structure:
          </p>
          {issues.map((issue) => (
            <div
              key={issue.id}
              className={`p-3 bg-surface rounded-lg border ${issue.severity === 'error' ? 'border-error/30' : 'border-border'}`}
            >
              <div className="flex items-start gap-2 mb-2">
                {issue.type === 'timeline_paradox' ? (
                  <Clock className={`h-4 w-4 mt-0.5 flex-shrink-0 ${issue.severity === 'error' ? 'text-error' : 'text-warning'}`} aria-hidden="true" />
                ) : issue.type === 'character_location_conflict' ? (
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <Users className={`h-4 w-4 ${issue.severity === 'error' ? 'text-error' : 'text-warning'}`} aria-hidden="true" />
                    <MapPin className={`h-3 w-3 ${issue.severity === 'error' ? 'text-error' : 'text-warning'}`} aria-hidden="true" />
                  </div>
                ) : (
                  <Link2Off className={`h-4 w-4 mt-0.5 flex-shrink-0 ${issue.severity === 'error' ? 'text-error' : 'text-warning'}`} aria-hidden="true" />
                )}
                <div className="flex-1">
                  <span className={`text-sm font-medium ${issue.severity === 'error' ? 'text-error' : 'text-warning'}`}>
                    {issue.type === 'timeline_paradox' ? 'Timeline Paradox' :
                     issue.type === 'character_location_conflict' ? 'Character Location Conflict' :
                     issue.type === 'orphaned_foreshadowing' ? 'Orphaned Foreshadowing' : 'Orphaned Payoff'}
                  </span>
                  <p className="text-sm text-text-primary mt-1">
                    {issue.description}
                  </p>
                </div>
              </div>

              <div className="mt-2 pl-6">
                <p className="text-sm text-accent flex items-center gap-1">
                  💡 <strong>Suggestion:</strong> {issue.suggestion}
                </p>
              </div>

              {/* Resolution Options */}
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {issue.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleResolution(issue, 'ignored')}
                        className="px-3 py-1.5 text-xs bg-surface border border-border rounded-lg hover:bg-surface-elevated transition-colors flex items-center gap-1.5"
                        title="Ignore this warning - it's intentional or not a real issue"
                      >
                        <EyeOff className="h-3 w-3" aria-hidden="true" />
                        Ignore
                      </button>
                      <button
                        onClick={() => handleResolution(issue, 'acknowledged')}
                        className="px-3 py-1.5 text-xs bg-accent/10 text-accent border border-accent/30 rounded-lg hover:bg-accent/20 transition-colors flex items-center gap-1.5"
                        title="Acknowledge and fix later"
                      >
                        <Eye className="h-3 w-3" aria-hidden="true" />
                        Acknowledge
                      </button>
                      <button
                        onClick={() => handleResolution(issue, 'fixed')}
                        className="px-3 py-1.5 text-xs bg-success/10 text-success border border-success/30 rounded-lg hover:bg-success/20 transition-colors flex items-center gap-1.5"
                        title="Mark as fixed - I've corrected the issue"
                      >
                        <Wrench className="h-3 w-3" aria-hidden="true" />
                        Fixed
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                        issue.status === 'ignored'
                          ? 'bg-text-secondary/10 text-text-secondary'
                          : issue.status === 'acknowledged'
                          ? 'bg-accent/10 text-accent'
                          : 'bg-success/10 text-success'
                      }`}>
                        <Check className="h-3 w-3" aria-hidden="true" />
                        {issue.status === 'ignored' ? 'Ignored' :
                         issue.status === 'acknowledged' ? 'Acknowledged' : 'Fixed'}
                      </span>
                      <button
                        onClick={() => handleResolution(issue, 'pending')}
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
