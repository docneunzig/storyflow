import { useState, useEffect, useCallback } from 'react'
import { X, BookOpen, Sparkles } from 'lucide-react'
import type { Chapter, ChapterStatus } from '@/types/project'
import { generateId } from '@/lib/db'
import { useAIGeneration } from '@/hooks/useAIGeneration'
import { AIProgressModal } from '@/components/ui/AIProgressModal'

interface ChapterModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (chapter: Chapter) => void
  editChapter?: Chapter | null
  nextChapterNumber?: number
}

const STATUSES: ChapterStatus[] = ['outline', 'draft', 'revision', 'final', 'locked']

function createEmptyChapter(chapterNumber: number): Omit<Chapter, 'id'> {
  return {
    number: chapterNumber,
    title: '',
    sceneIds: [],
    content: '',
    wordCount: 0,
    status: 'outline',
    lockedPassages: [],
    currentRevision: 0,
  }
}

export function ChapterModal({ isOpen, onClose, onSave, editChapter, nextChapterNumber = 1 }: ChapterModalProps) {
  const [formData, setFormData] = useState<Omit<Chapter, 'id'>>(createEmptyChapter(nextChapterNumber))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showAIProgress, setShowAIProgress] = useState(false)

  const {
    status: aiStatus,
    progress: aiProgress,
    message: aiMessage,
    error: aiError,
    isGenerating,
    generate,
    cancel,
    reset: resetAI,
  } = useAIGeneration()

  // Reset form when modal opens/closes or editChapter changes
  useEffect(() => {
    if (isOpen) {
      if (editChapter) {
        const { id, ...rest } = editChapter
        setFormData(rest)
      } else {
        setFormData(createEmptyChapter(nextChapterNumber))
      }
      setErrors({})
      resetAI()
      setShowAIProgress(false)
    }
  }, [isOpen, editChapter, nextChapterNumber, resetAI])

  // Handle AI generation for chapter content
  const handleAIGenerate = useCallback(async () => {
    if (!formData.title.trim()) {
      setErrors({ title: 'Please enter a title before generating content' })
      return
    }

    setShowAIProgress(true)

    const result = await generate({
      agentTarget: 'chapter',
      action: 'generate-chapter',
      context: {
        title: formData.title,
        chapterNumber: formData.number,
        synopsis: formData.content || 'A new chapter begins.',
      },
    })

    if (result) {
      // Update content with generated result
      const wordCount = result.trim() ? result.trim().split(/\s+/).length : 0
      setFormData(prev => ({
        ...prev,
        content: result,
        wordCount,
      }))
    }
  }, [formData.title, formData.number, formData.content, generate])

  const handleCloseAIProgress = useCallback(() => {
    setShowAIProgress(false)
    resetAI()
  }, [resetAI])

  // Handle Escape key to close
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const chapter: Chapter = {
      id: editChapter?.id || generateId(),
      ...formData,
      title: formData.title.trim(),
    }

    onSave(chapter)
    onClose()
  }

  const handleChange = (field: keyof Omit<Chapter, 'id'>, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-text-primary">
              {editChapter ? 'Edit Chapter' : 'New Chapter'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-text-secondary" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="chapter-number" className="block text-sm text-text-primary mb-1">
                Chapter Number
              </label>
              <input
                id="chapter-number"
                type="number"
                value={formData.number}
                onChange={(e) => handleChange('number', parseInt(e.target.value) || 1)}
                min="1"
                max="999"
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="chapter-status" className="block text-sm text-text-primary mb-1">Status</label>
              <select
                id="chapter-status"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value as ChapterStatus)}
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="chapter-title" className="block text-sm text-text-primary mb-1">
              Title <span className="text-error">*</span>
            </label>
            <input
              id="chapter-title"
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Chapter title"
              aria-invalid={errors.title ? 'true' : undefined}
              aria-describedby={errors.title ? 'chapter-title-error' : undefined}
              className={`w-full px-3 py-2 bg-surface-elevated border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent ${
                errors.title ? 'border-error' : 'border-border'
              }`}
            />
            {errors.title && (
              <p id="chapter-title-error" className="text-xs text-error mt-1" role="alert">{errors.title}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="chapter-content" className="block text-sm text-text-primary">
                Content
              </label>
              <button
                type="button"
                onClick={handleAIGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent/10 text-accent border border-accent/30 rounded-lg hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Generate chapter content with AI"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Generate with AI
              </button>
            </div>
            <textarea
              id="chapter-content"
              value={formData.content}
              onChange={(e) => {
                const content = e.target.value
                const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
                handleChange('content', content)
                handleChange('wordCount', wordCount)
              }}
              placeholder="Start writing your chapter or use AI to generate content..."
              rows={8}
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none font-serif"
            />
            <p className="text-xs text-text-secondary mt-1">
              {formData.wordCount.toLocaleString()} words
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-border flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-elevated transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            {editChapter ? 'Save Changes' : 'Create Chapter'}
          </button>
        </div>
      </div>

      {/* AI Progress Modal */}
      <AIProgressModal
        isOpen={showAIProgress}
        onClose={handleCloseAIProgress}
        onCancel={cancel}
        status={aiStatus}
        progress={aiProgress}
        message={aiMessage}
        error={aiError}
        title="Generating Chapter Content"
      />
    </div>
  )
}
