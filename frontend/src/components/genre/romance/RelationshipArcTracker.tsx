import { useState, useMemo } from 'react'
import { Heart, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import type { RelationshipBeat, RelationshipBeatType, Chapter, Character } from '@/types/project'

interface RelationshipArcTrackerProps {
  beats: RelationshipBeat[]
  chapters: Chapter[]
  protagonistA: Character | null
  protagonistB: Character | null
  onAddBeat: (beat: Omit<RelationshipBeat, 'id'>) => void
  onUpdateBeat: (id: string, updates: Partial<RelationshipBeat>) => void
  onDeleteBeat: (id: string) => void
}

const BEAT_TYPES: { type: RelationshipBeatType; label: string; color: string; emoji: string }[] = [
  { type: 'meet-cute', label: 'Meet Cute', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', emoji: '✨' },
  { type: 'first-conflict', label: 'First Conflict', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', emoji: '⚡' },
  { type: 'growing-closer', label: 'Growing Closer', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', emoji: '💫' },
  { type: 'first-kiss', label: 'First Kiss', color: 'bg-red-500/20 text-red-400 border-red-500/30', emoji: '💋' },
  { type: 'misunderstanding', label: 'Misunderstanding', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', emoji: '💔' },
  { type: 'separation', label: 'Separation', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', emoji: '😢' },
  { type: 'black-moment', label: 'Black Moment', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', emoji: '🌑' },
  { type: 'grand-gesture', label: 'Grand Gesture', color: 'bg-accent/20 text-accent border-accent/30', emoji: '💐' },
  { type: 'resolution', label: 'Resolution', color: 'bg-green-500/20 text-green-400 border-green-500/30', emoji: '🤝' },
  { type: 'hea', label: 'Happily Ever After', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', emoji: '💕' },
]

export function RelationshipArcTracker({
  beats,
  chapters,
  protagonistA,
  protagonistB,
  onAddBeat,
  onUpdateBeat,
  onDeleteBeat,
}: RelationshipArcTrackerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newBeat, setNewBeat] = useState({
    type: 'meet-cute' as RelationshipBeatType,
    chapterId: '',
    description: '',
    povCharacterId: '',
    emotionalIntensity: 5,
    notes: '',
  })

  const sortedBeats = useMemo(() => {
    return [...beats].sort((a, b) => {
      const aChapter = chapters.find(c => c.id === a.chapterId)
      const bChapter = chapters.find(c => c.id === b.chapterId)
      return (aChapter?.number || 0) - (bChapter?.number || 0)
    })
  }, [beats, chapters])

  const getBeatStyle = (type: RelationshipBeatType) => {
    return BEAT_TYPES.find(b => b.type === type) || BEAT_TYPES[0]
  }

  const getChapterTitle = (chapterId: string | null) => {
    if (!chapterId) return 'Unassigned'
    const chapter = chapters.find(c => c.id === chapterId)
    return chapter ? `Ch ${chapter.number}` : 'Unknown'
  }

  const handleAdd = () => {
    if (!newBeat.description) return

    onAddBeat({
      type: newBeat.type,
      chapterId: newBeat.chapterId || null,
      description: newBeat.description,
      povCharacterId: newBeat.povCharacterId || (protagonistA?.id || ''),
      emotionalIntensity: newBeat.emotionalIntensity,
      notes: newBeat.notes,
    })

    setNewBeat({
      type: 'meet-cute',
      chapterId: '',
      description: '',
      povCharacterId: '',
      emotionalIntensity: 5,
      notes: '',
    })
    setIsAdding(false)
  }

  // Check which standard beats are missing
  const missingBeats = useMemo(() => {
    const essentialTypes: RelationshipBeatType[] = ['meet-cute', 'first-conflict', 'black-moment', 'resolution', 'hea']
    const existingTypes = new Set(beats.map(b => b.type))
    return essentialTypes.filter(t => !existingTypes.has(t))
  }, [beats])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-400" />
          <h3 className="font-medium">Relationship Arc</h3>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/20 text-pink-400 rounded-lg hover:bg-pink-500/30 text-sm"
        >
          <Plus className="h-4 w-4" />
          Add Beat
        </button>
      </div>

      {/* Missing Beats Warning */}
      {missingBeats.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
          <p className="text-sm text-warning font-medium">Missing essential beats:</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {missingBeats.map(type => {
              const style = getBeatStyle(type)
              return (
                <span key={type} className="px-2 py-1 bg-surface rounded text-xs">
                  {style.emoji} {style.label}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Add Beat Form */}
      {isAdding && (
        <div className="bg-pink-500/10 rounded-lg p-4 border border-pink-500/30 space-y-3">
          <h4 className="font-medium text-pink-400">New Relationship Beat</h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-secondary">Beat Type</label>
              <select
                value={newBeat.type}
                onChange={(e) => setNewBeat(prev => ({ ...prev, type: e.target.value as RelationshipBeatType }))}
                className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-sm mt-1"
              >
                {BEAT_TYPES.map(bt => (
                  <option key={bt.type} value={bt.type}>{bt.emoji} {bt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-secondary">Chapter</label>
              <select
                value={newBeat.chapterId}
                onChange={(e) => setNewBeat(prev => ({ ...prev, chapterId: e.target.value }))}
                className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-sm mt-1"
              >
                <option value="">Not assigned yet</option>
                {chapters.map(ch => (
                  <option key={ch.id} value={ch.id}>Ch {ch.number}: {ch.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-text-secondary">POV Character</label>
            <select
              value={newBeat.povCharacterId}
              onChange={(e) => setNewBeat(prev => ({ ...prev, povCharacterId: e.target.value }))}
              className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-sm mt-1"
            >
              <option value="">Select POV...</option>
              {protagonistA && <option value={protagonistA.id}>{protagonistA.name}</option>}
              {protagonistB && <option value={protagonistB.id}>{protagonistB.name}</option>}
            </select>
          </div>

          <textarea
            value={newBeat.description}
            onChange={(e) => setNewBeat(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what happens in this beat..."
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm resize-none"
            rows={2}
          />

          <div>
            <label className="text-xs text-text-secondary">
              Emotional Intensity ({newBeat.emotionalIntensity}/10)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={newBeat.emotionalIntensity}
              onChange={(e) => setNewBeat(prev => ({ ...prev, emotionalIntensity: parseInt(e.target.value) }))}
              className="w-full mt-1"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newBeat.description}
              className="px-3 py-1.5 bg-pink-500 text-white rounded-lg text-sm disabled:opacity-50"
            >
              Add Beat
            </button>
          </div>
        </div>
      )}

      {/* Timeline View */}
      <div className="relative">
        {sortedBeats.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            No relationship beats yet. Add beats to track your romance arc.
          </div>
        ) : (
          <div className="space-y-2">
            {sortedBeats.map((beat, index) => {
              const style = getBeatStyle(beat.type)
              const isExpanded = expandedId === beat.id
              const povChar = beat.povCharacterId === protagonistA?.id ? protagonistA :
                            beat.povCharacterId === protagonistB?.id ? protagonistB : null

              return (
                <div key={beat.id} className="relative">
                  {/* Connector line */}
                  {index > 0 && (
                    <div className="absolute left-6 -top-2 h-2 w-0.5 bg-border" />
                  )}
                  {index < sortedBeats.length - 1 && (
                    <div className="absolute left-6 top-full h-2 w-0.5 bg-border" />
                  )}

                  <div className={`bg-surface rounded-lg border overflow-hidden ${style.color}`}>
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : beat.id)}
                    >
                      <div className="text-2xl">{style.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{style.label}</span>
                          <span className="text-xs text-text-secondary">
                            {getChapterTitle(beat.chapterId)}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary truncate">{beat.description}</p>
                      </div>
                      {povChar && (
                        <span className="text-xs bg-surface-elevated px-2 py-0.5 rounded">
                          {povChar.name}'s POV
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <Heart className={`h-4 w-4 ${beat.emotionalIntensity >= 7 ? 'text-pink-400 fill-pink-400' : 'text-pink-400/50'}`} />
                        <span className="text-xs">{beat.emotionalIntensity}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-text-secondary" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-text-secondary" />
                      )}
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-border/50 pt-3 space-y-3">
                        <textarea
                          value={beat.description}
                          onChange={(e) => onUpdateBeat(beat.id, { description: e.target.value })}
                          className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm resize-none"
                          rows={2}
                        />

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-text-secondary">Beat Type</label>
                            <select
                              value={beat.type}
                              onChange={(e) => onUpdateBeat(beat.id, { type: e.target.value as RelationshipBeatType })}
                              className="w-full bg-surface-elevated border border-border rounded-lg px-2 py-1 text-sm mt-1"
                            >
                              {BEAT_TYPES.map(bt => (
                                <option key={bt.type} value={bt.type}>{bt.emoji} {bt.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-text-secondary">Chapter</label>
                            <select
                              value={beat.chapterId || ''}
                              onChange={(e) => onUpdateBeat(beat.id, { chapterId: e.target.value || null })}
                              className="w-full bg-surface-elevated border border-border rounded-lg px-2 py-1 text-sm mt-1"
                            >
                              <option value="">Not assigned</option>
                              {chapters.map(ch => (
                                <option key={ch.id} value={ch.id}>Ch {ch.number}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-text-secondary">Intensity</label>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={beat.emotionalIntensity}
                              onChange={(e) => onUpdateBeat(beat.id, { emotionalIntensity: parseInt(e.target.value) })}
                              className="w-full mt-2"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button
                            onClick={() => onDeleteBeat(beat.id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-error hover:bg-error/10 rounded"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
