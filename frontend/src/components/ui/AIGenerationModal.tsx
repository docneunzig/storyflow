import { useState, useEffect } from 'react'
import { X, Sparkles, Loader2, FileText, Users, Film, GitBranch, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { Project } from '@/types/project'
import { useAIGeneration } from '@/hooks/useAIGeneration'
import { useProjectStore } from '@/stores/projectStore'
import { updateProject } from '@/lib/db'
import { toast } from './Toaster'

interface AIGenerationModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
  currentSection?: string
}

type GenerationType = 'chapter' | 'scene' | 'character' | 'plot-beat' | 'continue'

interface GenerationOption {
  type: GenerationType
  label: string
  description: string
  icon: React.ReactNode
  action: string
}

const GENERATION_OPTIONS: GenerationOption[] = [
  {
    type: 'chapter',
    label: 'Generate Chapter',
    description: 'Create a new chapter with AI-generated content',
    icon: <FileText className="h-5 w-5" />,
    action: 'generate-chapter',
  },
  {
    type: 'scene',
    label: 'Generate Scene',
    description: 'Create a new scene blueprint',
    icon: <Film className="h-5 w-5" />,
    action: 'generate-scene',
  },
  {
    type: 'character',
    label: 'Generate Character',
    description: 'Create a new character profile',
    icon: <Users className="h-5 w-5" />,
    action: 'generate-character',
  },
  {
    type: 'plot-beat',
    label: 'Generate Plot Beat',
    description: 'Add a new plot beat to your story',
    icon: <GitBranch className="h-5 w-5" />,
    action: 'generate-plot-beat',
  },
  {
    type: 'continue',
    label: 'Continue Writing',
    description: 'Continue from where you left off',
    icon: <BookOpen className="h-5 w-5" />,
    action: 'generate-continue',
  },
]

