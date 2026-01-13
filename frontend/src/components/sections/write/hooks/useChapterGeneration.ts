import { useState, useCallback } from 'react'
import type { Project, Chapter, CharacterVoiceDNA, SceneGenerationResult, GenerationCheckpoint } from '@/types/project'
import { useLanguageStore } from '@/stores/languageStore'
import { useAIGeneration } from '@/hooks/useAIGeneration'
import { toast } from '@/components/ui/Toaster'

interface UseChapterGenerationOptions {
  project: Project
  selectedChapterId: string | null
  onSaveChapter: (chapter: Chapter) => Promise<boolean>
}

export function useChapterGeneration({
  project,
  selectedChapterId,
  onSaveChapter
}: UseChapterGenerationOptions) {
  const t = useLanguageStore((state) => state.t)
  const {
    isGenerating,
    generate,
    reset: resetAI,
  } = useAIGeneration()

  // AI progress state
  const [showAIProgress, setShowAIProgress] = useState(false)
  const [aiProgressTitle, setAIProgressTitle] = useState('')

  // Guided Generation state
  const [guidedMode, setGuidedMode] = useState(false)
  const [voiceDNA] = useState<Record<string, CharacterVoiceDNA>>({})
  const [generationResults, setGenerationResults] = useState<Record<string, SceneGenerationResult>>({})
  const [currentCheckpoint] = useState<GenerationCheckpoint | null>(null)
  const [generatingSceneId, setGeneratingSceneId] = useState<string | undefined>(undefined)

  // Get previous chapter content for context
  const getPreviousChapterContent = (currentNumber: number): string => {
    const prevChapter = project.chapters.find(c => c.number === currentNumber - 1)
    if (prevChapter?.content) {
      return prevChapter.content.slice(-1000)
    }
    return ''
  }

  // Helper to update chapter content
  const handleUpdateChapterContent = async (chapter: Chapter, newContent: string) => {
    const wordCount = newContent.trim().split(/\s+/).filter(w => w).length
    const updatedChapter: Chapter = {
      ...chapter,
      content: newContent,
      wordCount,
      status: chapter.status === 'outline' ? 'draft' : chapter.status,
    }
    await onSaveChapter(updatedChapter)
  }

  // Continue writing from current position
  const handleContinueWriting = async () => {
    if (!selectedChapterId) return

    const chapter = project.chapters.find(c => c.id === selectedChapterId)
    if (!chapter) return

    setAIProgressTitle('Continuing Your Story')
    setShowAIProgress(true)

    try {
      const result = await generate({
        agentTarget: 'writer',
        action: 'continue-writing',
        context: {
          currentContent: chapter.content || '',
          chapterId: selectedChapterId,
          projectId: project.id,
          specification: project.specification,
          characters: project.characters?.map(c => ({
            name: c.name,
            role: c.role,
            personalitySummary: c.personalitySummary,
            speechPatterns: c.speechPatterns,
          })),
          scenes: project.scenes?.filter(s => s.chapterId === selectedChapterId),
        },
      })

      if (result) {
        const newContent = (chapter.content || '') + '\n\n' + result
        await handleUpdateChapterContent(chapter, newContent)
        toast({ title: t.toasts.generateSuccess, variant: 'success' })
      }
    } catch {
      toast({ title: t.toasts.generateError, variant: 'error' })
    } finally {
      setShowAIProgress(false)
      resetAI()
    }
  }

  // Generate chapter draft from scene outlines
  const handleGenerateChapterDraft = async () => {
    if (!selectedChapterId) return

    const chapter = project.chapters.find(c => c.id === selectedChapterId)
    if (!chapter) return

    const chapterScenes = project.scenes?.filter(s => s.chapterId === selectedChapterId) || []

    if (chapterScenes.length === 0) {
      toast({
        title: 'No scenes assigned',
        description: 'Assign scenes to this chapter first, or use the chapter modal to generate content.',
        variant: 'error'
      })
      return
    }

    setAIProgressTitle('Generating Chapter Draft')
    setShowAIProgress(true)

    try {
      const result = await generate({
        agentTarget: 'writer',
        action: 'generate-chapter-draft',
        context: {
          chapterId: selectedChapterId,
          chapterTitle: chapter.title,
          chapterNumber: chapter.number,
          projectId: project.id,
          specification: project.specification,
          scenes: chapterScenes.map(s => ({
            title: s.title,
            summary: s.summary,
            detailedOutline: s.detailedOutline,
            povCharacterId: s.povCharacterId,
            pacing: s.pacing,
            tone: s.tone,
            conflictType: s.conflictType,
          })),
          characters: project.characters?.map(c => ({
            id: c.id,
            name: c.name,
            role: c.role,
            personalitySummary: c.personalitySummary,
            speechPatterns: c.speechPatterns,
            vocabularyLevel: c.vocabularyLevel,
          })),
          previousChapterContent: getPreviousChapterContent(chapter.number),
        },
      })

      if (result) {
        await handleUpdateChapterContent(chapter, result)
        toast({ title: t.toasts.generateSuccess, variant: 'success' })
      }
    } catch {
      toast({ title: t.toasts.generateError, variant: 'error' })
    } finally {
      setShowAIProgress(false)
      resetAI()
    }
  }

  // Guided Generation handlers
  const handleGenerateScene = useCallback(async (sceneId: string) => {
    setGeneratingSceneId(sceneId)
    try {
      // Simulate AI scene generation
      await new Promise(resolve => setTimeout(resolve, 2000))

      const projectScenes = project.scenes || []
      const scene = projectScenes.find(s => s.id === sceneId)
      if (!scene) return

      const result: SceneGenerationResult = {
        sceneId,
        generatedProse: `[Generated content for "${scene.title}"]\n\nThe scene unfolds with careful attention to pacing and character voice. This is placeholder text that would be replaced by actual AI-generated content based on the scene outline, character voices, and story context.`,
        outlineAdherenceScore: 0.85,
        voiceMatchScores: {},
        continuityIssues: [],
        generatedAt: new Date().toISOString(),
        status: 'pending_review',
      }

      setGenerationResults(prev => ({ ...prev, [sceneId]: result }))
    } finally {
      setGeneratingSceneId(undefined)
    }
  }, [project.scenes])

  const handleApproveGeneration = useCallback((sceneId: string) => {
    setGenerationResults(prev => {
      const result = prev[sceneId]
      if (!result) return prev
      return { ...prev, [sceneId]: { ...result, status: 'approved' as const } }
    })
    toast({ title: t.toasts.saveSuccess, variant: 'success' })
  }, [t])

  const handleRejectGeneration = useCallback((sceneId: string) => {
    setGenerationResults(prev => {
      const result = prev[sceneId]
      if (!result) return prev
      return { ...prev, [sceneId]: { ...result, status: 'rejected' as const } }
    })
    toast({ title: t.toasts.saveSuccess, variant: 'default' })
  }, [t])

  const handleRegenerateScene = useCallback(async (sceneId: string) => {
    setGenerationResults(prev => {
      const newResults = { ...prev }
      delete newResults[sceneId]
      return newResults
    })
    await handleGenerateScene(sceneId)
  }, [handleGenerateScene])

  const handleSkipScene = useCallback((sceneId: string) => {
    setGenerationResults(prev => {
      const result = prev[sceneId]
      if (!result) {
        return {
          ...prev,
          [sceneId]: {
            sceneId,
            generatedProse: '',
            outlineAdherenceScore: 0,
            voiceMatchScores: {},
            continuityIssues: [],
            generatedAt: new Date().toISOString(),
            status: 'needs_revision' as const,
          }
        }
      }
      return { ...prev, [sceneId]: { ...result, status: 'needs_revision' as const } }
    })
    toast({ title: t.toasts.saveSuccess, variant: 'default' })
  }, [t])

  const handleFinalizeGeneration = useCallback(async () => {
    const projectScenes = project.scenes || []
    const currentChapter = project.chapters.find(c => c.id === selectedChapterId)

    const approvedContent = Object.values(generationResults)
      .filter(r => r.status === 'approved')
      .sort((a, b) => {
        const sceneA = projectScenes.findIndex(s => s.id === a.sceneId)
        const sceneB = projectScenes.findIndex(s => s.id === b.sceneId)
        return sceneA - sceneB
      })
      .map(r => r.generatedProse)
      .join('\n\n---\n\n')

    if (currentChapter && approvedContent) {
      const updatedChapter: Chapter = {
        ...currentChapter,
        content: (currentChapter.content || '') + '\n\n' + approvedContent,
        wordCount: (currentChapter.wordCount || 0) + approvedContent.split(/\s+/).filter(Boolean).length,
        status: 'draft',
      }
      await onSaveChapter(updatedChapter)
      setGuidedMode(false)
      setGenerationResults({})
      toast({ title: t.toasts.saveSuccess, variant: 'success' })
    }
  }, [generationResults, project.scenes, project.chapters, selectedChapterId, t, onSaveChapter])

  return {
    // Progress state
    showAIProgress,
    setShowAIProgress,
    aiProgressTitle,
    isGenerating,

    // Chapter generation
    handleContinueWriting,
    handleGenerateChapterDraft,
    handleUpdateChapterContent,

    // Guided generation
    guidedMode,
    setGuidedMode,
    voiceDNA,
    generationResults,
    currentCheckpoint,
    generatingSceneId,
    handleGenerateScene,
    handleApproveGeneration,
    handleRejectGeneration,
    handleRegenerateScene,
    handleSkipScene,
    handleFinalizeGeneration,
  }
}
