import { useState, useMemo } from 'react'
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Search,
  ChevronDown,
  ChevronRight,
  User,
  MapPin,
  Package,
  Calendar,
  Link2,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react'
import type {
  FactAssertion,
  ContinuityConflict,
  FactType,
  Character,
  Chapter
} from '@/types/project'

interface ContinuityPanelProps {
  facts: FactAssertion[]
  conflicts: ContinuityConflict[]
  characters: Character[]
  chapters: Chapter[]
  onExtractFacts: (chapterId: string) => void
  onResolveConflict: (conflictId: string, resolution: string) => void
  onDismissConflict: (conflictId: string) => void
  isExtracting?: boolean
}

const FACT_TYPE_CONFIG: Record<FactType, { icon: React.ReactNode; label: string; color: string }> = {
  physical: { icon: <User className="w-4 h-4" />, label: 'Physical', color: 'text-blue-400' },
  knowledge: { icon: <Eye className="w-4 h-4" />, label: 'Knowledge', color: 'text-purple-400' },
  location: { icon: <MapPin className="w-4 h-4" />, label: 'Location', color: 'text-green-400' },
  relationship: { icon: <Link2 className="w-4 h-4" />, label: 'Relationship', color: 'text-pink-400' },
  temporal: { icon: <Calendar className="w-4 h-4" />, label: 'Timeline', color: 'text-orange-400' },
  possession: { icon: <Package className="w-4 h-4" />, label: 'Possession', color: 'text-yellow-400' },
  state: { icon: <CheckCircle className="w-4 h-4" />, label: 'State', color: 'text-cyan-400' },
}

