import { useState, useEffect, useCallback, useMemo } from 'react'
import { X, User, AlertTriangle } from 'lucide-react'
import type { Character, CharacterRole, CharacterStatus } from '@/types/project'
import { generateId } from '@/lib/db'
import { toast } from '@/components/ui/Toaster'

interface CharacterModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (character: Character) => void
  editCharacter?: Character | null
}

interface UnsavedChangesDialogProps {
  isOpen: boolean
  onDiscard: () => void
  onCancel: () => void
}

const ROLES: CharacterRole[] = ['protagonist', 'antagonist', 'supporting', 'minor']
const STATUSES: CharacterStatus[] = ['alive', 'deceased', 'unknown']
// Archetype templates with suggested traits
const ARCHETYPE_TEMPLATES: Record<string, { strengths: string[]; flaws: string[]; desires: string[]; misbelief: string }> = {
  'Reluctant Hero': {
    strengths: ['Courage when pushed', 'Hidden capability', 'Moral compass'],
    flaws: ['Self-doubt', 'Avoidance', 'Fears responsibility'],
    desires: ['Peace', 'Normalcy', 'Safety'],
    misbelief: "I'm not the one who should save the day"
  },
  'Chosen One': {
    strengths: ['Unique abilities', 'Resilience', 'Inspires others'],
    flaws: ['Arrogance', 'Pressure-induced doubt', 'Isolation'],
    desires: ['To fulfill destiny', 'Acceptance', 'Proving worth'],
    misbelief: "My value is only in my destiny"
  },
  'Anti-Hero': {
    strengths: ['Pragmatism', 'Determination', 'Unconventional thinking'],
    flaws: ['Moral flexibility', 'Trust issues', 'Self-destructive'],
    desires: ['Redemption', 'Justice (their version)', 'Respect'],
    misbelief: "The ends justify the means"
  },
  'Mastermind': {
    strengths: ['Brilliant intellect', 'Strategic thinking', 'Patience'],
    flaws: ['Arrogance', 'Underestimating emotions', 'Isolation'],
    desires: ['Control', 'Recognition of genius', 'A worthy opponent'],
    misbelief: "Intelligence is the only true power"
  },
  'Wise Mentor': {
    strengths: ['Experience', 'Wisdom', 'Teaching ability'],
    flaws: ['Past failures', 'Over-protectiveness', 'Secrets'],
    desires: ['To pass on knowledge', 'To see protégé succeed', 'Redemption'],
    misbelief: "I must protect them from my mistakes"
  },
  'Loyal Sidekick': {
    strengths: ['Unwavering loyalty', 'Reliability', 'Support'],
    flaws: ['Lack of confidence', 'Dependency', 'Overlooked'],
    desires: ['Belonging', 'To prove worth', 'Recognition'],
    misbelief: "I'm only valuable in supporting others"
  },
  'Trickster': {
    strengths: ['Cunning', 'Adaptability', 'Humor'],
    flaws: ['Unreliable', 'Self-serving', 'Commitment-phobic'],
    desires: ['Freedom', 'Entertainment', 'To expose hypocrisy'],
    misbelief: "Life is a game, and I must win"
  },
  'Tragic Hero': {
    strengths: ['Noble qualities', 'Determination', 'Depth'],
    flaws: ['Fatal flaw', 'Blindness to fault', 'Hubris'],
    desires: ['Greatness', 'Recognition', 'Love'],
    misbelief: "I can overcome fate through sheer will"
  },
  'Morally Gray': {
    strengths: ['Complex reasoning', 'Adaptability', 'Unpredictability'],
    flaws: ['Unreliable morality', 'Self-interest', 'Trust issues'],
    desires: ['Survival', 'Their own code of justice', 'Balance'],
    misbelief: "There is no true good or evil, only survival"
  },
}

