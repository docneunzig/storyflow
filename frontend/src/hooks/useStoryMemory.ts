import { useState, useCallback, useMemo } from 'react'
import { useAIGeneration } from './useAIGeneration'
import { useProjectStore } from '@/stores/projectStore'
import type {
  Chapter,
  ChapterSummary,
  CharacterKnowledgeState,
  StoryMemoryContext,
  FactAssertion,
  WikiEntry,
  Subplot,
} from '@/types/project'

// Extended project type with story memory fields
interface ProjectWithMemory {
  chapterSummaries?: ChapterSummary[]
  characterKnowledgeStates?: CharacterKnowledgeState[]
  factAssertions?: FactAssertion[]
  worldbuildingEntries?: WikiEntry[]
  subplots?: Subplot[]
}

export interface StoryMemoryState {
  isProcessing: boolean
  lastSummarizedChapter: number | null
  error: string | null
}

export interface SummarizeChapterOptions {
  chapterId: string
  chapterNumber: number
  chapterTitle?: string
  chapterContent: string
  onSuccess?: (summary: ChapterSummary) => void
}

export interface UpdateCharacterKnowledgeOptions {
  characterId: string
  characterName: string
  characterRole?: string
  chapterId: string
  chapterNumber: number
  chapterSummary: string
  characterExperiences?: string
  newInformation?: string
  onSuccess?: (state: CharacterKnowledgeState) => void
}

export interface GetContextOptions {
  currentChapter: number
  currentScene?: string
  povCharacterId?: string
  taskDescription?: string
  focus?: string
}

