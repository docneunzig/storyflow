import { useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Target, Edit2, Trash2, Users, MapPin, BookOpen, Layers, Sparkles, List, GitBranch, Wand2, Zap, X, TrendingUp } from 'lucide-react'
import type { Project, PlotBeat, PlotStructure, PlotFramework, Subplot, SubplotTouch, Character, Scene } from '@/types/project'
import { useProjectStore } from '@/stores/projectStore'
import { updateProject, generateId } from '@/lib/db'
import { PlotBeatModal } from '@/components/ui/PlotBeatModal'
import { PlotCanvas } from '@/components/ui/PlotCanvas'
import { PlotConsistencyWarning } from '@/components/ui/PlotConsistencyWarning'
import { SubplotCanvas } from '@/components/ui/SubplotCanvas'
import { toast } from '@/components/ui/Toaster'
import { showConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAIGeneration } from '@/hooks/useAIGeneration'
import { AIProgressModal } from '@/components/ui/AIProgressModal'
import { UnifiedActionButton } from '@/components/ui/UnifiedActionButton'
import { useLanguageStore } from '@/stores/languageStore'
import { NextStepBanner } from '@/components/ui/NextStepBanner'

// Character suggestion from AI generation
interface CharacterSuggestion {
  name: string
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor'
  archetype: string
  description: string
  desires: string
  flaw: string
}

// Plot option interface for AI generation
interface PlotOption {
  title: string
  description: string
  approach: string
  beats: { position: string; title: string; summary: string }[]
  characters?: CharacterSuggestion[]
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

type ViewMode = 'list' | 'canvas' | 'subplots'

export function PlotSection({ project }: SectionProps) {
  const { projectId } = useParams<{ projectId: string }>()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBeat, setEditingBeat] = useState<PlotBeat | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const { updateProject: updateProjectStore, setSaveStatus } = useProjectStore()
  const t = useLanguageStore((state) => state.t)

  // Subplot state (using local state for now, can be moved to project later)
  const [subplots, setSubplots] = useState<Subplot[]>(project.subplots || [])
  const [subplotTouches, setSubplotTouches] = useState<SubplotTouch[]>(project.subplotTouches || [])

