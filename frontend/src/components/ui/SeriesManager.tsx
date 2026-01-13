import { useState, useCallback } from 'react'
import {
  BookOpen,
  Library,
  Users,
  Link2,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Trash2,
  User,
  History,
  Sparkles,
  Loader2,
  FileText,
  Lightbulb
} from 'lucide-react'
import type {
  Series,
  CrossBookPromise,
  Project,
  Character
} from '@/types/project'
import { useAIGeneration } from '@/hooks/useAIGeneration'
import { AIProgressModal } from '@/components/ui/AIProgressModal'

// Types for AI responses
interface ContinuityCheckResult {
  continuityIssues: {
    id: string
    severity: 'high' | 'medium' | 'low'
    type: string
    description: string
    book1: number
    book1Location: string
    book2: number
    book2Location: string
    suggestion: string
  }[]
  unresolvedPromises: {
    promiseId: string
    promiseText: string
    madeInBook: number
    urgency: string
    suggestedResolution: string
  }[]
  characterEvolutionGaps: {
    characterName: string
    lastKnownState: string
    currentState: string
    missingDevelopment: string
    suggestion: string
  }[]
  callbackOpportunities: {
    element: string
    originalBook: number
    suggestedCallback: string
    suggestedLocation: string
    impactLevel: string
  }[]
  overallHealth: {
    score: number
    summary: string
    criticalActions: string[]
  }
}

interface SeriesElementsResult {
  newWorldbuildingElements: { name: string; category: string; description: string }[]
  characterStateChanges: { characterName: string; changeType: string; newState: string }[]
  newPromises: { promiseText: string; promiseType: string; importance: string }[]
  timelineEvents: { event: string; relativeTime: string; significance: string }[]
}

interface SeriesManagerProps {
  series: Series[]
  projects: Project[]
  onCreateSeries: (series: Omit<Series, 'id' | 'createdAt' | 'updatedAt'>) => void
  onUpdateSeries: (seriesId: string, updates: Partial<Series>) => void
  onDeleteSeries: (seriesId: string) => void
  onAddBookToSeries: (seriesId: string, projectId: string) => void
  onRemoveBookFromSeries: (seriesId: string, projectId: string) => void
  onUpdatePromise: (seriesId: string, promiseId: string, updates: Partial<CrossBookPromise>) => void
}

interface SeriesCardProps {
  series: Series
  projects: Project[]
  onUpdate: (updates: Partial<Series>) => void
  onDelete: () => void
  onAddBook: (projectId: string) => void
  onRemoveBook: (projectId: string) => void
  onUpdatePromise: (promiseId: string, updates: Partial<CrossBookPromise>) => void
  isGenerating: boolean
  onCheckContinuity: () => void
  onExtractElements: (projectId: string) => void
  continuityResult: ContinuityCheckResult | null
  onClearContinuityResult: () => void
}