export function useStoryMemory() {
  const [state, setState] = useState<StoryMemoryState>({
    isProcessing: false,
    lastSummarizedChapter: null,
    error: null,
  })

  const { generate, isGenerating, error: aiError } = useAIGeneration()
  const currentProject = useProjectStore((s) => s.currentProject)
  const updateProject = useProjectStore((s) => s.updateProject)

  // Get story memory data from project (with type assertion for extended fields)
  const projectMemory = useMemo(() => {
    if (!currentProject) return null
    const project = currentProject as ProjectWithMemory
    return {
      chapterSummaries: project.chapterSummaries || [],
      characterKnowledgeStates: project.characterKnowledgeStates || [],
      factAssertions: project.factAssertions || [],
      worldbuildingEntries: project.worldbuildingEntries || [],
      subplots: project.subplots || [],
    }
  }, [currentProject])

  // Get summary for a specific chapter
  const getSummaryForChapter = useCallback(
    (chapterId: string): ChapterSummary | null => {
      if (!projectMemory) return null
      return projectMemory.chapterSummaries.find((s) => s.chapterId === chapterId) || null
    },
    [projectMemory]
  )

  // Get latest character knowledge state
  const getCharacterState = useCallback(
    (characterId: string): CharacterKnowledgeState | null => {
      if (!projectMemory) return null
      const states = projectMemory.characterKnowledgeStates.filter(
        (s) => s.characterId === characterId
      )
      if (states.length === 0) return null
      // Return the most recent state (highest chapter number)
      return states.reduce((latest, current) =>
        current.asOfChapterNumber > latest.asOfChapterNumber ? current : latest
      )
    },
    [projectMemory]
  )

  // Summarize a chapter and store the result
  const summarizeChapter = useCallback(
    async (options: SummarizeChapterOptions): Promise<ChapterSummary | null> => {
      if (!currentProject) return null

      setState((s) => ({ ...s, isProcessing: true, error: null }))

      try {
        const result = await generate({
          agentTarget: 'storyMemory',
          action: 'summarize-chapter',
          context: {
            specification: currentProject.specification,
            characters: currentProject.characters,
            chapterNumber: options.chapterNumber,
            chapterTitle: options.chapterTitle,
            chapterContent: options.chapterContent,
          },
        })

        if (!result) {
          setState((s) => ({ ...s, isProcessing: false, error: 'Failed to generate summary' }))
          return null
        }

        // Parse the JSON result
        let summaryData: Partial<ChapterSummary>
        try {
          summaryData = JSON.parse(result)
        } catch {
          setState((s) => ({ ...s, isProcessing: false, error: 'Invalid summary format' }))
          return null
        }

        // Create the full summary object
        const summary: ChapterSummary = {
          id: `summary_${options.chapterId}_${Date.now()}`,
          chapterId: options.chapterId,
          chapterNumber: options.chapterNumber,
          summary: summaryData.summary || '',
          keyEvents: summaryData.keyEvents || [],
          charactersPresent: summaryData.charactersPresent || [],
          locationsUsed: summaryData.locationsUsed || [],
          emotionalBeats: summaryData.emotionalBeats || [],
          plotBeatsAdvanced: summaryData.plotBeatsAdvanced || [],
          subplotsTouched: summaryData.subplotsTouched || [],
          foreshadowing: summaryData.foreshadowing || [],
          payoffs: summaryData.payoffs || [],
          cliffhanger: summaryData.cliffhanger || null,
          generatedAt: new Date().toISOString(),
          tokenCount: summaryData.tokenCount || 0,
        }

        // Update project with new summary (replace existing if any)
        const existingSummaries = projectMemory?.chapterSummaries || []
        const updatedSummaries = [
          ...existingSummaries.filter((s) => s.chapterId !== options.chapterId),
          summary,
        ]

        updateProject(currentProject.id, {
          chapterSummaries: updatedSummaries,
        } as Partial<typeof currentProject>)

        setState((s) => ({
          ...s,
          isProcessing: false,
          lastSummarizedChapter: options.chapterNumber,
        }))

        options.onSuccess?.(summary)
        return summary
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to summarize chapter'
        setState((s) => ({ ...s, isProcessing: false, error: message }))
        return null
      }
    },
    [currentProject, projectMemory, generate, updateProject]
  )

  // Update character knowledge state
  const updateCharacterKnowledge = useCallback(
    async (options: UpdateCharacterKnowledgeOptions): Promise<CharacterKnowledgeState | null> => {
      if (!currentProject) return null

      setState((s) => ({ ...s, isProcessing: true, error: null }))

      // Get previous state for this character
      const previousState = getCharacterState(options.characterId)

      try {
        const result = await generate({
          agentTarget: 'storyMemory',
          action: 'update-character-knowledge',
          context: {
            specification: currentProject.specification,
            characters: currentProject.characters,
            characterId: options.characterId,
            characterName: options.characterName,
            characterRole: options.characterRole,
            previousChapter: previousState?.asOfChapterNumber || 0,
            previousKnowledgeState: previousState,
            currentChapter: options.chapterNumber,
            chapterId: options.chapterId,
            chapterSummary: options.chapterSummary,
            characterExperiences: options.characterExperiences,
            newInformation: options.newInformation,
          },
        })

        if (!result) {
          setState((s) => ({ ...s, isProcessing: false, error: 'Failed to update character knowledge' }))
          return null
        }

        // Parse the JSON result
        let stateData: Partial<CharacterKnowledgeState>
        try {
          stateData = JSON.parse(result)
        } catch {
          setState((s) => ({ ...s, isProcessing: false, error: 'Invalid knowledge state format' }))
          return null
        }

        // Create the full state object
        const knowledgeState: CharacterKnowledgeState = {
          id: `knowledge_${options.characterId}_${options.chapterNumber}_${Date.now()}`,
          characterId: options.characterId,
          asOfChapterId: options.chapterId,
          asOfChapterNumber: options.chapterNumber,
          knownFacts: stateData.knownFacts || [],
          beliefs: stateData.beliefs || [],
          secrets: stateData.secrets || [],
          relationships: stateData.relationships || {},
          emotionalState: stateData.emotionalState || '',
          activeGoals: stateData.activeGoals || [],
          recentExperiences: stateData.recentExperiences || [],
          generatedAt: new Date().toISOString(),
        }

        // Update project with new state
        const existingStates = projectMemory?.characterKnowledgeStates || []
        const updatedStates = [...existingStates, knowledgeState]

        updateProject(currentProject.id, {
          characterKnowledgeStates: updatedStates,
        } as Partial<typeof currentProject>)

        setState((s) => ({ ...s, isProcessing: false }))

        options.onSuccess?.(knowledgeState)
        return knowledgeState
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update character knowledge'
        setState((s) => ({ ...s, isProcessing: false, error: message }))
        return null
      }
    },
    [currentProject, projectMemory, getCharacterState, generate, updateProject]
  )

  // Get relevant context for AI generation
  const getRelevantContext = useCallback(
    async (options: GetContextOptions): Promise<StoryMemoryContext | null> => {
      if (!currentProject || !projectMemory) return null

      // Get POV character details if specified
      const povCharacter = options.povCharacterId
        ? currentProject.characters?.find((c) => c.id === options.povCharacterId)
        : null

      setState((s) => ({ ...s, isProcessing: true, error: null }))

      try {
        const result = await generate({
          agentTarget: 'storyMemory',
          action: 'retrieve-context',
          context: {
            specification: currentProject.specification,
            characters: currentProject.characters,
            currentChapter: options.currentChapter,
            currentScene: options.currentScene,
            povCharacter: povCharacter?.name,
            taskDescription: options.taskDescription,
            focus: options.focus,
            availableSummaries: projectMemory.chapterSummaries,
            availableCharacterStates: projectMemory.characterKnowledgeStates.map((s) => ({
              ...s,
              characterName:
                currentProject.characters?.find((c) => c.id === s.characterId)?.name || 'Unknown',
            })),
            availableFacts: projectMemory.factAssertions,
            activeSubplots: projectMemory.subplots?.filter(
              (s) => s.status !== 'resolved' && s.status !== 'abandoned'
            ),
            worldbuildingEntries: projectMemory.worldbuildingEntries,
          },
        })

        if (!result) {
          // Fall back to basic context if AI retrieval fails
          setState((s) => ({ ...s, isProcessing: false }))
          return buildBasicContext(options)
        }

        // Parse the result
        let contextSpec: {
          relevantSummaryIds?: string[]
          relevantCharacterStateIds?: string[]
          relevantFactIds?: string[]
          relevantWorldbuildingIds?: string[]
          activeSubplotIds?: string[]
          openQuestions?: string[]
          recentEmotionalBeats?: string[]
          unresolvedSetups?: string[]
        }

        try {
          contextSpec = JSON.parse(result)
        } catch {
          setState((s) => ({ ...s, isProcessing: false }))
          return buildBasicContext(options)
        }

        // Build the context from the specification
        const context: StoryMemoryContext = {
          relevantSummaries: projectMemory.chapterSummaries.filter((s) =>
            contextSpec.relevantSummaryIds?.includes(s.chapterId)
          ),
          relevantCharacterStates: projectMemory.characterKnowledgeStates.filter((s) =>
            contextSpec.relevantCharacterStateIds?.includes(s.characterId)
          ),
          relevantFacts: projectMemory.factAssertions.filter((f) =>
            contextSpec.relevantFactIds?.includes(f.id)
          ),
          relevantWorldbuilding: projectMemory.worldbuildingEntries.filter((w) =>
            contextSpec.relevantWorldbuildingIds?.includes(w.id)
          ),
          activeSubplots: (projectMemory.subplots || []).filter((s) =>
            contextSpec.activeSubplotIds?.includes(s.id)
          ),
          openQuestions: contextSpec.openQuestions || [],
          recentEmotionalBeats: contextSpec.recentEmotionalBeats || [],
          unresolvedSetups: contextSpec.unresolvedSetups || [],
        }

        setState((s) => ({ ...s, isProcessing: false }))
        return context
      } catch (err) {
        setState((s) => ({ ...s, isProcessing: false }))
        return buildBasicContext(options)
      }
    },
    [currentProject, projectMemory, generate]
  )

  // Build basic context without AI assistance (fallback)
  const buildBasicContext = useCallback(
    (options: GetContextOptions): StoryMemoryContext => {
      if (!projectMemory) {
        return {
          relevantSummaries: [],
          relevantCharacterStates: [],
          relevantFacts: [],
          relevantWorldbuilding: [],
          activeSubplots: [],
          openQuestions: [],
          recentEmotionalBeats: [],
          unresolvedSetups: [],
        }
      }

      // Get summaries for recent chapters (last 3)
      const recentSummaries = projectMemory.chapterSummaries
        .filter((s) => s.chapterNumber <= options.currentChapter)
        .sort((a, b) => b.chapterNumber - a.chapterNumber)
        .slice(0, 3)

      // Get latest state for all characters
      const characterIds = new Set(
        projectMemory.characterKnowledgeStates.map((s) => s.characterId)
      )
      const latestStates: CharacterKnowledgeState[] = []
      for (const charId of characterIds) {
        const state = getCharacterState(charId)
        if (state) latestStates.push(state)
      }

      // Get active subplots
      const activeSubplots = (projectMemory.subplots || []).filter(
        (s) => s.status !== 'resolved' && s.status !== 'abandoned'
      )

      // Collect open questions from recent summaries
      const openQuestions = recentSummaries.flatMap((s) => s.openQuestions || [])

      // Collect unresolved foreshadowing as setups
      const unresolvedSetups = recentSummaries.flatMap(
        (s) => s.foreshadowing?.map((f) => (typeof f === 'string' ? f : f.element)) || []
      )

      return {
        relevantSummaries: recentSummaries,
        relevantCharacterStates: latestStates,
        relevantFacts: projectMemory.factAssertions.slice(0, 20),
        relevantWorldbuilding: projectMemory.worldbuildingEntries.slice(0, 10),
        activeSubplots,
        openQuestions: [...new Set(openQuestions)].slice(0, 5),
        recentEmotionalBeats: [],
        unresolvedSetups: [...new Set(unresolvedSetups)].slice(0, 5),
      }
    },
    [projectMemory, getCharacterState]
  )

  // Auto-summarize on chapter save (to be called by WriteSection)
  const autoSummarizeOnSave = useCallback(
    async (chapter: Chapter): Promise<void> => {
      if (!chapter.content || chapter.content.length < 500) return // Skip very short content

      // Check if we already have a recent summary for this chapter
      const existingSummary = getSummaryForChapter(chapter.id)
      if (existingSummary) {
        // Only re-summarize if content has significantly changed
        // (Simple heuristic: word count difference > 20%)
        const existingWordCount = existingSummary.tokenCount || 0
        const currentWordCount = chapter.wordCount || 0
        if (Math.abs(currentWordCount - existingWordCount) / Math.max(existingWordCount, 1) < 0.2) {
          return // Skip - summary is still valid
        }
      }

      await summarizeChapter({
        chapterId: chapter.id,
        chapterNumber: chapter.number,
        chapterTitle: chapter.title,
        chapterContent: chapter.content,
      })
    },
    [getSummaryForChapter, summarizeChapter]
  )

  // Update all character knowledge states after a chapter is written
  const updateAllCharactersAfterChapter = useCallback(
    async (chapter: Chapter): Promise<void> => {
      if (!currentProject) return

      const summary = getSummaryForChapter(chapter.id)
      if (!summary) return

      // Get characters present in this chapter
      const charactersPresent = summary.charactersPresent || []
      const characters = currentProject.characters?.filter((c) =>
        charactersPresent.some(
          (name) =>
            c.name.toLowerCase() === name.toLowerCase() ||
            c.aliases?.some((a) => a.toLowerCase() === name.toLowerCase())
        )
      )

      if (!characters || characters.length === 0) return

      // Update each character's knowledge state
      for (const character of characters) {
        await updateCharacterKnowledge({
          characterId: character.id,
          characterName: character.name,
          characterRole: character.role,
          chapterId: chapter.id,
          chapterNumber: chapter.number,
          chapterSummary: summary.summary,
        })
      }
    },
    [currentProject, getSummaryForChapter, updateCharacterKnowledge]
  )

  return {
    // State
    ...state,
    isGenerating: isGenerating || state.isProcessing,
    aiError,

    // Data access
    getSummaryForChapter,
    getCharacterState,
    projectMemory,

    // Actions
    summarizeChapter,
    updateCharacterKnowledge,
    getRelevantContext,
    buildBasicContext,

    // Auto-processing
    autoSummarizeOnSave,
    updateAllCharactersAfterChapter,
  }
}