export function ContinuityPanel({
  facts,
  conflicts,
  characters,
  chapters,
  onExtractFacts,
  onResolveConflict,
  onDismissConflict,
  isExtracting = false
}: ContinuityPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFactType, setSelectedFactType] = useState<FactType | 'all'>('all')
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set())
  const [showResolved, setShowResolved] = useState(false)
  const [selectedConflict, setSelectedConflict] = useState<ContinuityConflict | null>(null)

  // Group facts by subject
  const factsBySubject = useMemo(() => {
    const grouped = new Map<string, FactAssertion[]>()

    const filteredFacts = facts.filter(fact => {
      if (selectedFactType !== 'all' && fact.factType !== selectedFactType) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          fact.subjectId.toLowerCase().includes(query) ||
          fact.assertion.toLowerCase().includes(query) ||
          fact.quote.toLowerCase().includes(query)
        )
      }
      return true
    })

    for (const fact of filteredFacts) {
      const existing = grouped.get(fact.subjectId) || []
      grouped.set(fact.subjectId, [...existing, fact])
    }

    return grouped
  }, [facts, selectedFactType, searchQuery])

  // Get unresolved conflicts
  const unresolvedConflicts = useMemo(() =>
    conflicts.filter(c => !c.resolved),
    [conflicts]
  )

  const resolvedConflicts = useMemo(() =>
    conflicts.filter(c => c.resolved),
    [conflicts]
  )

  const getCharacterName = (id: string) => {
    const char = characters.find(c => c.id === id)
    return char?.name || id
  }

  const getChapterTitle = (id: string) => {
    const chapter = chapters.find(c => c.id === id)
    return chapter ? `Chapter ${chapter.number}: ${chapter.title}` : id
  }

  const toggleSubject = (subjectId: string) => {
    const next = new Set(expandedSubjects)
    if (next.has(subjectId)) {
      next.delete(subjectId)
    } else {
      next.add(subjectId)
    }
    setExpandedSubjects(next)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Eye className="w-5 h-5 text-accent" />
            Continuity Tracker
          </h3>
          <button
            onClick={() => {
              const latestChapter = chapters[chapters.length - 1]
              if (latestChapter) onExtractFacts(latestChapter.id)
            }}
            disabled={isExtracting || chapters.length === 0}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            {isExtracting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Extract Facts
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search facts..."
              className="input pl-9 w-full"
            />
          </div>
          <select
            value={selectedFactType}
            onChange={(e) => setSelectedFactType(e.target.value as FactType | 'all')}
            className="input w-40"
          >
            <option value="all">All Types</option>
            {Object.entries(FACT_TYPE_CONFIG).map(([type, config]) => (
              <option key={type} value={type}>{config.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Conflicts Section */}
      {unresolvedConflicts.length > 0 && (
        <div className="p-4 bg-red-500/10 border-b border-red-500/30">
          <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" />
            {unresolvedConflicts.length} Continuity Conflict{unresolvedConflicts.length !== 1 ? 's' : ''}
          </h4>
          <div className="space-y-2">
            {unresolvedConflicts.map(conflict => (
              <div
                key={conflict.id}
                className="bg-surface-elevated rounded-lg p-3 border border-red-500/30 cursor-pointer hover:border-red-500/50 transition-colors"
                onClick={() => setSelectedConflict(conflict)}
              >
                <p className="text-sm text-text-primary">{conflict.description}</p>
                <p className="text-xs text-text-secondary mt-1">
                  Severity: <span className={
                    conflict.severity === 'high' ? 'text-red-400' :
                    conflict.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                  }>{conflict.severity}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Facts List */}
      <div className="flex-1 overflow-y-auto p-4">
        {factsBySubject.size === 0 ? (
          <div className="text-center py-8">
            <Eye className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-50" />
            <p className="text-text-secondary">No facts tracked yet</p>
            <p className="text-sm text-text-secondary mt-1">
              Extract facts from your chapters to start tracking continuity
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from(factsBySubject.entries()).map(([subjectId, subjectFacts]) => (
              <div key={subjectId} className="card">
                <button
                  onClick={() => toggleSubject(subjectId)}
                  className="w-full flex items-center justify-between p-3 hover:bg-surface-elevated rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedSubjects.has(subjectId) ? (
                      <ChevronDown className="w-4 h-4 text-text-secondary" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-text-secondary" />
                    )}
                    <span className="font-medium text-text-primary">
                      {subjectFacts[0].subjectType === 'character'
                        ? getCharacterName(subjectId)
                        : subjectId}
                    </span>
                    <span className="text-xs text-text-secondary bg-surface-elevated px-2 py-0.5 rounded">
                      {subjectFacts.length} fact{subjectFacts.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </button>

                {expandedSubjects.has(subjectId) && (
                  <div className="px-3 pb-3 space-y-2">
                    {subjectFacts.map(fact => {
                      const config = FACT_TYPE_CONFIG[fact.factType]
                      return (
                        <div
                          key={fact.id}
                          className="bg-surface-elevated rounded-lg p-3 border border-border"
                        >
                          <div className="flex items-start gap-2">
                            <span className={config.color}>{config.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-text-primary">{fact.assertion}</p>
                              <p className="text-xs text-text-secondary mt-1 italic">
                                "{fact.quote}"
                              </p>
                              <p className="text-xs text-text-secondary mt-1">
                                {getChapterTitle(fact.assertedInChapterId)}
                              </p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              fact.confidence === 'explicit'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {fact.confidence}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Resolved Conflicts (collapsible) */}
        {resolvedConflicts.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowResolved(!showResolved)}
              className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-2"
            >
              {showResolved ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showResolved ? 'Hide' : 'Show'} {resolvedConflicts.length} resolved conflict{resolvedConflicts.length !== 1 ? 's' : ''}
            </button>
            {showResolved && (
              <div className="mt-2 space-y-2 opacity-60">
                {resolvedConflicts.map(conflict => (
                  <div key={conflict.id} className="bg-surface-elevated rounded-lg p-3 border border-border">
                    <p className="text-sm text-text-primary line-through">{conflict.description}</p>
                    {conflict.resolution && (
                      <p className="text-xs text-green-400 mt-1">Resolution: {conflict.resolution}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Conflict Resolution Modal */}
      {selectedConflict && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Resolve Conflict</h3>
              <button onClick={() => setSelectedConflict(null)} className="text-text-secondary hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-text-primary mb-4">{selectedConflict.description}</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  onResolveConflict(selectedConflict.id, 'Kept original fact')
                  setSelectedConflict(null)
                }}
                className="w-full btn-secondary text-left"
              >
                Keep original (older fact is correct)
              </button>
              <button
                onClick={() => {
                  onResolveConflict(selectedConflict.id, 'Updated to new fact')
                  setSelectedConflict(null)
                }}
                className="w-full btn-secondary text-left"
              >
                Use new (newer fact is correct)
              </button>
              <button
                onClick={() => {
                  onDismissConflict(selectedConflict.id)
                  setSelectedConflict(null)
                }}
                className="w-full btn-ghost text-left text-text-secondary"
              >
                Dismiss (not actually a conflict)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContinuityPanel
