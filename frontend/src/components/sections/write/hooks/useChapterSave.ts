import { useState, useRef } from 'react'
import type { Chapter, Project, RevisionHistory, DailyWordCount, WritingStatistics, WikiEntry } from '@/types/project'
import { useProjectStore } from '@/stores/projectStore'
import { updateProject } from '@/lib/db'
import { useLanguageStore } from '@/stores/languageStore'
import { toast } from '@/components/ui/Toaster'
import { getTodayDateString } from '../constants'
import { useStoryMemory } from '@/hooks/useStoryMemory'

// Helper to create a revision history entry when chapter content changes
function createRevisionHistory(
  oldChapter: Chapter,
  newChapter: Chapter,
  existingRevisions: RevisionHistory[],
  qualityScores: { chapterId: string; overallScore: number }[]
): RevisionHistory | null {
  // Only create revision if content actually changed
  if (!oldChapter.content || oldChapter.content === newChapter.content) {
    return null
  }

  // Calculate revision number
  const chapterRevisions = existingRevisions.filter(r => r.chapterId === oldChapter.id)
  const nextRevisionNumber = chapterRevisions.length + 1

  // Get the most recent quality score for this chapter (score before changes)
  const chapterQualityScores = qualityScores.filter(qs => qs.chapterId === oldChapter.id)
  const latestScore = chapterQualityScores.length > 0
    ? chapterQualityScores[chapterQualityScores.length - 1].overallScore
    : 0

  return {
    chapterId: oldChapter.id,
    revisionNumber: nextRevisionNumber,
    timestamp: new Date().toISOString(),
    previousContent: oldChapter.content,
    changes: [],
    qualityScoreBefore: latestScore,
    qualityScoreAfter: 0,
  }
}

// Helper to detect character first appearances in chapter content
function detectCharacterFirstAppearances(
  chapterContent: string,
  chapterTitle: string,
  chapterNumber: number,
  characters: { id: string; name: string; aliases: string[]; firstAppearance: string | null }[]
): { id: string; firstAppearance: string }[] {
  const updates: { id: string; firstAppearance: string }[] = []

  if (!chapterContent) return updates

  const contentLower = chapterContent.toLowerCase()

  for (const character of characters) {
    if (character.firstAppearance) continue

    const nameAppears = contentLower.includes(character.name.toLowerCase())
    const aliasAppears = (character.aliases || []).some(alias =>
      alias && contentLower.includes(alias.toLowerCase())
    )

    if (nameAppears || aliasAppears) {
      updates.push({
        id: character.id,
        firstAppearance: `Chapter ${chapterNumber}: ${chapterTitle}`
      })
    }
  }

  return updates
}

// Helper to update daily word count tracking
function updateDailyWordCount(
  currentStats: WritingStatistics | null,
  wordsAdded: number
): WritingStatistics {
  const today = getTodayDateString()
  const existingWordsPerDay = currentStats?.wordsPerDay || []

  const todayIndex = existingWordsPerDay.findIndex(d => d.date === today)
  let updatedWordsPerDay: DailyWordCount[]

  if (todayIndex >= 0) {
    updatedWordsPerDay = existingWordsPerDay.map((d, i) =>
      i === todayIndex ? { ...d, count: d.count + wordsAdded } : d
    )
  } else {
    updatedWordsPerDay = [...existingWordsPerDay, { date: today, count: wordsAdded }]
  }

  // Keep only the last 30 days of data
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]
  updatedWordsPerDay = updatedWordsPerDay.filter(d => d.date >= thirtyDaysAgoStr)

  // Sort by date
  updatedWordsPerDay.sort((a, b) => a.date.localeCompare(b.date))

  return {
    totalWords: currentStats?.totalWords || 0,
    wordsPerDay: updatedWordsPerDay,
    sessionsLogged: currentStats?.sessionsLogged || [],
    averageSessionLength: currentStats?.averageSessionLength || 0,
    chaptersCompleted: currentStats?.chaptersCompleted || 0,
    totalChapters: currentStats?.totalChapters || 0,
    revisionsCompleted: currentStats?.revisionsCompleted || 0,
    averageQualityScore: currentStats?.averageQualityScore || 0,
  }
}

interface UseChapterSaveOptions {
  project: Project
  onChapterSaved?: (chapter: Chapter) => void
}

