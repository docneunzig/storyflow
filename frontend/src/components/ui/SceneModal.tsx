import { useState, useEffect, useCallback } from 'react'
import { X, Film } from 'lucide-react'
import type { Scene, ContentStatus, Character, WikiEntry, Chapter } from '@/types/project'
import { generateId } from '@/lib/db'

interface SceneModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (scene: Scene) => void
  editScene?: Scene | null
  characters?: Character[]
  locations?: WikiEntry[]
  chapters?: Chapter[]
}

const STATUSES: ContentStatus[] = ['outline', 'drafted', 'revised', 'locked']
const CONFLICT_TYPES = [
  'Person vs Person',
  'Person vs Self',
  'Person vs Nature',
  'Person vs Society',
  'Person vs Technology',
  'Person vs Supernatural',
]
const PACING_OPTIONS = ['Slow', 'Moderate', 'Fast', 'Intense']

function createEmptyScene(): Omit<Scene, 'id'> {
  return {
    title: '',
    chapterId: null,
    sequenceInChapter: 0,
    plotBeatId: null,
    locationId: null,
    timeInStory: '',
    weatherAtmosphere: '',
    povCharacterId: null,
    charactersPresent: [],
    summary: '',
    detailedOutline: '',
    openingHook: '',
    keyMoments: [],
    closingHook: '',
    sceneGoal: '',
    conflictType: '',
    conflictDescription: '',
    characterGoals: [],
    openingEmotion: '',
    closingEmotion: '',
    tone: '',
    estimatedWordCount: 2000,
    pacing: 'Moderate',
    setupFor: [],
    payoffFor: [],
    status: 'outline',
    userNotes: '',
  }
}

