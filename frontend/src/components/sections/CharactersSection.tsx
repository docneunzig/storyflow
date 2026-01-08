import { useState, useEffect, useCallback } from 'react'
import { Plus, User, Edit2, Trash2, Users, Filter, Search, Link2, ArrowRight, CheckSquare, Square, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Film, GitBranch, List } from 'lucide-react'
import type { Project, Character, CharacterRole, CharacterRelationship, Scene } from '@/types/project'
import { useProjectStore } from '@/stores/projectStore'
import { updateProject } from '@/lib/db'
import { CharacterModal } from '@/components/ui/CharacterModal'
import { RelationshipModal } from '@/components/ui/RelationshipModal'
import { RelationshipMap } from '@/components/ui/RelationshipMap'
import { Inspector } from '@/components/layout/Inspector'
import { toast } from '@/components/ui/Toaster'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'

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
const STATUSES = ['alive', 'deceased', 'unknown'] as const
type CharacterStatus = typeof STATUSES[number]
type SortDirection = 'asc' | 'desc' | 'none'
const PAGE_SIZE = 10

export function CharactersSection({ project }: SectionProps) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { characterId: deepLinkCharacterId } = useParams<{ characterId?: string }>()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRelationshipModalOpen, setIsRelationshipModalOpen] = useState(false)
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null)
  const [editingRelationship, setEditingRelationship] = useState<CharacterRelationship | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'relationships' | 'map'>('cards')
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(new Set())
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
  const [inspectorCharacter, setInspectorCharacter] = useState<Character | null>(null)
  const { updateProject: updateProjectStore, setSaveStatus } = useProjectStore()

  // Read filter state from URL query params
  const roleFilter = (searchParams.get('role') as CharacterRole | 'all') || 'all'
  const statusFilter = (searchParams.get('status') as CharacterStatus | 'all') || 'all'
  const searchQuery = searchParams.get('search') || ''
  const sortDirection = (searchParams.get('sort') as SortDirection) || 'none'
  const currentPage = parseInt(searchParams.get('page') || '1', 10)

  // Update URL params helper
  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all' || value === 'none' || (key === 'page' && value === '1')) {
        newParams.delete(key)
      } else {
        newParams.set(key, value)
      }
    })
    setSearchParams(newParams, { replace: true })
  }, [searchParams, setSearchParams])

  // Filter change handlers that update URL
  const setRoleFilter = useCallback((role: CharacterRole | 'all') => {
    updateParams({ role: role === 'all' ? null : role, page: '1' })
  }, [updateParams])

  const setStatusFilter = useCallback((status: CharacterStatus | 'all') => {
    updateParams({ status: status === 'all' ? null : status, page: '1' })
  }, [updateParams])

  const setSearchQuery = useCallback((query: string) => {
    updateParams({ search: query || null, page: '1' })
  }, [updateParams])

  const setSortDirection = useCallback((direction: SortDirection) => {
    updateParams({ sort: direction === 'none' ? null : direction })
  }, [updateParams])

  const setCurrentPage = useCallback((page: number) => {
    updateParams({ page: page === 1 ? null : String(page) })
  }, [updateParams])

  // Define characters and filtered list early so they can be used in handlers
  const characters = project.characters || []
  const relationships = project.relationships || []

  // Handle deep linking - auto-open inspector for character specified in URL
  useEffect(() => {
    if (deepLinkCharacterId && characters.length > 0) {
      const character = characters.find(c => c.id === deepLinkCharacterId)
      if (character) {
        setInspectorCharacter(character)
      }
    }
  }, [deepLinkCharacterId, characters])

  // Apply role filter, status filter, search, and sorting
  const filteredCharacters = characters
    .filter(c => {
      const matchesRole = roleFilter === 'all' || c.role === roleFilter
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter
      const matchesSearch = searchQuery === '' ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.personalitySummary && c.personalitySummary.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.archetype && c.archetype.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesRole && matchesStatus && matchesSearch
    })
    .sort((a, b) => {
      if (sortDirection === 'none') return 0
      const comparison = a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      return sortDirection === 'asc' ? comparison : -comparison
    })

  // Pagination calculations
  const totalPages = Math.ceil(filteredCharacters.length / PAGE_SIZE)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const paginatedCharacters = filteredCharacters.slice(startIndex, endIndex)

  // Reset to page 1 when filters change and current page would be invalid
  const effectivePage = currentPage > totalPages ? 1 : currentPage
  if (effectivePage !== currentPage && totalPages > 0) {
    setCurrentPage(1)
  }

  // Handler to cycle through sort directions
  const handleSortToggle = () => {
    if (sortDirection === 'none') {
      setSortDirection('asc')
    } else if (sortDirection === 'asc') {
      setSortDirection('desc')
    } else {
      setSortDirection('none')
    }
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      setSelectedCharacters(new Set()) // Clear selection when changing pages
    }
  }

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

      // Cascade delete: Remove character references from scenes
      const updatedScenes = (project.scenes || []).map(scene => {
        const updates: Partial<typeof scene> = {}

        // Clear POV character if it matches
        if (scene.povCharacterId === characterId) {
          updates.povCharacterId = null
        }

        // Remove from characters present array
        if (scene.charactersPresent?.includes(characterId)) {
          updates.charactersPresent = scene.charactersPresent.filter(id => id !== characterId)
        }

        // Return updated scene if any changes, otherwise original
        if (Object.keys(updates).length > 0) {
          return { ...scene, ...updates }
        }
        return scene
      })

      await updateProject(project.id, {
        characters: updatedCharacters,
        relationships: updatedRelationships,
        scenes: updatedScenes,
      })
      updateProjectStore(project.id, {
        characters: updatedCharacters,
        relationships: updatedRelationships,
        scenes: updatedScenes,
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

  const handleBulkDeleteCharacters = async () => {
    if (selectedCharacters.size === 0) return

    try {
      setSaveStatus('saving')
      const deleteCount = selectedCharacters.size
      const updatedCharacters = project.characters.filter(c => !selectedCharacters.has(c.id))

      // Cascade delete: Remove all relationships involving deleted characters
      const updatedRelationships = (project.relationships || []).filter(
        r => !selectedCharacters.has(r.sourceCharacterId) && !selectedCharacters.has(r.targetCharacterId)
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
      setSelectedCharacters(new Set())
      setBulkDeleteConfirm(false)
      toast({ title: `${deleteCount} character(s) deleted`, variant: 'success' })
    } catch (error) {
      console.error('Failed to bulk delete characters:', error)
      toast({ title: 'Failed to delete characters', variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  const toggleCharacterSelection = (characterId: string) => {
    setSelectedCharacters(prev => {
      const newSet = new Set(prev)
      if (newSet.has(characterId)) {
        newSet.delete(characterId)
      } else {
        newSet.add(characterId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedCharacters.size === paginatedCharacters.length) {
      setSelectedCharacters(new Set())
    } else {
      setSelectedCharacters(new Set(paginatedCharacters.map(c => c.id)))
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

  // Get character name by ID
  const getCharacterName = (id: string) => {
    const char = characters.find(c => c.id === id)
    return char?.name || 'Unknown'
  }

  // Get scene info by ID
  const getSceneInfo = (sceneId: string): Scene | null => {
    const scenes = project.scenes || []
    return scenes.find(s => s.id === sceneId) || null
  }

  // Get relationships for a character
  const getCharacterRelationships = (characterId: string) => {
    return relationships.filter(
      r => r.sourceCharacterId === characterId || r.targetCharacterId === characterId
    )
  }

  // Handle character card click to open inspector
  const handleCharacterClick = (character: Character, event: React.MouseEvent) => {
    // Don't open inspector if clicking on buttons or checkboxes
    if ((event.target as HTMLElement).closest('button')) {
      return
    }
    setInspectorCharacter(character)
  }

  // Handle navigation from inspector
  const handleNavigateToScene = (sceneId: string) => {
    navigate(`/projects/${project.id}/scenes`)
  }

  const handleNavigateToCharacter = (characterId: string) => {
    const character = characters.find(c => c.id === characterId)
    if (character) {
      setInspectorCharacter(character)
    }
  }

  const scenes = project.scenes || []

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
          <div className="flex items-center border border-border rounded-lg overflow-hidden" role="group" aria-label="View mode">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2 text-sm transition-colors ${
                viewMode === 'cards'
                  ? 'bg-accent text-white'
                  : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
              }`}
              aria-label="Card view"
              aria-pressed={viewMode === 'cards'}
              title="Character Cards"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => setViewMode('relationships')}
              className={`px-3 py-2 text-sm transition-colors ${
                viewMode === 'relationships'
                  ? 'bg-accent text-white'
                  : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
              }`}
              aria-label="Relationships list view"
              aria-pressed={viewMode === 'relationships'}
              title="Relationships List"
            >
              <List className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-2 text-sm transition-colors ${
                viewMode === 'map'
                  ? 'bg-accent text-white'
                  : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
              }`}
              aria-label="Relationship map view"
              aria-pressed={viewMode === 'map'}
              title="Relationship Map (React Flow)"
            >
              <GitBranch className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" aria-hidden="true" />
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
            <Filter className="h-4 w-4 text-text-secondary" aria-hidden="true" />
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
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CharacterStatus | 'all')}
            className="px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            {STATUSES.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          {/* Sort Button */}
          <button
            onClick={handleSortToggle}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
              sortDirection !== 'none'
                ? 'bg-accent/10 border-accent/30 text-accent'
                : 'bg-surface-elevated border-border text-text-secondary hover:text-text-primary'
            }`}
            aria-label={`Sort by name ${sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : 'off'}`}
            title={`Sort by name: ${sortDirection === 'none' ? 'Off' : sortDirection === 'asc' ? 'A→Z' : 'Z→A'}`}
          >
            {sortDirection === 'none' && <ArrowUpDown className="h-4 w-4" aria-hidden="true" />}
            {sortDirection === 'asc' && <ArrowUp className="h-4 w-4" aria-hidden="true" />}
            {sortDirection === 'desc' && <ArrowDown className="h-4 w-4" aria-hidden="true" />}
            <span>Sort</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Character
          </button>
        </div>
      </div>

      {viewMode === 'map' ? (
        // React Flow Relationship Map View
        (() => {
          // Filter relationships to only include those between filtered characters
          const filteredCharacterIds = new Set(filteredCharacters.map(c => c.id))
          const filteredRelationships = relationships.filter(
            r => filteredCharacterIds.has(r.sourceCharacterId) && filteredCharacterIds.has(r.targetCharacterId)
          )
          return (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">Character Relationship Map</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">
                    {filteredCharacters.length} characters, {filteredRelationships.length} relationships
                    {(roleFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
                      <span className="ml-1 text-accent">(filtered)</span>
                    )}
                  </span>
                  <button
                    onClick={() => handleOpenRelationshipModal()}
                    disabled={characters.length < 2}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add Relationship
                  </button>
                </div>
              </div>
              <RelationshipMap
                characters={filteredCharacters}
                relationships={filteredRelationships}
                onNodeClick={(character) => setInspectorCharacter(character)}
              />
            </div>
          )
        })()
      ) : viewMode === 'cards' ? (
        // Character Cards View
        <>
          {/* Bulk Selection Controls */}
          {paginatedCharacters.length > 0 && (
            <div className="flex items-center justify-between mb-4 p-3 bg-surface-elevated rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                  aria-label={selectedCharacters.size === paginatedCharacters.length ? "Deselect all" : "Select all"}
                >
                  {selectedCharacters.size === paginatedCharacters.length && paginatedCharacters.length > 0 ? (
                    <CheckSquare className="h-5 w-5 text-accent" aria-hidden="true" />
                  ) : (
                    <Square className="h-5 w-5" aria-hidden="true" />
                  )}
                  Select All
                </button>
                {selectedCharacters.size > 0 && (
                  <span className="text-sm text-text-secondary">
                    {selectedCharacters.size} selected
                  </span>
                )}
              </div>
              {selectedCharacters.size > 0 && (
                <div className="flex items-center gap-2">
                  {bulkDeleteConfirm ? (
                    <>
                      <span className="text-sm text-error mr-2">Delete {selectedCharacters.size} character(s)?</span>
                      <button
                        onClick={handleBulkDeleteCharacters}
                        className="px-3 py-1.5 text-sm bg-error text-white rounded-lg hover:bg-error/90 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setBulkDeleteConfirm(false)}
                        className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-surface transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setBulkDeleteConfirm(true)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-error/10 text-error rounded-lg hover:bg-error/20 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Delete Selected
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {characters.length === 0 ? (
            <div className="card text-center py-12">
              <Users className="h-12 w-12 text-text-secondary mx-auto mb-4" aria-hidden="true" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No characters yet</h3>
              <p className="text-text-secondary mb-4">
                Start building your cast of characters by creating your first one.
              </p>
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create First Character
              </button>
            </div>
          ) : filteredCharacters.length === 0 ? (
            <div className="card text-center py-12">
              <Search className="h-12 w-12 text-text-secondary mx-auto mb-4" aria-hidden="true" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No matching characters</h3>
              <p className="text-text-secondary mb-4">
                No characters match the current search or filter. Try adjusting your criteria.
              </p>
              <button
                onClick={() => { setRoleFilter('all'); setStatusFilter('all'); setSearchQuery(''); }}
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-surface-elevated transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedCharacters.map(character => {
                const charRelationships = getCharacterRelationships(character.id)
                const isSelected = selectedCharacters.has(character.id)
                const isInspecting = inspectorCharacter?.id === character.id
                return (
                  <div
                    key={character.id}
                    onClick={(e) => handleCharacterClick(character, e)}
                    className={`card hover:border-accent/50 transition-colors group cursor-pointer ${isSelected ? 'border-accent ring-1 ring-accent/50' : ''} ${isInspecting ? 'border-success ring-1 ring-success/50' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {/* Selection Checkbox */}
                        <button
                          onClick={() => toggleCharacterSelection(character.id)}
                          className="flex-shrink-0"
                          aria-label={isSelected ? `Deselect ${character.name}` : `Select ${character.name}`}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-accent" aria-hidden="true" />
                          ) : (
                            <Square className="h-5 w-5 text-text-secondary hover:text-text-primary transition-colors" aria-hidden="true" />
                          )}
                        </button>
                        <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center">
                          <User className="h-5 w-5 text-text-secondary" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-text-primary truncate" title={character.name}>{character.name}</h3>
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${ROLE_COLORS[character.role] || ROLE_COLORS.minor}`}>
                            {character.role.charAt(0).toUpperCase() + character.role.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenModal(character)}
                          className="p-1.5 rounded-md hover:bg-surface-elevated transition-colors"
                          aria-label="Edit character"
                          title="Edit character"
                        >
                          <Edit2 className="h-4 w-4 text-text-secondary" aria-hidden="true" />
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
                            aria-label="Delete character"
                            title="Delete character"
                          >
                            <Trash2 className="h-4 w-4 text-error" aria-hidden="true" />
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 p-3 bg-surface-elevated rounded-lg border border-border">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-border hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-accent text-white'
                          : 'border border-border hover:bg-surface'
                      }`}
                      aria-label={`Page ${page}`}
                      aria-current={currentPage === page ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-border hover:bg-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>

                <span className="ml-4 text-sm text-text-secondary">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredCharacters.length)} of {filteredCharacters.length}
                </span>
              </div>
            )}
          </>
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
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Relationship
            </button>
          </div>

          {characters.length < 2 ? (
            <div className="card text-center py-12">
              <Users className="h-12 w-12 text-text-secondary mx-auto mb-4" aria-hidden="true" />
              <h3 className="text-lg font-medium text-text-primary mb-2">Need more characters</h3>
              <p className="text-text-secondary mb-4">
                Create at least 2 characters to start defining relationships between them.
              </p>
            </div>
          ) : relationships.length === 0 ? (
            <div className="card text-center py-12">
              <Link2 className="h-12 w-12 text-text-secondary mx-auto mb-4" aria-hidden="true" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No relationships yet</h3>
              <p className="text-text-secondary mb-4">
                Define how your characters relate to each other.
              </p>
              <button
                onClick={() => handleOpenRelationshipModal()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
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
                    <div className="flex items-center gap-3 min-w-0 flex-1 max-w-[200px]">
                      <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-text-secondary" aria-hidden="true" />
                      </div>
                      <span className="font-medium text-text-primary truncate" title={getCharacterName(rel.sourceCharacterId)}>
                        {getCharacterName(rel.sourceCharacterId)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <ArrowRight className={`h-4 w-4 ${RELATIONSHIP_COLORS[rel.relationshipType]}`} aria-hidden="true" />
                      <span className={`text-sm font-medium ${RELATIONSHIP_COLORS[rel.relationshipType]}`}>
                        {rel.relationshipType}
                      </span>
                      <ArrowRight className={`h-4 w-4 ${RELATIONSHIP_COLORS[rel.relationshipType]}`} aria-hidden="true" />
                    </div>

                    <div className="flex items-center gap-3 min-w-0 flex-1 max-w-[200px]">
                      <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-text-secondary" aria-hidden="true" />
                      </div>
                      <span className="font-medium text-text-primary truncate" title={getCharacterName(rel.targetCharacterId)}>
                        {getCharacterName(rel.targetCharacterId)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Key Scenes */}
                    {rel.keyScenes && rel.keyScenes.length > 0 && (
                      <div className="flex items-center gap-1 mr-2">
                        <Film className="h-3 w-3 text-warning" aria-hidden="true" />
                        {rel.keyScenes.slice(0, 2).map(sceneId => {
                          const sceneInfo = getSceneInfo(sceneId)
                          if (!sceneInfo) return null
                          return (
                            <button
                              key={sceneId}
                              onClick={() => handleNavigateToScene(sceneId)}
                              className="px-1.5 py-0.5 text-xs bg-warning/10 text-warning rounded hover:bg-warning/20 transition-colors"
                              title={`Go to scene: ${sceneInfo.title}`}
                            >
                              {sceneInfo.title.length > 12 ? sceneInfo.title.substring(0, 12) + '...' : sceneInfo.title}
                            </button>
                          )
                        })}
                        {rel.keyScenes.length > 2 && (
                          <span className="text-xs text-text-secondary">+{rel.keyScenes.length - 2}</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {rel.dynamicDescription && (
                        <span className="text-xs text-text-secondary mr-2 max-w-xs truncate">
                          {rel.dynamicDescription}
                        </span>
                      )}
                      <button
                        onClick={() => handleOpenRelationshipModal(rel)}
                        className="p-1.5 rounded-md hover:bg-surface-elevated transition-colors"
                        aria-label="Edit relationship"
                        title="Edit relationship"
                      >
                        <Edit2 className="h-4 w-4 text-text-secondary" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleDeleteRelationship(rel.sourceCharacterId, rel.targetCharacterId)}
                        className="p-1.5 rounded-md hover:bg-error/10 transition-colors"
                        aria-label="Delete relationship"
                        title="Delete relationship"
                      >
                        <Trash2 className="h-4 w-4 text-error" aria-hidden="true" />
                      </button>
                    </div>
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
        scenes={project.scenes || []}
        existingRelationship={editingRelationship}
      />

      {/* Inspector Panel */}
      {inspectorCharacter && (
        <div className="fixed right-0 top-0 h-full z-40">
          <Inspector
            selectedCharacter={inspectorCharacter}
            characters={characters}
            scenes={scenes}
            relationships={relationships}
            onClose={() => setInspectorCharacter(null)}
            onNavigateToScene={handleNavigateToScene}
            onNavigateToCharacter={handleNavigateToCharacter}
            onEditCharacter={(character) => {
              handleOpenModal(character)
              setInspectorCharacter(null)
            }}
            onDeleteCharacter={(characterId) => {
              handleDeleteCharacter(characterId)
              setInspectorCharacter(null)
            }}
          />
        </div>
      )}
    </div>
  )
}