export function useChapterSave({ project, onChapterSaved }: UseChapterSaveOptions) {
  const t = useLanguageStore((state) => state.t)
  const { updateProject: updateProjectStore, setSaveStatus } = useProjectStore()
  const [lastSavedChapter, setLastSavedChapter] = useState<Chapter | null>(null)

  // Story memory for auto-summarization
  const {
    autoSummarizeOnSave,
    updateAllCharactersAfterChapter,
    isGenerating: isMemoryProcessing,
  } = useStoryMemory()

  // Track pending memory updates to avoid duplicate processing
  const pendingMemoryUpdate = useRef<string | null>(null)

  const handleSaveChapter = async (chapter: Chapter) => {
    try {
      setSaveStatus('saving')

      const isEditing = project.chapters.some(c => c.id === chapter.id)
      let updatedChapters: Chapter[]

      // Calculate word count difference for tracking
      const newWordCount = chapter.wordCount || 0
      const oldChapter = project.chapters.find(c => c.id === chapter.id)
      const oldWordCount = oldChapter?.wordCount || 0
      const wordsAdded = newWordCount - oldWordCount

      // Track revision history if content changed
      let updatedRevisions = project.revisions || []
      if (isEditing && oldChapter) {
        const revision = createRevisionHistory(
          oldChapter,
          chapter,
          updatedRevisions,
          project.qualityScores || []
        )
        if (revision) {
          updatedRevisions = [...updatedRevisions, revision]
          chapter = { ...chapter, currentRevision: (oldChapter.currentRevision || 0) + 1 }
        }
      }

      if (isEditing) {
        updatedChapters = project.chapters.map(c =>
          c.id === chapter.id ? chapter : c
        )
        toast({ title: t.toasts.saveSuccess, variant: 'success' })
      } else {
        updatedChapters = [...project.chapters, chapter]
        toast({ title: t.toasts.saveSuccess, variant: 'success' })
      }

      // Sort chapters by number
      updatedChapters.sort((a, b) => a.number - b.number)

      // Update daily word count tracking if words were added
      let updatedStatistics = project.statistics
      if (wordsAdded > 0) {
        updatedStatistics = updateDailyWordCount(project.statistics, wordsAdded)
      }

      // Detect character first appearances in chapter content
      let updatedCharacters = project.characters || []
      if (chapter.content) {
        const firstAppearanceUpdates = detectCharacterFirstAppearances(
          chapter.content,
          chapter.title,
          chapter.number,
          updatedCharacters
        )

        if (firstAppearanceUpdates.length > 0) {
          updatedCharacters = updatedCharacters.map(char => {
            const update = firstAppearanceUpdates.find(u => u.id === char.id)
            if (update) {
              return { ...char, firstAppearance: update.firstAppearance }
            }
            return char
          })
          toast({
            title: t.toasts.saveSuccess,
            variant: 'success'
          })
        }
      }

      await updateProject(project.id, {
        chapters: updatedChapters,
        statistics: updatedStatistics,
        revisions: updatedRevisions,
        characters: updatedCharacters
      })
      updateProjectStore(project.id, {
        chapters: updatedChapters,
        statistics: updatedStatistics,
        revisions: updatedRevisions,
        characters: updatedCharacters
      })
      setSaveStatus('saved')

      // Track for wiki auto-extraction
      if (chapter.content && chapter.content.trim().length > 50) {
        setLastSavedChapter(chapter)
        onChapterSaved?.(chapter)
      }

      // Trigger story memory processing in the background (non-blocking)
      // Only process if not already processing this chapter
      if (chapter.content && chapter.wordCount > 100 && pendingMemoryUpdate.current !== chapter.id) {
        pendingMemoryUpdate.current = chapter.id

        // Run story memory update asynchronously
        setTimeout(async () => {
          try {
            // Auto-summarize the chapter
            await autoSummarizeOnSave(chapter)

            // Update character knowledge states based on the chapter
            await updateAllCharactersAfterChapter(chapter)
          } catch (error) {
            console.error('Story memory update failed:', error)
            // Don't show error to user - this is a background optimization
          } finally {
            pendingMemoryUpdate.current = null
          }
        }, 100)
      }

      return true
    } catch (error) {
      console.error('Failed to save chapter:', error)
      toast({ title: t.toasts.saveError, variant: 'error' })
      setSaveStatus('unsaved')
      return false
    }
  }

  const handleDeleteChapter = async (chapterId: string, selectedChapterId: string | null) => {
    try {
      // Check for dependent scenes
      const dependentScenes = (project.scenes || []).filter(s => s.chapterId === chapterId)
      if (dependentScenes.length > 0) {
        toast({
          title: t.toasts.deleteError,
          variant: 'error'
        })
        return { success: false, clearSelection: false }
      }

      setSaveStatus('saving')
      const updatedChapters = project.chapters.filter(c => c.id !== chapterId)
      await updateProject(project.id, { chapters: updatedChapters })
      updateProjectStore(project.id, { chapters: updatedChapters })
      setSaveStatus('saved')
      toast({ title: t.toasts.deleteSuccess, variant: 'success' })

      return {
        success: true,
        clearSelection: selectedChapterId === chapterId
      }
    } catch (error) {
      console.error('Failed to delete chapter:', error)
      toast({ title: t.toasts.deleteError, variant: 'error' })
      setSaveStatus('unsaved')
      return { success: false, clearSelection: false }
    }
  }

  const handleAddWikiEntries = async (entries: WikiEntry[]) => {
    if (entries.length === 0) return

    try {
      setSaveStatus('saving')
      const existingEntries = project.worldbuildingEntries || []
      const updatedEntries = [...existingEntries, ...entries]
      await updateProject(project.id, { worldbuildingEntries: updatedEntries })
      updateProjectStore(project.id, { worldbuildingEntries: updatedEntries })
      setSaveStatus('saved')
      toast({
        title: t.toasts.saveSuccess,
        variant: 'success',
      })
    } catch (error) {
      console.error('Failed to add wiki entries:', error)
      toast({ title: t.toasts.saveError, variant: 'error' })
      setSaveStatus('unsaved')
    }
  }

  return {
    lastSavedChapter,
    setLastSavedChapter,
    handleSaveChapter,
    handleDeleteChapter,
    handleAddWikiEntries,
    isMemoryProcessing,
  }
}
