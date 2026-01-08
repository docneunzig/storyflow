import { useState } from 'react'
import { Plus, Target, Edit2, Trash2, Users, MapPin, BookOpen, Layers } from 'lucide-react'
import type { Project, PlotBeat, PlotStructure, PlotFramework } from '@/types/project'
import { useProjectStore } from '@/stores/projectStore'
import { updateProject } from '@/lib/db'
import { PlotBeatModal } from '@/components/ui/PlotBeatModal'
import { toast } from '@/components/ui/Toaster'

interface SectionProps {
  project: Project
}

const FRAMEWORKS: { value: PlotFramework; label: string; description: string }[] = [
  { value: 'Three-Act Structure', label: 'Three-Act Structure', description: 'Classic setup, confrontation, resolution' },
  { value: "Hero's Journey", label: "Hero's Journey", description: "Campbell's monomyth with 12 stages" },
  { value: 'Save the Cat', label: 'Save the Cat', description: 'Blake Snyder\'s 15-beat structure' },
  { value: 'Seven-Point Structure', label: 'Seven-Point Structure', description: 'Dan Wells\' focused plot points' },
  { value: 'Freeform', label: 'Freeform', description: 'Create your own structure' },
]

const STATUS_COLORS: Record<string, string> = {
  outline: 'bg-text-secondary/20 text-text-secondary border-text-secondary/30',
  drafted: 'bg-accent/20 text-accent border-accent/30',
  revised: 'bg-success/20 text-success border-success/30',
  locked: 'bg-warning/20 text-warning border-warning/30',
}

