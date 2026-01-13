import { useState } from 'react'
import { Sparkles, Plus, Trash2, ChevronDown, ChevronUp, User, Eye } from 'lucide-react'
import type { RedHerring, Suspect, Chapter } from '@/types/project'

interface RedHerringManagerProps {
  redHerrings: RedHerring[]
  suspects: Suspect[]
  chapters: Chapter[]
  onAddRedHerring: (redHerring: Omit<RedHerring, 'id'>) => void
  onUpdateRedHerring: (id: string, updates: Partial<RedHerring>) => void
  onDeleteRedHerring: (id: string) => void
  getCharacterName: (characterId: string) => string
}

export function RedHerringManager({
  redHerrings,
  suspects,
  chapters,
  onAddRedHerring,
  onUpdateRedHerring,
  onDeleteRedHerring,
  getCharacterName,
}: RedHerringManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newHerring, setNewHerring] = useState({
    description: '',
    plantedInChapterId: '',
    targetSuspectId: '',
    convincingness: 5,
    notes: '',
  })

  const getChapterTitle = (chapterId: string | null) => {
    if (!chapterId) return null
    const chapter = chapters.find(c => c.id === chapterId)
    return chapter ? `Ch ${chapter.number}: ${chapter.title}` : null
  }

  const handleAdd = () => {
    if (!newHerring.description || !newHerring.plantedInChapterId) return

    onAddRedHerring({
      description: newHerring.description,
      plantedInChapterId: newHerring.plantedInChapterId,
      revealedAsRedHerringInChapterId: null,
      targetSuspectId: newHerring.targetSuspectId || null,
      convincingness: newHerring.convincingness,
      notes: newHerring.notes,
    })

    setNewHerring({
      description: '',
      plantedInChapterId: '',
      targetSuspectId: '',
      convincingness: 5,
      notes: '',
    })
    setIsAdding(false)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-warning" />
          <h3 className="font-medium">Red Herrings</h3>
          <span className="text-xs text-text-secondary bg-surface-elevated px-2 py-0.5 rounded-full">
            {redHerrings.length} planted
          </span>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-warning/20 text-warning rounded-lg hover:bg-warning/30 text-sm"
        >
          <Plus className="h-4 w-4" />
          Add Red Herring
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="bg-warning/10 rounded-lg p-4 border border-warning/30 space-y-3">
          <h4 className="font-medium text-warning">New Red Herring</h4>
          <textarea
            value={newHerring.description}
            onChange={(e) => setNewHerring(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the misleading evidence or clue..."
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm resize-none"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-secondary">Planted In Chapter</label>
              <select
                value={newHerring.plantedInChapterId}
                onChange={(e) => setNewHerring(prev => ({ ...prev, plantedInChapterId: e.target.value }))}
                className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-sm mt-1"
              >
                <option value="">Select chapter...</option>
                {chapters.map(ch => (
                  <option key={ch.id} value={ch.id}>Ch {ch.number}: {ch.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-secondary">Points Toward Suspect (optional)</label>
              <select
                value={newHerring.targetSuspectId}
                onChange={(e) => setNewHerring(prev => ({ ...prev, targetSuspectId: e.target.value }))}
                className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-sm mt-1"
              >
                <option value="">No specific suspect</option>
                {suspects.map(s => (
                  <option key={s.id} value={s.id}>{getCharacterName(s.characterId)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-text-secondary">
              How Convincing? ({newHerring.convincingness}/10)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={newHerring.convincingness}
              onChange={(e) => setNewHerring(prev => ({ ...prev, convincingness: parseInt(e.target.value) }))}
              className="w-full mt-1"
            />
          </div>
          <textarea
            value={newHerring.notes}
            onChange={(e) => setNewHerring(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Notes about why this is misleading..."
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm resize-none"
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newHerring.description || !newHerring.plantedInChapterId}
              className="px-3 py-1.5 bg-warning text-white rounded-lg text-sm disabled:opacity-50"
            >
              Add Red Herring
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {redHerrings.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            No red herrings yet. Add misleading clues to throw readers off the scent.
          </div>
        ) : (
          redHerrings.map((herring) => {
            const isExpanded = expandedId === herring.id
            const targetSuspect = suspects.find(s => s.id === herring.targetSuspectId)

            return (
              <div
                key={herring.id}
                className={`bg-surface rounded-lg border overflow-hidden ${
                  herring.revealedAsRedHerringInChapterId
                    ? 'border-success/30 opacity-60'
                    : 'border-warning/30'
                }`}
              >
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : herring.id)}
                >
                  <Sparkles className={`h-4 w-4 ${
                    herring.revealedAsRedHerringInChapterId ? 'text-success' : 'text-warning'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{herring.description}</p>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <span>Planted: {getChapterTitle(herring.plantedInChapterId)}</span>
                      {targetSuspect && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Points to: {getCharacterName(targetSuspect.characterId)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs text-text-secondary">Convincing</div>
                      <div className="text-sm font-medium text-warning">{herring.convincingness}/10</div>
                    </div>
                    {herring.revealedAsRedHerringInChapterId && (
                      <Eye className="h-4 w-4 text-success" />
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-text-secondary" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-text-secondary" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-border/50 pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-text-secondary">Convincingness</label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={herring.convincingness}
                          onChange={(e) => onUpdateRedHerring(herring.id, {
                            convincingness: parseInt(e.target.value)
                          })}
                          className="w-full mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-secondary">Revealed As False In</label>
                        <select
                          value={herring.revealedAsRedHerringInChapterId || ''}
                          onChange={(e) => onUpdateRedHerring(herring.id, {
                            revealedAsRedHerringInChapterId: e.target.value || null
                          })}
                          className="w-full bg-surface-elevated border border-border rounded-lg px-2 py-1 text-sm mt-1"
                        >
                          <option value="">Not yet revealed</option>
                          {chapters.map(ch => (
                            <option key={ch.id} value={ch.id}>Ch {ch.number}: {ch.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {herring.notes && (
                      <div>
                        <label className="text-xs text-text-secondary">Notes</label>
                        <p className="text-sm text-text-primary mt-1">{herring.notes}</p>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={() => onDeleteRedHerring(herring.id)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-error hover:bg-error/10 rounded"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
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
