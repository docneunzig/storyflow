import { useState } from 'react'
import { Plus, User, Edit2, Trash2, Users, Filter, Search, Link2, ArrowRight } from 'lucide-react'
import type { Project, Character, CharacterRole, CharacterRelationship } from '@/types/project'
import { useProjectStore } from '@/stores/projectStore'
import { updateProject } from '@/lib/db'
import { CharacterModal } from '@/components/ui/CharacterModal'
import { RelationshipModal } from '@/components/ui/RelationshipModal'
import { toast } from '@/components/ui/Toaster'

interface SectionProps {
  project: Project
}

const ROLE_COLORS: Record<string, string> = {
  protagonist: 'bg-accent/20 text-accent border-accent/30',
  antagonist: 'bg-error/20 text-error border-error/30',
  supporting: 'bg-success/20 text-success border-success/30',
  minor: 'bg-text-secondary/20 text-text-secondary border-text-secondary/30',
}

const RELATIONSHIP_COLORS: Record<string, string> = {
  family: 'text-purple-400',
  romantic: 'text-pink-400',
  conflict: 'text-error',
  alliance: 'text-success',
  mentor: 'text-blue-400',
  sibling: 'text-purple-300',
  rival: 'text-orange-400',
  friend: 'text-accent',
}

const ROLES: CharacterRole[] = ['protagonist', 'antagonist', 'supporting', 'minor']