export function PlotSection({ project }: SectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBeat, setEditingBeat] = useState<PlotBeat | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const { updateProject: updateProjectStore, setSaveStatus } = useProjectStore()

  // Initialize plot structure if needed
  const plot: PlotStructure = project.plot || {
    framework: 'Three-Act Structure',
    beats: [],
    overallArc: '',
    centralConflict: '',
    stakes: '',
  }

  const handleFrameworkChange = async (framework: PlotFramework) => {
    try {
      setSaveStatus('saving')
      const updatedPlot: PlotStructure = {
        ...plot,
        framework,
      }
      await updateProject(project.id, { plot: updatedPlot })
      updateProjectStore(project.id, { plot: updatedPlot })
      setSaveStatus('saved')
      toast({ title: `Framework changed to ${framework}`, variant: 'success' })
    } catch (error) {
      console.error('Failed to change framework:', error)
      toast({ title: 'Failed to change framework', variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  const handleSaveBeat = async (beat: PlotBeat) => {
    try {
      setSaveStatus('saving')

      const isEditing = plot.beats.some(b => b.id === beat.id)
      let updatedBeats: PlotBeat[]

      if (isEditing) {
        updatedBeats = plot.beats.map(b => b.id === beat.id ? beat : b)
        toast({ title: `Beat "${beat.title}" updated`, variant: 'success' })
      } else {
        updatedBeats = [...plot.beats, beat]
        toast({ title: `Beat "${beat.title}" created`, variant: 'success' })
      }

      const updatedPlot: PlotStructure = {
        ...plot,
        beats: updatedBeats,
      }

      await updateProject(project.id, { plot: updatedPlot })
      updateProjectStore(project.id, { plot: updatedPlot })
      setSaveStatus('saved')
      setEditingBeat(null)
    } catch (error) {
      console.error('Failed to save beat:', error)
      toast({ title: 'Failed to save beat', variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  const handleDeleteBeat = async (beatId: string) => {
    try {
      setSaveStatus('saving')
      const beat = plot.beats.find(b => b.id === beatId)
      const updatedBeats = plot.beats.filter(b => b.id !== beatId)
      const updatedPlot: PlotStructure = {
        ...plot,
        beats: updatedBeats,
      }
      await updateProject(project.id, { plot: updatedPlot })
      updateProjectStore(project.id, { plot: updatedPlot })
      setSaveStatus('saved')
      setDeleteConfirmId(null)
      toast({ title: `Beat "${beat?.title}" deleted`, variant: 'success' })
    } catch (error) {
      console.error('Failed to delete beat:', error)
      toast({ title: 'Failed to delete beat', variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  const handleOpenModal = (beat?: PlotBeat) => {
    setEditingBeat(beat || null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingBeat(null)
  }

  const characters = project.characters || []

  // Get character name by ID
  const getCharacterName = (id: string) => {
    const char = characters.find(c => c.id === id)
    return char?.name || 'Unknown'
  }

  // Sort beats by timeline position
  const sortedBeats = [...plot.beats].sort((a, b) => a.timelinePosition - b.timelinePosition)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Plot Development</h1>
          <p className="text-text-secondary mt-1">
            Transform your story seed into a fully structured plot.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Beat
        </button>
      </div>

      {/* Framework Selection */}
      <div className="card mb-6">
        <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-accent" aria-hidden="true" />
          Plot Framework
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {FRAMEWORKS.map(fw => (
            <button
              key={fw.value}
              onClick={() => handleFrameworkChange(fw.value)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                plot.framework === fw.value
                  ? 'border-accent bg-accent/10'
                  : 'border-border hover:border-accent/50'
              }`}
            >
              <div className="font-medium text-text-primary text-sm">{fw.label}</div>
              <div className="text-xs text-text-secondary mt-0.5">{fw.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Plot Beats */}
      {sortedBeats.length === 0 ? (
        <div className="card text-center py-12">
          <Target className="h-12 w-12 text-text-secondary mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No plot beats yet</h3>
          <p className="text-text-secondary mb-4">
            Start building your plot structure by adding story beats.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create First Beat
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stats */}
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm text-text-secondary">
              {sortedBeats.length} beat{sortedBeats.length !== 1 ? 's' : ''} |
              {' '}{sortedBeats.reduce((acc, b) => acc + b.wordCountEstimate, 0).toLocaleString()} estimated words
            </span>
          </div>

          {/* Beat Cards */}
          <div className="space-y-3">
            {sortedBeats.map((beat, index) => (
              <div
                key={beat.id}
                className="card hover:border-accent/50 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Position indicator */}
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-sm shrink-0">
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-medium text-text-primary">{beat.title}</h3>
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[beat.status] || STATUS_COLORS.outline}`}>
                          {beat.status.charAt(0).toUpperCase() + beat.status.slice(1)}
                        </span>
                        {beat.frameworkPosition && (
                          <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded">
                            {beat.frameworkPosition}
                          </span>
                        )}
                      </div>

                      {/* Summary */}
                      <p className="text-sm text-text-secondary mb-3">
                        {beat.summary}
                      </p>

                      {/* Metadata */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {beat.charactersInvolved.length > 0 && (
                          <span className="flex items-center gap-1 text-text-secondary bg-surface-elevated px-2 py-0.5 rounded">
                            <Users className="h-3 w-3" aria-hidden="true" />
                            {beat.charactersInvolved.map(id => getCharacterName(id)).join(', ')}
                          </span>
                        )}
                        {beat.location && (
                          <span className="flex items-center gap-1 text-text-secondary bg-surface-elevated px-2 py-0.5 rounded">
                            <MapPin className="h-3 w-3" aria-hidden="true" />
                            {beat.location}
                          </span>
                        )}
                        {beat.chapterTarget && (
                          <span className="flex items-center gap-1 text-text-secondary bg-surface-elevated px-2 py-0.5 rounded">
                            <BookOpen className="h-3 w-3" aria-hidden="true" />
                            Ch. {beat.chapterTarget}
                          </span>
                        )}
                        <span className="text-text-secondary bg-surface-elevated px-2 py-0.5 rounded">
                          ~{beat.wordCountEstimate.toLocaleString()} words
                        </span>
                      </div>

                      {/* Emotional Arc & Stakes */}
                      {(beat.emotionalArc || beat.stakes) && (
                        <div className="mt-2 pt-2 border-t border-border/50 flex flex-wrap gap-3 text-xs">
                          {beat.emotionalArc && (
                            <span className="text-text-secondary">
                              <span className="text-text-primary font-medium">Emotion:</span> {beat.emotionalArc}
                            </span>
                          )}
                          {beat.stakes && (
                            <span className="text-text-secondary">
                              <span className="text-text-primary font-medium">Stakes:</span> {beat.stakes}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                    {beat.status === 'locked' ? (
                      <span className="text-xs text-warning px-2 py-1 bg-warning/10 rounded" title="This beat is locked and cannot be edited">
                        🔒 Locked
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenModal(beat)}
                        className="p-1.5 rounded-md hover:bg-surface-elevated transition-colors"
                        aria-label="Edit beat"
                        title="Edit beat"
                      >
                        <Edit2 className="h-4 w-4 text-text-secondary" aria-hidden="true" />
                      </button>
                    )}
                    {deleteConfirmId === beat.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeleteBeat(beat.id)}
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
                        onClick={() => setDeleteConfirmId(beat.id)}
                        className="p-1.5 rounded-md hover:bg-error/10 transition-colors"
                        aria-label="Delete beat"
                        title="Delete beat"
                      >
                        <Trash2 className="h-4 w-4 text-error" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plot Beat Modal */}
      <PlotBeatModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveBeat}
        editBeat={editingBeat}
        characters={characters}
        framework={plot.framework}
      />
    </div>
  )
}
