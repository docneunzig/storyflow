import { useState } from 'react'
import { Plus, BookOpen, Edit2, Trash2, FileText, Lock, Film, ChevronDown, ChevronUp, History, X, Star, ArrowRight } from 'lucide-react'
import type { Project, Chapter, WikiEntry, DailyWordCount, WritingStatistics, RevisionHistory } from '@/types/project'
import { useProjectStore } from '@/stores/projectStore'
import { updateProject } from '@/lib/db'
import { ChapterModal } from '@/components/ui/ChapterModal'
import { WikiAutoExtractModal } from '@/components/ui/WikiAutoExtractModal'
import { WikiConsistencyWarning } from '@/components/ui/WikiConsistencyWarning'
import { toast } from '@/components/ui/Toaster'
import { useNavigate } from 'react-router-dom'

interface SectionProps {
  project: Project
}

const STATUS_COLORS: Record<string, string> = {
  outline: 'bg-text-secondary/20 text-text-secondary border-text-secondary/30',
  draft: 'bg-accent/20 text-accent border-accent/30',
  revision: 'bg-warning/20 text-warning border-warning/30',
  final: 'bg-success/20 text-success border-success/30',
  locked: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

// Helper to get today's date string in YYYY-MM-DD format
function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

// Helper to create a revision history entry when chapter content changes
function createRevisionHistory(
  oldChapter: Chapter,
  newChapter: Chapter,
  existingRevisions: RevisionHistory[],
  qualityScores: { chapterId: string; overallScore: number }[]
): RevisionHistory | null {
  // Only create revision if content actually changed
  if (!oldChapter.content || oldChapter.content === newChapter.content) {
    return null
  }

  // Calculate revision number
  const chapterRevisions = existingRevisions.filter(r => r.chapterId === oldChapter.id)
  const nextRevisionNumber = chapterRevisions.length + 1

  // Get the most recent quality score for this chapter (score before changes)
  const chapterQualityScores = qualityScores.filter(qs => qs.chapterId === oldChapter.id)
  const latestScore = chapterQualityScores.length > 0
    ? chapterQualityScores[chapterQualityScores.length - 1].overallScore
    : 0

  return {
    chapterId: oldChapter.id,
    revisionNumber: nextRevisionNumber,
    timestamp: new Date().toISOString(),
    previousContent: oldChapter.content,
    changes: [], // Could be populated with diff in future
    qualityScoreBefore: latestScore,
    qualityScoreAfter: 0, // Will be populated when next critique is run
  }
}

// Helper to detect character first appearances in chapter content
function detectCharacterFirstAppearances(
  chapterContent: string,
  chapterTitle: string,
  chapterNumber: number,
  characters: { id: string; name: string; aliases: string[]; firstAppearance: string | null }[]
): { id: string; firstAppearance: string }[] {
  const updates: { id: string; firstAppearance: string }[] = []

  if (!chapterContent) return updates

  const contentLower = chapterContent.toLowerCase()

  for (const character of characters) {
    // Skip characters that already have a first appearance recorded
    if (character.firstAppearance) continue

    // Check if character name appears in content
    const nameAppears = contentLower.includes(character.name.toLowerCase())

    // Check if any alias appears in content
    const aliasAppears = character.aliases.some(alias =>
      alias && contentLower.includes(alias.toLowerCase())
    )

    if (nameAppears || aliasAppears) {
      // Format: "Chapter X: Title"
      updates.push({
        id: character.id,
        firstAppearance: `Chapter ${chapterNumber}: ${chapterTitle}`
      })
    }
  }

  return updates
}

// Helper to update daily word count tracking
function updateDailyWordCount(
  currentStats: WritingStatistics | null,
  wordsAdded: number
): WritingStatistics {
  const today = getTodayDateString()
  const existingWordsPerDay = currentStats?.wordsPerDay || []

  // Find today's entry or create a new one
  const todayIndex = existingWordsPerDay.findIndex(d => d.date === today)
  let updatedWordsPerDay: DailyWordCount[]

  if (todayIndex >= 0) {
    // Update existing entry for today
    updatedWordsPerDay = existingWordsPerDay.map((d, i) =>
      i === todayIndex ? { ...d, count: d.count + wordsAdded } : d
    )
  } else {
    // Add new entry for today
    updatedWordsPerDay = [...existingWordsPerDay, { date: today, count: wordsAdded }]
  }

  // Keep only the last 30 days of data
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]
  updatedWordsPerDay = updatedWordsPerDay.filter(d => d.date >= thirtyDaysAgoStr)

  // Sort by date
  updatedWordsPerDay.sort((a, b) => a.date.localeCompare(b.date))

  return {
    totalWords: currentStats?.totalWords || 0,
    wordsPerDay: updatedWordsPerDay,
    sessionsLogged: currentStats?.sessionsLogged || [],
    averageSessionLength: currentStats?.averageSessionLength || 0,
    chaptersCompleted: currentStats?.chaptersCompleted || 0,
    totalChapters: currentStats?.totalChapters || 0,
    revisionsCompleted: currentStats?.revisionsCompleted || 0,
    averageQualityScore: currentStats?.averageQualityScore || 0,
  }
}

