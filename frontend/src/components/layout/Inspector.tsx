import { useState } from 'react'
import { ChevronRight, ChevronLeft, User, Film, Link2, X, Edit2, Trash2 } from 'lucide-react'
import type { Character, Scene, CharacterRelationship } from '@/types/project'

interface InspectorProps {
  selectedCharacter: Character | null
  characters: Character[]
  scenes: Scene[]
  relationships: CharacterRelationship[]
  onClose: () => void
  onNavigateToScene?: (sceneId: string) => void
  onNavigateToCharacter?: (characterId: string) => void
  onEditCharacter?: (character: Character) => void
  onDeleteCharacter?: (characterId: string) => void
}

export function Inspector({
  selectedCharacter,
  characters,
  scenes,
  relationships,
  onClose,
  onNavigateToScene,
  onNavigateToCharacter,
  onEditCharacter,
  onDeleteCharacter,
}: InspectorProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  if (!selectedCharacter) {
    return null
  }

  // Find scenes where this character is the POV character or is present
  const relatedScenes = scenes.filter(
    (scene) =>
      scene.povCharacterId === selectedCharacter.id ||
      scene.charactersPresent?.includes(selectedCharacter.id)
  )

  // Find relationships involving this character
  const characterRelationships = relationships.filter(
    (rel) =>
      rel.sourceCharacterId === selectedCharacter.id ||
      rel.targetCharacterId === selectedCharacter.id
  )

  // Get character name by ID
  const getCharacterName = (id: string) => {
    const char = characters.find((c) => c.id === id)
    return char?.name || 'Unknown'
  }

  // Get the other character in a relationship
  const getOtherCharacter = (rel: CharacterRelationship) => {
    const otherId =
      rel.sourceCharacterId === selectedCharacter.id
        ? rel.targetCharacterId
        : rel.sourceCharacterId
    return { id: otherId, name: getCharacterName(otherId) }
  }

  if (isCollapsed) {
    return (
      <aside
        className="w-10 bg-surface border-l border-border flex flex-col items-center py-4"
        role="complementary"
        aria-label="Inspector panel (collapsed)"
      >
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 rounded-lg hover:bg-surface-elevated transition-colors"
          aria-label="Expand inspector"
          title="Expand inspector"
        >
          <ChevronLeft className="h-4 w-4 text-text-secondary" />
        </button>
      </aside>
    )
  }

  return (
    <aside
      className="w-72 bg-surface border-l border-border flex flex-col overflow-hidden"
      role="complementary"
      aria-label="Inspector panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-text-primary">Inspector</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-md hover:bg-surface-elevated transition-colors"
            aria-label="Collapse inspector"
            title="Collapse inspector"
          >
            <ChevronRight className="h-4 w-4 text-text-secondary" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-surface-elevated transition-colors"
            aria-label="Close inspector"
            title="Close inspector"
          >
            <X className="h-4 w-4 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Selected Character Info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-accent" aria-hidden="true" />
            <h3 className="text-sm font-medium text-text-primary">
              {selectedCharacter.name}
            </h3>
          </div>
          <div className="space-y-1 text-xs text-text-secondary">
            <p>
              <span className="text-text-secondary/70">Role:</span>{' '}
              <span className="capitalize">{selectedCharacter.role}</span>
            </p>
            {selectedCharacter.archetype && (
              <p>
                <span className="text-text-secondary/70">Archetype:</span>{' '}
                {selectedCharacter.archetype}
              </p>
            )}
            <p>
              <span className="text-text-secondary/70">Status:</span>{' '}
              <span className="capitalize">{selectedCharacter.status}</span>
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Quick Actions</h3>
          <div className="flex gap-2">
            <button
              onClick={() => onEditCharacter?.(selectedCharacter)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm"
              aria-label="Edit character"
            >
              <Edit2 className="h-4 w-4" aria-hidden="true" />
              Edit
            </button>
            {deleteConfirm ? (
              <div className="flex-1 flex gap-1">
                <button
                  onClick={() => {
                    onDeleteCharacter?.(selectedCharacter.id)
                    setDeleteConfirm(false)
                    onClose()
                  }}
                  className="flex-1 px-2 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors text-xs"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="flex-1 px-2 py-2 border border-border rounded-lg hover:bg-surface-elevated transition-colors text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-error/10 text-error border border-error/30 rounded-lg hover:bg-error/20 transition-colors text-sm"
                aria-label="Delete character"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Related Scenes */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Film className="h-4 w-4 text-success" aria-hidden="true" />
            <h3 className="text-sm font-medium text-text-primary">
              Related Scenes ({relatedScenes.length})
            </h3>
          </div>
          {relatedScenes.length === 0 ? (
            <p className="text-xs text-text-secondary italic">
              No scenes featuring this character
            </p>
          ) : (
            <div className="space-y-2">
              {relatedScenes.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => onNavigateToScene?.(scene.id)}
                  className="w-full text-left p-2 rounded-lg bg-surface-elevated hover:bg-surface-elevated/80 transition-colors"
                >
                  <p className="text-sm text-text-primary truncate">
                    {scene.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {scene.povCharacterId === selectedCharacter.id && (
                      <span className="text-xs text-accent">POV</span>
                    )}
                    <span className="text-xs text-text-secondary capitalize">
                      {scene.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Relationships */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="h-4 w-4 text-warning" aria-hidden="true" />
            <h3 className="text-sm font-medium text-text-primary">
              Relationships ({characterRelationships.length})
            </h3>
          </div>
          {characterRelationships.length === 0 ? (
            <p className="text-xs text-text-secondary italic">
              No relationships defined
            </p>
          ) : (
            <div className="space-y-2">
              {characterRelationships.map((rel, index) => {
                const other = getOtherCharacter(rel)
                return (
                  <button
                    key={index}
                    onClick={() => onNavigateToCharacter?.(other.id)}
                    className="w-full text-left p-2 rounded-lg bg-surface-elevated hover:bg-surface-elevated/80 transition-colors"
                  >
                    <p className="text-sm text-text-primary truncate">
                      {other.name}
                    </p>
                    <p className="text-xs text-text-secondary capitalize mt-0.5">
                      {rel.relationshipType}
                    </p>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
