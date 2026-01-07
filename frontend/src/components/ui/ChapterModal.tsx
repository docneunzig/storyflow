import { useState, useEffect, useCallback } from 'react'
import { X, BookOpen } from 'lucide-react'
import type { Chapter, ChapterStatus } from '@/types/project'
import { generateId } from '@/lib/db'

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
    }
  }, [isOpen, editChapter, nextChapterNumber])

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
            <BookOpen className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-text-primary">
              {editChapter ? 'Edit Chapter' : 'New Chapter'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-primary mb-1">
                Chapter Number
              </label>
              <input
                type="number"
                value={formData.number}
                onChange={(e) => handleChange('number', parseInt(e.target.value) || 1)}
                min="1"
                max="999"
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm text-text-primary mb-1">Status</label>
              <select
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
            <label className="block text-sm text-text-primary mb-1">
              Title <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Chapter title"
              className={`w-full px-3 py-2 bg-surface-elevated border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent ${
                errors.title ? 'border-error' : 'border-border'
              }`}
            />
            {errors.title && (
              <p className="text-xs text-error mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-text-primary mb-1">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => {
                const content = e.target.value
                const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
                handleChange('content', content)
                handleChange('wordCount', wordCount)
              }}
              placeholder="Start writing your chapter..."
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
    </div>
  )
}