export function WriteSection({ project }: SectionProps) {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  const [isScenesExpanded, setIsScenesExpanded] = useState(true)
  const [isContentExpanded, setIsContentExpanded] = useState(true)
  const [showWikiExtract, setShowWikiExtract] = useState(false)
  const [lastSavedChapter, setLastSavedChapter] = useState<Chapter | null>(null)
  const [showRevisionHistory, setShowRevisionHistory] = useState(false)
  const { updateProject: updateProjectStore, setSaveStatus } = useProjectStore()

  const handleSaveChapter = async (chapter: Chapter) => {
    try {
      setSaveStatus('saving')

      const isEditing = project.chapters.some(c => c.id === chapter.id)
      let updatedChapters: Chapter[]

      // Calculate word count difference for tracking
      const newWordCount = chapter.wordCount || 0
      const oldChapter = project.chapters.find(c => c.id === chapter.id)
      const oldWordCount = oldChapter?.wordCount || 0
      const wordsAdded = newWordCount - oldWordCount

      // Track revision history if content changed
      let updatedRevisions = project.revisions || []
      if (isEditing && oldChapter) {
        const revision = createRevisionHistory(
          oldChapter,
          chapter,
          updatedRevisions,
          project.qualityScores || []
        )
        if (revision) {
          updatedRevisions = [...updatedRevisions, revision]
          // Increment the chapter's currentRevision counter
          chapter = { ...chapter, currentRevision: (oldChapter.currentRevision || 0) + 1 }
        }
      }

      if (isEditing) {
        updatedChapters = project.chapters.map(c =>
          c.id === chapter.id ? chapter : c
        )
        toast({ title: `Chapter "${chapter.title}" updated`, variant: 'success' })
      } else {
        updatedChapters = [...project.chapters, chapter]
        toast({ title: `Chapter "${chapter.title}" created`, variant: 'success' })
      }

      // Sort chapters by number
      updatedChapters.sort((a, b) => a.number - b.number)

      // Update daily word count tracking if words were added
      let updatedStatistics = project.statistics
      if (wordsAdded > 0) {
        updatedStatistics = updateDailyWordCount(project.statistics, wordsAdded)
      }

      // Detect character first appearances in chapter content
      let updatedCharacters = project.characters || []
      if (chapter.content) {
        const firstAppearanceUpdates = detectCharacterFirstAppearances(
          chapter.content,
          chapter.title,
          chapter.number,
          updatedCharacters
        )

        if (firstAppearanceUpdates.length > 0) {
          updatedCharacters = updatedCharacters.map(char => {
            const update = firstAppearanceUpdates.find(u => u.id === char.id)
            if (update) {
              return { ...char, firstAppearance: update.firstAppearance }
            }
            return char
          })
          toast({
            title: `Detected first appearance for ${firstAppearanceUpdates.length} character(s)`,
            variant: 'success'
          })
        }
      }

      await updateProject(project.id, { chapters: updatedChapters, statistics: updatedStatistics, revisions: updatedRevisions, characters: updatedCharacters })
      updateProjectStore(project.id, { chapters: updatedChapters, statistics: updatedStatistics, revisions: updatedRevisions, characters: updatedCharacters })
      setSaveStatus('saved')
      setEditingChapter(null)

      // If chapter has content, show wiki auto-extraction modal
      if (chapter.content && chapter.content.trim().length > 50) {
        setLastSavedChapter(chapter)
        setShowWikiExtract(true)
      }
    } catch (error) {
      console.error('Failed to save chapter:', error)
      toast({ title: 'Failed to save chapter', variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  // Handle adding wiki entries from auto-extraction
  const handleAddWikiEntries = async (entries: WikiEntry[]) => {
    if (entries.length === 0) return

    try {
      setSaveStatus('saving')
      const existingEntries = project.worldbuildingEntries || []
      const updatedEntries = [...existingEntries, ...entries]
      await updateProject(project.id, { worldbuildingEntries: updatedEntries })
      updateProjectStore(project.id, { worldbuildingEntries: updatedEntries })
      setSaveStatus('saved')
      toast({
        title: `Added ${entries.length} wiki ${entries.length === 1 ? 'entry' : 'entries'}`,
        variant: 'success',
      })
    } catch (error) {
      console.error('Failed to add wiki entries:', error)
      toast({ title: 'Failed to add wiki entries', variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  const handleDeleteChapter = async (chapterId: string) => {
    try {
      // Check for dependent scenes
      const dependentScenes = (project.scenes || []).filter(s => s.chapterId === chapterId)
      if (dependentScenes.length > 0) {
        const sceneNames = dependentScenes.map(s => s.title).join(', ')
        toast({
          title: 'Cannot delete chapter',
          description: `${dependentScenes.length} scene(s) are assigned to this chapter: ${sceneNames}. Remove them first.`,
          variant: 'error'
        })
        setDeleteConfirmId(null)
        return
      }

      setSaveStatus('saving')
      const chapter = project.chapters.find(c => c.id === chapterId)
      const updatedChapters = project.chapters.filter(c => c.id !== chapterId)
      await updateProject(project.id, { chapters: updatedChapters })
      updateProjectStore(project.id, { chapters: updatedChapters })
      setSaveStatus('saved')
      setDeleteConfirmId(null)
      if (selectedChapterId === chapterId) {
        setSelectedChapterId(null)
      }
      toast({ title: `Chapter "${chapter?.title}" deleted`, variant: 'success' })
    } catch (error) {
      console.error('Failed to delete chapter:', error)
      toast({ title: 'Failed to delete chapter', variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  const handleOpenModal = (chapter?: Chapter) => {
    setEditingChapter(chapter || null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingChapter(null)
  }

  const chapters = project.chapters || []
  const scenes = project.scenes || []
  const totalWords = chapters.reduce((acc, c) => acc + c.wordCount, 0)
  const nextChapterNumber = chapters.length > 0
    ? Math.max(...chapters.map(c => c.number)) + 1
    : 1

  const selectedChapter = selectedChapterId
    ? chapters.find(c => c.id === selectedChapterId)
    : null

  // Get scenes assigned to the selected chapter
  const chapterScenes = selectedChapterId
    ? scenes.filter(s => s.chapterId === selectedChapterId)
    : []
  const scenesWordCount = chapterScenes.reduce((acc, s) => acc + s.estimatedWordCount, 0)

  // Get revision history for the selected chapter
  const chapterRevisions = selectedChapterId
    ? (project.revisions || []).filter(r => r.chapterId === selectedChapterId).sort((a, b) => b.revisionNumber - a.revisionNumber)
    : []

  // Get the latest quality score for the selected chapter
  const latestQualityScore = selectedChapterId
    ? (project.qualityScores || [])
        .filter(qs => qs.chapterId === selectedChapterId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.overallScore || null
    : null

  // Helper to get color based on quality score
  const getQualityColor = (score: number) => {
    if (score >= 9.0) return 'text-success'
    if (score >= 7.5) return 'text-accent'
    if (score >= 6.0) return 'text-warning'
    return 'text-error'
  }

  return (
    <div className="h-full flex">
      {/* Chapter List Sidebar */}
      <div className="w-72 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold text-text-primary">Chapters</h1>
            <button
              onClick={() => handleOpenModal()}
              className="p-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              title="New Chapter"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p className="text-xs text-text-secondary">
            {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} | {totalWords.toLocaleString()} words
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chapters.length === 0 ? (
            <div className="p-4 text-center">
              <BookOpen className="h-8 w-8 text-text-secondary mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm text-text-secondary mb-3">No chapters yet</p>
              <button
                onClick={() => handleOpenModal()}
                className="text-sm text-accent hover:underline"
              >
                Create your first chapter
              </button>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {chapters.map(chapter => (
                <div
                  key={chapter.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                    selectedChapterId === chapter.id
                      ? 'bg-accent/20 border border-accent/30'
                      : 'hover:bg-surface-elevated border border-transparent'
                  }`}
                  onClick={() => setSelectedChapterId(chapter.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-secondary font-medium">
                          Ch. {chapter.number}
                        </span>
                        {chapter.status === 'locked' && (
                          <Lock className="h-3 w-3 text-purple-400" aria-hidden="true" />
                        )}
                      </div>
                      <h3 className="font-medium text-text-primary text-sm truncate">
                        {chapter.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_COLORS[chapter.status]}`}>
                          {chapter.status}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {chapter.wordCount.toLocaleString()} words
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenModal(chapter)
                        }}
                        className="p-1 rounded hover:bg-surface transition-colors"
                        aria-label="Edit chapter"
                        title="Edit chapter"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
                      </button>
                      {deleteConfirmId === chapter.id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleDeleteChapter(chapter.id)}
                            className="px-1.5 py-0.5 text-xs bg-error text-white rounded hover:bg-error/90"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-1.5 py-0.5 text-xs border border-border rounded hover:bg-surface"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirmId(chapter.id)
                          }}
                          className="p-1 rounded hover:bg-error/10 transition-colors"
                          aria-label="Delete chapter"
                          title="Delete chapter"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-error" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedChapter ? (
          <>
            {/* Chapter Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary mb-1">
                    <span>Chapter {selectedChapter.number}</span>
                    <span className={`px-2 py-0.5 rounded border ${STATUS_COLORS[selectedChapter.status]}`}>
                      {selectedChapter.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-text-primary">
                    {selectedChapter.title}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-text-secondary">
                    <span>{selectedChapter.wordCount.toLocaleString()} words</span>
                    {chapterScenes.length > 0 && (
                      <span className="ml-2 text-accent">
                        ({chapterScenes.length} scene{chapterScenes.length !== 1 ? 's' : ''}, ~{scenesWordCount.toLocaleString()} est.)
                      </span>
                    )}
                  </div>
                  {/* Revision count indicator */}
                  {(selectedChapter.currentRevision || 0) > 0 && (
                    <button
                      onClick={() => setShowRevisionHistory(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-400 border border-purple-500/30 bg-purple-500/10 rounded-lg hover:bg-purple-500/20 transition-colors"
                      title="View revision history"
                    >
                      <History className="h-4 w-4" aria-hidden="true" />
                      Rev {selectedChapter.currentRevision}
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenModal(selectedChapter)}
                    className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-surface-elevated transition-colors"
                  >
                    Edit Details
                  </button>
                </div>
              </div>
            </div>

            {/* Chapter Scenes - Collapsible */}
            {chapterScenes.length > 0 && (
              <div className="border-b border-border bg-surface-elevated/30">
                <button
                  onClick={() => setIsScenesExpanded(!isScenesExpanded)}
                  className="w-full px-6 py-3 flex items-center justify-between hover:bg-surface-elevated/50 transition-colors"
                  aria-expanded={isScenesExpanded}
                  aria-controls="chapter-scenes-content"
                >
                  <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                    <Film className="h-4 w-4" aria-hidden="true" />
                    Scenes in this chapter ({chapterScenes.length})
                  </h3>
                  {isScenesExpanded ? (
                    <ChevronUp className="h-4 w-4 text-text-secondary" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-text-secondary" aria-hidden="true" />
                  )}
                </button>
                {isScenesExpanded && (
                  <div id="chapter-scenes-content" className="px-6 pb-4">
                    <div className="flex flex-wrap gap-2">
                      {chapterScenes.map(scene => (
                        <button
                          key={scene.id}
                          onClick={() => navigate(`/projects/${project.id}/scenes`)}
                          className="px-3 py-2 bg-surface border border-border rounded-lg text-sm hover:border-accent hover:bg-accent/10 transition-colors text-left"
                          title={`Go to scene: ${scene.title}`}
                        >
                          <span className="text-text-primary">{scene.title}</span>
                          <span className="text-text-secondary ml-2">
                            ~{scene.estimatedWordCount.toLocaleString()} words
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Chapter Content - Collapsible */}
            <div className="flex-1 overflow-y-auto flex flex-col">
              <button
                onClick={() => setIsContentExpanded(!isContentExpanded)}
                className="w-full px-6 py-3 flex items-center justify-between hover:bg-surface-elevated/30 transition-colors border-b border-border"
                aria-expanded={isContentExpanded}
                aria-controls="chapter-content-section"
              >
                <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Chapter Content
                </h3>
                {isContentExpanded ? (
                  <ChevronUp className="h-4 w-4 text-text-secondary" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-text-secondary" aria-hidden="true" />
                )}
              </button>
              {isContentExpanded && (
                <div id="chapter-content-section" className="flex-1 overflow-y-auto p-6">
                  {/* Wiki Consistency Warning */}
                  {selectedChapter.content && (
                    <div className="max-w-3xl mx-auto mb-4">
                      <WikiConsistencyWarning
                        chapter={selectedChapter}
                        wikiEntries={project.worldbuildingEntries || []}
                      />
                    </div>
                  )}

                  {selectedChapter.content ? (
                    <div className="max-w-3xl mx-auto">
                      <div className="prose prose-invert prose-lg font-serif whitespace-pre-wrap">
                        {selectedChapter.content}
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-3xl mx-auto text-center py-12">
                      <FileText className="h-12 w-12 text-text-secondary mx-auto mb-4" aria-hidden="true" />
                      <h3 className="text-lg font-medium text-text-primary mb-2">
                        No content yet
                      </h3>
                      <p className="text-text-secondary mb-4">
                        Start writing or use AI to generate content for this chapter.
                      </p>
                      <button
                        onClick={() => handleOpenModal(selectedChapter)}
                        className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
                      >
                        Start Writing
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <BookOpen className="h-16 w-16 text-text-secondary mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                {chapters.length === 0 ? 'Start Writing Your Novel' : 'Select a Chapter'}
              </h2>
              <p className="text-text-secondary mb-4 max-w-md">
                {chapters.length === 0
                  ? 'Create your first chapter to begin writing your manuscript.'
                  : 'Choose a chapter from the sidebar to view or edit its content.'}
              </p>
              {chapters.length === 0 && (
                <button
                  onClick={() => handleOpenModal()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Create First Chapter
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chapter Modal */}
      <ChapterModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveChapter}
        editChapter={editingChapter}
        nextChapterNumber={nextChapterNumber}
        project={project}
      />

      {/* Wiki Auto-Extraction Modal */}
      {lastSavedChapter && (
        <WikiAutoExtractModal
          isOpen={showWikiExtract}
          onClose={() => {
            setShowWikiExtract(false)
            setLastSavedChapter(null)
          }}
          onAddEntries={handleAddWikiEntries}
          chapter={lastSavedChapter}
          existingWikiEntries={project.worldbuildingEntries || []}
          existingCharacters={project.characters || []}
        />
      )}

      {/* Revision History Modal */}
      {showRevisionHistory && selectedChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowRevisionHistory(false)}
          />
          <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-purple-400" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-text-primary">
                  Revision History - {selectedChapter.title}
                </h2>
              </div>
              <button
                onClick={() => setShowRevisionHistory(false)}
                className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-text-secondary" aria-hidden="true" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {chapterRevisions.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-text-secondary mx-auto mb-4" aria-hidden="true" />
                  <p className="text-text-secondary">No revision history yet</p>
                  <p className="text-sm text-text-secondary mt-2">
                    Revisions are recorded when chapter content changes
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Current version */}
                  <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-accent">
                        Current Version (Rev {selectedChapter.currentRevision || 0})
                      </span>
                      <span className="text-xs text-text-secondary">
                        {selectedChapter.wordCount.toLocaleString()} words
                      </span>
                    </div>
                    {latestQualityScore !== null && (
                      <div className="flex items-center gap-1.5 mb-2 text-sm">
                        <Star className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
                        <span className={getQualityColor(latestQualityScore)}>
                          {latestQualityScore.toFixed(1)}/10
                        </span>
                        <span className="text-text-secondary text-xs">quality score</span>
                      </div>
                    )}
                    <p className="text-sm text-text-secondary line-clamp-2">
                      {selectedChapter.content?.substring(0, 200) || 'No content'}...
                    </p>
                  </div>

                  {/* Previous revisions */}
                  {chapterRevisions.map((revision, index) => {
                    // Get the score after this revision (from the next revision's "before" score, or current score)
                    const scoreAfter = index === 0
                      ? latestQualityScore
                      : chapterRevisions[index - 1].qualityScoreBefore
                    const scoreBefore = revision.qualityScoreBefore

                    return (
                      <div
                        key={`${revision.chapterId}-${revision.revisionNumber}`}
                        className="p-4 bg-surface-elevated border border-border rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-purple-400">
                            Revision {revision.revisionNumber}
                          </span>
                          <span className="text-xs text-text-secondary">
                            {new Date(revision.timestamp).toLocaleString()}
                          </span>
                        </div>

                        {/* Quality score comparison */}
                        {(scoreBefore > 0 || (scoreAfter && scoreAfter > 0)) && (
                          <div className="flex items-center gap-2 mb-2 text-sm">
                            <Star className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
                            <span className={`${scoreBefore > 0 ? getQualityColor(scoreBefore) : 'text-text-secondary'}`}>
                              {scoreBefore > 0 ? scoreBefore.toFixed(1) : '—'}
                            </span>
                            <ArrowRight className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
                            <span className={`${scoreAfter && scoreAfter > 0 ? getQualityColor(scoreAfter) : 'text-text-secondary'}`}>
                              {scoreAfter && scoreAfter > 0 ? scoreAfter.toFixed(1) : '—'}
                            </span>
                            {scoreBefore > 0 && scoreAfter && scoreAfter > 0 && (
                              <span className={`text-xs ${scoreAfter > scoreBefore ? 'text-success' : scoreAfter < scoreBefore ? 'text-error' : 'text-text-secondary'}`}>
                                ({scoreAfter > scoreBefore ? '+' : ''}{(scoreAfter - scoreBefore).toFixed(1)})
                              </span>
                            )}
                          </div>
                        )}

                        <p className="text-sm text-text-secondary line-clamp-2">
                          {revision.previousContent?.substring(0, 200) || 'No content'}...
                        </p>
                        <div className="mt-2 text-xs text-text-secondary">
                          {revision.previousContent?.split(/\s+/).length.toLocaleString() || 0} words
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border flex justify-end">
              <button
                onClick={() => setShowRevisionHistory(false)}
                className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-elevated transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