export function CharactersSection({ project }: SectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRelationshipModalOpen, setIsRelationshipModalOpen] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [editingRelationship, setEditingRelationship] = useState<CharacterRelationship | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<CharacterRole | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'relationships'>('cards')
  const { updateProject: updateProjectStore, setSaveStatus } = useProjectStore()

  const handleSaveCharacter = async (character: Character) => {
    try {
      setSaveStatus('saving')

      const isEditing = project.characters.some(c => c.id === character.id)
      let updatedCharacters: Character[]

      if (isEditing) {
        updatedCharacters = project.characters.map(c =>
          c.id === character.id ? character : c
        )
        toast({ title: `Character "${character.name}" updated`, variant: 'success' })
      } else {
        updatedCharacters = [...project.characters, character]
        toast({ title: `Character "${character.name}" created`, variant: 'success' })
      }

      await updateProject(project.id, { characters: updatedCharacters })
      updateProjectStore(project.id, { characters: updatedCharacters })
      setSaveStatus('saved')
      setEditingCharacter(null)
    } catch (error) {
      console.error('Failed to save character:', error)
      toast({ title: 'Failed to save character', variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  const handleDeleteCharacter = async (characterId: string) => {
    try {
      setSaveStatus('saving')
      const character = project.characters.find(c => c.id === characterId)
      const updatedCharacters = project.characters.filter(c => c.id !== characterId)

      // Cascade delete: Remove all relationships involving this character
      const updatedRelationships = (project.relationships || []).filter(
        r => r.sourceCharacterId !== characterId && r.targetCharacterId !== characterId
      )

      await updateProject(project.id, {
        characters: updatedCharacters,
        relationships: updatedRelationships,
      })
      updateProjectStore(project.id, {
        characters: updatedCharacters,
        relationships: updatedRelationships,
      })
      setSaveStatus('saved')
      setDeleteConfirmId(null)
      toast({ title: `Character "${character?.name}" deleted`, variant: 'success' })
    } catch (error) {
      console.error('Failed to delete character:', error)
      toast({ title: 'Failed to delete character', variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  const handleSaveRelationship = async (relationship: CharacterRelationship) => {
    try {
      setSaveStatus('saving')

      const relationships = project.relationships || []
      const existingIndex = relationships.findIndex(
        r => r.sourceCharacterId === relationship.sourceCharacterId &&
             r.targetCharacterId === relationship.targetCharacterId
      )

      let updatedRelationships: CharacterRelationship[]

      if (existingIndex >= 0) {
        updatedRelationships = relationships.map((r, i) =>
          i === existingIndex ? relationship : r
        )
        toast({ title: 'Relationship updated', variant: 'success' })
      } else {
        updatedRelationships = [...relationships, relationship]
        toast({ title: 'Relationship added', variant: 'success' })
      }

      await updateProject(project.id, { relationships: updatedRelationships })
      updateProjectStore(project.id, { relationships: updatedRelationships })
      setSaveStatus('saved')
      setEditingRelationship(null)
    } catch (error) {
      console.error('Failed to save relationship:', error)
      toast({ title: 'Failed to save relationship', variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  const handleDeleteRelationship = async (sourceId: string, targetId: string) => {
    try {
      setSaveStatus('saving')
      const updatedRelationships = (project.relationships || []).filter(
        r => !(r.sourceCharacterId === sourceId && r.targetCharacterId === targetId)
      )

      await updateProject(project.id, { relationships: updatedRelationships })
      updateProjectStore(project.id, { relationships: updatedRelationships })
      setSaveStatus('saved')
      toast({ title: 'Relationship removed', variant: 'success' })
    } catch (error) {
      console.error('Failed to delete relationship:', error)
      toast({ title: 'Failed to delete relationship', variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  const handleOpenModal = (character?: Character) => {
    setEditingCharacter(character || null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCharacter(null)
  }

  const handleOpenRelationshipModal = (relationship?: CharacterRelationship) => {
    setEditingRelationship(relationship || null)
    setIsRelationshipModalOpen(true)
  }

  const characters = project.characters || []
  const relationships = project.relationships || []

  // Apply role filter and search
  const filteredCharacters = characters.filter(c => {
    const matchesRole = roleFilter === 'all' || c.role === roleFilter
    const matchesSearch = searchQuery === '' ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.personalitySummary && c.personalitySummary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.archetype && c.archetype.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesRole && matchesSearch
  })

  // Get character name by ID
  const getCharacterName = (id: string) => {
    const char = characters.find(c => c.id === id)
    return char?.name || 'Unknown'
  }

  // Get relationships for a character
  const getCharacterRelationships = (characterId: string) => {
    return relationships.filter(
      r => r.sourceCharacterId === characterId || r.targetCharacterId === characterId
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Characters</h1>
          <p className="text-text-secondary mt-1">
            Create deep, consistent, and compelling characters.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2 text-sm transition-colors ${
                viewMode === 'cards'
                  ? 'bg-accent text-white'
                  : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
              }`}
            >
              <Users className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('relationships')}
              className={`px-3 py-2 text-sm transition-colors ${
                viewMode === 'relationships'
                  ? 'bg-accent text-white'
                  : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
              }`}
            >
              <Link2 className="h-4 w-4" />
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search characters..."
              className="pl-9 pr-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary text-sm placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent w-48"
              aria-label="Search characters"
            />
          </div>
          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-text-secondary" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as CharacterRole | 'all')}
              className="px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label="Filter by role"
            >
              <option value="all">All Roles</option>
              {ROLES.map(role => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Character
          </button>
        </div>
      </div>

      {viewMode === 'cards' ? (
        // Character Cards View
        <>
          {characters.length === 0 ? (
            <div className="card text-center py-12">
              <Users className="h-12 w-12 text-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No characters yet</h3>
              <p className="text-text-secondary mb-4">
                Start building your cast of characters by creating your first one.
              </p>
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create First Character
              </button>
            </div>
          ) : filteredCharacters.length === 0 ? (
            <div className="card text-center py-12">
              <Search className="h-12 w-12 text-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No matching characters</h3>
              <p className="text-text-secondary mb-4">
                No characters match the current search or filter. Try adjusting your criteria.
              </p>
              <button
                onClick={() => { setRoleFilter('all'); setSearchQuery(''); }}
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface-elevated transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCharacters.map(character => {
                const charRelationships = getCharacterRelationships(character.id)
                return (
                  <div
                    key={character.id}
                    className="card hover:border-accent/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center">
                          <User className="h-5 w-5 text-text-secondary" />
                        </div>
                        <div>
                          <h3 className="font-medium text-text-primary">{character.name}</h3>
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${ROLE_COLORS[character.role] || ROLE_COLORS.minor}`}>
                            {character.role.charAt(0).toUpperCase() + character.role.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenModal(character)}
                          className="p-1.5 rounded-md hover:bg-surface-elevated transition-colors"
                          title="Edit character"
                        >
                          <Edit2 className="h-4 w-4 text-text-secondary" />
                        </button>
                        {deleteConfirmId === character.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteCharacter(character.id)}
                              className="px-2 py-1 text-xs bg-error text-white rounded hover:bg-error/90"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 text-xs border border-border rounded hover:bg-surface-elevated"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(character.id)}
                            className="p-1.5 rounded-md hover:bg-error/10 transition-colors"
                            title="Delete character"
                          >
                            <Trash2 className="h-4 w-4 text-error" />
                          </button>
                        )}
                      </div>
                    </div>

                    {character.archetype && (
                      <p className="text-sm text-accent mb-2">{character.archetype}</p>
                    )}

                    {character.personalitySummary && (
                      <p className="text-sm text-text-secondary line-clamp-2 mb-2">
                        {character.personalitySummary}
                      </p>
                    )}

                    {/* Relationships preview */}
                    {charRelationships.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs text-text-secondary mb-1">Relationships:</p>
                        <div className="flex flex-wrap gap-1">
                          {charRelationships.slice(0, 3).map((rel, i) => {
                            const otherId = rel.sourceCharacterId === character.id
                              ? rel.targetCharacterId
                              : rel.sourceCharacterId
                            return (
                              <span
                                key={i}
                                className={`text-xs px-1.5 py-0.5 rounded bg-surface-elevated ${RELATIONSHIP_COLORS[rel.relationshipType]}`}
                              >
                                {rel.relationshipType}: {getCharacterName(otherId)}
                              </span>
                            )
                          })}
                          {charRelationships.length > 3 && (
                            <span className="text-xs text-text-secondary">
                              +{charRelationships.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-auto pt-2">
                      {character.age && (
                        <span className="text-xs text-text-secondary bg-surface-elevated px-2 py-0.5 rounded">
                          Age: {character.age}
                        </span>
                      )}
                      {character.gender && (
                        <span className="text-xs text-text-secondary bg-surface-elevated px-2 py-0.5 rounded">
                          {character.gender}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        character.status === 'alive' ? 'bg-success/20 text-success' :
                        character.status === 'deceased' ? 'bg-error/20 text-error' :
                        'bg-warning/20 text-warning'
                      }`}>
                        {character.status.charAt(0).toUpperCase() + character.status.slice(1)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      ) : (
        // Relationships View
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Character Relationships</h2>
            <button
              onClick={() => handleOpenRelationshipModal()}
              disabled={characters.length < 2}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              Add Relationship
            </button>
          </div>

          {characters.length < 2 ? (
            <div className="card text-center py-12">
              <Users className="h-12 w-12 text-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">Need more characters</h3>
              <p className="text-text-secondary mb-4">
                Create at least 2 characters to start defining relationships between them.
              </p>
            </div>
          ) : relationships.length === 0 ? (
            <div className="card text-center py-12">
              <Link2 className="h-12 w-12 text-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No relationships yet</h3>
              <p className="text-text-secondary mb-4">
                Define how your characters relate to each other.
              </p>
              <button
                onClick={() => handleOpenRelationshipModal()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add First Relationship
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {relationships.map((rel, index) => (
                <div
                  key={`${rel.sourceCharacterId}-${rel.targetCharacterId}-${index}`}
                  className="card flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center">
                        <User className="h-4 w-4 text-text-secondary" />
                      </div>
                      <span className="font-medium text-text-primary">
                        {getCharacterName(rel.sourceCharacterId)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <ArrowRight className={`h-4 w-4 ${RELATIONSHIP_COLORS[rel.relationshipType]}`} />
                      <span className={`text-sm font-medium ${RELATIONSHIP_COLORS[rel.relationshipType]}`}>
                        {rel.relationshipType}
                      </span>
                      <ArrowRight className={`h-4 w-4 ${RELATIONSHIP_COLORS[rel.relationshipType]}`} />
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center">
                        <User className="h-4 w-4 text-text-secondary" />
                      </div>
                      <span className="font-medium text-text-primary">
                        {getCharacterName(rel.targetCharacterId)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {rel.dynamicDescription && (
                      <span className="text-xs text-text-secondary mr-2 max-w-xs truncate">
                        {rel.dynamicDescription}
                      </span>
                    )}
                    <button
                      onClick={() => handleOpenRelationshipModal(rel)}
                      className="p-1.5 rounded-md hover:bg-surface-elevated transition-colors"
                      title="Edit relationship"
                    >
                      <Edit2 className="h-4 w-4 text-text-secondary" />
                    </button>
                    <button
                      onClick={() => handleDeleteRelationship(rel.sourceCharacterId, rel.targetCharacterId)}
                      className="p-1.5 rounded-md hover:bg-error/10 transition-colors"
                      title="Delete relationship"
                    >
                      <Trash2 className="h-4 w-4 text-error" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Character Modal */}
      <CharacterModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCharacter}
        editCharacter={editingCharacter}
      />

      {/* Relationship Modal */}
      <RelationshipModal
        isOpen={isRelationshipModalOpen}
        onClose={() => {
          setIsRelationshipModalOpen(false)
          setEditingRelationship(null)
        }}
        onSave={handleSaveRelationship}
        characters={characters}
        existingRelationship={editingRelationship}
      />
    </div>
  )
}
