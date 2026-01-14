import { useState, useEffect, useCallback } from 'react'
import { X, Film, Link2, ArrowRight, ArrowLeft, Sparkles, Loader2 } from 'lucide-react'
import type { Scene, ContentStatus, Character, WikiEntry, Chapter, PlotBeat, Project } from '@/types/project'
import { generateId } from '@/lib/db'
import { toast } from '@/components/ui/Toaster'
import { useAIGeneration } from '@/hooks/useAIGeneration'

interface SceneModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (scene: Scene) => void
  editScene?: Scene | null
  characters?: Character[]
  locations?: WikiEntry[]
  chapters?: Chapter[]
  plotBeats?: PlotBeat[]
  allScenes?: Scene[]
  project?: Project | null
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

export function SceneModal({ isOpen, onClose, onSave, editScene, characters = [], locations = [], chapters = [], plotBeats = [], allScenes = [], project }: SceneModalProps) {
  const [formData, setFormData] = useState<Omit<Scene, 'id'>>(createEmptyScene())
  const [errors, setErrors] = useState<Record<string, string>>({})

  // AI generation hook
  const { isGenerating, generate } = useAIGeneration()

  // Generate scene blueprint with AI
  const handleGenerateWithAI = useCallback(async () => {
    const result = await generate({
      agentTarget: 'scene',
      action: 'generate-scene',
      context: {
        specification: project?.specification,
        characters: (characters || []).map(c => ({
          id: c.id,
          name: c.name,
        })),
      },
    })

    if (result) {
      try {
        const parsed = JSON.parse(result)
        // Populate form with generated scene blueprint
        setFormData(prev => ({
          ...prev,
          title: parsed.title || prev.title,
          timeInStory: parsed.timeInStory || prev.timeInStory,
          weatherAtmosphere: parsed.weatherAtmosphere || prev.weatherAtmosphere,
          summary: parsed.summary || prev.summary,
          sceneGoal: parsed.sceneGoal || prev.sceneGoal,
          conflictType: parsed.conflictType || prev.conflictType,
          conflictDescription: parsed.conflictDescription || prev.conflictDescription,
          openingEmotion: parsed.openingEmotion || prev.openingEmotion,
          closingEmotion: parsed.closingEmotion || prev.closingEmotion,
          tone: parsed.tone || prev.tone,
          openingHook: parsed.openingHook || prev.openingHook,
          closingHook: parsed.closingHook || prev.closingHook,
          pacing: parsed.pacing || prev.pacing,
          estimatedWordCount: parsed.estimatedWordCount || prev.estimatedWordCount,
          status: parsed.status || prev.status,
        }))
        toast({ title: 'Scene blueprint generated with AI', variant: 'success' })
      } catch {
        toast({ title: 'Failed to parse AI response', variant: 'error' })
      }
    }
  }, [generate, project, characters])

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
      toast({
        title: 'Please fix validation errors',
        variant: 'error',
      })
      return
    }

    const scene: Scene = {
      id: editScene?.id || generateId(),
      ...formData,
      title: formData.title.trim(),
    }

    onSave(scene)
    toast({
      title: editScene ? 'Scene updated' : 'Scene created',
      variant: 'success',
    })
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
            <Film className="h-5 w-5 text-accent" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-text-primary">
              {editScene ? 'Edit Scene' : 'New Scene'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {!editScene && (
              <button
                type="button"
                onClick={handleGenerateWithAI}
                disabled={isGenerating}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-accent/10 text-accent border border-accent/30 rounded-lg hover:bg-accent/20 transition-colors disabled:opacity-50"
                title="Generate scene blueprint with AI"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{isGenerating ? 'Generating...' : 'Generate with AI'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-text-secondary" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Basic Information */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="scene-title" className="block text-sm text-text-primary mb-1">
                  Title <span className="text-error">*</span>
                </label>
                <input
                  id="scene-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Scene title"
                  aria-invalid={errors.title ? 'true' : undefined}
                  aria-describedby={errors.title ? 'scene-title-error' : undefined}
                  className={`w-full px-3 py-2 bg-surface-elevated border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent ${
                    errors.title ? 'border-error' : 'border-border'
                  }`}
                />
                {errors.title && (
                  <p id="scene-title-error" className="text-xs text-error mt-1" role="alert">{errors.title}</p>
                )}
              </div>
              <div>
                <label htmlFor="scene-status" className="block text-sm text-text-primary mb-1">Status</label>
                <select
                  id="scene-status"
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
                <label htmlFor="scene-pacing" className="block text-sm text-text-primary mb-1">Pacing</label>
                <select
                  id="scene-pacing"
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
                <label htmlFor="scene-chapter" className="block text-sm text-text-primary mb-1">Chapter</label>
                <select
                  id="scene-chapter"
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
            {plotBeats.length > 0 && (
              <div className="mt-4">
                <label htmlFor="scene-plot-beat" className="block text-sm text-text-primary mb-1">Linked Plot Beat</label>
                <select
                  id="scene-plot-beat"
                  value={formData.plotBeatId || ''}
                  onChange={(e) => handleChange('plotBeatId', e.target.value || null)}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">No plot beat linked</option>
                  {plotBeats.sort((a, b) => a.timelinePosition - b.timelinePosition).map(beat => (
                    <option key={beat.id} value={beat.id}>{beat.frameworkPosition}: {beat.title}</option>
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
                <label htmlFor="scene-time" className="block text-sm text-text-primary mb-1">Time in Story</label>
                <input
                  id="scene-time"
                  type="text"
                  value={formData.timeInStory}
                  onChange={(e) => handleChange('timeInStory', e.target.value)}
                  placeholder="e.g., Morning of Day 3"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label htmlFor="scene-weather" className="block text-sm text-text-primary mb-1">Weather/Atmosphere</label>
                <input
                  id="scene-weather"
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
                <label htmlFor="scene-location" className="block text-sm text-text-primary mb-1">Location</label>
                <select
                  id="scene-location"
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

          {/* Characters */}
          {characters.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-text-secondary mb-3">Characters</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="scene-pov" className="block text-sm text-text-primary mb-1">POV Character</label>
                  <select
                    id="scene-pov"
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
                <div>
                  <label className="block text-sm text-text-primary mb-2">Other Characters Present</label>
                  <p className="text-xs text-text-secondary mb-2">
                    Select additional characters who appear in this scene (besides the POV character).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {characters
                      .filter(char => char.id !== formData.povCharacterId)
                      .map(char => {
                        const isPresent = formData.charactersPresent?.includes(char.id) || false
                        return (
                          <button
                            key={char.id}
                            type="button"
                            onClick={() => {
                              const currentPresent = formData.charactersPresent || []
                              const newPresent = isPresent
                                ? currentPresent.filter(id => id !== char.id)
                                : [...currentPresent, char.id]
                              handleChange('charactersPresent', newPresent)
                            }}
                            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                              isPresent
                                ? 'bg-accent/20 border-accent text-accent'
                                : 'bg-surface-elevated border-border text-text-secondary hover:border-accent/50'
                            }`}
                          >
                            {char.name}
                          </button>
                        )
                      })}
                  </div>
                  {characters.filter(char => char.id !== formData.povCharacterId).length === 0 && (
                    <p className="text-xs text-text-secondary italic">
                      {formData.povCharacterId
                        ? 'No other characters available. Create more characters to add them to scenes.'
                        : 'Select a POV character first to see other available characters.'}
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Summary */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Content</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="scene-summary" className="block text-sm text-text-primary mb-1">Summary</label>
                <textarea
                  id="scene-summary"
                  value={formData.summary}
                  onChange={(e) => handleChange('summary', e.target.value)}
                  placeholder="Brief scene summary..."
                  rows={2}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>
              <div>
                <label htmlFor="scene-goal" className="block text-sm text-text-primary mb-1">Scene Goal</label>
                <input
                  id="scene-goal"
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
                <label htmlFor="scene-conflict-type" className="block text-sm text-text-primary mb-1">Conflict Type</label>
                <select
                  id="scene-conflict-type"
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
                <label htmlFor="scene-word-count" className="block text-sm text-text-primary mb-1">Est. Word Count</label>
                <input
                  id="scene-word-count"
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
              <label htmlFor="scene-conflict-desc" className="block text-sm text-text-primary mb-1">Conflict Description</label>
              <textarea
                id="scene-conflict-desc"
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
                <label htmlFor="scene-opening-emotion" className="block text-sm text-text-primary mb-1">Opening Emotion</label>
                <input
                  id="scene-opening-emotion"
                  type="text"
                  value={formData.openingEmotion}
                  onChange={(e) => handleChange('openingEmotion', e.target.value)}
                  placeholder="e.g., Anxious, Hopeful"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label htmlFor="scene-closing-emotion" className="block text-sm text-text-primary mb-1">Closing Emotion</label>
                <input
                  id="scene-closing-emotion"
                  type="text"
                  value={formData.closingEmotion}
                  onChange={(e) => handleChange('closingEmotion', e.target.value)}
                  placeholder="e.g., Relieved, Devastated"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="scene-tone" className="block text-sm text-text-primary mb-1">Tone</label>
              <input
                id="scene-tone"
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
                <label htmlFor="scene-opening-hook" className="block text-sm text-text-primary mb-1">Opening Hook</label>
                <input
                  id="scene-opening-hook"
                  type="text"
                  value={formData.openingHook}
                  onChange={(e) => handleChange('openingHook', e.target.value)}
                  placeholder="What draws the reader in?"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label htmlFor="scene-closing-hook" className="block text-sm text-text-primary mb-1">Closing Hook</label>
                <input
                  id="scene-closing-hook"
                  type="text"
                  value={formData.closingHook}
                  onChange={(e) => handleChange('closingHook', e.target.value)}
                  placeholder="What keeps them reading?"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </section>

          {/* Scene Connections - Setup & Payoff */}
          {allScenes.length > 0 && (
            <section>
              <h3 className="text-sm font-medium text-text-secondary mb-3">
                <span className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" aria-hidden="true" />
                  Scene Connections
                </span>
              </h3>
              <p className="text-xs text-text-secondary mb-4">
                Link scenes together to track setup and payoff relationships. A "setup" plants information that will pay off later; a "payoff" delivers on earlier setups.
              </p>

              {/* This scene is a SETUP for... */}
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm text-text-primary mb-2">
                  <ArrowRight className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                  This scene sets up payoffs in:
                </label>
                <div className="flex flex-wrap gap-2">
                  {allScenes
                    .filter(scene => scene.id !== editScene?.id)
                    .map(scene => {
                      const isSelected = formData.setupFor?.includes(scene.id) || false
                      return (
                        <button
                          key={scene.id}
                          type="button"
                          onClick={() => {
                            const current = formData.setupFor || []
                            const updated = isSelected
                              ? current.filter(id => id !== scene.id)
                              : [...current, scene.id]
                            handleChange('setupFor', updated)
                          }}
                          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                            isSelected
                              ? 'bg-success/20 border-success text-success'
                              : 'bg-surface-elevated border-border text-text-secondary hover:border-success/50'
                          }`}
                        >
                          {scene.title}
                        </button>
                      )
                    })}
                </div>
                {allScenes.filter(scene => scene.id !== editScene?.id).length === 0 && (
                  <p className="text-xs text-text-secondary italic">
                    Create more scenes to link setup/payoff relationships.
                  </p>
                )}
              </div>

              {/* This scene is a PAYOFF for... */}
              <div>
                <label className="flex items-center gap-2 text-sm text-text-primary mb-2">
                  <ArrowLeft className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
                  This scene pays off setups from:
                </label>
                <div className="flex flex-wrap gap-2">
                  {allScenes
                    .filter(scene => scene.id !== editScene?.id)
                    .map(scene => {
                      const isSelected = formData.payoffFor?.includes(scene.id) || false
                      return (
                        <button
                          key={scene.id}
                          type="button"
                          onClick={() => {
                            const current = formData.payoffFor || []
                            const updated = isSelected
                              ? current.filter(id => id !== scene.id)
                              : [...current, scene.id]
                            handleChange('payoffFor', updated)
                          }}
                          className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                            isSelected
                              ? 'bg-warning/20 border-warning text-warning'
                              : 'bg-surface-elevated border-border text-text-secondary hover:border-warning/50'
                          }`}
                        >
                          {scene.title}
                        </button>
                      )
                    })}
                </div>
                {allScenes.filter(scene => scene.id !== editScene?.id).length === 0 && (
                  <p className="text-xs text-text-secondary italic">
                    Create more scenes to link setup/payoff relationships.
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Notes */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Notes</h3>
            <label htmlFor="scene-notes" className="sr-only">Additional Notes</label>
            <textarea
              id="scene-notes"
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
