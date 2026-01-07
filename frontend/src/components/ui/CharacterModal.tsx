import { useState, useEffect, useCallback } from 'react'
import { X, User } from 'lucide-react'
import type { Character, CharacterRole, CharacterStatus } from '@/types/project'
import { generateId } from '@/lib/db'

interface CharacterModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (character: Character) => void
  editCharacter?: Character | null
}

const ROLES: CharacterRole[] = ['protagonist', 'antagonist', 'supporting', 'minor']
const STATUSES: CharacterStatus[] = ['alive', 'deceased', 'unknown']
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

export function CharacterModal({ isOpen, onClose, onSave, editCharacter }: CharacterModalProps) {
  const [formData, setFormData] = useState<Omit<Character, 'id'>>(createEmptyCharacter())
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens/closes or editCharacter changes
  useEffect(() => {
    if (isOpen) {
      if (editCharacter) {
        const { id, ...rest } = editCharacter
        setFormData(rest)
      } else {
        setFormData(createEmptyCharacter())
      }
      setErrors({})
    }
  }, [isOpen, editCharacter])

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

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
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
      return
    }

    const character: Character = {
      id: editCharacter?.id || generateId(),
      ...formData,
      name: formData.name.trim(),
    }

    onSave(character)
    onClose()
  }

  const handleChange = (field: keyof Omit<Character, 'id'>, value: any) => {
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
            <User className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-semibold text-text-primary">
              {editCharacter ? 'Edit Character' : 'New Character'}
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
              <div>
                <label className="block text-sm text-text-primary mb-1">
                  Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Character name"
                  className={`w-full px-3 py-2 bg-surface-elevated border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent ${
                    errors.name ? 'border-error' : 'border-border'
                  }`}
                />
                {errors.name && (
                  <p className="text-xs text-error mt-1">{errors.name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-text-primary mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value as CharacterRole)}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {ROLES.map(role => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-primary mb-1">Archetype</label>
                <select
                  value={formData.archetype}
                  onChange={(e) => handleChange('archetype', e.target.value)}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Select an archetype...</option>
                  {ARCHETYPES.map(arch => (
                    <option key={arch} value={arch}>{arch}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-primary mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value as CharacterStatus)}
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
          </section>

          {/* Physical Attributes */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Physical Attributes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-text-primary mb-1">Age</label>
                <input
                  type="number"
                  value={formData.age || ''}
                  onChange={(e) => handleChange('age', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Age"
                  min="0"
                  max="999"
                  className={`w-full px-3 py-2 bg-surface-elevated border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent ${
                    errors.age ? 'border-error' : 'border-border'
                  }`}
                />
                {errors.age && (
                  <p className="text-xs text-error mt-1">{errors.age}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-text-primary mb-1">Gender</label>
                <input
                  type="text"
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  placeholder="e.g., Female, Male, Non-binary"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm text-text-primary mb-1">Vocabulary Level</label>
                <input
                  type="text"
                  value={formData.vocabularyLevel}
                  onChange={(e) => handleChange('vocabularyLevel', e.target.value)}
                  placeholder="e.g., Academic, Street-smart"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-text-primary mb-1">Physical Description</label>
              <textarea
                value={formData.physicalDescription}
                onChange={(e) => handleChange('physicalDescription', e.target.value)}
                placeholder="Describe the character's appearance..."
                rows={2}
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>
          </section>

          {/* Psychology */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Psychology</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-primary mb-1">Personality Summary</label>
                <textarea
                  value={formData.personalitySummary}
                  onChange={(e) => handleChange('personalitySummary', e.target.value)}
                  placeholder="Brief personality overview..."
                  rows={2}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-text-primary mb-1">Misbelief (the lie they believe)</label>
                <input
                  type="text"
                  value={formData.misbelief}
                  onChange={(e) => handleChange('misbelief', e.target.value)}
                  placeholder="e.g., 'I'm not worthy of love'"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </section>

          {/* Background */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Background</h3>
            <div>
              <label className="block text-sm text-text-primary mb-1">Backstory</label>
              <textarea
                value={formData.backstory}
                onChange={(e) => handleChange('backstory', e.target.value)}
                placeholder="Character's history and background..."
                rows={3}
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
            </div>
          </section>

          {/* Character Arc */}
          <section>
            <h3 className="text-sm font-medium text-text-secondary mb-3">Character Arc</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-primary mb-1">Arc Description</label>
                <input
                  type="text"
                  value={formData.characterArc}
                  onChange={(e) => handleChange('characterArc', e.target.value)}
                  placeholder="e.g., From coward to hero"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm text-text-primary mb-1">Arc Catalyst</label>
                <input
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
            <textarea
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
            onClick={onClose}
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
  )
}
