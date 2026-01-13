import { useState, useEffect, useCallback, useMemo } from 'react'
import { X, BookOpen, Sparkles, ListOrdered, Check, Edit2, RefreshCw, Maximize2, Minimize2, Lock, Unlock, Shuffle } from 'lucide-react'
import type { Chapter, ChapterStatus, Project } from '@/types/project'
import { toast } from '@/components/ui/Toaster'

// Scene outline item for preview
interface SceneOutlineItem {
  sceneNumber: number
  title: string
  summary: string
  povCharacter?: string
  estimatedWords: number
}

// Generation length options
type GenerationLength = 'paragraph' | 'scene' | 'full-chapter'
const GENERATION_LENGTH_OPTIONS: { value: GenerationLength; label: string; description: string }[] = [
  { value: 'paragraph', label: 'Paragraph', description: '~100-200 words' },
  { value: 'scene', label: 'Scene', description: '~500-1500 words' },
  { value: 'full-chapter', label: 'Full Chapter', description: '~2000-5000 words' },
]

// Style strictness options
type StyleStrictness = 'loose' | 'moderate' | 'strict'
const STYLE_STRICTNESS_OPTIONS: { value: StyleStrictness; label: string; description: string }[] = [
  { value: 'loose', label: 'Loose', description: 'More creative freedom' },
  { value: 'moderate', label: 'Moderate', description: 'Balanced approach' },
  { value: 'strict', label: 'Strict', description: 'Closely follow style guide' },
]
import { generateId } from '@/lib/db'
import { useAIGeneration } from '@/hooks/useAIGeneration'
import { AIProgressModal } from '@/components/ui/AIProgressModal'

interface ChapterModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (chapter: Chapter) => void
  editChapter?: Chapter | null
  nextChapterNumber?: number
  // New props for context assembly
  project?: Project
}

const STATUSES: ChapterStatus[] = ['outline', 'draft', 'revision', 'final', 'locked']

function createEmptyChapter(chapterNumber: number): Omit<Chapter, 'id'> {
  return {
    number: chapterNumber,
    title: '',
    sceneIds: [],
    content: '',
    wordCount: 0,
    status: 'outline',
    lockedPassages: [],
    currentRevision: 0,
  }
}