export function SceneModal({ isOpen, onClose, onSave, editScene, characters = [], locations = [], chapters = [] }: SceneModalProps) {
  const [formData, setFormData] = useState<Omit<Scene, 'id'>>(createEmptyScene())
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens/closes or editScene changes
  useEffect(() => {
    if (isOpen) {
      if (editScene) {
        const { id, ...rest } = editScene
        setFormData(rest)
      } else {
        setFormData(createEmptyScene())
      }
      setErrors({})
    }
  }, [isOpen, editScene])

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

    const scene: Scene = {
      id: editScene?.id || generateId(),
      ...formData,
      title: formData.title.trim(),
    }

    onSave(scene)
    onClose()
  }

  const handleChange = (field: keyof Omit<Scene, 'id'>, value: any) => {
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
      <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-2xl mx-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface flex items-center justify-between p-4 border-b border-border z-10">
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-text-primary">
              {editScene ? 'Edit Scene' : 'New Scene'}
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
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Basic Information */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-text-primary mb-1">
                  Title <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Scene title"
                  className={`w-full px-3 py-2 bg-surface-elevated border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent ${
                    errors.title ? 'border-error' : 'border-border'
                  }`}
                />
                {errors.title && (
                  <p className="text-xs text-error mt-1">{errors.title}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-text-primary mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value as ContentStatus)}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {STATUSES.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-primary mb-1">Pacing</label>
                <select
                  value={formData.pacing}
                  onChange={(e) => handleChange('pacing', e.target.value)}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {PACING_OPTIONS.map(pace => (
                    <option key={pace} value={pace}>{pace}</option>
                  ))}
                </select>
              </div>
            </div>
            {chapters.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm text-text-primary mb-1">Chapter</label>
                <select
                  value={formData.chapterId || ''}
                  onChange={(e) => handleChange('chapterId', e.target.value || null)}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">No chapter assigned</option>
                  {chapters.sort((a, b) => a.number - b.number).map(ch => (
                    <option key={ch.id} value={ch.id}>Chapter {ch.number}: {ch.title}</option>
                  ))}
                </select>
              </div>
            )}
          </section>

          {/* Setting */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Setting</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-primary mb-1">Time in Story</label>
                <input
                  type="text"
                  value={formData.timeInStory}
                  onChange={(e) => handleChange('timeInStory', e.target.value)}
                  placeholder="e.g., Morning of Day 3"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm text-text-primary mb-1">Weather/Atmosphere</label>
                <input
                  type="text"
                  value={formData.weatherAtmosphere}
                  onChange={(e) => handleChange('weatherAtmosphere', e.target.value)}
                  placeholder="e.g., Stormy night, tense"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            {locations.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm text-text-primary mb-1">Location</label>
                <select
                  value={formData.locationId || ''}
                  onChange={(e) => handleChange('locationId', e.target.value || null)}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select location...</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            )}
          </section>

          {/* POV Character */}
          {characters.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-text-secondary mb-3">Point of View</h3>
              <div>
                <label className="block text-sm text-text-primary mb-1">POV Character</label>
                <select
                  value={formData.povCharacterId || ''}
                  onChange={(e) => handleChange('povCharacterId', e.target.value || null)}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select POV character...</option>
                  {characters.map(char => (
                    <option key={char.id} value={char.id}>{char.name}</option>
                  ))}
                </select>
              </div>
            </section>
          )}

          {/* Summary */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Content</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-primary mb-1">Summary</label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => handleChange('summary', e.target.value)}
                  placeholder="Brief scene summary..."
                  rows={2}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-text-primary mb-1">Scene Goal</label>
                <input
                  type="text"
                  value={formData.sceneGoal}
                  onChange={(e) => handleChange('sceneGoal', e.target.value)}
                  placeholder="What should this scene accomplish?"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </section>

          {/* Conflict */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Conflict</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-primary mb-1">Conflict Type</label>
                <select
                  value={formData.conflictType}
                  onChange={(e) => handleChange('conflictType', e.target.value)}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select conflict type...</option>
                  {CONFLICT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-primary mb-1">Est. Word Count</label>
                <input
                  type="number"
                  value={formData.estimatedWordCount}
                  onChange={(e) => handleChange('estimatedWordCount', parseInt(e.target.value) || 0)}
                  min="0"
                  max="20000"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-text-primary mb-1">Conflict Description</label>
              <textarea
                value={formData.conflictDescription}
                onChange={(e) => handleChange('conflictDescription', e.target.value)}
                placeholder="Describe the conflict in this scene..."
                rows={2}
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>
          </section>

          {/* Emotional Arc */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Emotional Arc</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-primary mb-1">Opening Emotion</label>
                <input
                  type="text"
                  value={formData.openingEmotion}
                  onChange={(e) => handleChange('openingEmotion', e.target.value)}
                  placeholder="e.g., Anxious, Hopeful"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm text-text-primary mb-1">Closing Emotion</label>
                <input
                  type="text"
                  value={formData.closingEmotion}
                  onChange={(e) => handleChange('closingEmotion', e.target.value)}
                  placeholder="e.g., Relieved, Devastated"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-text-primary mb-1">Tone</label>
              <input
                type="text"
                value={formData.tone}
                onChange={(e) => handleChange('tone', e.target.value)}
                placeholder="e.g., Tense and suspenseful"
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </section>

          {/* Hooks */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Scene Hooks</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-primary mb-1">Opening Hook</label>
                <input
                  type="text"
                  value={formData.openingHook}
                  onChange={(e) => handleChange('openingHook', e.target.value)}
                  placeholder="What draws the reader in?"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm text-text-primary mb-1">Closing Hook</label>
                <input
                  type="text"
                  value={formData.closingHook}
                  onChange={(e) => handleChange('closingHook', e.target.value)}
                  placeholder="What keeps them reading?"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </section>

          {/* Notes */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Notes</h3>
            <textarea
              value={formData.userNotes}
              onChange={(e) => handleChange('userNotes', e.target.value)}
              placeholder="Any additional notes about this scene..."
              rows={2}
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </section>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 bg-surface p-4 border-t border-border flex gap-3 justify-end">
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
            {editScene ? 'Save Changes' : 'Create Scene'}
          </button>
        </div>
      </div>
    </div>
  )
}
