import { useState, useMemo } from 'react'
import { Search, Eye, EyeOff, Link2, Plus, Trash2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import type { Clue, Chapter } from '@/types/project'

interface ClueTrackerProps {
  clues: Clue[]
  chapters: Chapter[]
  onAddClue: (clue: Omit<Clue, 'id'>) => void
  onUpdateClue: (id: string, updates: Partial<Clue>) => void
  onDeleteClue: (id: string) => void
}

const IMPORTANCE_COLORS = {
  critical: 'bg-error/20 text-error border-error/30',
  supporting: 'bg-warning/20 text-warning border-warning/30',
  minor: 'bg-text-secondary/20 text-text-secondary border-text-secondary/30',
}

const STATUS_ICONS = {
  planted: EyeOff,
  revealed: Eye,
  'red-herring': Sparkles,
}

export function ClueTracker({
  clues,
  chapters,
  onAddClue,
  onUpdateClue,
  onDeleteClue,
}: ClueTrackerProps) {
  const [isAddingClue, setIsAddingClue] = useState(false)
  const [expandedClueId, setExpandedClueId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<Clue['status'] | 'all'>('all')
  const [newClue, setNewClue] = useState({
    description: '',
    plantedInChapterId: '',
    importance: 'supporting' as Clue['importance'],
    notes: '',
  })

  const filteredClues = useMemo(() => {
    if (filterStatus === 'all') return clues
    return clues.filter(c => c.status === filterStatus)
  }, [clues, filterStatus])

  const stats = useMemo(() => {
    const planted = clues.filter(c => c.status === 'planted').length
    const revealed = clues.filter(c => c.status === 'revealed').length
    const redHerrings = clues.filter(c => c.status === 'red-herring').length
    const critical = clues.filter(c => c.importance === 'critical').length
    const criticalRevealed = clues.filter(c => c.importance === 'critical' && c.status === 'revealed').length
    return { planted, revealed, redHerrings, critical, criticalRevealed }
  }, [clues])

  const getChapterTitle = (chapterId: string) => {
    const chapter = chapters.find(c => c.id === chapterId)
    return chapter ? `Ch ${chapter.number}: ${chapter.title}` : 'Unknown'
  }

  const handleAddClue = () => {
    if (!newClue.description || !newClue.plantedInChapterId) return

    onAddClue({
      description: newClue.description,
      plantedInChapterId: newClue.plantedInChapterId,
      revealedInChapterId: null,
      importance: newClue.importance,
      status: 'planted',
      connectedClueIds: [],
      notes: newClue.notes,
    })

    setNewClue({
      description: '',
      plantedInChapterId: '',
      importance: 'supporting',
      notes: '',
    })
    setIsAddingClue(false)
  }

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-surface-elevated rounded-lg p-3 border border-border">
          <div className="text-2xl font-bold text-accent">{clues.length}</div>
          <div className="text-xs text-text-secondary">Total Clues</div>
        </div>
        <div className="bg-surface-elevated rounded-lg p-3 border border-border">
          <div className="text-2xl font-bold text-warning">{stats.planted}</div>
          <div className="text-xs text-text-secondary">Planted (Hidden)</div>
        </div>
        <div className="bg-surface-elevated rounded-lg p-3 border border-border">
          <div className="text-2xl font-bold text-success">{stats.revealed}</div>
          <div className="text-xs text-text-secondary">Revealed</div>
        </div>
        <div className="bg-surface-elevated rounded-lg p-3 border border-border">
          <div className="text-2xl font-bold text-error">
            {stats.criticalRevealed}/{stats.critical}
          </div>
          <div className="text-xs text-text-secondary">Critical Revealed</div>
        </div>
      </div>

      {/* Filter & Add */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-text-secondary" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="all">All Clues</option>
            <option value="planted">Planted Only</option>
            <option value="revealed">Revealed Only</option>
            <option value="red-herring">Red Herrings</option>
          </select>
        </div>
        <button
          onClick={() => setIsAddingClue(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-lg hover:bg-accent/90 text-sm"
        >
          <Plus className="h-4 w-4" />
          Add Clue
        </button>
      </div>

      {/* Add Clue Form */}
      {isAddingClue && (
        <div className="bg-surface-elevated rounded-lg p-4 border border-accent/30 space-y-3">
          <h4 className="font-medium text-accent">New Clue</h4>
          <textarea
            value={newClue.description}
            onChange={(e) => setNewClue(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the clue..."
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm resize-none"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-secondary">Planted In</label>
              <select
                value={newClue.plantedInChapterId}
                onChange={(e) => setNewClue(prev => ({ ...prev, plantedInChapterId: e.target.value }))}
                className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-sm mt-1"
              >
                <option value="">Select chapter...</option>
                {chapters.map(ch => (
                  <option key={ch.id} value={ch.id}>
                    Ch {ch.number}: {ch.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-secondary">Importance</label>
              <select
                value={newClue.importance}
                onChange={(e) => setNewClue(prev => ({ ...prev, importance: e.target.value as Clue['importance'] }))}
                className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-sm mt-1"
              >
                <option value="critical">Critical</option>
                <option value="supporting">Supporting</option>
                <option value="minor">Minor</option>
              </select>
            </div>
          </div>
          <textarea
            value={newClue.notes}
            onChange={(e) => setNewClue(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes (optional)..."
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm resize-none"
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAddingClue(false)}
              className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              onClick={handleAddClue}
              disabled={!newClue.description || !newClue.plantedInChapterId}
              className="px-3 py-1.5 bg-accent text-white rounded-lg text-sm disabled:opacity-50"
            >
              Add Clue
            </button>
          </div>
        </div>
      )}

      {/* Clues List */}
      <div className="space-y-2">
        {filteredClues.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            No clues found. Add your first clue to start tracking.
          </div>
        ) : (
          filteredClues.map((clue) => {
            const StatusIcon = STATUS_ICONS[clue.status]
            const isExpanded = expandedClueId === clue.id

            return (
              <div
                key={clue.id}
                className={`bg-surface rounded-lg border ${IMPORTANCE_COLORS[clue.importance]} overflow-hidden`}
              >
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer"
                  onClick={() => setExpandedClueId(isExpanded ? null : clue.id)}
                >
                  <StatusIcon className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{clue.description}</p>
                    <p className="text-xs text-text-secondary">
                      Planted: {getChapterTitle(clue.plantedInChapterId)}
                      {clue.revealedInChapterId && ` → Revealed: ${getChapterTitle(clue.revealedInChapterId)}`}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs ${IMPORTANCE_COLORS[clue.importance]}`}>
                    {clue.importance}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-text-secondary" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-text-secondary" />
                  )}
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-border/50 pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-text-secondary">Status</label>
                        <select
                          value={clue.status}
                          onChange={(e) => onUpdateClue(clue.id, { status: e.target.value as Clue['status'] })}
                          className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-1.5 text-sm mt-1"
                        >
                          <option value="planted">Planted (Hidden)</option>
                          <option value="revealed">Revealed</option>
                          <option value="red-herring">Red Herring</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-text-secondary">Revealed In</label>
                        <select
                          value={clue.revealedInChapterId || ''}
                          onChange={(e) => onUpdateClue(clue.id, { revealedInChapterId: e.target.value || null })}
                          className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-1.5 text-sm mt-1"
                        >
                          <option value="">Not yet revealed</option>
                          {chapters.map(ch => (
                            <option key={ch.id} value={ch.id}>
                              Ch {ch.number}: {ch.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {clue.connectedClueIds.length > 0 && (
                      <div>
                        <label className="text-xs text-text-secondary flex items-center gap-1">
                          <Link2 className="h-3 w-3" />
                          Connected Clues
                        </label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {clue.connectedClueIds.map(connId => {
                            const connClue = clues.find(c => c.id === connId)
                            return connClue ? (
                              <span key={connId} className="px-2 py-0.5 bg-accent/20 text-accent rounded text-xs">
                                {connClue.description.substring(0, 20)}...
                              </span>
                            ) : null
                          })}
                        </div>
                      </div>
                    )}

                    {clue.notes && (
                      <div>
                        <label className="text-xs text-text-secondary">Notes</label>
                        <p className="text-sm text-text-primary mt-1">{clue.notes}</p>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={() => onDeleteClue(clue.id)}
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