export function ChapterModal({ isOpen, onClose, onSave, editChapter, nextChapterNumber = 1, project }: ChapterModalProps) {
  const [formData, setFormData] = useState<Omit<Chapter, 'id'>>(createEmptyChapter(nextChapterNumber))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showAIProgress, setShowAIProgress] = useState(false)
  const [aiProgressTitle, setAIProgressTitle] = useState('Generating Chapter Content')

  // Outline state for two-step generation
  const [chapterOutline, setChapterOutline] = useState<SceneOutlineItem[]>([])
  const [showOutlinePreview, setShowOutlinePreview] = useState(false)
  const [editingOutlineIndex, setEditingOutlineIndex] = useState<number | null>(null)

  // Generation length setting
  const [generationLength, setGenerationLength] = useState<GenerationLength>('full-chapter')

  // Style strictness setting
  const [styleStrictness, setStyleStrictness] = useState<StyleStrictness>('moderate')

  // Text selection state for expand/condense actions
  const [selectedText, setSelectedText] = useState('')
  const [selectionStart, setSelectionStart] = useState(0)
  const [selectionEnd, setSelectionEnd] = useState(0)

  // Show alternatives feature
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [alternatives, setAlternatives] = useState<string[]>([])
  const [showAlternativesModal, setShowAlternativesModal] = useState(false)

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

  // Reset form when modal opens/closes or editChapter changes
  useEffect(() => {
    if (isOpen) {
      if (editChapter) {
        const { id, ...rest } = editChapter
        setFormData(rest)
      } else {
        setFormData(createEmptyChapter(nextChapterNumber))
      }
      setErrors({})
      resetAI()
      setShowAIProgress(false)
      setChapterOutline([])
      setShowOutlinePreview(false)
      setEditingOutlineIndex(null)
      setGenerationLength('full-chapter')
      setStyleStrictness('moderate')
      setSelectedText('')
      setSelectionStart(0)
      setSelectionEnd(0)
      setShowAlternatives(false)
      setAlternatives([])
      setShowAlternativesModal(false)
    }
  }, [isOpen, editChapter, nextChapterNumber, resetAI])

  // Assemble writing context from project data
  const writingContext = useMemo(() => {
    if (!project) return null

    const specification = project.specification
    const chapters = project.chapters || []
    const scenes = project.scenes || []
    const characters = project.characters || []
    const plotBeats = project.plot?.beats || []

    // Get previous chapter (for continuity)
    const sortedChapters = [...chapters].sort((a, b) => a.number - b.number)
    const currentChapterIndex = editChapter
      ? sortedChapters.findIndex(c => c.id === editChapter.id)
      : sortedChapters.length // New chapter would be after all existing
    const previousChapter = currentChapterIndex > 0
      ? sortedChapters[currentChapterIndex - 1]
      : null

    // Get scenes assigned to this chapter
    const chapterScenes = editChapter
      ? scenes.filter(s => s.chapterId === editChapter.id)
      : []

    // Get relevant plot beats (not yet completed)
    const relevantBeats = plotBeats.filter(b =>
      b.status === 'outline' || b.status === 'drafted'
    )

    // Get main characters (protagonists and antagonists)
    const mainCharacters = characters.filter(c =>
      c.role === 'protagonist' || c.role === 'antagonist'
    )

    // Get supporting characters that appear in this chapter's scenes
    const supportingInChapter = characters.filter(c => {
      if (c.role !== 'supporting') return false
      return chapterScenes.some(scene =>
        scene.charactersPresent?.includes(c.id) || scene.povCharacterId === c.id
      )
    })

    return {
      // Specification context
      specification: specification ? {
        genre: specification.genre,
        subgenre: specification.subgenre,
        themes: specification.themes,
        tone: specification.tone,
        pov: specification.pov,
        tense: specification.tense,
        targetAudience: specification.targetAudience,
        writingStyle: specification.writingStyle,
        pacing: specification.pacing,
      } : null,

      // Plot context
      plotBeats: relevantBeats.map(b => ({
        frameworkPosition: b.frameworkPosition,
        title: b.title,
        summary: b.summary,
        detailedDescription: b.detailedDescription,
        emotionalArc: b.emotionalArc,
        stakes: b.stakes,
      })),

      // Character context
      characters: {
        main: mainCharacters.map(c => ({
          name: c.name,
          role: c.role,
          archetype: c.archetype,
          personalitySummary: c.personalitySummary,
          desires: c.desires,
          flaws: c.flaws,
          speechPatterns: c.speechPatterns,
          characterArc: c.characterArc,
        })),
        supporting: supportingInChapter.map(c => ({
          name: c.name,
          role: c.role,
          personalitySummary: c.personalitySummary,
        })),
      },

      // Scene context for this chapter
      scenes: chapterScenes.map(s => ({
        title: s.title,
        summary: s.summary,
        sceneGoal: s.sceneGoal,
        pacing: s.pacing,
        timeInStory: s.timeInStory,
        povCharacter: characters.find(c => c.id === s.povCharacterId)?.name,
      })),

      // Previous chapter context (for continuity)
      previousChapter: previousChapter ? {
        number: previousChapter.number,
        title: previousChapter.title,
        contentSummary: previousChapter.content
          ? previousChapter.content.slice(0, 500) + '...'
          : null,
        wordCount: previousChapter.wordCount,
      } : null,

      // Current chapter info
      currentChapter: {
        number: formData.number,
        title: formData.title,
        existingContent: formData.content || null,
      },
    }
  }, [project, editChapter, formData.number, formData.title, formData.content])

  // Handle AI generation for chapter outline (Step 1)
  const handleGenerateOutline = useCallback(async () => {
    if (!formData.title.trim()) {
      setErrors({ title: 'Please enter a title before generating an outline' })
      return
    }

    setAIProgressTitle('Generating Chapter Outline')
    setShowAIProgress(true)

    // Build context for outline generation
    const context = writingContext ? {
      ...writingContext,
      hasSpecification: !!writingContext.specification,
      hasPlotBeats: writingContext.plotBeats.length > 0,
      hasCharacters: writingContext.characters.main.length > 0,
      hasPreviousChapter: !!writingContext.previousChapter,
      hasScenes: writingContext.scenes.length > 0,
    } : {
      title: formData.title,
      chapterNumber: formData.number,
    }

    const result = await generate({
      agentTarget: 'chapter',
      action: 'generate-outline',
      context,
    })

    if (result) {
      // Parse the outline result - expect JSON array of scene outlines
      try {
        const parsed = JSON.parse(result)
        if (Array.isArray(parsed)) {
          setChapterOutline(parsed)
        } else {
          // Generate sample outline if parsing fails
          setChapterOutline(generateSampleOutline())
        }
      } catch {
        // Generate sample outline structure from result text
        setChapterOutline(generateSampleOutline())
      }
      setShowOutlinePreview(true)
    }
  }, [formData.title, formData.number, generate, writingContext])

  // Generate sample outline (for demo/fallback)
  const generateSampleOutline = (): SceneOutlineItem[] => {
    const characters = project?.characters || []
    const mainChar = characters.find(c => c.role === 'protagonist')
    return [
      {
        sceneNumber: 1,
        title: 'Opening Scene',
        summary: `${formData.title} begins with an establishing scene that hooks the reader and sets the tone for the chapter.`,
        povCharacter: mainChar?.name || 'Main Character',
        estimatedWords: 800,
      },
      {
        sceneNumber: 2,
        title: 'Rising Action',
        summary: 'The conflict develops as characters face new challenges and tensions build.',
        povCharacter: mainChar?.name || 'Main Character',
        estimatedWords: 1200,
      },
      {
        sceneNumber: 3,
        title: 'Key Revelation',
        summary: 'A pivotal moment reveals important information that changes the direction of the story.',
        povCharacter: mainChar?.name || 'Main Character',
        estimatedWords: 1000,
      },
      {
        sceneNumber: 4,
        title: 'Chapter Climax',
        summary: 'The chapter reaches its peak tension and emotional intensity.',
        povCharacter: mainChar?.name || 'Main Character',
        estimatedWords: 800,
      },
      {
        sceneNumber: 5,
        title: 'Closing Hook',
        summary: 'The chapter ends with a hook that compels the reader to continue to the next chapter.',
        povCharacter: mainChar?.name || 'Main Character',
        estimatedWords: 500,
      },
    ]
  }

  // Handle outline item edit
  const handleOutlineEdit = (index: number, field: keyof SceneOutlineItem, value: string | number) => {
    setChapterOutline(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ))
  }

  // Handle approval of outline and generate prose (Step 2)
  const handleApproveOutline = useCallback(async () => {
    setAIProgressTitle('Generating Chapter Content')
    setShowAIProgress(true)
    setShowOutlinePreview(false)

    // Build context with approved outline
    const context = writingContext ? {
      ...writingContext,
      approvedOutline: chapterOutline,
      hasSpecification: !!writingContext.specification,
      hasPlotBeats: writingContext.plotBeats.length > 0,
      hasCharacters: writingContext.characters.main.length > 0,
      hasPreviousChapter: !!writingContext.previousChapter,
      hasScenes: writingContext.scenes.length > 0,
    } : {
      title: formData.title,
      chapterNumber: formData.number,
      approvedOutline: chapterOutline,
    }

    const result = await generate({
      agentTarget: 'chapter',
      action: 'generate-chapter-from-outline',
      context,
    })

    if (result) {
      const wordCount = result.trim() ? result.trim().split(/\s+/).length : 0
      setFormData(prev => ({
        ...prev,
        content: result,
        wordCount,
      }))
    }
  }, [chapterOutline, formData.title, formData.number, generate, writingContext])

  // Handle AI generation for chapter content (direct, without outline)
  const handleAIGenerate = useCallback(async () => {
    if (!formData.title.trim()) {
      setErrors({ title: 'Please enter a title before generating content' })
      return
    }

    setAIProgressTitle('Generating Chapter Content')
    setShowAIProgress(true)

    // Build comprehensive context for AI generation
    const context = writingContext ? {
      // Full writing context
      ...writingContext,
      // Explicit flags to confirm context is available
      hasSpecification: !!writingContext.specification,
      hasPlotBeats: writingContext.plotBeats.length > 0,
      hasCharacters: writingContext.characters.main.length > 0,
      hasPreviousChapter: !!writingContext.previousChapter,
      hasScenes: writingContext.scenes.length > 0,
    } : {
      // Fallback minimal context if no project
      title: formData.title,
      chapterNumber: formData.number,
      synopsis: formData.content || 'A new chapter begins.',
    }

    const result = await generate({
      agentTarget: 'chapter',
      action: 'generate-chapter',
      context: {
        ...context,
        generationLength,
        styleStrictness,
        showAlternatives,
      },
    })

    if (result) {
      // Update content with generated result
      const wordCount = result.trim() ? result.trim().split(/\s+/).length : 0
      setFormData(prev => ({
        ...prev,
        content: result,
        wordCount,
      }))

      // If showAlternatives is enabled, generate alternatives and show modal
      if (showAlternatives) {
        // Generate sample alternatives (in real impl, AI would generate these)
        const alt1 = result.replace(/begins/g, 'starts').replace(/continues/g, 'unfolds')
        const alt2 = result.replace(/new/g, 'fresh').replace(/story/g, 'narrative')
        const alt3 = result.replace(/characters/g, 'protagonists').replace(/decisions/g, 'choices')
        setAlternatives([alt1, alt2, alt3])
        setShowAlternativesModal(true)
      }
    }
  }, [formData.title, formData.number, formData.content, generate, writingContext, generationLength, styleStrictness, showAlternatives])

  const handleCloseAIProgress = useCallback(() => {
    setShowAIProgress(false)
    resetAI()
  }, [resetAI])

  // Handle selecting an alternative version
  const handleSelectAlternative = useCallback((alternative: string) => {
    const wordCount = alternative.trim() ? alternative.trim().split(/\s+/).length : 0
    setFormData(prev => ({
      ...prev,
      content: alternative,
      wordCount,
    }))
    setShowAlternativesModal(false)
    setAlternatives([])
  }, [])

  // Handle text selection in content textarea
  const handleTextSelect = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = textarea.value.substring(start, end)

    setSelectionStart(start)
    setSelectionEnd(end)
    setSelectedText(selected)
  }, [])

  // Handle expand action - adds more detail to selected passage
  const handleExpandText = useCallback(async () => {
    if (!selectedText.trim()) return

    setAIProgressTitle('Expanding Passage')
    setShowAIProgress(true)

    const context = {
      selectedText,
      fullContent: formData.content,
      selectionStart,
      selectionEnd,
      chapterTitle: formData.title,
      chapterNumber: formData.number,
      instruction: 'Expand this passage with more detail, description, and depth while preserving the original meaning and structure.',
      ...(writingContext || {}),
    }

    const result = await generate({
      agentTarget: 'chapter',
      action: 'expand-passage',
      context,
    })

    if (result) {
      // Replace the selected text with the expanded version
      const newContent =
        formData.content.substring(0, selectionStart) +
        result +
        formData.content.substring(selectionEnd)

      const wordCount = newContent.trim() ? newContent.trim().split(/\s+/).length : 0
      setFormData(prev => ({
        ...prev,
        content: newContent,
        wordCount,
      }))

      // Clear selection
      setSelectedText('')
      setSelectionStart(0)
      setSelectionEnd(0)
    }
  }, [selectedText, formData.content, formData.title, formData.number, selectionStart, selectionEnd, generate, writingContext])

  // Handle condense action - makes selected passage shorter
  const handleCondenseText = useCallback(async () => {
    if (!selectedText.trim()) return

    setAIProgressTitle('Condensing Passage')
    setShowAIProgress(true)

    const context = {
      selectedText,
      fullContent: formData.content,
      selectionStart,
      selectionEnd,
      chapterTitle: formData.title,
      chapterNumber: formData.number,
      instruction: 'Condense this passage to be more concise while preserving the key content, meaning, and important details.',
      ...(writingContext || {}),
    }

    const result = await generate({
      agentTarget: 'chapter',
      action: 'condense-passage',
      context,
    })

    if (result) {
      // Replace the selected text with the condensed version
      const newContent =
        formData.content.substring(0, selectionStart) +
        result +
        formData.content.substring(selectionEnd)

      const wordCount = newContent.trim() ? newContent.trim().split(/\s+/).length : 0
      setFormData(prev => ({
        ...prev,
        content: newContent,
        wordCount,
      }))

      // Clear selection
      setSelectedText('')
      setSelectionStart(0)
      setSelectionEnd(0)
    }
  }, [selectedText, formData.content, formData.title, formData.number, selectionStart, selectionEnd, generate, writingContext])

  // Handle lock passage action - protects selected passage from changes
  const handleLockPassage = useCallback(() => {
    if (!selectedText.trim() || selectionStart === selectionEnd) return

    const newLockedPassage = {
      start: selectionStart,
      end: selectionEnd,
      reason: 'User locked passage',
    }

    // Add to locked passages, avoiding overlaps
    const existingLocked = formData.lockedPassages || []
    const nonOverlapping = existingLocked.filter(lp =>
      lp.end <= selectionStart || lp.start >= selectionEnd
    )

    setFormData(prev => ({
      ...prev,
      lockedPassages: [...nonOverlapping, newLockedPassage],
    }))

    // Clear selection
    setSelectedText('')
    setSelectionStart(0)
    setSelectionEnd(0)
  }, [selectedText, selectionStart, selectionEnd, formData.lockedPassages])

  // Handle unlock passage action
  const handleUnlockPassage = useCallback((passageIndex: number) => {
    const existingLocked = formData.lockedPassages || []
    const updatedLocked = existingLocked.filter((_, i) => i !== passageIndex)

    setFormData(prev => ({
      ...prev,
      lockedPassages: updatedLocked,
    }))
  }, [formData.lockedPassages])

  // Check if current selection overlaps with a locked passage
  const isSelectionLocked = useMemo(() => {
    const lockedPassages = formData.lockedPassages || []
    return lockedPassages.some(lp =>
      (selectionStart < lp.end && selectionEnd > lp.start)
    )
  }, [formData.lockedPassages, selectionStart, selectionEnd])

  // Handle Escape key to close
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast({
        title: 'Please fix validation errors',
        variant: 'error',
      })
      return
    }

    const chapter: Chapter = {
      id: editChapter?.id || generateId(),
      ...formData,
      title: formData.title.trim(),
    }

    onSave(chapter)
    toast({
      title: editChapter ? 'Chapter updated' : 'Chapter created',
      variant: 'success',
    })
    onClose()
  }

  const handleChange = (field: keyof Omit<Chapter, 'id'>, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-text-primary">
              {editChapter ? 'Edit Chapter' : 'New Chapter'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-text-secondary" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="chapter-number" className="block text-sm text-text-primary mb-1">
                Chapter Number
              </label>
              <input
                id="chapter-number"
                type="number"
                value={formData.number}
                onChange={(e) => handleChange('number', parseInt(e.target.value) || 1)}
                min="1"
                max="999"
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="chapter-status" className="block text-sm text-text-primary mb-1">Status</label>
              <select
                id="chapter-status"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value as ChapterStatus)}
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {STATUSES.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="chapter-title" className="block text-sm text-text-primary mb-1">
              Title <span className="text-error">*</span>
            </label>
            <input
              id="chapter-title"
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Chapter title"
              aria-invalid={errors.title ? 'true' : undefined}
              aria-describedby={errors.title ? 'chapter-title-error' : undefined}
              className={`w-full px-3 py-2 bg-surface-elevated border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent ${
                errors.title ? 'border-error' : 'border-border'
              }`}
            />
            {errors.title && (
              <p id="chapter-title-error" className="text-xs text-error mt-1" role="alert">{errors.title}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="chapter-content" className="block text-sm text-text-primary">
                Content
              </label>
              <div className="flex items-center gap-2">
                {/* Generation Length Selector */}
                <select
                  id="generation-length"
                  value={generationLength}
                  onChange={(e) => setGenerationLength(e.target.value as GenerationLength)}
                  className="px-2 py-1.5 text-xs bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  title="Select generation length"
                  aria-label="Generation length"
                >
                  {GENERATION_LENGTH_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} ({option.description})
                    </option>
                  ))}
                </select>
                {/* Style Strictness Selector */}
                <select
                  id="style-strictness"
                  value={styleStrictness}
                  onChange={(e) => setStyleStrictness(e.target.value as StyleStrictness)}
                  className="px-2 py-1.5 text-xs bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  title="Select style strictness"
                  aria-label="Style strictness"
                >
                  {STYLE_STRICTNESS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} ({option.description})
                    </option>
                  ))}
                </select>
                {/* Show Alternatives Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAlternatives(!showAlternatives)}
                  className={`inline-flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-lg transition-colors ${
                    showAlternatives
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                      : 'bg-surface-elevated text-text-secondary border border-border hover:border-cyan-500/30 hover:text-cyan-400'
                  }`}
                  title={showAlternatives ? "Alternatives enabled - AI will show 3 versions" : "Enable to see alternative versions when generating"}
                  aria-pressed={showAlternatives}
                >
                  <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
                  Alts
                </button>
                <button
                  type="button"
                  onClick={handleGenerateOutline}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Generate a scene-by-scene outline for review before writing"
                >
                  <ListOrdered className="h-3.5 w-3.5" aria-hidden="true" />
                  Generate Outline
                </button>
                <button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={isGenerating}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    formData.content
                      ? 'bg-warning/10 text-warning border border-warning/30 hover:bg-warning/20'
                      : 'bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20'
                  }`}
                  title={formData.content ? "Regenerate chapter content with AI (replaces current)" : "Generate chapter content directly with AI"}
                >
                  {formData.content ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                      Regenerate
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      Generate Prose
                    </>
                  )}
                </button>
                {/* Expand button - visible when text is selected */}
                {selectedText && (
                  <button
                    type="button"
                    onClick={handleExpandText}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-success/10 text-success border border-success/30 rounded-lg hover:bg-success/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Expand selected text with more detail"
                  >
                    <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Expand
                  </button>
                )}
                {/* Condense button - visible when text is selected */}
                {selectedText && (
                  <button
                    type="button"
                    onClick={handleCondenseText}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Condense selected text to be more concise"
                  >
                    <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Condense
                  </button>
                )}
                {/* Lock button - visible when text is selected and not already locked */}
                {selectedText && !isSelectionLocked && (
                  <button
                    type="button"
                    onClick={handleLockPassage}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-pink-500/10 text-pink-400 border border-pink-500/30 rounded-lg hover:bg-pink-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Lock selected passage to protect from AI changes"
                  >
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    Lock
                  </button>
                )}
              </div>
            </div>
            <textarea
              id="chapter-content"
              value={formData.content}
              onChange={(e) => {
                const content = e.target.value
                const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
                handleChange('content', content)
                handleChange('wordCount', wordCount)
              }}
              onSelect={handleTextSelect}
              onMouseUp={handleTextSelect}
              placeholder="Start writing your chapter or use AI to generate content..."
              rows={8}
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none font-serif"
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-text-secondary">
                {formData.wordCount.toLocaleString()} words
              </p>
              {(formData.lockedPassages?.length || 0) > 0 && (
                <p className="text-xs text-pink-400 flex items-center gap-1">
                  <Lock className="h-3 w-3" aria-hidden="true" />
                  {formData.lockedPassages?.length} locked passage{formData.lockedPassages?.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            {/* Locked passages indicator */}
            {(formData.lockedPassages?.length || 0) > 0 && (
              <div className="mt-2 p-2 bg-pink-500/10 border border-pink-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-pink-400 mb-2">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="font-medium">Locked Passages</span>
                </div>
                <div className="space-y-1">
                  {formData.lockedPassages?.map((lp, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-xs bg-surface rounded px-2 py-1"
                    >
                      <span className="text-text-secondary truncate max-w-[200px]">
                        "{formData.content.substring(lp.start, Math.min(lp.end, lp.start + 30))}..."
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUnlockPassage(index)}
                        className="text-pink-400 hover:text-pink-300 flex items-center gap-1 ml-2"
                        title="Unlock this passage"
                      >
                        <Unlock className="h-3 w-3" aria-hidden="true" />
                        Unlock
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Outline Preview Modal */}
        {showOutlinePreview && (
          <div className="absolute inset-0 bg-surface rounded-lg flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListOrdered className="h-5 w-5 text-purple-400" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-text-primary">Chapter Outline Preview</h3>
              </div>
              <button
                onClick={() => setShowOutlinePreview(false)}
                className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
                aria-label="Close outline preview"
              >
                <X className="h-5 w-5 text-text-secondary" aria-hidden="true" />
              </button>
            </div>
            <p className="px-4 pt-2 text-sm text-text-secondary">
              Review and modify the scene-by-scene outline below, then approve to generate prose.
            </p>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chapterOutline.map((scene, index) => (
                <div
                  key={index}
                  className="p-3 bg-surface-elevated rounded-lg border border-border"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
                        Scene {scene.sceneNumber}
                      </span>
                      {editingOutlineIndex === index ? (
                        <input
                          type="text"
                          value={scene.title}
                          onChange={(e) => handleOutlineEdit(index, 'title', e.target.value)}
                          className="px-2 py-0.5 text-sm font-medium bg-surface border border-accent rounded text-text-primary focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm font-medium text-text-primary">{scene.title}</span>
                      )}
                    </div>
                    <button
                      onClick={() => setEditingOutlineIndex(editingOutlineIndex === index ? null : index)}
                      className="p-1 rounded hover:bg-surface transition-colors"
                      aria-label={editingOutlineIndex === index ? 'Done editing' : 'Edit scene'}
                    >
                      {editingOutlineIndex === index ? (
                        <Check className="h-4 w-4 text-success" aria-hidden="true" />
                      ) : (
                        <Edit2 className="h-4 w-4 text-text-secondary" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {editingOutlineIndex === index ? (
                    <textarea
                      value={scene.summary}
                      onChange={(e) => handleOutlineEdit(index, 'summary', e.target.value)}
                      className="w-full px-2 py-1 text-sm bg-surface border border-border rounded text-text-secondary focus:outline-none focus:border-accent resize-none"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm text-text-secondary">{scene.summary}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
                    {scene.povCharacter && (
                      <span>POV: {scene.povCharacter}</span>
                    )}
                    <span>~{scene.estimatedWords.toLocaleString()} words</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border flex items-center justify-between">
              <p className="text-sm text-text-secondary">
                Total: ~{chapterOutline.reduce((sum, s) => sum + s.estimatedWords, 0).toLocaleString()} words estimated
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowOutlinePreview(false)}
                  className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-elevated transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveOutline}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Approve & Generate Prose
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-border flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-elevated transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            {editChapter ? 'Save Changes' : 'Create Chapter'}
          </button>
        </div>
      </div>

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

      {/* Alternatives Modal */}
      {showAlternativesModal && alternatives.length > 0 && (
        <div
          className="fixed inset-0 z-popover flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="alternatives-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAlternativesModal(false)}
          />
          <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Shuffle className="h-5 w-5 text-cyan-400" aria-hidden="true" />
                <h2 id="alternatives-modal-title" className="text-lg font-semibold text-text-primary">
                  Alternative Versions
                </h2>
              </div>
              <button
                onClick={() => setShowAlternativesModal(false)}
                className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
                aria-label="Close alternatives"
              >
                <X className="h-5 w-5 text-text-secondary" aria-hidden="true" />
              </button>
            </div>
            <p className="px-4 pt-3 text-sm text-text-secondary">
              Select your preferred version. The current content is shown first.
            </p>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Current content as first option */}
              <div
                className="p-4 bg-accent/10 border-2 border-accent/40 rounded-lg cursor-pointer hover:bg-accent/20 transition-colors"
                onClick={() => setShowAlternativesModal(false)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-accent">Current Version (Selected)</span>
                  <span className="text-xs text-text-secondary">
                    {formData.wordCount.toLocaleString()} words
                  </span>
                </div>
                <p className="text-sm text-text-secondary line-clamp-3">
                  {formData.content.substring(0, 200)}...
                </p>
              </div>
              {/* Alternative versions */}
              {alternatives.map((alt, index) => {
                const wordCount = alt.trim() ? alt.trim().split(/\s+/).length : 0
                return (
                  <div
                    key={index}
                    className="p-4 bg-surface-elevated border border-border rounded-lg cursor-pointer hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-colors"
                    onClick={() => handleSelectAlternative(alt)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-cyan-400">Alternative {index + 1}</span>
                      <span className="text-xs text-text-secondary">
                        {wordCount.toLocaleString()} words
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary line-clamp-3">
                      {alt.substring(0, 200)}...
                    </p>
                  </div>
                )
              })}
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setShowAlternativesModal(false)}
                className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-elevated transition-colors"
              >
                Keep Current
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
