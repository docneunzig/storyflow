import { useState, useMemo } from 'react'
import { User, Shield, AlertTriangle, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import type { Suspect, Character, Chapter } from '@/types/project'

interface SuspectTimelineProps {
  suspects: Suspect[]
  characters: Character[]
  chapters: Chapter[]
  onAddSuspect: (suspect: Omit<Suspect, 'id'>) => void
  onUpdateSuspect: (id: string, updates: Partial<Suspect>) => void
  onDeleteSuspect: (id: string) => void
}

export function SuspectTimeline({
  suspects,
  characters,
  chapters,
  onAddSuspect,
  onUpdateSuspect,
  onDeleteSuspect,
}: SuspectTimelineProps) {
  const [isAddingSuspect, setIsAddingSuspect] = useState(false)
  const [expandedSuspectId, setExpandedSuspectId] = useState<string | null>(null)
  const [newSuspect, setNewSuspect] = useState({
    characterId: '',
    motive: '',
    opportunity: '',
    means: '',
    alibi: '',
  })

  const sortedSuspects = useMemo(() => {
    return [...suspects].sort((a, b) => b.suspicionLevel - a.suspicionLevel)
  }, [suspects])

  const getCharacterName = (characterId: string) => {
    const character = characters.find(c => c.id === characterId)
    return character?.name || 'Unknown'
  }

  const handleAddSuspect = () => {
    if (!newSuspect.characterId) return

    onAddSuspect({
      characterId: newSuspect.characterId,
      motive: newSuspect.motive,
      opportunity: newSuspect.opportunity,
      means: newSuspect.means,
      alibi: newSuspect.alibi || null,
      isGuilty: false,
      isRevealed: false,
      suspicionLevel: 5,
      revealChapterId: null,
    })

    setNewSuspect({
      characterId: '',
      motive: '',
      opportunity: '',
      means: '',
      alibi: '',
    })
    setIsAddingSuspect(false)
  }

  const availableCharacters = characters.filter(
    c => !suspects.some(s => s.characterId === c.id)
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-accent" />
          <h3 className="font-medium">Suspect Profiles</h3>
        </div>
        <button
          onClick={() => setIsAddingSuspect(true)}
          disabled={availableCharacters.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-lg hover:bg-accent/90 text-sm disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Suspect
        </button>
      </div>

      {/* Add Suspect Form */}
      {isAddingSuspect && (
        <div className="bg-surface-elevated rounded-lg p-4 border border-accent/30 space-y-3">
          <h4 className="font-medium text-accent">New Suspect</h4>

          <div>
            <label className="text-xs text-text-secondary">Character</label>
            <select
              value={newSuspect.characterId}
              onChange={(e) => setNewSuspect(prev => ({ ...prev, characterId: e.target.value }))}
              className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-sm mt-1"
            >
              <option value="">Select character...</option>
              {availableCharacters.map(ch => (
                <option key={ch.id} value={ch.id}>{ch.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-text-secondary">Motive</label>
              <input
                type="text"
                value={newSuspect.motive}
                onChange={(e) => setNewSuspect(prev => ({ ...prev, motive: e.target.value }))}
                placeholder="Why would they?"
                className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary">Opportunity</label>
              <input
                type="text"
                value={newSuspect.opportunity}
                onChange={(e) => setNewSuspect(prev => ({ ...prev, opportunity: e.target.value }))}
                placeholder="When could they?"
                className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary">Means</label>
              <input
                type="text"
                value={newSuspect.means}
                onChange={(e) => setNewSuspect(prev => ({ ...prev, means: e.target.value }))}
                placeholder="How could they?"
                className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-sm mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-text-secondary">Alibi (if any)</label>
            <input
              type="text"
              value={newSuspect.alibi}
              onChange={(e) => setNewSuspect(prev => ({ ...prev, alibi: e.target.value }))}
              placeholder="Their claimed alibi..."
              className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-sm mt-1"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAddingSuspect(false)}
              className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSuspect}
              disabled={!newSuspect.characterId}
              className="px-3 py-1.5 bg-accent text-white rounded-lg text-sm disabled:opacity-50"
            >
              Add Suspect
            </button>
          </div>
        </div>
      )}

      {/* Suspects List */}
      <div className="space-y-2">
        {sortedSuspects.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            No suspects added yet. Add characters as suspects to track their involvement.
          </div>
        ) : (
          sortedSuspects.map((suspect) => {
            const isExpanded = expandedSuspectId === suspect.id

            return (
              <div
                key={suspect.id}
                className={`bg-surface rounded-lg border overflow-hidden ${
                  suspect.isGuilty
                    ? 'border-error/50 bg-error/5'
                    : suspect.isRevealed
                    ? 'border-success/50 bg-success/5'
                    : 'border-border'
                }`}
              >
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => setExpandedSuspectId(isExpanded ? null : suspect.id)}
                >
                  <div className="relative">
                    <User className="h-8 w-8 text-text-secondary" />
                    {suspect.isGuilty && (
                      <AlertTriangle className="absolute -top-1 -right-1 h-4 w-4 text-error" />
                    )}
                    {suspect.isRevealed && !suspect.isGuilty && (
                      <Shield className="absolute -top-1 -right-1 h-4 w-4 text-success" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{getCharacterName(suspect.characterId)}</p>
                    <p className="text-xs text-text-secondary truncate">
                      {suspect.motive || 'No motive specified'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-text-secondary">Suspicion</div>
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-2 bg-surface-elevated rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              suspect.suspicionLevel >= 8 ? 'bg-error' :
                              suspect.suspicionLevel >= 5 ? 'bg-warning' : 'bg-success'
                            }`}
                            style={{ width: `${suspect.suspicionLevel * 10}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{suspect.suspicionLevel}/10</span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-text-secondary" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-text-secondary" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-border/50 pt-3 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-surface-elevated rounded-lg p-2">
                        <div className="text-xs text-text-secondary mb-1">Motive</div>
                        <input
                          value={suspect.motive}
                          onChange={(e) => onUpdateSuspect(suspect.id, { motive: e.target.value })}
                          className="w-full bg-transparent text-sm focus:outline-none"
                          placeholder="Why would they?"
                        />
                      </div>
                      <div className="bg-surface-elevated rounded-lg p-2">
                        <div className="text-xs text-text-secondary mb-1">Opportunity</div>
                        <input
                          value={suspect.opportunity}
                          onChange={(e) => onUpdateSuspect(suspect.id, { opportunity: e.target.value })}
                          className="w-full bg-transparent text-sm focus:outline-none"
                          placeholder="When could they?"
                        />
                      </div>
                      <div className="bg-surface-elevated rounded-lg p-2">
                        <div className="text-xs text-text-secondary mb-1">Means</div>
                        <input
                          value={suspect.means}
                          onChange={(e) => onUpdateSuspect(suspect.id, { means: e.target.value })}
                          className="w-full bg-transparent text-sm focus:outline-none"
                          placeholder="How could they?"
                        />
                      </div>
                    </div>

                    <div className="bg-surface-elevated rounded-lg p-2">
                      <div className="text-xs text-text-secondary mb-1">Alibi</div>
                      <input
                        value={suspect.alibi || ''}
                        onChange={(e) => onUpdateSuspect(suspect.id, { alibi: e.target.value || null })}
                        className="w-full bg-transparent text-sm focus:outline-none"
                        placeholder="Their claimed alibi..."
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-xs text-text-secondary">Suspicion Level</label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={suspect.suspicionLevel}
                          onChange={(e) => onUpdateSuspect(suspect.id, { suspicionLevel: parseInt(e.target.value) })}
                          className="w-full mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-secondary">Revealed In</label>
                        <select
                          value={suspect.revealChapterId || ''}
                          onChange={(e) => onUpdateSuspect(suspect.id, {
                            revealChapterId: e.target.value || null,
                            isRevealed: !!e.target.value
                          })}
                          className="w-full bg-surface border border-border rounded-lg px-2 py-1 text-sm mt-1"
                        >
                          <option value="">Not revealed</option>
                          {chapters.map(ch => (
                            <option key={ch.id} value={ch.id}>Ch {ch.number}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={suspect.isGuilty}
                          onChange={(e) => onUpdateSuspect(suspect.id, { isGuilty: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm text-error">This is the guilty party</span>
                      </label>
                      <button
                        onClick={() => onDeleteSuspect(suspect.id)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-error hover:bg-error/10 rounded"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