  // AI generation state
  const [showAIProgress, setShowAIProgress] = useState(false)
  const [aiProgressTitle, setAIProgressTitle] = useState('Generating Plot Options')
  const [plotOptions, setPlotOptions] = useState<PlotOption[]>([])
  const [showOptionsModal, setShowOptionsModal] = useState(false)
  const [expandedBeatId, setExpandedBeatId] = useState<string | null>(null)
  const [expandedScenes, setExpandedScenes] = useState<{ title: string; summary: string }[]>([])
  const [showExpandModal, setShowExpandModal] = useState(false)
  const [twistBeatId, setTwistBeatId] = useState<string | null>(null)
  const [suggestedTwists, setSuggestedTwists] = useState<string[]>([])
  const [showTwistsModal, setShowTwistsModal] = useState(false)

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
      toast({ title: t.toasts.saveSuccess, variant: 'success' })
    } catch (error) {
      console.error('Failed to change framework:', error)
      toast({ title: t.toasts.saveError, variant: 'error' })
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
        toast({ title: t.toasts.saveSuccess, variant: 'success' })
      } else {
        updatedBeats = [...plot.beats, beat]
        toast({ title: t.toasts.saveSuccess, variant: 'success' })
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
      toast({ title: t.toasts.saveError, variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  const handleDeleteBeat = async (beatId: string) => {
    const beat = plot.beats.find(b => b.id === beatId)
    if (!beat) return

    const confirmed = await showConfirmDialog({
      title: t.dialogs.deletePlotBeat,
      message: `${t.dialogs.confirmDelete} ${t.dialogs.cannotBeUndone}`,
      confirmLabel: t.actions.delete,
      cancelLabel: t.actions.cancel,
      variant: 'destructive',
    })
    if (!confirmed) return

    try {
      setSaveStatus('saving')
      const updatedBeats = plot.beats.filter(b => b.id !== beatId)
      const updatedPlot: PlotStructure = {
        ...plot,
        beats: updatedBeats,
      }
      await updateProject(project.id, { plot: updatedPlot })
      updateProjectStore(project.id, { plot: updatedPlot })
      setSaveStatus('saved')
      toast({ title: t.toasts.deleteSuccess, variant: 'success' })
    } catch (error) {
      console.error('Failed to delete beat:', error)
      toast({ title: t.toasts.deleteError, variant: 'error' })
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

  // Handle beat click from canvas
  const handleBeatClick = useCallback((beat: PlotBeat) => {
    handleOpenModal(beat)
  }, [])

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
        characters: [
          { name: 'The Hero', role: 'protagonist', archetype: 'The Hero', description: 'An ordinary person called to extraordinary action', desires: 'To prove their worth and protect what matters', flaw: 'Self-doubt and fear of failure' },
          { name: 'The Mentor', role: 'supporting', archetype: 'The Mentor', description: 'A wise guide who provides knowledge and tools', desires: 'To pass on their wisdom before time runs out', flaw: 'Cannot fight the hero\'s battles for them' },
          { name: 'The Shadow', role: 'antagonist', archetype: 'The Shadow', description: 'A dark reflection of what the hero could become', desires: 'Power and control over the world', flaw: 'Arrogance and inability to see their own weakness' },
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
        characters: [
          { name: 'The Seeker', role: 'protagonist', archetype: 'The Seeker', description: 'Someone running from their past while seeking meaning', desires: 'To find peace and understand themselves', flaw: 'Avoidance of painful truths' },
          { name: 'The Mirror', role: 'supporting', archetype: 'The Ally', description: 'A confidant who reflects the protagonist\'s true self', desires: 'To help their friend see clearly', flaw: 'Too close to remain objective' },
          { name: 'The Ghost', role: 'antagonist', archetype: 'The Shadow', description: 'A figure from the past who represents unresolved trauma', desires: 'Recognition and acknowledgment', flaw: 'Trapped in the past' },
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
        characters: [
          { name: 'The Investigator', role: 'protagonist', archetype: 'The Detective', description: 'Someone piecing together fragments of a hidden truth', desires: 'To uncover the truth regardless of cost', flaw: 'Obsession that blinds them to present dangers' },
          { name: 'The Keeper', role: 'supporting', archetype: 'The Guardian', description: 'Someone who holds pieces of the puzzle', desires: 'To protect secrets that could hurt loved ones', flaw: 'Misguided protectiveness' },
          { name: 'The Catalyst', role: 'antagonist', archetype: 'The Trickster', description: 'The one whose past actions set everything in motion', desires: 'To escape the consequences of their choices', flaw: 'Inability to take responsibility' },
        ],
      },
    ]
  }

  // Apply selected plot option
  const handleSelectPlotOption = async (option: PlotOption) => {
    try {
      setSaveStatus('saving')
      setShowOptionsModal(false)

      // Create new characters from the plot option
      const newCharacters: Character[] = (option.characters || []).map((c) => ({
        id: generateId(),
        name: c.name,
        aliases: [],
        role: c.role,
        archetype: c.archetype,
        age: null,
        gender: '',
        physicalDescription: '',
        distinguishingFeatures: [],
        personalitySummary: c.description,
        strengths: [],
        flaws: c.flaw ? [c.flaw] : [],
        fears: [],
        desires: c.desires ? [c.desires] : [],
        needs: [],
        misbelief: '',
        backstory: '',
        formativeExperiences: [],
        secrets: [],
        speechPatterns: '',
        vocabularyLevel: 'Average',
        catchphrases: [],
        internalVoice: '',
        characterArc: '',
        arcCatalyst: '',
        firstAppearance: null,
        scenesPresent: [],
        status: 'alive' as const,
        userNotes: `Generated from plot: ${option.title}`,
      }))

      // Create character ID map for linking to beats
      const characterIdMap: Record<string, string> = {}
      newCharacters.forEach((char) => {
        const originalName = option.characters?.find(c => c.name === char.name)?.name
        if (originalName) {
          characterIdMap[originalName.toLowerCase()] = char.id
        }
      })

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
        foreshadowing: [],
        payoffs: [],
        wordCountEstimate: 3000,
        status: 'outline' as const,
        userNotes: '',
      }))

      const updatedPlot: PlotStructure = {
        ...plot,
        beats: newBeats,
        overallArc: option.description,
      }

      // Merge with existing characters (don't overwrite if they already exist)
      const existingCharacterNames = (project.characters || []).map(c => c.name.toLowerCase())
      const charactersToAdd = newCharacters.filter(
        c => !existingCharacterNames.includes(c.name.toLowerCase())
      )
      const mergedCharacters = [...(project.characters || []), ...charactersToAdd]

      // Save plot and characters first
      await updateProject(project.id, {
        plot: updatedPlot,
        characters: mergedCharacters,
      })
      updateProjectStore(project.id, {
        plot: updatedPlot,
        characters: mergedCharacters,
      })
      setSaveStatus('saved')
      setPlotOptions([])

      const charCount = charactersToAdd.length
      if (charCount > 0) {
        toast({
          title: `Plot applied with ${charCount} new character${charCount > 1 ? 's' : ''}`,
          description: 'Generating scenes from plot beats...',
          variant: 'success'
        })
      } else {
        toast({
          title: t.toasts.saveSuccess,
          description: 'Generating scenes from plot beats...',
          variant: 'success'
        })
      }

      // Now generate scenes from the beats
      setAIProgressTitle('Generating Scenes from Plot')
      setShowAIProgress(true)

      try {
        const sceneResult = await generate({
          agentTarget: 'plot',
          action: 'generate-scenes-from-beats',
          context: {
            specification: project.specification,
            beats: newBeats.map(b => ({
              title: b.title,
              summary: b.summary,
              frameworkPosition: b.frameworkPosition,
              charactersInvolved: b.charactersInvolved,
            })),
            characters: mergedCharacters.map(c => ({
              name: c.name,
              role: c.role,
              description: c.personalitySummary,
            })),
            targetSceneCount: Math.max(newBeats.length * 2, 12),
          },
          timeoutMs: 120000, // 2 minute timeout for scene generation
        })

        if (sceneResult) {
          try {
            // Parse the AI response
            let jsonStr = sceneResult
            // Handle markdown code blocks
            jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
            const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
            if (jsonMatch) jsonStr = jsonMatch[0]

            const parsed = JSON.parse(jsonStr)
            const generatedScenes = parsed.scenes || []

            if (generatedScenes.length > 0) {
              // Convert AI-generated scenes to Scene objects
              const newScenes: Scene[] = generatedScenes.map((s: any, i: number) => {
                // Find beat ID based on plotBeatIndex
                const beatIndex = typeof s.plotBeatIndex === 'number' ? s.plotBeatIndex : 0
                const linkedBeat = newBeats[Math.min(beatIndex, newBeats.length - 1)]

                // Map character names to IDs
                const characterIds = (s.charactersPresent || [])
                  .map((name: string) => {
                    const char = mergedCharacters.find(c =>
                      c.name.toLowerCase() === name.toLowerCase()
                    )
                    return char?.id
                  })
                  .filter(Boolean)

                return {
                  id: generateId(),
                  title: s.title || `Scene ${i + 1}`,
                  chapterId: null,
                  sequenceInChapter: i + 1,
                  plotBeatId: linkedBeat?.id || null,
                  locationId: null,
                  timeInStory: '',
                  weatherAtmosphere: '',
                  povCharacterId: characterIds[0] || null,
                  charactersPresent: characterIds,
                  summary: s.summary || '',
                  detailedOutline: '',
                  openingHook: '',
                  keyMoments: [],
                  closingHook: '',
                  sceneGoal: s.sceneGoal || '',
                  conflictType: s.conflictType || '',
                  conflictDescription: '',
                  characterGoals: [],
                  openingEmotion: '',
                  closingEmotion: '',
                  tone: s.tone || '',
                  estimatedWordCount: 1500,
                  pacing: s.pacing || 'Moderate',
                  setupFor: [],
                  payoffFor: [],
                  status: 'outline' as const,
                  userNotes: `Generated from beat: ${linkedBeat?.title || 'Unknown'}`,
                }
              })

              // Merge with existing scenes
              const existingScenes = project.scenes || []
              const updatedScenes = [...existingScenes, ...newScenes]

              await updateProject(project.id, { scenes: updatedScenes })
              updateProjectStore(project.id, { scenes: updatedScenes })

              toast({
                title: `${newScenes.length} scenes generated`,
                description: 'Go to Scenes section to refine them',
                variant: 'success'
              })
            }
          } catch (parseError) {
            console.error('Failed to parse scene generation result:', parseError)
            toast({
              title: 'Scene generation completed',
              description: 'Some scenes may need manual creation',
              variant: 'default'
            })
          }
        }
      } catch (sceneError) {
        console.error('Scene generation failed:', sceneError)
        toast({
          title: 'Scene generation skipped',
          description: 'You can manually create scenes in the Scenes section',
          variant: 'default'
        })
      } finally {
        setShowAIProgress(false)
      }
    } catch (error) {
      console.error('Failed to apply plot option:', error)
      toast({ title: t.toasts.saveError, variant: 'error' })
      setSaveStatus('unsaved')
      setShowAIProgress(false)
    }
  }

  const handleCloseAIProgress = useCallback(() => {
    setShowAIProgress(false)
    resetAI()
  }, [resetAI])

  // Expand beat into detailed scenes
  const handleExpandBeat = async (beat: PlotBeat) => {
    setExpandedBeatId(beat.id)
    setAIProgressTitle(`Expanding: ${beat.title}`)
    setShowAIProgress(true)

    try {
      const result = await generate({
        agentTarget: 'plot',
        action: 'expand-beat',
        context: {
          beat: {
            title: beat.title,
            summary: beat.summary,
            detailedDescription: beat.detailedDescription,
            emotionalArc: beat.emotionalArc,
            stakes: beat.stakes,
            frameworkPosition: beat.frameworkPosition,
          },
          characters: (beat.charactersInvolved || []).map(id => {
            const char = (project.characters || []).find(c => c.id === id)
            return char ? { name: char.name, role: char.role } : null
          }).filter(Boolean),
          specification: project.specification,
        },
      })

      if (result) {
        try {
          const parsed = JSON.parse(result)
          if (Array.isArray(parsed)) {
            setExpandedScenes(parsed)
          } else if (parsed.scenes && Array.isArray(parsed.scenes)) {
            setExpandedScenes(parsed.scenes)
          } else {
            setExpandedScenes([
              { title: 'Scene 1', summary: 'Opening of the beat - establish the situation' },
              { title: 'Scene 2', summary: 'Rising action - develop the conflict' },
              { title: 'Scene 3', summary: 'Climax of the beat - peak intensity' },
            ])
          }
        } catch {
          setExpandedScenes([
            { title: 'Scene 1: Opening', summary: 'Introduction of the beat\'s central conflict' },
            { title: 'Scene 2: Development', summary: 'Escalation of tension and stakes' },
            { title: 'Scene 3: Turning Point', summary: 'Critical moment that changes the situation' },
          ])
        }
        setShowExpandModal(true)
      }
    } catch (error) {
      console.error('Failed to expand beat:', error)
      toast({ title: t.toasts.generateError, variant: 'error' })
    } finally {
      setShowAIProgress(false)
    }
  }

  // Create scenes from expanded beat
  const handleCreateScenesFromExpansion = async () => {
    if (!expandedBeatId || expandedScenes.length === 0) return

    try {
      setSaveStatus('saving')
      const beat = plot.beats.find(b => b.id === expandedBeatId)

      // Create scene objects
      const newScenes = expandedScenes.map((s, i) => ({
        id: generateId(),
        title: s.title,
        chapterId: null,
        sequenceInChapter: i + 1,
        plotBeatId: expandedBeatId,
        locationId: null,
        timeInStory: '',
        weatherAtmosphere: '',
        povCharacterId: null,
        charactersPresent: beat?.charactersInvolved || [],
        summary: s.summary,
        detailedOutline: '',
        openingHook: '',
        keyMoments: [],
        closingHook: '',
        sceneGoal: '',
        conflictType: '',
        conflictDescription: '',
        characterGoals: [],
        openingEmotion: '',
        closingEmotion: '',
        tone: '',
        estimatedWordCount: 1500,
        pacing: 'Moderate',
        setupFor: [],
        payoffFor: [],
        status: 'outline' as const,
        userNotes: '',
      }))

      const existingScenes = project.scenes || []
      const updatedScenes = [...existingScenes, ...newScenes]

      await updateProject(project.id, { scenes: updatedScenes })
      updateProjectStore(project.id, { scenes: updatedScenes })
      setSaveStatus('saved')
      setShowExpandModal(false)
      setExpandedScenes([])
      setExpandedBeatId(null)
      toast({ title: t.toasts.saveSuccess, variant: 'success' })
    } catch (error) {
      console.error('Failed to create scenes:', error)
      toast({ title: t.toasts.saveError, variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  // Suggest twists for a beat
  const handleSuggestTwists = async (beat: PlotBeat) => {
    setTwistBeatId(beat.id)
    setAIProgressTitle(`Finding Twists for: ${beat.title}`)
    setShowAIProgress(true)

    try {
      const result = await generate({
        agentTarget: 'plot',
        action: 'suggest-twists',
        context: {
          beat: {
            title: beat.title,
            summary: beat.summary,
            stakes: beat.stakes,
          },
          existingBeats: plot.beats.map(b => ({ title: b.title, summary: b.summary })),
          specification: project.specification,
        },
      })

      if (result) {
        try {
          const parsed = JSON.parse(result)
          if (Array.isArray(parsed)) {
            setSuggestedTwists(parsed)
          } else if (parsed.twists && Array.isArray(parsed.twists)) {
            setSuggestedTwists(parsed.twists)
          } else {
            setSuggestedTwists([
              'A trusted ally is revealed to have hidden motives',
              'The protagonist discovers their initial goal was misdirected',
              'A seemingly minor character becomes crucial to the resolution',
            ])
          }
        } catch {
          setSuggestedTwists([
            'Unexpected betrayal from a trusted character',
            'The stakes are revealed to be much higher than believed',
            'A hidden connection between characters is exposed',
          ])
        }
        setShowTwistsModal(true)
      }
    } catch (error) {
      console.error('Failed to suggest twists:', error)
      toast({ title: t.toasts.generateError, variant: 'error' })
    } finally {
      setShowAIProgress(false)
    }
  }

  // Apply a twist to the beat
  const handleApplyTwist = async (twist: string) => {
    if (!twistBeatId) return

    try {
      setSaveStatus('saving')
      const updatedBeats = plot.beats.map(b =>
        b.id === twistBeatId
          ? {
              ...b,
              summary: b.summary + '\n\nTwist: ' + twist,
              userNotes: (b.userNotes || '') + '\n\nSuggested twist: ' + twist,
            }
          : b
      )

      const updatedPlot: PlotStructure = { ...plot, beats: updatedBeats }
      await updateProject(project.id, { plot: updatedPlot })
      updateProjectStore(project.id, { plot: updatedPlot })
      setSaveStatus('saved')
      setShowTwistsModal(false)
      setSuggestedTwists([])
      setTwistBeatId(null)

      toast({ title: t.toasts.saveSuccess, variant: 'success' })
    } catch (error) {
      console.error('Failed to apply twist:', error)
      toast({ title: t.toasts.saveError, variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  // Subplot handlers
  const handleCreateSubplot = async (subplot: Omit<Subplot, 'id' | 'createdAt' | 'tensionCurve'>) => {
    try {
      setSaveStatus('saving')
      const newSubplot: Subplot = {
        ...subplot,
        id: generateId(),
        createdAt: new Date().toISOString(),
        tensionCurve: []
      }
      const updatedSubplots = [...subplots, newSubplot]
      setSubplots(updatedSubplots)
      await updateProject(project.id, { subplots: updatedSubplots })
      updateProjectStore(project.id, { subplots: updatedSubplots })
      setSaveStatus('saved')
      toast({ title: t.toasts.saveSuccess, variant: 'success' })
    } catch (error) {
      console.error('Failed to create subplot:', error)
      toast({ title: t.toasts.saveError, variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  const handleUpdateSubplot = async (id: string, updates: Partial<Subplot>) => {
    try {
      setSaveStatus('saving')
      const updatedSubplots = subplots.map(s => s.id === id ? { ...s, ...updates } : s)
      setSubplots(updatedSubplots)
      await updateProject(project.id, { subplots: updatedSubplots })
      updateProjectStore(project.id, { subplots: updatedSubplots })
      setSaveStatus('saved')
      toast({ title: t.toasts.saveSuccess, variant: 'success' })
    } catch (error) {
      console.error('Failed to update subplot:', error)
      toast({ title: t.toasts.saveError, variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  const handleDeleteSubplot = async (id: string) => {
    const subplot = subplots.find(s => s.id === id)
    if (!subplot) return

    const confirmed = await showConfirmDialog({
      title: t.dialogs.deleteSubplot,
      message: `${t.dialogs.confirmDelete} ${t.dialogs.cannotBeUndone}`,
      confirmLabel: t.actions.delete,
      cancelLabel: t.actions.cancel,
      variant: 'destructive',
    })
    if (!confirmed) return

    try {
      setSaveStatus('saving')
      const updatedSubplots = subplots.filter(s => s.id !== id)
      const updatedTouches = subplotTouches.filter(t => t.subplotId !== id)
      setSubplots(updatedSubplots)
      setSubplotTouches(updatedTouches)
      await updateProject(project.id, { subplots: updatedSubplots, subplotTouches: updatedTouches })
      updateProjectStore(project.id, { subplots: updatedSubplots, subplotTouches: updatedTouches })
      setSaveStatus('saved')
      toast({ title: t.toasts.deleteSuccess, variant: 'success' })
    } catch (error) {
      console.error('Failed to delete subplot:', error)
      toast({ title: t.toasts.deleteError, variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  const handleAddSubplotTouch = async (touch: Omit<SubplotTouch, 'id'>) => {
    try {
      setSaveStatus('saving')
      const newTouch: SubplotTouch = { ...touch, id: generateId() }
      const updatedTouches = [...subplotTouches, newTouch]
      setSubplotTouches(updatedTouches)
      await updateProject(project.id, { subplotTouches: updatedTouches })
      updateProjectStore(project.id, { subplotTouches: updatedTouches })
      setSaveStatus('saved')
      toast({ title: t.toasts.saveSuccess, variant: 'success' })
    } catch (error) {
      console.error('Failed to add subplot touch:', error)
      toast({ title: t.toasts.saveError, variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  const characters = project.characters || []
  const scenes = project.scenes || []
  const chapters = project.chapters || []

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
          <h1 className="text-2xl font-bold text-text-primary">{t.plot.title}</h1>
          <p className="text-text-secondary mt-1">
            {t.plot.storyBeats}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-surface-elevated rounded-lg border border-border p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                viewMode === 'list'
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title={t.plot.timeline}
            >
              <List className="h-4 w-4" aria-hidden="true" />
              {t.plot.timeline}
            </button>
            <button
              onClick={() => setViewMode('canvas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                viewMode === 'canvas'
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title={t.plot.canvas}
            >
              <GitBranch className="h-4 w-4" aria-hidden="true" />
              {t.plot.canvas}
            </button>
            <button
              onClick={() => setViewMode('subplots')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                viewMode === 'subplots'
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              title={t.plot.subplots}
            >
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              {t.plot.subplots}
            </button>
          </div>
          <UnifiedActionButton
            primaryAction={{
              id: 'add-beat',
              label: t.plot.addBeat,
              icon: Plus,
              onClick: () => handleOpenModal(),
            }}
            secondaryActions={[
              {
                id: 'generate-plot',
                label: t.actions.generate,
                description: t.plot.storyBeats,
                icon: Sparkles,
                onClick: handleGeneratePlotOptions,
                disabled: isGenerating,
                variant: 'accent',
              },
            ]}
            size="sm"
            disabled={isGenerating}
          />
        </div>
      </div>

      {/* Framework Selection */}
      <div className="card mb-6">
        <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-accent" aria-hidden="true" />
          {t.plot.title}
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

      {/* Plot Consistency Warnings */}
      <PlotConsistencyWarning
        beats={sortedBeats}
        characters={characters}
      />

      {/* Plot Beats */}
      {viewMode === 'subplots' ? (
        /* Subplot Canvas View */
        <div className="h-[calc(100vh-300px)]">
          <SubplotCanvas
            subplots={subplots}
            subplotTouches={subplotTouches}
            characters={characters}
            scenes={scenes}
            chapters={chapters}
            onCreateSubplot={handleCreateSubplot}
            onUpdateSubplot={handleUpdateSubplot}
            onDeleteSubplot={handleDeleteSubplot}
            onAddTouch={handleAddSubplotTouch}
          />
        </div>
      ) : viewMode === 'canvas' ? (
        /* Canvas View */
        <PlotCanvas
          beats={sortedBeats}
          framework={plot.framework}
          onNodeClick={handleBeatClick}
          getCharacterName={getCharacterName}
        />
      ) : sortedBeats.length === 0 ? (
        <div className="card text-center py-12">
          <Target className="h-12 w-12 text-text-secondary mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-medium text-text-primary mb-2">{t.plot.noBeatYet}</h3>
          <p className="text-text-secondary mb-4">
            {t.plot.createFirstBeat}
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t.plot.addBeat}
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
                    {/* AI Actions */}
                    <button
                      onClick={() => handleExpandBeat(beat)}
                      disabled={isGenerating}
                      className="p-1.5 rounded-md hover:bg-accent/10 transition-colors disabled:opacity-50"
                      aria-label="Expand to scenes"
                      title="Expand beat into detailed scenes"
                    >
                      <Wand2 className="h-4 w-4 text-accent" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleSuggestTwists(beat)}
                      disabled={isGenerating}
                      className="p-1.5 rounded-md hover:bg-purple-500/10 transition-colors disabled:opacity-50"
                      aria-label="Suggest twists"
                      title="Suggest plot twists"
                    >
                      <Zap className="h-4 w-4 text-purple-400" aria-hidden="true" />
                    </button>
                    {beat.status === 'locked' ? (
                      <span className="text-xs text-warning px-2 py-1 bg-warning/10 rounded" title={t.status.locked}>
                        {t.status.locked}
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
                    <button
                      onClick={() => handleDeleteBeat(beat.id)}
                      className="p-1.5 rounded-md hover:bg-error/10 transition-colors"
                      aria-label="Delete beat"
                      title="Delete beat"
                    >
                      <Trash2 className="h-4 w-4 text-error" aria-hidden="true" />
                    </button>
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
        allBeats={plot.beats}
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
        title={aiProgressTitle}
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
              Select one of these 3 distinct plot approaches. Each includes suggested characters you can refine.
            </p>
            <div className="p-4 grid gap-4 max-h-[60vh] overflow-y-auto">
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

                  {/* Plot Beats */}
                  <div className="mb-3">
                    <p className="text-xs font-medium text-text-secondary mb-1.5">Plot Beats:</p>
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
                  </div>

                  {/* Characters */}
                  {option.characters && option.characters.length > 0 && (
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs font-medium text-text-secondary mb-1.5 flex items-center gap-1">
                        <Users className="h-3 w-3" aria-hidden="true" />
                        Characters ({option.characters.length}):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {option.characters.map((char, ci) => (
                          <span
                            key={ci}
                            className={`text-xs px-2 py-0.5 rounded ${
                              char.role === 'protagonist'
                                ? 'bg-success/20 text-success'
                                : char.role === 'antagonist'
                                ? 'bg-error/20 text-error'
                                : 'bg-warning/20 text-warning'
                            }`}
                            title={`${char.archetype}: ${char.description}`}
                          >
                            {char.name} ({char.role})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-border flex justify-end">
              <button
                onClick={() => setShowOptionsModal(false)}
                className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-elevated transition-colors"
              >
                {t.actions.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Scenes Modal */}
      {showExpandModal && expandedScenes.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowExpandModal(false)
              setExpandedScenes([])
              setExpandedBeatId(null)
            }}
          />
          <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-2xl mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-accent" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-text-primary">{t.scenes.title}</h2>
              </div>
              <button
                onClick={() => {
                  setShowExpandModal(false)
                  setExpandedScenes([])
                  setExpandedBeatId(null)
                }}
                className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
              >
                <X className="h-5 w-5 text-text-secondary" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-text-secondary mb-4">
                The following scenes were generated from this beat. Create them as new scenes?
              </p>
              <div className="space-y-3">
                {expandedScenes.map((scene, index) => (
                  <div key={index} className="p-3 bg-surface-elevated border border-border rounded-lg">
                    <h4 className="font-medium text-text-primary mb-1">{scene.title}</h4>
                    <p className="text-sm text-text-secondary">{scene.summary}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowExpandModal(false)
                  setExpandedScenes([])
                  setExpandedBeatId(null)
                }}
                className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-elevated transition-colors"
              >
                {t.actions.cancel}
              </button>
              <button
                onClick={handleCreateScenesFromExpansion}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                {t.actions.create} {expandedScenes.length} {t.scenes.title}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggested Twists Modal */}
      {showTwistsModal && suggestedTwists.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowTwistsModal(false)
              setSuggestedTwists([])
              setTwistBeatId(null)
            }}
          />
          <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-2xl mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-400" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-text-primary">Suggested Twists</h2>
              </div>
              <button
                onClick={() => {
                  setShowTwistsModal(false)
                  setSuggestedTwists([])
                  setTwistBeatId(null)
                }}
                className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
              >
                <X className="h-5 w-5 text-text-secondary" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-text-secondary mb-4">
                Choose a twist to add to this beat, or use them as inspiration:
              </p>
              <div className="space-y-2">
                {suggestedTwists.map((twist, index) => (
                  <button
                    key={index}
                    onClick={() => handleApplyTwist(twist)}
                    className="w-full p-4 text-left bg-surface-elevated border border-border rounded-lg hover:border-purple-500/50 hover:bg-purple-500/5 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-text-primary">{twist}</p>
                      <span className="text-xs text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {t.common.add}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-end">
              <button
                onClick={() => {
                  setShowTwistsModal(false)
                  setSuggestedTwists([])
                  setTwistBeatId(null)
                }}
                className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-elevated transition-colors"
              >
                {t.actions.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Next Step Navigation */}
      {projectId && (
        <NextStepBanner
          currentSection="plot"
          projectId={projectId}
          project={project}
        />
      )}
    </div>
  )
}
