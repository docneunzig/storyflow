import { useState } from 'react'
import { Plus, BookOpen, Edit2, Trash2, FileText, Lock } from 'lucide-react'
import type { Project, Chapter } from '@/types/project'
import { useProjectStore } from '@/stores/projectStore'
import { updateProject } from '@/lib/db'
import { ChapterModal } from '@/components/ui/ChapterModal'
import { toast } from '@/components/ui/Toaster'

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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
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
  const totalWords = chapters.reduce((acc, c) => acc + c.wordCount, 0)
  const nextChapterNumber = chapters.length > 0
    ? Math.max(...chapters.map(c => c.number)) + 1
    : 1

  const selectedChapter = selectedChapterId
    ? chapters.find(c => c.id === selectedChapterId)
    : null

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
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-text-secondary">
            {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} | {totalWords.toLocaleString()} words
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chapters.length === 0 ? (
            <div className="p-4 text-center">
              <BookOpen className="h-8 w-8 text-text-secondary mx-auto mb-2" />
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
                          <Lock className="h-3 w-3 text-purple-400" />
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
                        title="Edit chapter"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-text-secondary" />
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
                          title="Delete chapter"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-error" />
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">
                    {selectedChapter.wordCount.toLocaleString()} words
                  </span>
                  <button
                    onClick={() => handleOpenModal(selectedChapter)}
                    className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-surface-elevated transition-colors"
                  >
                    Edit Details
                  </button>
                </div>
              </div>
            </div>

            {/* Chapter Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedChapter.content ? (
                <div className="max-w-3xl mx-auto">
                  <div className="prose prose-invert prose-lg font-serif whitespace-pre-wrap">
                    {selectedChapter.content}
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto text-center py-12">
                  <FileText className="h-12 w-12 text-text-secondary mx-auto mb-4" />
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <BookOpen className="h-16 w-16 text-text-secondary mx-auto mb-4" />
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
                  <Plus className="h-4 w-4" />
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
