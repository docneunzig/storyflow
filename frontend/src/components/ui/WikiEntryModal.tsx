import { useState, useEffect } from 'react'
import { X, BookOpen, Plus, FileText, Link2 } from 'lucide-react'
import type { WikiEntry, WikiCategory, Chapter } from '@/types/project'
import { generateId } from '@/lib/db'

interface WikiEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (entry: WikiEntry) => void
  editEntry?: WikiEntry | null
  preselectedCategory?: WikiCategory
  chapters?: Chapter[]
  wikiEntries?: WikiEntry[]
}

const WIKI_CATEGORIES: { value: WikiCategory; label: string; description: string }[] = [
  { value: 'locations', label: 'Locations', description: 'Places in your story' },
  { value: 'characters', label: 'Characters', description: 'Character profiles' },
  { value: 'timeline', label: 'Timeline', description: 'Historical events' },
  { value: 'magicTechnology', label: 'Magic/Technology', description: 'Systems and tech' },
  { value: 'culturesFactions', label: 'Cultures/Factions', description: 'Groups and societies' },
  { value: 'objects', label: 'Objects', description: 'Important items' },
  { value: 'terminology', label: 'Terminology', description: 'World-specific terms' },
  { value: 'rules', label: 'Rules', description: 'World rules and constraints' },
]

export function WikiEntryModal({
  isOpen,
  onClose,
  onSave,
  editEntry,
  preselectedCategory,
  chapters = [],
  wikiEntries = [],
}: WikiEntryModalProps) {
  const [category, setCategory] = useState<WikiCategory>('locations')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [sourceChapters, setSourceChapters] = useState<string[]>([])
  const [relatedEntries, setRelatedEntries] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      if (editEntry) {
        setCategory(editEntry.category)
        setName(editEntry.name)
        setDescription(editEntry.description)
        setTags(editEntry.tags)
        setSourceChapters(editEntry.sourceChapters || [])
        setRelatedEntries(editEntry.relatedEntries || [])
      } else {
        setCategory(preselectedCategory || 'locations')
        setName('')
        setDescription('')
        setTags([])
        setSourceChapters([])
        setRelatedEntries([])
      }
      setTagInput('')
    }
  }, [isOpen, editEntry, preselectedCategory])

  // Filter out the current entry from available entries for linking
  const availableRelatedEntries = wikiEntries.filter(e => e.id !== editEntry?.id)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !description.trim()) return

    const entry: WikiEntry = {
      id: editEntry?.id || generateId(),
      category,
      name: name.trim(),
      description: description.trim(),
      relatedEntries,
      sourceChapters,
      tags,
    }

    onSave(entry)
    onClose()
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-accent" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-text-primary">
              {editEntry ? 'Edit Wiki Entry' : 'New Wiki Entry'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-elevated transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-text-secondary" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Category */}
          <div>
            <span id="wiki-category-label" className="block text-sm font-medium text-text-primary mb-2">
              Category *
            </span>
            <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="wiki-category-label">
              {WIKI_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  aria-pressed={category === cat.value}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    category === cat.value
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:border-accent/50'
                  }`}
                >
                  <div className="font-medium text-text-primary text-sm">{cat.label}</div>
                  <div className="text-xs text-text-secondary">{cat.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="wiki-name" className="block text-sm font-medium text-text-primary mb-1">
              Name *
            </label>
            <input
              id="wiki-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., The Crystal Tower"
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="wiki-description" className="block text-sm font-medium text-text-primary mb-1">
              Description *
            </label>
            <textarea
              id="wiki-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe this entry in detail..."
              rows={4}
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="wiki-tag-input" className="block text-sm font-medium text-text-primary mb-1">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                id="wiki-tag-input"
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add a tag..."
                className="flex-1 px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                aria-label="Add tag"
                className="px-3 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-accent/20 text-accent text-sm rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      aria-label={`Remove ${tag} tag`}
                      className="hover:text-error transition-colors"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Source Chapters */}
          {chapters.length > 0 && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
                <FileText className="h-4 w-4 text-text-secondary" aria-hidden="true" />
                Source Chapters
              </label>
              <p className="text-xs text-text-secondary mb-2">
                Select chapters where this information is introduced or referenced.
              </p>
              <div className="flex flex-wrap gap-2">
                {chapters
                  .sort((a, b) => a.number - b.number)
                  .map(chapter => {
                    const isSelected = sourceChapters.includes(chapter.id)
                    return (
                      <button
                        key={chapter.id}
                        type="button"
                        onClick={() => {
                          setSourceChapters(prev =>
                            isSelected
                              ? prev.filter(id => id !== chapter.id)
                              : [...prev, chapter.id]
                          )
                        }}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-success/20 border-success text-success'
                            : 'bg-surface-elevated border-border text-text-secondary hover:border-success/50'
                        }`}
                      >
                        Ch. {chapter.number}: {chapter.title}
                      </button>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Related Entries */}
          {availableRelatedEntries.length > 0 && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-2">
                <Link2 className="h-4 w-4 text-text-secondary" aria-hidden="true" />
                Related Wiki Entries
              </label>
              <p className="text-xs text-text-secondary mb-2">
                Link this entry to other wiki entries that are related.
              </p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {availableRelatedEntries.map(entry => {
                  const isSelected = relatedEntries.includes(entry.id)
                  const categoryLabel = WIKI_CATEGORIES.find(c => c.value === entry.category)?.label || entry.category
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => {
                        setRelatedEntries(prev =>
                          isSelected
                            ? prev.filter(id => id !== entry.id)
                            : [...prev, entry.id]
                        )
                      }}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        isSelected
                          ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                          : 'bg-surface-elevated border-border text-text-secondary hover:border-purple-500/50'
                      }`}
                    >
                      {entry.name} <span className="text-xs opacity-60">({categoryLabel})</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !description.trim()}
              className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editEntry ? 'Save Changes' : 'Create Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
