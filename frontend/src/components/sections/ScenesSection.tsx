import { useState, useMemo } from 'react'
import { Plus, Film, Edit2, Trash2, Clock, Target, Zap, BookOpen, GitBranch, ArrowRight, ArrowLeft, GripVertical, LayoutGrid, LayoutList, Layers, Grid3X3, Sparkles, X, FileText, Wand2 } from 'lucide-react'
import type { Project, Scene, Chapter } from '@/types/project'
import { useProjectStore } from '@/stores/projectStore'
import { useLanguageStore } from '@/stores/languageStore'
import { updateProject } from '@/lib/db'
import { SceneModal } from '@/components/ui/SceneModal'
import { SceneTimeline } from '@/components/ui/SceneTimeline'
import { SceneCharacterMatrix } from '@/components/ui/SceneCharacterMatrix'
import { toast } from '@/components/ui/Toaster'
import { useAIGeneration } from '@/hooks/useAIGeneration'
import { AIProgressModal } from '@/components/ui/AIProgressModal'
import { UnifiedActionButton } from '@/components/ui/UnifiedActionButton'

interface SceneOption {
  title: string
  summary: string
  conflictType: string
  conflictDescription: string
  sceneGoal: string
  openingEmotion: string
  closingEmotion: string
  pacing: string
  tone: string
}

type ViewMode = 'cards' | 'timeline' | 'chapters' | 'matrix'

interface SectionProps {
  project: Project
}

const STATUS_COLORS: Record<string, string> = {
  outline: 'bg-text-secondary/20 text-text-secondary border-text-secondary/30',
  drafted: 'bg-accent/20 text-accent border-accent/30',
  revised: 'bg-success/20 text-success border-success/30',
  locked: 'bg-warning/20 text-warning border-warning/30',
}

const PACING_COLORS: Record<string, string> = {
  Slow: 'text-blue-400',
  Moderate: 'text-text-secondary',
  Fast: 'text-orange-400',
  Intense: 'text-error',
}

