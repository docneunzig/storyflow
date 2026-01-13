import { useState, useCallback } from 'react'
import type { Project, Chapter } from '@/types/project'
import { useLanguageStore } from '@/stores/languageStore'
import { useAIGeneration } from '@/hooks/useAIGeneration'
import { toast } from '@/components/ui/Toaster'

interface UseInlineAIOptions {
  project: Project
  selectedChapterId: string | null
  onUpdateChapterContent: (chapter: Chapter, newContent: string) => Promise<void>
}

export function useInlineAI({ project, selectedChapterId, onUpdateChapterContent }: UseInlineAIOptions) {
  const t = useLanguageStore((state) => state.t)
  const {
    status: aiStatus,
    progress: aiProgress,
    message: aiMessage,
    isGenerating,
    generate,
    cancel: cancelGeneration,
    reset: resetAI,
  } = useAIGeneration()

  // Text selection state
  const [selectedText, setSelectedText] = useState('')
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null)

  // AI progress modal state
  const [showAIProgress, setShowAIProgress] = useState(false)
  const [aiProgressTitle, setAIProgressTitle] = useState('')

  // Alternatives modal state
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [alternatives, setAlternatives] = useState<string[]>([])

  // Handle text selection
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim().length > 0) {
      const text = selection.toString()
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      setSelectedText(text)
      setSelectionRect(rect)
    } else {
      setSelectedText('')
      setSelectionRect(null)
    }
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedText('')
    setSelectionRect(null)
  }, [])

  // AI action: Expand selection
  const handleAIExpand = async () => {
    if (!selectedText || !selectedChapterId) return

    setAIProgressTitle('Expanding Selection')
    setShowAIProgress(true)
    handleClearSelection()

    try {
      const result = await generate({
        agentTarget: 'writer',
        action: 'expand-selection',
        context: {
          selectedText,
          chapterId: selectedChapterId,
          projectId: project.id,
          specification: project.specification,
          characters: project.characters?.map(c => ({ name: c.name, role: c.role })),
        },
      })

      if (result) {
        const chapter = project.chapters.find(c => c.id === selectedChapterId)
        if (chapter && chapter.content) {
          const newContent = chapter.content.replace(selectedText, result)
          await onUpdateChapterContent(chapter, newContent)
          toast({ title: t.toasts.generateSuccess, variant: 'success' })
        }
      }
    } catch {
      toast({ title: t.toasts.generateError, variant: 'error' })
    } finally {
      setShowAIProgress(false)
      resetAI()
    }
  }

  // AI action: Condense selection
  const handleAICondense = async () => {
    if (!selectedText || !selectedChapterId) return

    setAIProgressTitle('Condensing Selection')
    setShowAIProgress(true)
    handleClearSelection()

    try {
      const result = await generate({
        agentTarget: 'writer',
        action: 'condense-selection',
        context: {
          selectedText,
          chapterId: selectedChapterId,
          projectId: project.id,
        },
      })

      if (result) {
        const chapter = project.chapters.find(c => c.id === selectedChapterId)
        if (chapter && chapter.content) {
          const newContent = chapter.content.replace(selectedText, result)
          await onUpdateChapterContent(chapter, newContent)
          toast({ title: t.toasts.generateSuccess, variant: 'success' })
        }
      }
    } catch {
      toast({ title: t.toasts.generateError, variant: 'error' })
    } finally {
      setShowAIProgress(false)
      resetAI()
    }
  }

  // AI action: Rewrite selection
  const handleAIRewrite = async () => {
    if (!selectedText || !selectedChapterId) return

    setAIProgressTitle('Rewriting Selection')
    setShowAIProgress(true)
    handleClearSelection()

    try {
      const result = await generate({
        agentTarget: 'writer',
        action: 'rewrite-selection',
        context: {
          selectedText,
          chapterId: selectedChapterId,
          projectId: project.id,
          specification: project.specification,
        },
      })

      if (result) {
        const chapter = project.chapters.find(c => c.id === selectedChapterId)
        if (chapter && chapter.content) {
          const newContent = chapter.content.replace(selectedText, result)
          await onUpdateChapterContent(chapter, newContent)
          toast({ title: t.toasts.generateSuccess, variant: 'success' })
        }
      }
    } catch {
      toast({ title: t.toasts.generateError, variant: 'error' })
    } finally {
      setShowAIProgress(false)
      resetAI()
    }
  }

  // AI action: Generate alternatives
  const handleAIAlternatives = async () => {
    if (!selectedText || !selectedChapterId) return

    setShowAlternatives(true)
    setAlternatives([])
    handleClearSelection()

    try {
      const result = await generate({
        agentTarget: 'writer',
        action: 'generate-alternatives',
        context: {
          selectedText,
          chapterId: selectedChapterId,
          projectId: project.id,
          specification: project.specification,
        },
      })

      if (result) {
        try {
          const parsed = JSON.parse(result)
          setAlternatives(Array.isArray(parsed) ? parsed : [result])
        } catch {
          setAlternatives(result.split('\n\n').filter(a => a.trim()))
        }
      }
    } catch {
      toast({ title: t.toasts.generateError, variant: 'error' })
      setShowAlternatives(false)
    }
  }

  // Select an alternative
  const handleSelectAlternative = async (alternative: string) => {
    if (!selectedChapterId) return

    const chapter = project.chapters.find(c => c.id === selectedChapterId)
    if (chapter && chapter.content && selectedText) {
      const newContent = chapter.content.replace(selectedText, alternative)
      await onUpdateChapterContent(chapter, newContent)
      toast({ title: t.toasts.saveSuccess, variant: 'success' })
    }
    setShowAlternatives(false)
    setAlternatives([])
    resetAI()
  }

  return {
    // Text selection
    selectedText,
    selectionRect,
    handleTextSelection,
    handleClearSelection,

    // AI state
    aiStatus,
    aiProgress,
    aiMessage,
    isGenerating,
    cancelGeneration,
    resetAI,

    // Progress modal
    showAIProgress,
    setShowAIProgress,
    aiProgressTitle,

    // Alternatives modal
    showAlternatives,
    setShowAlternatives,
    alternatives,
    setAlternatives,

    // AI actions
    handleAIExpand,
    handleAICondense,
    handleAIRewrite,
    handleAIAlternatives,
    handleSelectAlternative,
  }
}