export function AIGenerationModal({ isOpen, onClose, project, currentSection }: AIGenerationModalProps) {
  const [selectedType, setSelectedType] = useState<GenerationType | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const { generate, cancel, reset, status, progress, message, result, error, isGenerating } = useAIGeneration()
  const { updateProject: updateProjectStore, setSaveStatus } = useProjectStore()

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      reset()
      setSelectedType(null)
      setCustomPrompt('')

      // Auto-select based on current section
      if (currentSection === 'write') {
        setSelectedType('chapter')
      } else if (currentSection === 'scenes') {
        setSelectedType('scene')
      } else if (currentSection === 'characters') {
        setSelectedType('character')
      } else if (currentSection === 'plot') {
        setSelectedType('plot-beat')
      }
    }
  }, [isOpen, currentSection, reset])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isGenerating) {
          cancel()
        } else {
          onClose()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isGenerating, cancel, onClose])

  const handleGenerate = async () => {
    if (!selectedType || !project) return

    const option = GENERATION_OPTIONS.find(o => o.type === selectedType)
    if (!option) return

    // Build comprehensive context for writer agent with full project data
    const context = {
      // Project identification
      projectId: project.id,
      title: project.metadata?.workingTitle || 'Untitled',

      // Full specification settings
      specification: {
        genre: project.specification?.genre || [],
        subgenre: project.specification?.subgenre || [],
        targetAudience: project.specification?.targetAudience || 'Adult',
        pov: project.specification?.pov || 'Third Limited',
        tense: project.specification?.tense || 'Past',
        writingStyle: project.specification?.writingStyle || {},
        tone: project.specification?.tone || '',
        themes: project.specification?.themes || [],
        settingType: project.specification?.settingType || [],
        timePeriod: project.specification?.timePeriod || '',
        pacing: project.specification?.pacing || 5,
        complexity: project.specification?.complexity || 5,
        targetWordCount: project.specification?.targetWordCount || 80000,
      },

      // Full character profiles for voice consistency
      characters: project.characters?.map(c => ({
        id: c.id,
        name: c.name,
        role: c.role,
        archetype: c.archetype,
        personalitySummary: c.personalitySummary,
        speechPatterns: c.speechPatterns,
        catchphrases: c.catchphrases,
        internalVoice: c.internalVoice,
        status: c.status,
      })) || [],

      // Full plot beats for narrative continuity
      plotBeats: project.plot?.beats?.map(b => ({
        id: b.id,
        title: b.title,
        summary: b.summary,
        frameworkPosition: b.frameworkPosition,
        timelinePosition: b.timelinePosition,
        emotionalArc: b.emotionalArc,
        stakes: b.stakes,
        charactersInvolved: b.charactersInvolved,
        status: b.status,
      })) || [],

      // Previous chapters for continuity
      previousChapters: project.chapters?.slice(-3).map(ch => ({
        id: ch.id,
        number: ch.number,
        title: ch.title,
        summary: ch.content?.substring(0, 500) || '', // First 500 chars as context
        wordCount: ch.wordCount,
        status: ch.status,
      })) || [],

      // World-building context from wiki
      wikiContext: project.wiki?.slice(0, 10).map(w => ({
        name: w.name,
        category: w.category,
        description: w.description,
      })) || [],

      // Current chapter count for numbering
      currentChapterCount: project.chapters?.length || 0,

      // Custom prompt from user
      customPrompt: customPrompt || undefined,
    }

    const generatedContent = await generate({
      agentTarget: 'writer',
      action: option.action,
      context,
    })

    if (generatedContent) {
      toast({
        title: 'Content Generated!',
        description: 'AI has generated new content for your project.',
        variant: 'success',
      })
    }
  }

  const handleAcceptResult = async () => {
    if (!result || !project || !selectedType) return

    try {
      setSaveStatus('saving')

      // Handle based on generation type
      if (selectedType === 'chapter') {
        // Create a new chapter with the generated content
        const newChapter = {
          id: `chapter-${Date.now()}`,
          number: (project.chapters?.length || 0) + 1,
          title: `AI Generated Chapter ${(project.chapters?.length || 0) + 1}`,
          content: result,
          wordCount: result.split(/\s+/).length,
          status: 'draft' as const,
          sceneIds: [],
          lockedPassages: [],
          currentRevision: 1,
        }
        const updatedChapters = [...(project.chapters || []), newChapter]
        await updateProject(project.id, { chapters: updatedChapters })
        updateProjectStore(project.id, { chapters: updatedChapters })
        toast({ title: 'Chapter added to your project', variant: 'success' })
      } else if (selectedType === 'character') {
        // Create a new character
        const newCharacter = {
          id: `char-${Date.now()}`,
          name: `AI Character ${(project.characters?.length || 0) + 1}`,
          role: 'supporting' as const,
          archetype: 'Everyman',
          personalitySummary: result,
          status: 'alive' as const,
          aliases: [],
          distinguishingFeatures: [],
          strengths: [],
          flaws: [],
          fears: [],
          desires: [],
          needs: [],
          formativeExperiences: [],
          secrets: [],
          speechPatterns: '',
          catchphrases: [],
          internalVoice: '',
          characterArc: '',
          arcCatalyst: '',
          scenesPresent: [],
          notes: '',
        }
        const updatedCharacters = [...(project.characters || []), newCharacter]
        await updateProject(project.id, { characters: updatedCharacters })
        updateProjectStore(project.id, { characters: updatedCharacters })
        toast({ title: 'Character added to your project', variant: 'success' })
      } else if (selectedType === 'scene') {
        // Create a new scene
        const newScene = {
          id: `scene-${Date.now()}`,
          title: `AI Generated Scene ${(project.scenes?.length || 0) + 1}`,
          status: 'outline' as const,
          pacing: 'moderate' as const,
          summary: result,
          estimatedWordCount: 2000,
          openingEmotion: '',
          closingEmotion: '',
          tone: '',
          openingHook: '',
          closingHook: '',
          notes: '',
          sequenceInChapter: 1,
          charactersPresent: [],
        }
        const updatedScenes = [...(project.scenes || []), newScene]
        await updateProject(project.id, { scenes: updatedScenes })
        updateProjectStore(project.id, { scenes: updatedScenes })
        toast({ title: 'Scene added to your project', variant: 'success' })
      } else if (selectedType === 'plot-beat') {
        // Create a new plot beat
        const existingBeats = project.plot?.beats || []
        const newBeat = {
          id: `beat-${Date.now()}`,
          frameworkPosition: 'custom',
          title: `AI Plot Beat ${existingBeats.length + 1}`,
          summary: result,
          detailedDescription: '',
          charactersInvolved: [],
          timelinePosition: existingBeats.length + 1,
          emotionalArc: '',
          stakes: '',
          foreshadowing: [],
          payoffs: [],
          chapterTarget: null,
          wordCountEstimate: 0,
          status: 'outline' as const,
          notes: '',
        }
        const updatedPlot = {
          ...project.plot,
          beats: [...existingBeats, newBeat],
        }
        await updateProject(project.id, { plot: updatedPlot })
        updateProjectStore(project.id, { plot: updatedPlot })
        toast({ title: 'Plot beat added to your project', variant: 'success' })
      }

      setSaveStatus('saved')
      onClose()
    } catch (err) {
      console.error('Failed to save generated content:', err)
      toast({ title: 'Failed to save generated content', variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          if (!isGenerating) onClose()
        }}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/20 rounded-lg">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">AI Content Generation</h2>
              <p className="text-sm text-text-secondary">Generate content with Claude AI</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isGenerating) {
                cancel()
              } else {
                onClose()
              }
            }}
            className="p-2 rounded-lg hover:bg-surface-elevated transition-colors"
            title={isGenerating ? 'Cancel generation' : 'Close'}
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Generation in progress */}
          {isGenerating && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 text-accent animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">Generating Content...</h3>
              <p className="text-text-secondary mb-4">{message}</p>
              <div className="w-full bg-surface-elevated rounded-full h-2 mb-4">
                <div
                  className="bg-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <button
                onClick={cancel}
                className="px-4 py-2 border border-border rounded-lg hover:bg-surface-elevated transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">Generation Failed</h3>
              <p className="text-text-secondary mb-4">{error}</p>
              <button
                onClick={reset}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Result state */}
          {status === 'completed' && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Content Generated Successfully!</span>
              </div>
              <div className="bg-surface-elevated border border-border rounded-lg p-4 max-h-64 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-text-primary font-serif">
                  {result}
                </pre>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAcceptResult}
                  className="flex-1 px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 transition-colors"
                >
                  Accept & Add to Project
                </button>
                <button
                  onClick={() => {
                    reset()
                    setSelectedType(null)
                  }}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-surface-elevated transition-colors"
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {/* Selection state (idle) */}
          {status === 'idle' && (
            <div className="space-y-4">
              {/* Generation type selection */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  What would you like to generate?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {GENERATION_OPTIONS.map(option => (
                    <button
                      key={option.type}
                      onClick={() => setSelectedType(option.type)}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors text-left ${
                        selectedType === option.type
                          ? 'border-accent bg-accent/10'
                          : 'border-border hover:border-accent/50 hover:bg-surface-elevated'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${selectedType === option.type ? 'bg-accent/20 text-accent' : 'bg-surface-elevated text-text-secondary'}`}>
                        {option.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-text-primary">{option.label}</h4>
                        <p className="text-xs text-text-secondary">{option.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom prompt */}
              {selectedType && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Additional instructions (optional)
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                    placeholder="E.g., 'Focus on the conflict between the main characters' or 'Include a plot twist'"
                    className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder:text-text-secondary focus:ring-2 focus:ring-accent/50 focus:border-accent resize-none"
                    rows={3}
                  />
                </div>
              )}

              {/* Project context info */}
              {project && (
                <div className="bg-surface-elevated/50 border border-border rounded-lg p-3">
                  <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">
                    Project Context
                  </h4>
                  <div className="text-sm text-text-primary">
                    <p><strong>Title:</strong> {project.metadata?.workingTitle || 'Untitled'}</p>
                    <p><strong>Genre:</strong> {project.specification?.genre?.join(', ') || 'Not set'}</p>
                    <p><strong>Characters:</strong> {project.characters?.length || 0}</p>
                    <p><strong>Chapters:</strong> {project.chapters?.length || 0}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {status === 'idle' && (
          <div className="p-4 border-t border-border flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg hover:bg-surface-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!selectedType}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Generate
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