export function ScenesSection({ project }: SectionProps) {
  const t = useLanguageStore((state) => state.t)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingScene, setEditingScene] = useState<Scene | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null)
  const [dragOverSceneId, setDragOverSceneId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [showAIProgress, setShowAIProgress] = useState(false)
  const [aiProgressTitle, setAIProgressTitle] = useState(t.scenes.generatingSceneOptions)
  const [sceneOptions, setSceneOptions] = useState<SceneOption[]>([])
  const [showOptionsModal, setShowOptionsModal] = useState(false)
  const [showProseModal, setShowProseModal] = useState(false)
  const [generatedProse, setGeneratedProse] = useState('')
  const [proseSceneId, setProseSceneId] = useState<string | null>(null)
  const { updateProject: updateProjectStore, setSaveStatus } = useProjectStore()
  const { generate, isGenerating, progress, message, status, cancel } = useAIGeneration()

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, sceneId: string) => {
    setDraggedSceneId(sceneId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', sceneId)
    // Add a slight delay to allow the drag image to be set
    setTimeout(() => {
      const element = e.target as HTMLElement
      element.style.opacity = '0.5'
    }, 0)
  }

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    const element = e.target as HTMLElement
    element.style.opacity = '1'
    setDraggedSceneId(null)
    setDragOverSceneId(null)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, sceneId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (sceneId !== draggedSceneId) {
      setDragOverSceneId(sceneId)
    }
  }

  const handleDragLeave = () => {
    setDragOverSceneId(null)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetSceneId: string) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('text/plain')

    if (!draggedId || draggedId === targetSceneId) {
      setDraggedSceneId(null)
      setDragOverSceneId(null)
      return
    }

    const scenes = project.scenes || []
    const draggedIndex = scenes.findIndex(s => s.id === draggedId)
    const targetIndex = scenes.findIndex(s => s.id === targetSceneId)

    if (draggedIndex === -1 || targetIndex === -1) return

    // Reorder scenes
    const newScenes = [...scenes]
    const [draggedScene] = newScenes.splice(draggedIndex, 1)
    newScenes.splice(targetIndex, 0, draggedScene)

    try {
      setSaveStatus('saving')
      await updateProject(project.id, { scenes: newScenes })
      updateProjectStore(project.id, { scenes: newScenes })
      setSaveStatus('saved')
      toast({ title: t.scenes.sceneOrderUpdated, variant: 'success' })
    } catch (error) {
      console.error('Failed to reorder scenes:', error)
      toast({ title: t.scenes.failedToReorderScenes, variant: 'error' })
      setSaveStatus('unsaved')
    }

    setDraggedSceneId(null)
    setDragOverSceneId(null)
  }

  const handleSaveScene = async (scene: Scene) => {
    try {
      setSaveStatus('saving')

      const isEditing = project.scenes.some(s => s.id === scene.id)
      let updatedScenes: Scene[]

      if (isEditing) {
        updatedScenes = project.scenes.map(s =>
          s.id === scene.id ? scene : s
        )
        toast({ title: `${t.scenes.sceneUpdated}: "${scene.title}"`, variant: 'success' })
      } else {
        updatedScenes = [...project.scenes, scene]
        toast({ title: `${t.scenes.sceneCreated}: "${scene.title}"`, variant: 'success' })
      }

      // Update character scenesPresent based on charactersPresent in scenes
      const updatedCharacters = updateCharacterScenes(project.characters || [], updatedScenes)

      await updateProject(project.id, { scenes: updatedScenes, characters: updatedCharacters })
      updateProjectStore(project.id, { scenes: updatedScenes, characters: updatedCharacters })
      setSaveStatus('saved')
      setEditingScene(null)
    } catch (error) {
      console.error('Failed to save scene:', error)
      toast({ title: t.scenes.failedToSaveScene, variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  // Update character scenesPresent arrays based on scene charactersPresent
  const updateCharacterScenes = (characters: typeof project.characters, scenes: Scene[]) => {
    return characters.map(char => {
      // Find all scenes where this character is present (POV or in charactersPresent)
      const presentInScenes = scenes
        .filter(scene =>
          scene.povCharacterId === char.id ||
          scene.charactersPresent?.includes(char.id)
        )
        .map(scene => scene.id)

      // Only update if scenesPresent has changed
      const currentScenes = char.scenesPresent || []
      const hasChanged =
        currentScenes.length !== presentInScenes.length ||
        !currentScenes.every(id => presentInScenes.includes(id))

      if (hasChanged) {
        return { ...char, scenesPresent: presentInScenes }
      }
      return char
    })
  }

  const handleDeleteScene = async (sceneId: string) => {
    try {
      setSaveStatus('saving')
      const scene = project.scenes.find(s => s.id === sceneId)
      const updatedScenes = project.scenes.filter(s => s.id !== sceneId)

      // Update character scenesPresent to remove deleted scene
      const updatedCharacters = updateCharacterScenes(project.characters || [], updatedScenes)

      await updateProject(project.id, { scenes: updatedScenes, characters: updatedCharacters })
      updateProjectStore(project.id, { scenes: updatedScenes, characters: updatedCharacters })
      setSaveStatus('saved')
      setDeleteConfirmId(null)
      toast({ title: `${t.scenes.sceneDeleted}: "${scene?.title}"`, variant: 'success' })
    } catch (error) {
      console.error('Failed to delete scene:', error)
      toast({ title: t.scenes.failedToDeleteScene, variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  const handleOpenModal = (scene?: Scene) => {
    setEditingScene(scene || null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingScene(null)
  }

  // Generate sample scene options (fallback when AI is unavailable)
  const generateSampleSceneOptions = (): SceneOption[] => {
    return [
      {
        title: 'The Confrontation',
        summary: 'Tensions reach a boiling point as characters face off in a high-stakes verbal duel that will change their relationship forever.',
        conflictType: 'Internal/External',
        conflictDescription: 'Character must choose between loyalty and truth while facing opposition from a trusted ally.',
        sceneGoal: 'Reveal hidden motivations and shift power dynamics',
        openingEmotion: 'Tense anticipation',
        closingEmotion: 'Shocked revelation',
        pacing: 'Fast',
        tone: 'Dramatic',
      },
      {
        title: 'The Discovery',
        summary: 'A seemingly innocent investigation leads to an unexpected discovery that raises more questions than answers.',
        conflictType: 'Mystery/Investigation',
        conflictDescription: 'Uncovering clues that point to a deeper conspiracy while dealing with misdirection.',
        sceneGoal: 'Plant crucial plot seeds and build intrigue',
        openingEmotion: 'Curious determination',
        closingEmotion: 'Unsettled realization',
        pacing: 'Moderate',
        tone: 'Suspenseful',
      },
      {
        title: 'The Quiet Before',
        summary: 'An intimate moment of reflection and connection between characters, allowing deeper bonds to form before coming challenges.',
        conflictType: 'Emotional/Relational',
        conflictDescription: 'Characters must overcome past hurts and miscommunications to forge a genuine connection.',
        sceneGoal: 'Deepen character relationships and provide emotional grounding',
        openingEmotion: 'Guarded vulnerability',
        closingEmotion: 'Hopeful connection',
        pacing: 'Slow',
        tone: 'Intimate',
      },
    ]
  }

  // Handle generating scene options with AI
  const handleGenerateSceneOptions = async () => {
    setShowAIProgress(true)
    try {
      const result = await generate({
        agentTarget: 'writer',
        action: 'generate-scene',
        context: {
          projectTitle: project.metadata.workingTitle,
          genre: project.specification?.genre,
          existingScenes: scenes.map(s => ({ title: s.title, summary: s.summary })),
          characters: characters.map(c => ({ name: c.name, role: c.role })),
        },
      })

      if (result) {
        try {
          const parsed = JSON.parse(result)
          if (parsed?.options && Array.isArray(parsed.options)) {
            setSceneOptions(parsed.options as SceneOption[])
          } else {
            setSceneOptions(generateSampleSceneOptions())
          }
        } catch {
          setSceneOptions(generateSampleSceneOptions())
        }
      } else {
        // Use sample data as fallback
        setSceneOptions(generateSampleSceneOptions())
      }
      setShowOptionsModal(true)
    } catch (error) {
      console.error('Failed to generate scene options:', error)
      // Use sample data as fallback
      setSceneOptions(generateSampleSceneOptions())
      setShowOptionsModal(true)
    } finally {
      setShowAIProgress(false)
    }
  }

  // Handle selecting a scene option
  const handleSelectSceneOption = async (option: SceneOption) => {
    const newScene: Scene = {
      id: `scene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: option.title,
      chapterId: null,
      sequenceInChapter: scenes.length + 1,
      plotBeatId: null,
      locationId: null,
      timeInStory: '',
      weatherAtmosphere: '',
      povCharacterId: null,
      charactersPresent: [],
      summary: option.summary,
      detailedOutline: '',
      openingHook: '',
      keyMoments: [],
      closingHook: '',
      sceneGoal: option.sceneGoal,
      conflictType: option.conflictType,
      conflictDescription: option.conflictDescription,
      characterGoals: [],
      openingEmotion: option.openingEmotion,
      closingEmotion: option.closingEmotion,
      tone: option.tone,
      estimatedWordCount: 1500,
      pacing: option.pacing,
      setupFor: [],
      payoffFor: [],
      status: 'outline',
      userNotes: '',
    }

    try {
      setSaveStatus('saving')
      const updatedScenes = [...scenes, newScene]
      await updateProject(project.id, { scenes: updatedScenes })
      updateProjectStore(project.id, { scenes: updatedScenes })
      setSaveStatus('saved')
      setShowOptionsModal(false)
      setSceneOptions([])
      toast({ title: `${t.scenes.sceneCreated}: "${newScene.title}"`, variant: 'success' })
    } catch (error) {
      console.error('Failed to create scene:', error)
      toast({ title: t.scenes.failedToSaveScene, variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  // Handle generating prose from scene outline
  const handleGenerateProse = async (scene: Scene, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()

    setProseSceneId(scene.id)
    setAIProgressTitle(`${t.scenes.generatingProse}: ${scene.title}`)
    setShowAIProgress(true)

    try {
      const result = await generate({
        agentTarget: 'writer',
        action: 'generate-scene-prose',
        context: {
          scene: {
            title: scene.title,
            summary: scene.summary,
            detailedOutline: scene.detailedOutline,
            sceneGoal: scene.sceneGoal,
            conflictType: scene.conflictType,
            conflictDescription: scene.conflictDescription,
            openingEmotion: scene.openingEmotion,
            closingEmotion: scene.closingEmotion,
            tone: scene.tone,
            pacing: scene.pacing,
            timeInStory: scene.timeInStory,
            weatherAtmosphere: scene.weatherAtmosphere,
          },
          povCharacter: characters.find(c => c.id === scene.povCharacterId),
          charactersPresent: scene.charactersPresent?.map(id => characters.find(c => c.id === id)).filter(Boolean),
          projectTitle: project.metadata.workingTitle,
          specification: project.specification,
        },
      })

      if (result) {
        setGeneratedProse(result)
        setShowProseModal(true)
      }
    } catch (error) {
      console.error('Failed to generate prose:', error)
      toast({ title: t.scenes.failedToGenerateProse, variant: 'error' })
    } finally {
      setShowAIProgress(false)
    }
  }

  // Accept generated prose and save to scene
  const handleAcceptProse = async () => {
    if (!proseSceneId || !generatedProse) return

    try {
      setSaveStatus('saving')
      const updatedScenes = scenes.map(s =>
        s.id === proseSceneId
          ? {
              ...s,
              detailedOutline: generatedProse,
              status: s.status === 'outline' ? 'drafted' : s.status,
            }
          : s
      )

      await updateProject(project.id, { scenes: updatedScenes })
      updateProjectStore(project.id, { scenes: updatedScenes })
      setSaveStatus('saved')
      setShowProseModal(false)
      setGeneratedProse('')
      setProseSceneId(null)

      const scene = scenes.find(s => s.id === proseSceneId)
      toast({ title: `${t.scenes.proseSavedTo} "${scene?.title}"`, variant: 'success' })
    } catch (error) {
      console.error('Failed to save prose:', error)
      toast({ title: t.scenes.failedToSaveProse, variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  const scenes = project.scenes || []
  const characters = project.characters || []
  const chapters = project.chapters || []
  const plotBeats = project.plot?.beats || []
  const worldbuildingEntries = project.worldbuildingEntries || []
  const locations = worldbuildingEntries.filter(entry => entry.category === 'locations')

  // Group scenes by chapter for chapter view
  const chapterGroups = useMemo(() => {
    const groups: { chapter: Chapter | null; scenes: Scene[]; wordCount: number }[] = []

    // Create a map of chapter ID to scenes
    const chapterSceneMap = new Map<string | null, Scene[]>()
    chapterSceneMap.set(null, []) // Unassigned scenes

    chapters.forEach(ch => {
      chapterSceneMap.set(ch.id, [])
    })

    scenes.forEach(scene => {
      const chapterId = scene.chapterId || null
      const existing = chapterSceneMap.get(chapterId)
      if (existing) {
        existing.push(scene)
      } else {
        // Chapter not found, add to unassigned
        chapterSceneMap.get(null)?.push(scene)
      }
    })

    // Convert to array sorted by chapter number
    chapters.sort((a, b) => a.number - b.number).forEach(ch => {
      const chapterScenes = chapterSceneMap.get(ch.id) || []
      if (chapterScenes.length > 0) {
        groups.push({
          chapter: ch,
          scenes: chapterScenes,
          wordCount: chapterScenes.reduce((sum, s) => sum + s.estimatedWordCount, 0)
        })
      }
    })

    // Add unassigned scenes at the end
    const unassignedScenes = chapterSceneMap.get(null) || []
    if (unassignedScenes.length > 0) {
      groups.push({
        chapter: null,
        scenes: unassignedScenes,
        wordCount: unassignedScenes.reduce((sum, s) => sum + s.estimatedWordCount, 0)
      })
    }

    return groups
  }, [scenes, chapters])

  // Get character name by ID
  const getCharacterName = (id: string | null) => {
    if (!id) return null
    const char = characters.find(c => c.id === id)
    return char?.name || null
  }

  // Get chapter info by ID
  const getChapterInfo = (id: string | null) => {
    if (!id) return null
    const chapter = chapters.find(c => c.id === id)
    if (!chapter) return null
    return {
      number: chapter.number,
      title: chapter.title
    }
  }

  // Get plot beat info by ID
  const getPlotBeatInfo = (id: string | null) => {
    if (!id) return null
    const beat = plotBeats.find(b => b.id === id)
    if (!beat) return null
    return {
      title: beat.title,
      frameworkPosition: beat.frameworkPosition
    }
  }

  // Get scene title by ID
  const getSceneTitle = (id: string) => {
    const scene = scenes.find(s => s.id === id)
    return scene?.title || null
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t.scenes.title}</h1>
          <p className="text-text-secondary mt-1">
            {t.scenes.subtitle}
          </p>
        </div>
        <UnifiedActionButton
          primaryAction={{
            id: 'new-scene',
            label: t.scenes.newScene,
            icon: Plus,
            onClick: () => handleOpenModal(),
          }}
          secondaryActions={[
            {
              id: 'generate-scenes',
              label: t.scenes.generate3Options,
              description: t.scenes.aiGeneratedSuggestions,
              icon: Sparkles,
              onClick: handleGenerateSceneOptions,
              disabled: isGenerating,
              variant: 'accent',
            },
          ]}
          size="sm"
          disabled={isGenerating}
        />
      </div>

      {scenes.length === 0 ? (
        <div className="card text-center py-12">
          <Film className="h-12 w-12 text-text-secondary mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-medium text-text-primary mb-2">{t.scenes.noScenesYet}</h3>
          <p className="text-text-secondary mb-4">
            {t.scenes.createScenesAssignChapters}
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t.scenes.createFirstScene}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Scene stats and view toggle */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-text-secondary">
              {scenes.length} {scenes.length !== 1 ? t.scenes.title.toLowerCase() : t.scenes.title.toLowerCase().slice(0, -1)} |
              {' '}{scenes.reduce((acc, s) => acc + s.estimatedWordCount, 0).toLocaleString()} {t.scenes.estimatedWords}
            </span>

            {/* View mode toggle */}
            <div className="flex items-center gap-1 bg-surface-elevated rounded-lg p-1 border border-border">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                }`}
                aria-label="Card view"
              >
                <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t.scenes.cards}</span>
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  viewMode === 'timeline'
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                }`}
                aria-label="Timeline view"
              >
                <LayoutList className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t.scenes.timeline}</span>
              </button>
              <button
                onClick={() => setViewMode('chapters')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  viewMode === 'chapters'
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                }`}
                aria-label="Chapter grouping view"
              >
                <Layers className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t.scenes.chapters}</span>
              </button>
              <button
                onClick={() => setViewMode('matrix')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  viewMode === 'matrix'
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                }`}
                aria-label="Character matrix view"
              >
                <Grid3X3 className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t.scenes.matrix}</span>
              </button>
            </div>
          </div>

          {/* Timeline View */}
          {viewMode === 'timeline' && (
            <SceneTimeline
              scenes={scenes}
              chapters={chapters}
              characters={characters}
              onSceneClick={(scene) => handleOpenModal(scene)}
            />
          )}

          {/* Matrix View */}
          {viewMode === 'matrix' && (
            <SceneCharacterMatrix
              scenes={scenes}
              characters={characters}
              onSceneClick={(scene) => handleOpenModal(scene)}
            />
          )}

          {/* Chapter Grouping View */}
          {viewMode === 'chapters' && (
            <div className="space-y-6">
              {chapterGroups.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  <p>{t.scenes.noScenesToDisplay}</p>
                </div>
              ) : (
                chapterGroups.map((group) => (
                  <div key={group.chapter?.id || 'unassigned'} className="card">
                    {/* Chapter header */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          group.chapter ? 'bg-accent/20' : 'bg-text-secondary/20'
                        }`}>
                          <BookOpen className={`h-5 w-5 ${group.chapter ? 'text-accent' : 'text-text-secondary'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-text-primary">
                            {group.chapter
                              ? `${t.scenes.chapters} ${group.chapter.number}: ${group.chapter.title}`
                              : t.scenes.unassignedScenes
                            }
                          </h3>
                          <p className="text-sm text-text-secondary">
                            {group.scenes.length} {group.scenes.length !== 1 ? t.scenes.title.toLowerCase() : t.scenes.title.toLowerCase().slice(0, -1)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-text-primary">
                          {group.wordCount.toLocaleString()}
                        </p>
                        <p className="text-xs text-text-secondary">{t.scenes.estimatedWords}</p>
                      </div>
                    </div>

                    {/* Scenes list */}
                    <div className="space-y-2">
                      {group.scenes.map((scene, idx) => (
                        <div
                          key={scene.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, scene.id)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOver(e, scene.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, scene.id)}
                          onClick={() => handleOpenModal(scene)}
                          className={`flex items-center gap-4 p-3 rounded-lg bg-surface hover:bg-surface-elevated cursor-move transition-all group ${
                            draggedSceneId === scene.id ? 'opacity-50' : ''
                          } ${
                            dragOverSceneId === scene.id ? 'ring-2 ring-accent scale-[1.02]' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <GripVertical className="h-4 w-4 text-text-secondary opacity-50 group-hover:opacity-100" />
                            <span className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-medium">
                              {idx + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-text-primary truncate">{scene.title}</h4>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[scene.status] || STATUS_COLORS.outline}`}>
                                {scene.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
                              {scene.timeInStory && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {scene.timeInStory}
                                </span>
                              )}
                              {getCharacterName(scene.povCharacterId) && (
                                <span className="text-accent">
                                  {t.scenes.pov}: {getCharacterName(scene.povCharacterId)}
                                </span>
                              )}
                              {scene.pacing && (
                                <span className={`flex items-center gap-1 ${PACING_COLORS[scene.pacing] || ''}`}>
                                  <Zap className="h-3 w-3" />
                                  {scene.pacing}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <span className="text-sm text-text-secondary">
                              ~{scene.estimatedWordCount.toLocaleString()} {t.scenes.words}
                            </span>
                          </div>
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit2 className="h-4 w-4 text-text-secondary" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}

              {/* Total word count summary */}
              <div className="card bg-surface-elevated">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">{t.scenes.totalEstimatedWords}</span>
                  <span className="text-xl font-bold text-text-primary">
                    {scenes.reduce((sum, s) => sum + s.estimatedWordCount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Scene Cards */}
          {viewMode === 'cards' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {scenes.map((scene, index) => (
              <div
                key={scene.id}
                draggable
                onDragStart={(e) => handleDragStart(e, scene.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, scene.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, scene.id)}
                className={`card hover:border-accent/50 transition-all group cursor-move ${
                  draggedSceneId === scene.id ? 'opacity-50' : ''
                } ${
                  dragOverSceneId === scene.id ? 'border-accent border-2 scale-[1.02]' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <GripVertical className="h-4 w-4 text-text-secondary opacity-50 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-medium text-sm">
                        {index + 1}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-text-primary">{scene.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[scene.status] || STATUS_COLORS.outline}`}>
                          {scene.status.charAt(0).toUpperCase() + scene.status.slice(1)}
                        </span>
                        {scene.pacing && (
                          <span className={`text-xs ${PACING_COLORS[scene.pacing] || 'text-text-secondary'}`}>
                            <Zap className="h-3 w-3 inline mr-0.5" aria-hidden="true" />
                            {scene.pacing}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleGenerateProse(scene, e)}
                      disabled={isGenerating}
                      className="p-1.5 rounded-md hover:bg-accent/10 transition-colors disabled:opacity-50"
                      aria-label={t.scenes.generateProse}
                      title={t.scenes.generateProse}
                    >
                      <Wand2 className="h-4 w-4 text-accent" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleOpenModal(scene)}
                      className="p-1.5 rounded-md hover:bg-surface-elevated transition-colors"
                      aria-label="Edit scene"
                      title="Edit scene"
                    >
                      <Edit2 className="h-4 w-4 text-text-secondary" aria-hidden="true" />
                    </button>
                    {deleteConfirmId === scene.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeleteScene(scene.id)}
                          className="px-2 py-1 text-xs bg-error text-white rounded hover:bg-error/90"
                        >
                          {t.common.confirm}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 text-xs border border-border rounded hover:bg-surface-elevated"
                        >
                          {t.actions.cancel}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(scene.id)}
                        className="p-1.5 rounded-md hover:bg-error/10 transition-colors"
                        aria-label="Delete scene"
                        title="Delete scene"
                      >
                        <Trash2 className="h-4 w-4 text-error" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

                {scene.summary && (
                  <p className="text-sm text-text-secondary line-clamp-2 mb-3">
                    {scene.summary}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 text-xs">
                  {scene.timeInStory && (
                    <span className="flex items-center gap-1 text-text-secondary bg-surface-elevated px-2 py-0.5 rounded">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {scene.timeInStory}
                    </span>
                  )}
                  {scene.sceneGoal && (
                    <span className="flex items-center gap-1 text-text-secondary bg-surface-elevated px-2 py-0.5 rounded">
                      <Target className="h-3 w-3" aria-hidden="true" />
                      {scene.sceneGoal.length > 30 ? scene.sceneGoal.substring(0, 30) + '...' : scene.sceneGoal}
                    </span>
                  )}
                  {getCharacterName(scene.povCharacterId) && (
                    <span className="text-accent bg-accent/10 px-2 py-0.5 rounded">
                      {t.scenes.pov}: {getCharacterName(scene.povCharacterId)}
                    </span>
                  )}
                  {getChapterInfo(scene.chapterId) && (
                    <span className="flex items-center gap-1 text-success bg-success/10 px-2 py-0.5 rounded">
                      <BookOpen className="h-3 w-3" aria-hidden="true" />
                      Ch. {getChapterInfo(scene.chapterId)?.number}: {getChapterInfo(scene.chapterId)?.title}
                    </span>
                  )}
                  {getPlotBeatInfo(scene.plotBeatId) && (
                    <span className="flex items-center gap-1 text-warning bg-warning/10 px-2 py-0.5 rounded">
                      <GitBranch className="h-3 w-3" aria-hidden="true" />
                      {getPlotBeatInfo(scene.plotBeatId)?.title}
                    </span>
                  )}
                  <span className="text-text-secondary bg-surface-elevated px-2 py-0.5 rounded">
                    ~{scene.estimatedWordCount.toLocaleString()} {t.scenes.words}
                  </span>
                </div>

                {(scene.openingEmotion || scene.closingEmotion) && (
                  <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-text-secondary">
                    {scene.openingEmotion && (
                      <span className="bg-surface-elevated px-2 py-0.5 rounded">
                        {t.scenes.start}: {scene.openingEmotion}
                      </span>
                    )}
                    {scene.openingEmotion && scene.closingEmotion && (
                      <span className="text-text-secondary">→</span>
                    )}
                    {scene.closingEmotion && (
                      <span className="bg-surface-elevated px-2 py-0.5 rounded">
                        {t.scenes.end}: {scene.closingEmotion}
                      </span>
                    )}
                  </div>
                )}

                {/* Setup/Payoff Connections */}
                {((scene.setupFor && scene.setupFor.length > 0) || (scene.payoffFor && scene.payoffFor.length > 0)) && (
                  <div className="mt-3 pt-3 border-t border-border text-xs">
                    {scene.setupFor && scene.setupFor.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap mb-1">
                        <span className="flex items-center gap-1 text-success">
                          <ArrowRight className="h-3 w-3" aria-hidden="true" />
                          {t.scenes.setsUp}
                        </span>
                        {scene.setupFor.map(id => {
                          const title = getSceneTitle(id)
                          return title ? (
                            <span key={id} className="bg-success/10 text-success px-1.5 py-0.5 rounded">
                              {title}
                            </span>
                          ) : null
                        })}
                      </div>
                    )}
                    {scene.payoffFor && scene.payoffFor.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="flex items-center gap-1 text-warning">
                          <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                          {t.scenes.paysOff}
                        </span>
                        {scene.payoffFor.map(id => {
                          const title = getSceneTitle(id)
                          return title ? (
                            <span key={id} className="bg-warning/10 text-warning px-1.5 py-0.5 rounded">
                              {title}
                            </span>
                          ) : null
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* Scene Modal */}
      <SceneModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveScene}
        editScene={editingScene}
        characters={characters}
        locations={locations}
        chapters={chapters}
        plotBeats={plotBeats}
        allScenes={scenes}
      />

      {/* AI Progress Modal */}
      <AIProgressModal
        isOpen={showAIProgress}
        onClose={() => setShowAIProgress(false)}
        onCancel={cancel}
        status={status}
        title={aiProgressTitle}
        progress={progress}
        message={message}
      />

      {/* Scene Options Selection Modal */}
      {showOptionsModal && sceneOptions.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowOptionsModal(false)}
          />
          <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-4xl mx-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-text-primary">
                  {t.scenes.chooseSceneApproach}
                </h2>
              </div>
              <button
                onClick={() => setShowOptionsModal(false)}
                className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
                aria-label={t.actions.close}
              >
                <X className="h-5 w-5 text-text-secondary" aria-hidden="true" />
              </button>
            </div>

            {/* Options Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-text-secondary mb-4">
                {t.scenes.selectSceneApproach}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sceneOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectSceneOption(option)}
                    className="text-left p-4 rounded-lg border border-border bg-surface-elevated hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-text-primary group-hover:text-purple-400 transition-colors">
                        {option.title}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        option.pacing === 'Fast' ? 'bg-orange-500/20 text-orange-400' :
                        option.pacing === 'Slow' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-text-secondary/20 text-text-secondary'
                      }`}>
                        {option.pacing}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary mb-3 line-clamp-3">
                      {option.summary}
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-error">{t.scenes.conflict}:</span>
                        <span className="text-text-secondary">{option.conflictType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-accent">{t.scenes.tone}:</span>
                        <span className="text-text-secondary">{option.tone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-success">{t.scenes.emotionArc}:</span>
                        <span className="text-text-secondary">{option.openingEmotion} → {option.closingEmotion}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setShowOptionsModal(false)}
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                {t.actions.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Prose Preview Modal */}
      {showProseModal && generatedProse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowProseModal(false)
              setGeneratedProse('')
              setProseSceneId(null)
            }}
          />
          <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-4xl mx-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-text-primary">
                  {t.scenes.generatedProse}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowProseModal(false)
                  setGeneratedProse('')
                  setProseSceneId(null)
                }}
                className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
                aria-label={t.actions.close}
              >
                <X className="h-5 w-5 text-text-secondary" aria-hidden="true" />
              </button>
            </div>

            {/* Prose Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-invert prose-lg max-w-none font-serif whitespace-pre-wrap">
                {generatedProse}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border flex justify-between items-center">
              <p className="text-sm text-text-secondary">
                {generatedProse.split(/\s+/).length.toLocaleString()} {t.scenes.words}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowProseModal(false)
                    setGeneratedProse('')
                    setProseSceneId(null)
                  }}
                  className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  {t.actions.cancel}
                </button>
                <button
                  onClick={handleAcceptProse}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
                >
                  {t.scenes.saveToScene}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