const ARCHETYPES = [
  'Reluctant Hero',
  'Chosen One',
  'Anti-Hero',
  'Everyman',
  'Knight in Shining Armor',
  'Mastermind',
  'Fallen Angel',
  'Force of Nature',
  'Mirror Image',
  'Sympathetic Antagonist',
  'Wise Mentor',
  'Loyal Sidekick',
  'Trickster',
  'Love Interest',
  'Threshold Guardian',
  'Tragic Hero',
  'Reformed Villain',
  'Double Agent',
  'Morally Gray',
]

function createEmptyCharacter(): Omit<Character, 'id'> {
  return {
    name: '',
    aliases: [],
    role: 'supporting',
    archetype: '',
    age: null,
    gender: '',
    physicalDescription: '',
    distinguishingFeatures: [],
    personalitySummary: '',
    strengths: [],
    flaws: [],
    fears: [],
    desires: [],
    needs: [],
    misbelief: '',
    backstory: '',
    formativeExperiences: [],
    secrets: [],
    speechPatterns: '',
    vocabularyLevel: '',
    catchphrases: [],
    internalVoice: '',
    characterArc: '',
    arcCatalyst: '',
    firstAppearance: null,
    scenesPresent: [],
    status: 'alive',
    userNotes: '',
  }
}

