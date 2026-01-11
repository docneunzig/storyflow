import { useState, useMemo } from 'react'
import { Plus, BookOpen, Edit2, Trash2, Tag, Filter, Link2, FileText, Sparkles, Wand2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Project, WikiEntry, WikiCategory, Character } from '@/types/project'
import { useProjectStore } from '@/stores/projectStore'
import { updateProject, generateId } from '@/lib/db'
import { WikiEntryModal } from '@/components/ui/WikiEntryModal'
import { toast } from '@/components/ui/Toaster'
import { useAIGeneration } from '@/hooks/useAIGeneration'
import { AIProgressModal } from '@/components/ui/AIProgressModal'
import { UnifiedActionButton } from '@/components/ui/UnifiedActionButton'
import { useLanguageStore } from '@/stores/languageStore'

interface SectionProps {
  project: Project
}

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

// Extended WikiEntry type for auto-linked entries
interface LinkedWikiEntry extends WikiEntry {
  isAutoLinked?: boolean
  linkedCharacterId?: string
}

export function WikiSection({ project }: SectionProps) {
  const navigate = useNavigate()
  const t = useLanguageStore((state) => state.t)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<WikiEntry | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<WikiCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { updateProject: updateProjectStore, setSaveStatus } = useProjectStore()

  // Wiki categories with translated labels
  const wikiCategories: { value: WikiCategory | 'all'; label: string }[] = useMemo(() => [
    { value: 'all', label: t.wiki.allCategories },
    { value: 'locations', label: t.wiki.locations },
    { value: 'characters', label: t.wiki.characters },
    { value: 'timeline', label: t.wiki.timeline },
    { value: 'magicTechnology', label: t.wiki.magicTechnology },
    { value: 'culturesFactions', label: t.wiki.culturesFactions },
    { value: 'objects', label: t.wiki.objects },
    { value: 'terminology', label: t.wiki.terminology },
    { value: 'rules', label: t.wiki.rules },
  ], [t])

  // AI Generation
  const { generate, isGenerating, progress, message, status, cancel, reset: resetAI } = useAIGeneration()
  const [showAIProgress, setShowAIProgress] = useState(false)
  const [aiProgressTitle, setAIProgressTitle] = useState(t.wiki.extractingElements)
  const [extractedEntries, setExtractedEntries] = useState<{ name: string; category: WikiCategory; description: string }[]>([])
  const [showExtractedModal, setShowExtractedModal] = useState(false)
  const [expandingEntryId, setExpandingEntryId] = useState<string | null>(null)

  // Extract wiki elements from chapters
  const handleExtractFromChapters = async () => {
    const chapters = project.chapters || []
    if (chapters.length === 0 || !chapters.some(c => c.content)) {
      toast({ title: t.wiki.noChapterContent, variant: 'error' })
      return
    }

    setAIProgressTitle(t.wiki.extractingElements)
    setShowAIProgress(true)

    try {
      const result = await generate({
        agentTarget: 'wiki',
        action: 'extract-elements',
        context: {
          chapters: chapters.filter(c => c.content).map(c => ({
            number: c.number,
            title: c.title,
            content: c.content?.substring(0, 3000), // Limit content
          })),
          existingEntries: wikiEntries.map(e => e.name),
          specification: project.specification,
        },
      })

      if (result) {
        try {
          const parsed = JSON.parse(result)
          if (Array.isArray(parsed)) {
            setExtractedEntries(parsed)
          } else {
            setExtractedEntries([
              { name: 'The Old Manor', category: 'locations', description: 'A mysterious building mentioned in the story' },
              { name: 'The Binding Oath', category: 'terminology', description: 'A sacred promise with magical consequences' },
            ])
          }
        } catch {
          setExtractedEntries([
            { name: 'Sample Location', category: 'locations', description: 'A key location from the chapters' },
            { name: 'Sample Term', category: 'terminology', description: 'An important term used in the story' },
          ])
        }
        setShowExtractedModal(true)
      }
    } catch (error) {
      console.error('Failed to extract wiki elements:', error)
      toast({ title: t.wiki.failedToExtract, variant: 'error' })
    } finally {
      setShowAIProgress(false)
    }
  }

  // Add extracted entries to wiki
  const handleAddExtractedEntries = async () => {
    if (extractedEntries.length === 0) return

    try {
      setSaveStatus('saving')
      const newEntries: WikiEntry[] = extractedEntries.map(e => ({
        id: generateId(),
        category: e.category,
        name: e.name,
        description: e.description,
        tags: [],
        relatedEntries: [],
        sourceChapters: [],
      }))

      const updatedEntries = [...wikiEntries, ...newEntries]
      await updateProject(project.id, { worldbuildingEntries: updatedEntries })
      updateProjectStore(project.id, { worldbuildingEntries: updatedEntries })
      setSaveStatus('saved')
      setShowExtractedModal(false)
      setExtractedEntries([])
      toast({ title: `${t.wiki.addedEntries} (${newEntries.length})`, variant: 'success' })
    } catch (error) {
      console.error('Failed to add entries:', error)
      toast({ title: t.wiki.failedToAddEntries, variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  // Expand a wiki entry with more detail
  const handleExpandEntry = async (entry: WikiEntry) => {
    setExpandingEntryId(entry.id)
    setAIProgressTitle(`${t.wiki.expandingEntry}: ${entry.name}`)
    setShowAIProgress(true)

    try {
      const result = await generate({
        agentTarget: 'wiki',
        action: 'expand-entry',
        context: {
          entry: {
            name: entry.name,
            category: entry.category,
            description: entry.description,
            tags: entry.tags,
          },
          specification: project.specification,
          genre: project.specification?.genre,
        },
      })

      if (result) {
        setSaveStatus('saving')
        const updatedEntries = wikiEntries.map(e =>
          e.id === entry.id
            ? { ...e, description: result }
            : e
        )
        await updateProject(project.id, { worldbuildingEntries: updatedEntries })
        updateProjectStore(project.id, { worldbuildingEntries: updatedEntries })
        setSaveStatus('saved')
        toast({ title: `${t.wiki.expandedEntry} "${entry.name}"`, variant: 'success' })
      }
    } catch (error) {
      console.error('Failed to expand entry:', error)
      toast({ title: t.wiki.failedToExpandEntry, variant: 'error' })
    } finally {
      setShowAIProgress(false)
      setExpandingEntryId(null)
    }
  }

  const wikiEntries = project.worldbuildingEntries || []

  // Auto-link characters from Character Development section
  const autoLinkedCharacters: LinkedWikiEntry[] = useMemo(() => {
    return (project.characters || []).map((char: Character) => ({
      id: `auto-char-${char.id}`,
      category: 'characters' as WikiCategory,
      name: char.name,
      description: char.personalitySummary || `${char.role} character. ${char.backstory || ''}`.trim() || `A ${char.role} in the story.`,
      tags: [
        char.role,
        char.archetype,
        char.status,
        ...(char.aliases || [])
      ].filter(Boolean) as string[],
      relatedEntries: [],
      sourceChapters: char.scenesPresent || [],
      isAutoLinked: true,
      linkedCharacterId: char.id,
    }))
  }, [project.characters])

  const handleSaveEntry = async (entry: WikiEntry) => {
    try {
      setSaveStatus('saving')

      const isEditing = wikiEntries.some(e => e.id === entry.id)
      let updatedEntries: WikiEntry[]

      if (isEditing) {
        updatedEntries = wikiEntries.map(e => e.id === entry.id ? entry : e)
        toast({ title: `${t.wiki.wikiEntryUpdated}: "${entry.name}"`, variant: 'success' })
      } else {
        updatedEntries = [...wikiEntries, entry]
        toast({ title: `${t.wiki.wikiEntryCreated}: "${entry.name}"`, variant: 'success' })
      }

      await updateProject(project.id, { worldbuildingEntries: updatedEntries })
      updateProjectStore(project.id, { worldbuildingEntries: updatedEntries })
      setSaveStatus('saved')
      setEditingEntry(null)
    } catch (error) {
      console.error('Failed to save wiki entry:', error)
      toast({ title: t.wiki.failedToSaveEntry, variant: 'error' })
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
      toast({ title: `${t.wiki.wikiEntryDeleted}: "${entry?.name}"`, variant: 'success' })
    } catch (error) {
      console.error('Failed to delete wiki entry:', error)
      toast({ title: t.wiki.failedToDeleteEntry, variant: 'error' })
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

  // Combine wiki entries with auto-linked characters
  const allEntries: LinkedWikiEntry[] = useMemo(() => {
    return [...wikiEntries, ...autoLinkedCharacters]
  }, [wikiEntries, autoLinkedCharacters])

  // Filter entries by category and search
  const filteredEntries = allEntries.filter(entry => {
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
  }, {} as Record<WikiCategory, LinkedWikiEntry[]>)

  // Handle click on auto-linked character
  const handleCharacterClick = (_characterId: string) => {
    navigate(`/projects/${project.id}/characters`)
    // Could potentially scroll to specific character in future
  }

  const getCategoryLabel = (cat: WikiCategory) => {
    return wikiCategories.find(c => c.value === cat)?.label || cat
  }

  // Get chapter info by ID
  const getChapterInfo = (chapterId: string) => {
    const chapters = project.chapters || []
    const chapter = chapters.find(c => c.id === chapterId)
    if (!chapter) return null
    return { id: chapter.id, number: chapter.number, title: chapter.title }
  }

  // Navigate to chapter in Write section
  const handleNavigateToChapter = (chapterId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/projects/${project.id}/write/${chapterId}`)
  }

  // Get wiki entry info by ID
  const getWikiEntryInfo = (entryId: string) => {
    const entry = wikiEntries.find(e => e.id === entryId)
    if (!entry) return null
    return { id: entry.id, name: entry.name, category: entry.category }
  }

  // Navigate to related entry (scroll to it)
  const handleNavigateToEntry = (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const element = document.getElementById(`wiki-entry-${entryId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      element.classList.add('ring-2', 'ring-accent')
      setTimeout(() => element.classList.remove('ring-2', 'ring-accent'), 2000)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t.wiki.title}</h1>
          <p className="text-text-secondary mt-1">
            {t.wiki.subtitle}
          </p>
        </div>
        <UnifiedActionButton
          primaryAction={{
            id: 'add-entry',
            label: t.wiki.addEntry,
            icon: Plus,
            onClick: () => handleOpenModal(),
          }}
          secondaryActions={[
            {
              id: 'extract-chapters',
              label: t.wiki.extractFromChapters,
              description: t.wiki.extractFromChaptersDesc,
              icon: Sparkles,
              onClick: handleExtractFromChapters,
              disabled: isGenerating,
              variant: 'accent',
            },
          ]}
          size="sm"
          disabled={isGenerating}
        />
      </div>

      {allEntries.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="h-12 w-12 text-text-secondary mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-medium text-text-primary mb-2">{t.wiki.noEntriesYet}</h3>
          <p className="text-text-secondary mb-4">
            {t.wiki.startBuildingWorld}
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t.wiki.createFirstEntry}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-text-secondary" aria-hidden="true" />
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value as WikiCategory | 'all')}
                className="px-3 py-1.5 bg-surface-elevated border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {wikiCategories.map(cat => (
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
                placeholder={t.wiki.searchEntries}
                className="w-full px-3 py-1.5 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="text-sm text-text-secondary">
            {filteredEntries.length} / {allEntries.length} {t.wiki.entries}
            {autoLinkedCharacters.length > 0 && (
              <span className="ml-2 text-purple-400">
                ({autoLinkedCharacters.length} {t.wiki.autoLinkedFrom})
              </span>
            )}
          </div>

          {/* Entry List grouped by category */}
          {filteredEntries.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-text-secondary">{t.wiki.noMatchingEntries}</p>
              <button
                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                className="mt-2 text-sm text-accent hover:underline"
              >
                {t.wiki.clearFilters}
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
                    {entries.map(entry => {
                      const linkedEntry = entry as LinkedWikiEntry
                      const isAutoLinked = linkedEntry.isAutoLinked

                      return (
                      <div
                        key={entry.id}
                        id={`wiki-entry-${entry.id}`}
                        className={`card hover:border-accent/50 transition-all duration-300 group ${isAutoLinked ? 'cursor-pointer border-purple-500/30' : ''}`}
                        onClick={isAutoLinked && linkedEntry.linkedCharacterId ? () => handleCharacterClick(linkedEntry.linkedCharacterId!) : undefined}
                        role={isAutoLinked ? 'button' : undefined}
                        tabIndex={isAutoLinked ? 0 : undefined}
                        onKeyDown={isAutoLinked && linkedEntry.linkedCharacterId ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleCharacterClick(linkedEntry.linkedCharacterId!)
                          }
                        } : undefined}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-text-primary flex items-center gap-2">
                              {entry.name}
                              {isAutoLinked && (
                                <span title={t.wiki.autoLinkedFrom}><Link2 className="h-4 w-4 text-purple-400" aria-hidden="true" /></span>
                              )}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[entry.category] || 'bg-text-secondary/20 text-text-secondary'}`}>
                                {getCategoryLabel(entry.category)}
                              </span>
                              {isAutoLinked && (
                                <span className="text-xs text-purple-400">
                                  {t.wiki.clickToViewCharacters}
                                </span>
                              )}
                            </div>
                          </div>
                          {!isAutoLinked && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleExpandEntry(entry); }}
                                disabled={isGenerating}
                                className="p-1.5 rounded-md hover:bg-accent/10 transition-colors disabled:opacity-50"
                                aria-label={t.actions.expand}
                                title={t.wiki.expandWithAI}
                              >
                                <Wand2 className="h-4 w-4 text-accent" aria-hidden="true" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenModal(entry); }}
                                className="p-1.5 rounded-md hover:bg-surface-elevated transition-colors"
                                aria-label={t.wiki.editEntry}
                                title={t.wiki.editEntry}
                              >
                                <Edit2 className="h-4 w-4 text-text-secondary" aria-hidden="true" />
                              </button>
                              {deleteConfirmId === entry.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteEntry(entry.id); }}
                                    className="px-2 py-1 text-xs bg-error text-white rounded hover:bg-error/90"
                                  >
                                    {t.common.confirm}
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                                    className="px-2 py-1 text-xs border border-border rounded hover:bg-surface-elevated"
                                  >
                                    {t.actions.cancel}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(entry.id); }}
                                  className="p-1.5 rounded-md hover:bg-error/10 transition-colors"
                                  aria-label={t.wiki.deleteEntry}
                                  title={t.wiki.deleteEntry}
                                >
                                  <Trash2 className="h-4 w-4 text-error" aria-hidden="true" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                          {entry.description}
                        </p>

                        {entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {entry.tags.slice(0, 4).map((tag, idx) => (
                              <span
                                key={`${tag}-${idx}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-surface-elevated text-text-secondary text-xs rounded"
                              >
                                <Tag className="h-3 w-3" aria-hidden="true" />
                                {tag}
                              </span>
                            ))}
                            {entry.tags.length > 4 && (
                              <span className="text-xs text-text-secondary">
                                +{entry.tags.length - 4} {t.wiki.more}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Source Chapters */}
                        {entry.sourceChapters && entry.sourceChapters.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border">
                            <div className="flex items-center gap-1 flex-wrap text-xs">
                              <span className="flex items-center gap-1 text-text-secondary">
                                <FileText className="h-3 w-3" aria-hidden="true" />
                                {t.wiki.sources}
                              </span>
                              {entry.sourceChapters.map(chapterId => {
                                const chapterInfo = getChapterInfo(chapterId)
                                if (!chapterInfo) return null
                                return (
                                  <button
                                    key={chapterId}
                                    onClick={(e) => handleNavigateToChapter(chapterId, e)}
                                    className="px-1.5 py-0.5 bg-success/10 text-success rounded hover:bg-success/20 transition-colors"
                                  >
                                    Ch. {chapterInfo.number}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Related Entries */}
                        {entry.relatedEntries && entry.relatedEntries.length > 0 && (
                          <div className={`mt-2 pt-2 ${entry.sourceChapters && entry.sourceChapters.length > 0 ? '' : 'border-t border-border'}`}>
                            <div className="flex items-center gap-1 flex-wrap text-xs">
                              <span className="flex items-center gap-1 text-text-secondary">
                                <Link2 className="h-3 w-3" aria-hidden="true" />
                                {t.wiki.related}
                              </span>
                              {entry.relatedEntries.map(relatedId => {
                                const relatedInfo = getWikiEntryInfo(relatedId)
                                if (!relatedInfo) return null
                                return (
                                  <button
                                    key={relatedId}
                                    onClick={(e) => handleNavigateToEntry(relatedId, e)}
                                    className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded hover:bg-purple-500/20 transition-colors"
                                  >
                                    {relatedInfo.name}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      )
                    })}
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
        chapters={project.chapters || []}
        wikiEntries={wikiEntries}
      />

      {/* AI Progress Modal */}
      <AIProgressModal
        isOpen={showAIProgress}
        onClose={() => {
          setShowAIProgress(false)
          resetAI()
        }}
        onCancel={cancel}
        status={status}
        title={aiProgressTitle}
        progress={progress}
        message={message}
      />

      {/* Extracted Entries Modal */}
      {showExtractedModal && extractedEntries.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowExtractedModal(false)
              setExtractedEntries([])
            }}
          />
          <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-2xl mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-text-primary">
                  {t.wiki.extractedElements}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowExtractedModal(false)
                  setExtractedEntries([])
                }}
                className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
              >
                <X className="h-5 w-5 text-text-secondary" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-text-secondary mb-4">
                {t.wiki.foundPotentialEntries} ({extractedEntries.length})
              </p>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {extractedEntries.map((entry, index) => (
                  <div key={index} className="p-3 bg-surface-elevated border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-text-primary">{entry.name}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[entry.category]}`}>
                        {getCategoryLabel(entry.category)}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary">{entry.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowExtractedModal(false)
                  setExtractedEntries([])
                }}
                className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-elevated transition-colors"
              >
                {t.actions.cancel}
              </button>
              <button
                onClick={handleAddExtractedEntries}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                {t.wiki.addAllToWiki}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
