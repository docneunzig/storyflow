import { useState, useCallback } from 'react'
import { Plus, Target, Edit2, Trash2, Users, MapPin, BookOpen, Layers, Sparkles } from 'lucide-react'
import type { Project, PlotBeat, PlotStructure, PlotFramework } from '@/types/project'
import { useProjectStore } from '@/stores/projectStore'
import { updateProject, generateId } from '@/lib/db'
import { PlotBeatModal } from '@/components/ui/PlotBeatModal'
import { toast } from '@/components/ui/Toaster'
import { useAIGeneration } from '@/hooks/useAIGeneration'
import { AIProgressModal } from '@/components/ui/AIProgressModal'

// Plot option interface for AI generation
interface PlotOption {
  title: string
  description: string
  approach: string
  beats: { position: string; title: string; summary: string }[]
}

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

  // AI generation state
  const [showAIProgress, setShowAIProgress] = useState(false)
  const [plotOptions, setPlotOptions] = useState<PlotOption[]>([])
  const [showOptionsModal, setShowOptionsModal] = useState(false)

  const {
    status: aiStatus,
    progress: aiProgress,
    message: aiMessage,
    error: aiError,
    isGenerating,
    generate,
    cancel,
    reset: resetAI,
  } = useAIGeneration()

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

  // Generate 3 plot options with AI
  const handleGeneratePlotOptions = useCallback(async () => {
    setShowAIProgress(true)

    const context = {
      specification: project.specification,
      characters: (project.characters || []).slice(0, 3).map(c => ({
        name: c.name,
        role: c.role,
        desires: c.desires,
        flaws: c.flaws,
      })),
      framework: plot.framework,
      existingBeats: plot.beats.length,
    }

    const result = await generate({
      agentTarget: 'plot',
      action: 'generate-3-options',
      context,
    })

    if (result) {
      try {
        const parsed = JSON.parse(result)
        if (Array.isArray(parsed) && parsed.length === 3) {
          setPlotOptions(parsed)
        } else {
          // Generate sample options if parsing fails
          setPlotOptions(generateSamplePlotOptions())
        }
      } catch {
        setPlotOptions(generateSamplePlotOptions())
      }
      setShowOptionsModal(true)
    }

    setShowAIProgress(false)
  }, [project, plot, generate])

  // Generate sample plot options (fallback)
  const generateSamplePlotOptions = (): PlotOption[] => {
    const spec = project.specification
    const genre = spec?.genre?.[0] || 'Fiction'
    const themes = spec?.themes || ['conflict', 'growth']

    return [
      {
        title: 'The Classic Journey',
        description: `A ${genre} story following the traditional narrative arc with emphasis on ${themes[0]}.`,
        approach: 'Character-driven with external conflict',
        beats: [
          { position: 'Act 1', title: 'The Ordinary World', summary: 'Introduce the protagonist in their everyday life' },
          { position: 'Act 1', title: 'Call to Adventure', summary: 'An inciting incident disrupts the status quo' },
          { position: 'Act 2', title: 'Tests and Trials', summary: 'The protagonist faces escalating challenges' },
          { position: 'Act 3', title: 'Climax', summary: 'The ultimate confrontation' },
          { position: 'Act 3', title: 'Resolution', summary: 'The new normal emerges' },
        ],
      },
      {
        title: 'The Internal Struggle',
        description: `An introspective ${genre} tale focusing on inner conflict and ${themes[1] || 'transformation'}.`,
        approach: 'Psychological depth with minimal external action',
        beats: [
          { position: 'Opening', title: 'The Wound', summary: 'Reveal the protagonist\'s deep-seated fear or flaw' },
          { position: 'Rising', title: 'The Trigger', summary: 'An event forces confrontation with the wound' },
          { position: 'Middle', title: 'False Solution', summary: 'Initial attempts to avoid real change' },
          { position: 'Crisis', title: 'Dark Night', summary: 'Complete breakdown before transformation' },
          { position: 'Resolution', title: 'Integration', summary: 'Genuine healing and growth' },
        ],
      },
      {
        title: 'The Dual Timeline',
        description: `A ${genre} narrative weaving past and present to explore ${themes.join(' and ')}.`,
        approach: 'Non-linear storytelling with parallel revelations',
        beats: [
          { position: 'Present', title: 'Mystery Established', summary: 'A compelling question drives the narrative' },
          { position: 'Past', title: 'Origins', summary: 'The seeds of current conflict are planted' },
          { position: 'Present', title: 'Investigation', summary: 'Active pursuit of truth' },
          { position: 'Past', title: 'The Event', summary: 'The pivotal moment that changed everything' },
          { position: 'Convergence', title: 'Revelation', summary: 'Past and present collide in understanding' },
        ],
      },
    ]
  }

  // Apply selected plot option
  const handleSelectPlotOption = async (option: PlotOption) => {
    try {
      setSaveStatus('saving')

      const newBeats: PlotBeat[] = option.beats.map((b, i) => ({
        id: generateId(),
        frameworkPosition: b.position,
        title: b.title,
        summary: b.summary,
        detailedDescription: '',
        charactersInvolved: [],
        location: null,
        timelinePosition: i + 1,
        chapterTarget: null,
        emotionalArc: '',
        stakes: '',
        wordCountEstimate: 3000,
        status: 'outline' as const,
      }))

      const updatedPlot: PlotStructure = {
        ...plot,
        beats: newBeats,
        overallArc: option.description,
      }

      await updateProject(project.id, { plot: updatedPlot })
      updateProjectStore(project.id, { plot: updatedPlot })
      setSaveStatus('saved')
      setShowOptionsModal(false)
      setPlotOptions([])
      toast({ title: `Applied "${option.title}" plot structure`, variant: 'success' })
    } catch (error) {
      console.error('Failed to apply plot option:', error)
      toast({ title: 'Failed to apply plot option', variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  const handleCloseAIProgress = useCallback(() => {
    setShowAIProgress(false)
    resetAI()
  }, [resetAI])

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
        <div className="flex items-center gap-2">
          <button
            onClick={handleGeneratePlotOptions}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent border border-accent/30 rounded-lg hover:bg-accent/20 transition-colors disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Generate 3 Options
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Beat
          </button>
        </div>
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

      {/* AI Progress Modal */}
      <AIProgressModal
        isOpen={showAIProgress}
        onClose={handleCloseAIProgress}
        onCancel={cancel}
        status={aiStatus}
        progress={aiProgress}
        message={aiMessage}
        error={aiError}
        title="Generating Plot Options"
      />

      {/* Plot Options Selection Modal */}
      {showOptionsModal && plotOptions.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowOptionsModal(false)}
          />
          <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-4xl mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-text-primary">Choose Your Plot Direction</h2>
              </div>
              <button
                onClick={() => setShowOptionsModal(false)}
                className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="px-4 pt-3 text-sm text-text-secondary">
              Select one of these 3 distinct plot approaches. Each offers a different way to tell your story.
            </p>
            <div className="p-4 grid gap-4">
              {plotOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectPlotOption(option)}
                  className="p-4 bg-surface-elevated border border-border rounded-lg hover:border-accent/50 transition-colors text-left"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded mr-2">
                        Option {index + 1}
                      </span>
                      <h3 className="inline font-medium text-text-primary">{option.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary mb-2">{option.description}</p>
                  <p className="text-xs text-accent mb-3">Approach: {option.approach}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {option.beats.map((beat, bi) => (
                      <span
                        key={bi}
                        className="text-xs bg-surface px-2 py-0.5 rounded text-text-secondary"
                      >
                        {beat.title}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-border flex justify-end">
              <button
                onClick={() => setShowOptionsModal(false)}
                className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-elevated transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
