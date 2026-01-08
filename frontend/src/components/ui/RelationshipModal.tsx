import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Character, CharacterRelationship, RelationshipType } from '@/types/project'
import { generateId } from '@/lib/db'

interface RelationshipModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (relationship: CharacterRelationship) => void
  characters: Character[]
  existingRelationship?: CharacterRelationship | null
  preselectedCharacterId?: string
}

const RELATIONSHIP_TYPES: RelationshipType[] = [
  'family',
  'romantic',
  'conflict',
  'alliance',
  'mentor',
  'sibling',
  'rival',
  'friend',
]

export function RelationshipModal({
  isOpen,
  onClose,
  onSave,
  characters,
  existingRelationship,
  preselectedCharacterId,
}: RelationshipModalProps) {
  const [sourceCharacterId, setSourceCharacterId] = useState('')
  const [targetCharacterId, setTargetCharacterId] = useState('')
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('friend')
  const [dynamicDescription, setDynamicDescription] = useState('')
  const [evolution, setEvolution] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (existingRelationship) {
        setSourceCharacterId(existingRelationship.sourceCharacterId)
        setTargetCharacterId(existingRelationship.targetCharacterId)
        setRelationshipType(existingRelationship.relationshipType)
        setDynamicDescription(existingRelationship.dynamicDescription)
        setEvolution(existingRelationship.evolution)
      } else {
        setSourceCharacterId(preselectedCharacterId || '')
        setTargetCharacterId('')
        setRelationshipType('friend')
        setDynamicDescription('')
        setEvolution('')
      }
    }
  }, [isOpen, existingRelationship, preselectedCharacterId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!sourceCharacterId || !targetCharacterId) {
      return
    }

    const relationship: CharacterRelationship = {
      sourceCharacterId,
      targetCharacterId,
      relationshipType,
      dynamicDescription,
      evolution,
      keyScenes: existingRelationship?.keyScenes || [],
    }

    onSave(relationship)
    onClose()
  }

  if (!isOpen) return null

  const availableTargets = characters.filter(c => c.id !== sourceCharacterId)
  const sourceCharacter = characters.find(c => c.id === sourceCharacterId)
  const targetCharacter = characters.find(c => c.id === targetCharacterId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            {existingRelationship ? 'Edit Relationship' : 'Add Relationship'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg hover:bg-surface-elevated transition-colors"
          >
            <X className="h-5 w-5 text-text-secondary" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Source Character */}
          <div>
            <label htmlFor="rel-source" className="block text-sm font-medium text-text-primary mb-1">
              From Character *
            </label>
            <select
              id="rel-source"
              value={sourceCharacterId}
              onChange={(e) => setSourceCharacterId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              required
            >
              <option value="">Select a character</option>
              {characters.map(char => (
                <option key={char.id} value={char.id}>{char.name}</option>
              ))}
            </select>
          </div>

          {/* Relationship Type */}
          <div>
            <label htmlFor="rel-type" className="block text-sm font-medium text-text-primary mb-1">
              Relationship Type *
            </label>
            <select
              id="rel-type"
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value as RelationshipType)}
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {RELATIONSHIP_TYPES.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Target Character */}
          <div>
            <label htmlFor="rel-target" className="block text-sm font-medium text-text-primary mb-1">
              To Character *
            </label>
            <select
              id="rel-target"
              value={targetCharacterId}
              onChange={(e) => setTargetCharacterId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              required
            >
              <option value="">Select a character</option>
              {availableTargets.map(char => (
                <option key={char.id} value={char.id}>{char.name}</option>
              ))}
            </select>
          </div>

          {/* Dynamic Description */}
          <div>
            <label htmlFor="rel-description" className="block text-sm font-medium text-text-primary mb-1">
              Description
            </label>
            <textarea
              id="rel-description"
              value={dynamicDescription}
              onChange={(e) => setDynamicDescription(e.target.value)}
              placeholder="Describe the nature of their relationship..."
              rows={2}
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          {/* Evolution */}
          <div>
            <label htmlFor="rel-evolution" className="block text-sm font-medium text-text-primary mb-1">
              Evolution (how does it change?)
            </label>
            <textarea
              id="rel-evolution"
              value={evolution}
              onChange={(e) => setEvolution(e.target.value)}
              placeholder="How does this relationship evolve throughout the story?"
              rows={2}
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          {/* Preview */}
          {sourceCharacter && targetCharacter && (
            <div className="p-3 bg-surface-elevated rounded-lg border border-border">
              <p className="text-sm text-text-secondary">
                <span className="text-text-primary font-medium">{sourceCharacter.name}</span>
                {' '}<span className="text-accent">{relationshipType}</span>{' '}
                <span className="text-text-primary font-medium">{targetCharacter.name}</span>
              </p>
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
              disabled={!sourceCharacterId || !targetCharacterId}
              className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {existingRelationship ? 'Update' : 'Add'} Relationship
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
