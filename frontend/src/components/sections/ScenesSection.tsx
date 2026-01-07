import { useState } from 'react'
import { Plus, Film, Edit2, Trash2, Clock, Target, Zap } from 'lucide-react'
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

      await updateProject(project.id, { scenes: updatedScenes })
      updateProjectStore(project.id, { scenes: updatedScenes })
      setSaveStatus('saved')
      setEditingScene(null)
    } catch (error) {
      console.error('Failed to save scene:', error)
      toast({ title: 'Failed to save scene', variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  const handleDeleteScene = async (sceneId: string) => {
    try {
      setSaveStatus('saving')
      const scene = project.scenes.find(s => s.id === sceneId)
      const updatedScenes = project.scenes.filter(s => s.id !== sceneId)
      await updateProject(project.id, { scenes: updatedScenes })
      updateProjectStore(project.id, { scenes: updatedScenes })
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

  // Get character name by ID
  const getCharacterName = (id: string | null) => {
    if (!id) return null
    const char = characters.find(c => c.id === id)
    return char?.name || null
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
          <Plus className="h-4 w-4" />
          New Scene
        </button>
      </div>

      {scenes.length === 0 ? (
        <div className="card text-center py-12">
          <Film className="h-12 w-12 text-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No scenes yet</h3>
          <p className="text-text-secondary mb-4">
            Start building your story by creating scene blueprints.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
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
                            <Zap className="h-3 w-3 inline mr-0.5" />
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
                      title="Edit scene"
                    >
                      <Edit2 className="h-4 w-4 text-text-secondary" />
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
                        title="Delete scene"
                      >
                        <Trash2 className="h-4 w-4 text-error" />
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
                      <Clock className="h-3 w-3" />
                      {scene.timeInStory}
                    </span>
                  )}
                  {scene.sceneGoal && (
                    <span className="flex items-center gap-1 text-text-secondary bg-surface-elevated px-2 py-0.5 rounded">
                      <Target className="h-3 w-3" />
                      {scene.sceneGoal.length > 30 ? scene.sceneGoal.substring(0, 30) + '...' : scene.sceneGoal}
                    </span>
                  )}
                  {getCharacterName(scene.povCharacterId) && (
                    <span className="text-accent bg-accent/10 px-2 py-0.5 rounded">
                      POV: {getCharacterName(scene.povCharacterId)}
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
      />
    </div>
  )
}
