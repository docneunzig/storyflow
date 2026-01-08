import { useState } from 'react'
import { Plus, Film, Edit2, Trash2, Clock, Target, Zap, BookOpen, GitBranch, ArrowRight, ArrowLeft } from 'lucide-react'
import type { Project, Scene } from '@/types/project'
import { useProjectStore } from '@/stores/projectStore'
import { updateProject } from '@/lib/db'
import { SceneModal } from '@/components/ui/SceneModal'
import { toast } from '@/components/ui/Toaster'

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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingScene, setEditingScene] = useState<Scene | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const { updateProject: updateProjectStore, setSaveStatus } = useProjectStore()

  const handleSaveScene = async (scene: Scene) => {
    try {
      setSaveStatus('saving')

      const isEditing = project.scenes.some(s => s.id === scene.id)
      let updatedScenes: Scene[]

      if (isEditing) {
        updatedScenes = project.scenes.map(s =>
          s.id === scene.id ? scene : s
        )
        toast({ title: `Scene "${scene.title}" updated`, variant: 'success' })
      } else {
        updatedScenes = [...project.scenes, scene]
        toast({ title: `Scene "${scene.title}" created`, variant: 'success' })
      }

      // Update character scenesPresent based on charactersPresent in scenes
      const updatedCharacters = updateCharacterScenes(project.characters || [], updatedScenes)

      await updateProject(project.id, { scenes: updatedScenes, characters: updatedCharacters })
      updateProjectStore(project.id, { scenes: updatedScenes, characters: updatedCharacters })
      setSaveStatus('saved')
      setEditingScene(null)
    } catch (error) {
      console.error('Failed to save scene:', error)
      toast({ title: 'Failed to save scene', variant: 'error' })
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
      toast({ title: `Scene "${scene?.title}" deleted`, variant: 'success' })
    } catch (error) {
      console.error('Failed to delete scene:', error)
      toast({ title: 'Failed to delete scene', variant: 'error' })
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

  const scenes = project.scenes || []
  const characters = project.characters || []
  const chapters = project.chapters || []
  const plotBeats = project.plot?.beats || []
  const worldbuildingEntries = project.worldbuildingEntries || []
  const locations = worldbuildingEntries.filter(entry => entry.category === 'locations')

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
          <h1 className="text-2xl font-bold text-text-primary">Scenes</h1>
          <p className="text-text-secondary mt-1">
            Build detailed scene blueprints with timeline and chapter views.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New Scene
        </button>
      </div>

      {scenes.length === 0 ? (
        <div className="card text-center py-12">
          <Film className="h-12 w-12 text-text-secondary mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No scenes yet</h3>
          <p className="text-text-secondary mb-4">
            Start building your story by creating scene blueprints.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create First Scene
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Scene Timeline View */}
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm text-text-secondary">
              {scenes.length} scene{scenes.length !== 1 ? 's' : ''} |
              {' '}{scenes.reduce((acc, s) => acc + s.estimatedWordCount, 0).toLocaleString()} estimated words
            </span>
          </div>

          {/* Scene Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {scenes.map((scene, index) => (
              <div
                key={scene.id}
                className="card hover:border-accent/50 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-medium text-sm">
                      {index + 1}
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
                      POV: {getCharacterName(scene.povCharacterId)}
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
                    ~{scene.estimatedWordCount.toLocaleString()} words
                  </span>
                </div>

                {(scene.openingEmotion || scene.closingEmotion) && (
                  <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-text-secondary">
                    {scene.openingEmotion && (
                      <span className="bg-surface-elevated px-2 py-0.5 rounded">
                        Start: {scene.openingEmotion}
                      </span>
                    )}
                    {scene.openingEmotion && scene.closingEmotion && (
                      <span className="text-text-secondary">→</span>
                    )}
                    {scene.closingEmotion && (
                      <span className="bg-surface-elevated px-2 py-0.5 rounded">
                        End: {scene.closingEmotion}
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
                          Sets up:
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
                          Pays off:
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
    </div>
  )
}