// Unsaved Changes Dialog Component
function UnsavedChangesDialog({ isOpen, onDiscard, onCancel }: UnsavedChangesDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-popover flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-text-primary mb-2">Unsaved Changes</h3>
            <p className="text-text-secondary text-sm">
              You have unsaved changes. Are you sure you want to discard them?
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-elevated transition-colors"
          >
            Keep Editing
          </button>
          <button
            onClick={onDiscard}
            className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors"
          >
            Discard Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export function CharacterModal({ isOpen, onClose, onSave, editCharacter }: CharacterModalProps) {
  const [formData, setFormData] = useState<Omit<Character, 'id'>>(createEmptyCharacter())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [initialFormData, setInitialFormData] = useState<Omit<Character, 'id'>>(createEmptyCharacter())
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)

  // Check if form has been modified (dirty state)
  const isDirty = useMemo(() => {
    // Compare current form data with initial data
    const currentName = formData.name.trim()
    const initialName = initialFormData.name.trim()

    // Check simple string/number fields that users commonly edit
    if (currentName !== initialName) return true
    if (formData.role !== initialFormData.role) return true
    if (formData.archetype !== initialFormData.archetype) return true
    if (formData.status !== initialFormData.status) return true
    if (formData.age !== initialFormData.age) return true
    if (formData.gender !== initialFormData.gender) return true
    if (formData.physicalDescription !== initialFormData.physicalDescription) return true
    if (formData.personalitySummary !== initialFormData.personalitySummary) return true
    if (formData.misbelief !== initialFormData.misbelief) return true
    if (formData.backstory !== initialFormData.backstory) return true
    if (formData.characterArc !== initialFormData.characterArc) return true
    if (formData.arcCatalyst !== initialFormData.arcCatalyst) return true
    if (formData.vocabularyLevel !== initialFormData.vocabularyLevel) return true
    if (formData.userNotes !== initialFormData.userNotes) return true

    return false
  }, [formData, initialFormData])

  // Reset form when modal opens/closes or editCharacter changes
  useEffect(() => {
    if (isOpen) {
      let newFormData: Omit<Character, 'id'>
      if (editCharacter) {
        const { id, ...rest } = editCharacter
        // Ensure all array fields have fallbacks to prevent undefined.join() errors
        newFormData = {
          ...rest,
          aliases: rest.aliases || [],
          distinguishingFeatures: rest.distinguishingFeatures || [],
          strengths: rest.strengths || [],
          flaws: rest.flaws || [],
          fears: rest.fears || [],
          desires: rest.desires || [],
          needs: rest.needs || [],
          formativeExperiences: rest.formativeExperiences || [],
          secrets: rest.secrets || [],
          catchphrases: rest.catchphrases || [],
          scenesPresent: rest.scenesPresent || [],
        }
      } else {
        newFormData = createEmptyCharacter()
      }
      setFormData(newFormData)
      setInitialFormData(newFormData)
      setErrors({})
      setShowUnsavedDialog(false)
    }
  }, [isOpen, editCharacter])

  // Handle attempting to close the modal
  const handleAttemptClose = useCallback(() => {
    if (isDirty) {
      setShowUnsavedDialog(true)
    } else {
      onClose()
    }
  }, [isDirty, onClose])

  // Handle discard changes
  const handleDiscardChanges = useCallback(() => {
    setShowUnsavedDialog(false)
    onClose()
  }, [onClose])

  // Handle cancel discard (keep editing)
  const handleCancelDiscard = useCallback(() => {
    setShowUnsavedDialog(false)
  }, [])

  // Handle Escape key to close
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Don't close via Escape if unsaved dialog is showing
      if (!showUnsavedDialog) {
        handleAttemptClose()
      }
    }
  }, [handleAttemptClose, showUnsavedDialog])

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

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Name must be 100 characters or less'
    }

    // Age validation
    if (formData.age !== null) {
      if (formData.age < 0) {
        newErrors.age = 'Age cannot be negative'
      } else if (formData.age > 999) {
        newErrors.age = 'Age must be 999 or less'
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast({
        title: 'Please fix validation errors',
        variant: 'error',
      })
      return
    }

    const character: Character = {
      id: editCharacter?.id || generateId(),
      ...formData,
      name: formData.name.trim(),
    }

    onSave(character)
    toast({
      title: editCharacter ? 'Character updated' : 'Character created',
      variant: 'success',
    })
    onClose()
  }

  const handleChange = (field: keyof Omit<Character, 'id'>, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Apply archetype template when archetype is selected
    if (field === 'archetype' && value in ARCHETYPE_TEMPLATES) {
      const template = ARCHETYPE_TEMPLATES[value]
      setFormData(prev => ({
        ...prev,
        archetype: value,
        // Only apply template values if current values are empty
        strengths: prev.strengths.length === 0 ? template.strengths : prev.strengths,
        flaws: prev.flaws.length === 0 ? template.flaws : prev.flaws,
        desires: prev.desires.length === 0 ? template.desires : prev.desires,
        misbelief: prev.misbelief === '' ? template.misbelief : prev.misbelief,
      }))
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleAttemptClose}
        />

        {/* Modal */}
        <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-2xl mx-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-surface flex items-center justify-between p-4 border-b border-border z-10">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-accent" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-text-primary">
                {editCharacter ? 'Edit Character' : 'New Character'}
              </h2>
            </div>
            <button
              onClick={handleAttemptClose}
              className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-text-secondary" aria-hidden="true" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Basic Information / Identity */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="character-name" className="block text-sm text-text-primary mb-1">
                  Name <span className="text-error">*</span>
                </label>
                <input
                  id="character-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Character name"
                  aria-invalid={errors.name ? 'true' : undefined}
                  aria-describedby={errors.name ? 'character-name-error' : undefined}
                  className={`w-full px-3 py-2 bg-surface-elevated border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent ${
                    errors.name ? 'border-error' : 'border-border'
                  }`}
                />
                {errors.name && (
                  <p id="character-name-error" className="text-xs text-error mt-1" role="alert">{errors.name}</p>
                )}
              </div>
              <div>
                <label htmlFor="character-aliases" className="block text-sm text-text-primary mb-1">Aliases</label>
                <input
                  id="character-aliases"
                  type="text"
                  value={formData.aliases.join(', ')}
                  onChange={(e) => handleChange('aliases', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="Nicknames, titles (comma-separated)"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label htmlFor="character-role" className="block text-sm text-text-primary mb-1">Role</label>
                <select
                  id="character-role"
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value as CharacterRole)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                >
                  {ROLES.map(role => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="character-archetype" className="block text-sm text-text-primary mb-1">Archetype</label>
                <select
                  id="character-archetype"
                  value={formData.archetype}
                  onChange={(e) => handleChange('archetype', e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                >
                  <option value="">Select an archetype...</option>
                  {ARCHETYPES.map(arch => (
                    <option key={arch} value={arch}>{arch}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="character-status" className="block text-sm text-text-primary mb-1">Status</label>
                <select
                  id="character-status"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value as CharacterStatus)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                >
                  {STATUSES.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Physical Attributes */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Physical Attributes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="character-age" className="block text-sm text-text-primary mb-1">Age</label>
                <input
                  id="character-age"
                  type="number"
                  value={formData.age || ''}
                  onChange={(e) => handleChange('age', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Age"
                  min="0"
                  max="999"
                  aria-invalid={errors.age ? 'true' : undefined}
                  aria-describedby={errors.age ? 'character-age-error' : undefined}
                  className={`w-full px-3 py-2 bg-surface-elevated border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent ${
                    errors.age ? 'border-error' : 'border-border'
                  }`}
                />
                {errors.age && (
                  <p id="character-age-error" className="text-xs text-error mt-1" role="alert">{errors.age}</p>
                )}
              </div>
              <div>
                <label htmlFor="character-gender" className="block text-sm text-text-primary mb-1">Gender</label>
                <input
                  id="character-gender"
                  type="text"
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  placeholder="e.g., Female, Male, Non-binary"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="md:col-span-1">
                <label htmlFor="character-vocabulary" className="block text-sm text-text-primary mb-1">Vocabulary Level</label>
                <input
                  id="character-vocabulary"
                  type="text"
                  value={formData.vocabularyLevel}
                  onChange={(e) => handleChange('vocabularyLevel', e.target.value)}
                  placeholder="e.g., Academic, Street-smart"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="character-physical-description" className="block text-sm text-text-primary mb-1">Physical Description</label>
              <textarea
                id="character-physical-description"
                value={formData.physicalDescription}
                onChange={(e) => handleChange('physicalDescription', e.target.value)}
                placeholder="Describe the character's appearance..."
                rows={2}
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>
            <div className="mt-4">
              <label htmlFor="character-features" className="block text-sm text-text-primary mb-1">Distinguishing Features</label>
              <input
                id="character-features"
                type="text"
                value={formData.distinguishingFeatures.join(', ')}
                onChange={(e) => handleChange('distinguishingFeatures', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="Scars, tattoos, unique traits (comma-separated)"
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </section>

          {/* Psychology */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Psychology</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="character-personality" className="block text-sm text-text-primary mb-1">Personality Summary</label>
                <textarea
                  id="character-personality"
                  value={formData.personalitySummary}
                  onChange={(e) => handleChange('personalitySummary', e.target.value)}
                  placeholder="Brief personality overview..."
                  rows={2}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="character-strengths" className="block text-sm text-text-primary mb-1">Strengths</label>
                  <input
                    id="character-strengths"
                    type="text"
                    value={formData.strengths.join(', ')}
                    onChange={(e) => handleChange('strengths', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder="Brave, intelligent (comma-separated)"
                    className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label htmlFor="character-flaws" className="block text-sm text-text-primary mb-1">Flaws</label>
                  <input
                    id="character-flaws"
                    type="text"
                    value={formData.flaws.join(', ')}
                    onChange={(e) => handleChange('flaws', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder="Stubborn, impulsive (comma-separated)"
                    className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label htmlFor="character-fears" className="block text-sm text-text-primary mb-1">Fears</label>
                  <input
                    id="character-fears"
                    type="text"
                    value={formData.fears.join(', ')}
                    onChange={(e) => handleChange('fears', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder="Abandonment, failure (comma-separated)"
                    className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="character-misbelief" className="block text-sm text-text-primary mb-1">Misbelief (the lie they believe)</label>
                <input
                  id="character-misbelief"
                  type="text"
                  value={formData.misbelief}
                  onChange={(e) => handleChange('misbelief', e.target.value)}
                  placeholder="e.g., 'I'm not worthy of love'"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </section>

          {/* Desires & Needs */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Desires & Needs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="character-desires" className="block text-sm text-text-primary mb-1">Desires (wants)</label>
                <input
                  id="character-desires"
                  type="text"
                  value={formData.desires.join(', ')}
                  onChange={(e) => handleChange('desires', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="External goals (comma-separated)"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label htmlFor="character-needs" className="block text-sm text-text-primary mb-1">Needs (internal)</label>
                <input
                  id="character-needs"
                  type="text"
                  value={formData.needs.join(', ')}
                  onChange={(e) => handleChange('needs', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  placeholder="Internal needs (comma-separated)"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </section>

          {/* Background */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Background</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="character-backstory" className="block text-sm text-text-primary mb-1">Backstory</label>
                <textarea
                  id="character-backstory"
                  value={formData.backstory}
                  onChange={(e) => handleChange('backstory', e.target.value)}
                  placeholder="Character's history and background..."
                  rows={3}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="character-experiences" className="block text-sm text-text-primary mb-1">Formative Experiences</label>
                  <input
                    id="character-experiences"
                    type="text"
                    value={formData.formativeExperiences.join(', ')}
                    onChange={(e) => handleChange('formativeExperiences', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder="Key life events (comma-separated)"
                    className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label htmlFor="character-secrets" className="block text-sm text-text-primary mb-1">Secrets</label>
                  <input
                    id="character-secrets"
                    type="text"
                    value={formData.secrets.join(', ')}
                    onChange={(e) => handleChange('secrets', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder="Hidden truths (comma-separated)"
                    className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Voice */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Voice</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="character-speech-patterns" className="block text-sm text-text-primary mb-1">Speech Patterns</label>
                  <input
                    id="character-speech-patterns"
                    type="text"
                    value={formData.speechPatterns}
                    onChange={(e) => handleChange('speechPatterns', e.target.value)}
                    placeholder="e.g., Formal, uses slang, stutters"
                    className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label htmlFor="character-catchphrases" className="block text-sm text-text-primary mb-1">Catchphrases</label>
                  <input
                    id="character-catchphrases"
                    type="text"
                    value={formData.catchphrases.join(', ')}
                    onChange={(e) => handleChange('catchphrases', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder="Signature phrases (comma-separated)"
                    className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="character-internal-voice" className="block text-sm text-text-primary mb-1">Internal Voice</label>
                <textarea
                  id="character-internal-voice"
                  value={formData.internalVoice}
                  onChange={(e) => handleChange('internalVoice', e.target.value)}
                  placeholder="How they think, their inner monologue style..."
                  rows={2}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>
            </div>
          </section>

          {/* Character Arc */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Character Arc</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="character-arc" className="block text-sm text-text-primary mb-1">Arc Description</label>
                <input
                  id="character-arc"
                  type="text"
                  value={formData.characterArc}
                  onChange={(e) => handleChange('characterArc', e.target.value)}
                  placeholder="e.g., From coward to hero"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label htmlFor="character-catalyst" className="block text-sm text-text-primary mb-1">Arc Catalyst</label>
                <input
                  id="character-catalyst"
                  type="text"
                  value={formData.arcCatalyst}
                  onChange={(e) => handleChange('arcCatalyst', e.target.value)}
                  placeholder="What triggers their transformation?"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </section>

          {/* Notes */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Notes</h3>
            <label htmlFor="character-notes" className="sr-only">Additional Notes</label>
            <textarea
              id="character-notes"
              value={formData.userNotes}
              onChange={(e) => handleChange('userNotes', e.target.value)}
              placeholder="Any additional notes about this character..."
              rows={2}
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </section>
          </form>

          {/* Footer */}
          <div className="sticky bottom-0 bg-surface p-4 border-t border-border flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleAttemptClose}
              className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              {editCharacter ? 'Save Changes' : 'Create Character'}
            </button>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={showUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={handleCancelDiscard}
      />
    </>
  )
}
