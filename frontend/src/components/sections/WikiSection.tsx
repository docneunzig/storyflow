import { useState } from 'react'
import { Plus, BookOpen, Edit2, Trash2, Tag, Filter } from 'lucide-react'
import type { Project, WikiEntry, WikiCategory } from '@/types/project'
import { useProjectStore } from '@/stores/projectStore'
import { updateProject } from '@/lib/db'
import { WikiEntryModal } from '@/components/ui/WikiEntryModal'
import { toast } from '@/components/ui/Toaster'

interface SectionProps {
  project: Project
}

const WIKI_CATEGORIES: { value: WikiCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'locations', label: 'Locations' },
  { value: 'characters', label: 'Characters' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'magicTechnology', label: 'Magic/Technology' },
  { value: 'culturesFactions', label: 'Cultures/Factions' },
  { value: 'objects', label: 'Objects' },
  { value: 'terminology', label: 'Terminology' },
  { value: 'rules', label: 'Rules' },
]

const CATEGORY_COLORS: Record<WikiCategory, string> = {
  locations: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  characters: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  timeline: 'bg-green-500/20 text-green-400 border-green-500/30',
  magicTechnology: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  culturesFactions: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  objects: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  terminology: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  rules: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export function WikiSection({ project }: SectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<WikiEntry | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<WikiCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { updateProject: updateProjectStore, setSaveStatus } = useProjectStore()

  const wikiEntries = project.worldbuildingEntries || []

  const handleSaveEntry = async (entry: WikiEntry) => {
    try {
      setSaveStatus('saving')

      const isEditing = wikiEntries.some(e => e.id === entry.id)
      let updatedEntries: WikiEntry[]

      if (isEditing) {
        updatedEntries = wikiEntries.map(e => e.id === entry.id ? entry : e)
        toast({ title: `Wiki entry "${entry.name}" updated`, variant: 'success' })
      } else {
        updatedEntries = [...wikiEntries, entry]
        toast({ title: `Wiki entry "${entry.name}" created`, variant: 'success' })
      }

      await updateProject(project.id, { worldbuildingEntries: updatedEntries })
      updateProjectStore(project.id, { worldbuildingEntries: updatedEntries })
      setSaveStatus('saved')
      setEditingEntry(null)
    } catch (error) {
      console.error('Failed to save wiki entry:', error)
      toast({ title: 'Failed to save wiki entry', variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    try {
      setSaveStatus('saving')
      const entry = wikiEntries.find(e => e.id === entryId)
      const updatedEntries = wikiEntries.filter(e => e.id !== entryId)
      await updateProject(project.id, { worldbuildingEntries: updatedEntries })
      updateProjectStore(project.id, { worldbuildingEntries: updatedEntries })
      setSaveStatus('saved')
      setDeleteConfirmId(null)
      toast({ title: `Wiki entry "${entry?.name}" deleted`, variant: 'success' })
    } catch (error) {
      console.error('Failed to delete wiki entry:', error)
      toast({ title: 'Failed to delete wiki entry', variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  const handleOpenModal = (entry?: WikiEntry) => {
    setEditingEntry(entry || null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingEntry(null)
  }

  // Filter entries by category and search
  const filteredEntries = wikiEntries.filter(entry => {
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory
    const matchesSearch = !searchQuery ||
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  // Group entries by category for display
  const entriesByCategory = filteredEntries.reduce((acc, entry) => {
    if (!acc[entry.category]) {
      acc[entry.category] = []
    }
    acc[entry.category].push(entry)
    return acc
  }, {} as Record<WikiCategory, WikiEntry[]>)

  const getCategoryLabel = (cat: WikiCategory) => {
    return WIKI_CATEGORIES.find(c => c.value === cat)?.label || cat
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Worldbuilding Wiki</h1>
          <p className="text-text-secondary mt-1">
            Maintain internal consistency with organized worldbuilding details.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Entry
        </button>
      </div>

      {wikiEntries.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="h-12 w-12 text-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No wiki entries yet</h3>
          <p className="text-text-secondary mb-4">
            Start building your world by documenting locations, items, and lore.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create First Entry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-text-secondary" />
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value as WikiCategory | 'all')}
                className="px-3 py-1.5 bg-surface-elevated border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {WIKI_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search entries..."
                className="w-full px-3 py-1.5 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="text-sm text-text-secondary">
            {filteredEntries.length} of {wikiEntries.length} entries
          </div>

          {/* Entry List grouped by category */}
          {filteredEntries.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-text-secondary">No matching entries found</p>
              <button
                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                className="mt-2 text-sm text-accent hover:underline"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(entriesByCategory).map(([category, entries]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-text-secondary mb-3 flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${CATEGORY_COLORS[category as WikiCategory]?.split(' ')[0] || 'bg-text-secondary'}`} />
                    {getCategoryLabel(category as WikiCategory)}
                    <span className="text-text-secondary/60">({entries.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {entries.map(entry => (
                      <div
                        key={entry.id}
                        className="card hover:border-accent/50 transition-colors group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-text-primary">{entry.name}</h4>
                            <span className={`inline-block text-xs px-2 py-0.5 rounded-full border mt-1 ${CATEGORY_COLORS[entry.category] || 'bg-text-secondary/20 text-text-secondary'}`}>
                              {getCategoryLabel(entry.category)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenModal(entry)}
                              className="p-1.5 rounded-md hover:bg-surface-elevated transition-colors"
                              title="Edit entry"
                            >
                              <Edit2 className="h-4 w-4 text-text-secondary" />
                            </button>
                            {deleteConfirmId === entry.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDeleteEntry(entry.id)}
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
                                onClick={() => setDeleteConfirmId(entry.id)}
                                className="p-1.5 rounded-md hover:bg-error/10 transition-colors"
                                title="Delete entry"
                              >
                                <Trash2 className="h-4 w-4 text-error" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                          {entry.description}
                        </p>

                        {entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {entry.tags.slice(0, 4).map(tag => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-elevated text-text-secondary text-xs rounded"
                              >
                                <Tag className="h-3 w-3" />
                                {tag}
                              </span>
                            ))}
                            {entry.tags.length > 4 && (
                              <span className="text-xs text-text-secondary">
                                +{entry.tags.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Wiki Entry Modal */}
      <WikiEntryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveEntry}
        editEntry={editingEntry}
      />
    </div>
  )
}