function SeriesCard({
  series,
  projects,
  onUpdate: _onUpdate,
  onDelete,
  onAddBook,
  onRemoveBook,
  onUpdatePromise,
  isGenerating,
  onCheckContinuity,
  onExtractElements,
  continuityResult,
  onClearContinuityResult
}: SeriesCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'books' | 'characters' | 'promises' | 'timeline' | 'ai'>('books')
  const [showAddBook, setShowAddBook] = useState(false)

  const seriesProjects = projects.filter(p => series.projectIds.includes(p.id))
  const availableProjects = projects.filter(p => !series.projectIds.includes(p.id))

  const openPromises = series.crossBookPromises.filter(p => p.status === 'open')
  const resolvedPromises = series.crossBookPromises.filter(p => p.status === 'resolved')

  return (
    <div className="card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-elevated/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-text-secondary" />
          ) : (
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          )}
          <Library className="w-5 h-5 text-accent" />
          <div className="text-left">
            <span className="font-medium text-text-primary">{series.name}</span>
            <span className="text-xs text-text-secondary ml-2">
              {series.projectIds.length} book{series.projectIds.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {continuityResult && (
            <span className={`text-xs px-2 py-0.5 rounded ${
              continuityResult.overallHealth.score >= 7 ? 'bg-green-500/20 text-green-400' :
              continuityResult.overallHealth.score >= 5 ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              Health: {continuityResult.overallHealth.score}/10
            </span>
          )}
          {openPromises.length > 0 && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
              {openPromises.length} open promise{openPromises.length !== 1 ? 's' : ''}
            </span>
          )}
          {series.projectIds.length >= 2 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCheckContinuity()
              }}
              disabled={isGenerating}
              className="text-xs flex items-center gap-1 text-accent hover:bg-accent/10 px-2 py-1 rounded transition-colors"
              title="AI Continuity Check"
            >
              {isGenerating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              Check
            </button>
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {(['books', 'characters', 'promises', 'timeline', 'ai'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-accent border-b-2 border-accent'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab === 'ai' ? (
                  <span className="flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI
                  </span>
                ) : (
                  tab.charAt(0).toUpperCase() + tab.slice(1)
                )}
              </button>
            ))}
          </div>

          <div className="p-4">
            {/* Books Tab */}
            {activeTab === 'books' && (
              <div className="space-y-3">
                {seriesProjects.length === 0 ? (
                  <p className="text-sm text-text-secondary italic">No books in this series yet</p>
                ) : (
                  seriesProjects.map((project, index) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between bg-surface-elevated rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{project.metadata.workingTitle}</p>
                          <p className="text-xs text-text-secondary">
                            {project.specification?.targetWordCount?.toLocaleString() || 0} words target
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveBook(project.id)}
                        className="text-text-secondary hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}

                {showAddBook ? (
                  <div className="bg-surface-elevated rounded-lg p-3">
                    <p className="text-xs text-text-secondary mb-2">Add existing project to series:</p>
                    {availableProjects.length === 0 ? (
                      <p className="text-sm text-text-secondary italic">No available projects</p>
                    ) : (
                      <div className="space-y-2">
                        {availableProjects.slice(0, 5).map(project => (
                          <button
                            key={project.id}
                            onClick={() => {
                              onAddBook(project.id)
                              setShowAddBook(false)
                            }}
                            className="w-full text-left px-3 py-2 rounded hover:bg-surface transition-colors text-sm text-text-primary"
                          >
                            {project.metadata.workingTitle}
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => setShowAddBook(false)}
                      className="mt-2 text-xs text-text-secondary hover:text-text-primary"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddBook(true)}
                    className="btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Book
                  </button>
                )}
              </div>
            )}

            {/* Characters Tab */}
            {activeTab === 'characters' && (
              <div className="space-y-3">
                {series.sharedCharacters.length === 0 ? (
                  <div className="text-center py-4">
                    <Users className="w-8 h-8 text-text-secondary mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-text-secondary">No shared characters tracked</p>
                    <p className="text-xs text-text-secondary mt-1">
                      Characters appearing in multiple books will be tracked here
                    </p>
                  </div>
                ) : (
                  series.sharedCharacters.map(char => (
                    <div key={char.seriesCharacterId} className="bg-surface-elevated rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-accent" />
                          <span className="font-medium text-text-primary">{char.seriesCharacterName}</span>
                          {!char.lastKnownState.isAlive && (
                            <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                              Deceased
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-text-secondary">
                          Last seen: Book {char.lastKnownState.lastSeenBookNumber}
                        </span>
                      </div>
                      {char.lastKnownState.significantChanges.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {char.lastKnownState.significantChanges.map((change, i) => (
                            <p key={i} className="text-xs text-text-secondary flex items-start gap-1">
                              <History className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              {change}
                            </p>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex gap-1">
                        {Object.keys(char.bookMappings).map(projectId => {
                          const bookNum = series.projectIds.indexOf(projectId) + 1
                          return (
                            <span
                              key={projectId}
                              className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded"
                            >
                              Book {bookNum}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Promises Tab */}
            {activeTab === 'promises' && (
              <div className="space-y-4">
                {openPromises.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-yellow-400 uppercase mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Open Promises ({openPromises.length})
                    </h5>
                    <div className="space-y-2">
                      {openPromises.map(promise => (
                        <div
                          key={promise.id}
                          className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3"
                        >
                          <p className="text-sm text-text-primary">{promise.promiseText}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-text-secondary">
                              Made in Book {promise.madeInBookNumber}
                            </span>
                            {promise.requiredResolutionBy && (
                              <span className="text-xs text-yellow-400">
                                Resolve by Book {promise.requiredResolutionBy}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => onUpdatePromise(promise.id, { status: 'resolved' })}
                            className="mt-2 text-xs text-green-400 hover:underline"
                          >
                            Mark as Resolved
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {resolvedPromises.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-green-400 uppercase mb-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Resolved ({resolvedPromises.length})
                    </h5>
                    <div className="space-y-2 opacity-60">
                      {resolvedPromises.map(promise => (
                        <div
                          key={promise.id}
                          className="bg-surface-elevated rounded-lg p-3"
                        >
                          <p className="text-sm text-text-primary line-through">{promise.promiseText}</p>
                          <p className="text-xs text-text-secondary mt-1">
                            Made in Book {promise.madeInBookNumber}, resolved in Book {promise.resolvedInBookNumber}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {series.crossBookPromises.length === 0 && (
                  <div className="text-center py-4">
                    <Link2 className="w-8 h-8 text-text-secondary mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-text-secondary">No cross-book promises tracked</p>
                    <p className="text-xs text-text-secondary mt-1">
                      Prophecies, foreshadowing, and setup that needs payoff will appear here
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-3">
                {series.timeline.length === 0 ? (
                  <div className="text-center py-4">
                    <Clock className="w-8 h-8 text-text-secondary mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-text-secondary">No timeline events tracked</p>
                    <p className="text-xs text-text-secondary mt-1">
                      Major events spanning the series will be tracked here
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
                    {series.timeline.sort((a, b) => a.bookNumber - b.bookNumber).map(event => (
                      <div key={event.id} className="relative pl-8 pb-4 last:pb-0">
                        <div className="absolute left-1.5 w-4 h-4 rounded-full bg-accent border-2 border-surface" />
                        <div className="bg-surface-elevated rounded-lg p-3">
                          <p className="text-sm text-text-primary">{event.event}</p>
                          <p className="text-xs text-text-secondary mt-1">
                            Book {event.bookNumber} &middot; {event.relativeTime}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Tab */}
            {activeTab === 'ai' && (
              <div className="space-y-4">
                {/* Continuity Check Results */}
                {continuityResult ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-semibold text-accent flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Continuity Analysis
                      </h5>
                      <button
                        onClick={onClearContinuityResult}
                        className="text-text-secondary hover:text-text-primary"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Health Score */}
                    <div className={`p-3 rounded-lg ${
                      continuityResult.overallHealth.score >= 7 ? 'bg-green-500/10 border border-green-500/30' :
                      continuityResult.overallHealth.score >= 5 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                      'bg-red-500/10 border border-red-500/30'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-text-secondary">Overall Health</span>
                        <span className={`text-lg font-bold ${
                          continuityResult.overallHealth.score >= 7 ? 'text-green-400' :
                          continuityResult.overallHealth.score >= 5 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {continuityResult.overallHealth.score}/10
                        </span>
                      </div>
                      <p className="text-xs text-text-primary">{continuityResult.overallHealth.summary}</p>
                    </div>

                    {/* Continuity Issues */}
                    {continuityResult.continuityIssues.length > 0 && (
                      <div>
                        <h6 className="text-xs font-semibold text-red-400 uppercase mb-2">
                          Continuity Issues ({continuityResult.continuityIssues.length})
                        </h6>
                        <div className="space-y-2">
                          {continuityResult.continuityIssues.map((issue, i) => (
                            <div key={i} className={`p-2 rounded-lg text-xs ${
                              issue.severity === 'high' ? 'bg-red-500/10 border border-red-500/30' :
                              issue.severity === 'medium' ? 'bg-yellow-500/10 border border-yellow-500/30' :
                              'bg-blue-500/10 border border-blue-500/30'
                            }`}>
                              <p className="text-text-primary mb-1">{issue.description}</p>
                              <p className="text-text-secondary">
                                Book {issue.book1} vs Book {issue.book2}
                              </p>
                              <p className="text-accent mt-1">Fix: {issue.suggestion}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Callback Opportunities */}
                    {continuityResult.callbackOpportunities.length > 0 && (
                      <div>
                        <h6 className="text-xs font-semibold text-green-400 uppercase mb-2 flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" />
                          Callback Opportunities ({continuityResult.callbackOpportunities.length})
                        </h6>
                        <div className="space-y-2">
                          {continuityResult.callbackOpportunities.slice(0, 3).map((opp, i) => (
                            <div key={i} className="p-2 bg-green-500/10 rounded-lg text-xs border border-green-500/30">
                              <p className="text-text-primary">{opp.element} (Book {opp.originalBook})</p>
                              <p className="text-text-secondary mt-1">{opp.suggestedCallback}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Critical Actions */}
                    {continuityResult.overallHealth.criticalActions.length > 0 && (
                      <div className="p-3 bg-surface-elevated rounded-lg">
                        <h6 className="text-xs font-semibold text-text-primary mb-2">Priority Actions</h6>
                        <ul className="space-y-1">
                          {continuityResult.overallHealth.criticalActions.map((action, i) => (
                            <li key={i} className="text-xs text-text-secondary flex items-start gap-1">
                              <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-accent" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Sparkles className="w-8 h-8 text-text-secondary mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-text-secondary">No analysis yet</p>
                    <p className="text-xs text-text-secondary mt-1 mb-4">
                      Click "Check" to analyze series continuity
                    </p>
                    {series.projectIds.length >= 2 ? (
                      <button
                        onClick={onCheckContinuity}
                        disabled={isGenerating}
                        className="btn-primary flex items-center gap-2 mx-auto"
                      >
                        {isGenerating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        Analyze Continuity
                      </button>
                    ) : (
                      <p className="text-xs text-yellow-400">Add at least 2 books to analyze continuity</p>
                    )}
                  </div>
                )}

                {/* Extract Elements from Books */}
                {seriesProjects.length > 0 && (
                  <div className="border-t border-border pt-4">
                    <h6 className="text-xs font-semibold text-text-secondary uppercase mb-2 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      Extract Series Elements
                    </h6>
                    <div className="space-y-2">
                      {seriesProjects.map((project, index) => (
                        <div
                          key={project.id}
                          className="flex items-center justify-between bg-surface-elevated rounded-lg p-2"
                        >
                          <span className="text-sm text-text-primary">
                            Book {index + 1}: {project.metadata.workingTitle}
                          </span>
                          <button
                            onClick={() => onExtractElements(project.id)}
                            disabled={isGenerating}
                            className="text-xs flex items-center gap-1 text-accent hover:bg-accent/10 px-2 py-1 rounded"
                          >
                            {isGenerating ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                            Extract
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-border flex justify-end">
            <button
              onClick={onDelete}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Delete Series
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function SeriesManager({
  series,
  projects,
  onCreateSeries,
  onUpdateSeries,
  onDeleteSeries,
  onAddBookToSeries,
  onRemoveBookFromSeries,
  onUpdatePromise
}: SeriesManagerProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [newSeriesName, setNewSeriesName] = useState('')
  const [newSeriesDescription, setNewSeriesDescription] = useState('')

  // AI Integration
  const [continuityResults, setContinuityResults] = useState<Record<string, ContinuityCheckResult>>({})
  const { generate, isGenerating, status, progress, message, cancel } = useAIGeneration()

  const handleCreate = () => {
    if (!newSeriesName.trim()) return

    onCreateSeries({
      name: newSeriesName.trim(),
      description: newSeriesDescription.trim(),
      projectIds: [],
      seriesBible: [],
      sharedCharacters: [],
      crossBookPromises: [],
      timeline: []
    })

    setNewSeriesName('')
    setNewSeriesDescription('')
    setShowCreate(false)
  }

  // AI: Check series continuity
  const handleCheckContinuity = useCallback(async (s: Series) => {
    const seriesProjects = projects.filter(p => s.projectIds.includes(p.id))
    if (seriesProjects.length < 2) return

    try {
      const result = await generate({
        agentTarget: 'series',
        action: 'check-series-continuity',
        context: {
          series: s,
          books: seriesProjects.map((p) => ({
            title: p.metadata.workingTitle,
            wordCount: p.specification?.targetWordCount || 0,
            status: p.metadata.currentPhase,
            characters: p.characters?.map((c: Character) => ({ name: c.name })) || [],
            keyEvents: []
          })),
          sharedCharacters: s.sharedCharacters,
          crossBookPromises: s.crossBookPromises,
          timeline: s.timeline
        }
      })

      if (result) {
        try {
          const parsed = JSON.parse(result) as ContinuityCheckResult
          setContinuityResults(prev => ({ ...prev, [s.id]: parsed }))
        } catch {
          console.error('Failed to parse continuity result')
        }
      }
    } catch (error) {
      console.error('Continuity check failed:', error)
    }
  }, [generate, projects])

  // AI: Extract series elements from a book
  const handleExtractElements = useCallback(async (s: Series, projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return

    const bookNumber = s.projectIds.indexOf(projectId) + 1

    try {
      const result = await generate({
        agentTarget: 'series',
        action: 'extract-series-elements',
        context: {
          book: {
            title: project.metadata.workingTitle,
            wordCount: project.specification?.targetWordCount || 0
          },
          bookNumber,
          contentSummary: 'See chapter summaries below',
          chapterSummaries: project.chapters?.map((c, i) => ({
            number: i + 1,
            summary: c.content?.slice(0, 500) || 'No content yet'
          })) || [],
          characters: project.characters || [],
          existingSeriesBible: s.seriesBible
        }
      })

      if (result) {
        try {
          const parsed = JSON.parse(result) as SeriesElementsResult
          console.log('Extracted elements:', parsed)
          // TODO: Update series with extracted elements
        } catch {
          console.error('Failed to parse extracted elements')
        }
      }
    } catch (error) {
      console.error('Element extraction failed:', error)
    }
  }, [generate, projects])

  // Calculate total open promises across all series
  const totalOpenPromises = series.reduce(
    (sum, s) => sum + s.crossBookPromises.filter(p => p.status === 'open').length,
    0
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Library className="w-5 h-5 text-accent" />
          Series Manager
          {totalOpenPromises > 0 && (
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
              {totalOpenPromises} open promise{totalOpenPromises !== 1 ? 's' : ''}
            </span>
          )}
        </h3>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Series
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="card p-4">
          <h4 className="font-medium text-text-primary mb-3">Create New Series</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-text-secondary block mb-1">Series Name</label>
              <input
                type="text"
                value={newSeriesName}
                onChange={(e) => setNewSeriesName(e.target.value)}
                placeholder="The Chronicles of..."
                className="input w-full"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-1">Description</label>
              <textarea
                value={newSeriesDescription}
                onChange={(e) => setNewSeriesDescription(e.target.value)}
                placeholder="A brief description of the series..."
                className="input w-full h-20 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!newSeriesName.trim()}
                className="btn-primary flex-1"
              >
                Create Series
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Series List */}
      {series.length === 0 ? (
        <div className="text-center py-12 card">
          <BookOpen className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-50" />
          <p className="text-text-secondary">No series created yet</p>
          <p className="text-sm text-text-secondary mt-1">
            Create a series to track continuity across multiple books
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {series.map(s => (
            <SeriesCard
              key={s.id}
              series={s}
              projects={projects}
              onUpdate={(updates) => onUpdateSeries(s.id, updates)}
              onDelete={() => onDeleteSeries(s.id)}
              onAddBook={(projectId) => onAddBookToSeries(s.id, projectId)}
              onRemoveBook={(projectId) => onRemoveBookFromSeries(s.id, projectId)}
              onUpdatePromise={(promiseId, updates) => onUpdatePromise(s.id, promiseId, updates)}
              isGenerating={isGenerating}
              onCheckContinuity={() => handleCheckContinuity(s)}
              onExtractElements={(projectId) => handleExtractElements(s, projectId)}
              continuityResult={continuityResults[s.id] || null}
              onClearContinuityResult={() => setContinuityResults(prev => {
                const updated = { ...prev }
                delete updated[s.id]
                return updated
              })}
            />
          ))}
        </div>
      )}

      {/* AI Progress Modal */}
      <AIProgressModal
        isOpen={isGenerating}
        onClose={cancel}
        onCancel={cancel}
        title="Analyzing Series..."
        status={status}
        progress={progress}
        message={message}
      />
    </div>
  )
}

export default SeriesManager
