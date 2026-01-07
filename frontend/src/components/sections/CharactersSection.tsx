import { useState } from 'react'
import { Plus, User, Edit2, Trash2, Users, Filter, Search } from 'lucide-react'
import type { Project, Character, CharacterRole } from '@/types/project'
import { useProjectStore } from '@/stores/projectStore'
import { updateProject } from '@/lib/db'
import { CharacterModal } from '@/components/ui/CharacterModal'
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

const ROLES: CharacterRole[] = ['protagonist', 'antagonist', 'supporting', 'minor']

export function CharactersSection({ project }: SectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<CharacterRole | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
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
      await updateProject(project.id, { characters: updatedCharacters })
      updateProjectStore(project.id, { characters: updatedCharacters })
      setSaveStatus('saved')
      setDeleteConfirmId(null)
      toast({ title: `Character "${character?.name}" deleted`, variant: 'success' })
    } catch (error) {
      console.error('Failed to delete character:', error)
      toast({ title: 'Failed to delete character', variant: 'error' })
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

  const characters = project.characters || []

  // Apply role filter and search
  const filteredCharacters = characters.filter(c => {
    const matchesRole = roleFilter === 'all' || c.role === roleFilter
    const matchesSearch = searchQuery === '' ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.personalitySummary && c.personalitySummary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.archetype && c.archetype.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesRole && matchesSearch
  })

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
          {filteredCharacters.map(character => (
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
          ))}
        </div>
      )}

      {/* Character Modal */}
      <CharacterModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCharacter}
        editCharacter={editingCharacter}
      />
    </div>
  )
}
