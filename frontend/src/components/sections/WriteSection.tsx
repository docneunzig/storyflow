import { useState } from 'react'
import { Plus, BookOpen, Edit2, Trash2, FileText, Lock, Film, ChevronDown, ChevronUp } from 'lucide-react'
import type { Project, Chapter, Scene } from '@/types/project'
import { useProjectStore } from '@/stores/projectStore'
import { updateProject } from '@/lib/db'
import { ChapterModal } from '@/components/ui/ChapterModal'
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

export function WriteSection({ project }: SectionProps) {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  const [isScenesExpanded, setIsScenesExpanded] = useState(true)
  const [isContentExpanded, setIsContentExpanded] = useState(true)
  const { updateProject: updateProjectStore, setSaveStatus } = useProjectStore()

  const handleSaveChapter = async (chapter: Chapter) => {
    try {
      setSaveStatus('saving')

      const isEditing = project.chapters.some(c => c.id === chapter.id)
      let updatedChapters: Chapter[]

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

      await updateProject(project.id, { chapters: updatedChapters })
      updateProjectStore(project.id, { chapters: updatedChapters })
      setSaveStatus('saved')
      setEditingChapter(null)
    } catch (error) {
      console.error('Failed to save chapter:', error)
      toast({ title: 'Failed to save chapter', variant: 'error' })
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
      />
    </div>
  )
}
