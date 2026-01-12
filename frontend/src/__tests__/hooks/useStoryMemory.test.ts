import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStoryMemory } from '@/hooks/useStoryMemory'
import type { ChapterSummary, CharacterKnowledgeState } from '@/types/project'

// Mock the dependencies
vi.mock('@/hooks/useAIGeneration', () => ({
  useAIGeneration: () => ({
    generate: vi.fn().mockResolvedValue(JSON.stringify({
      summary: 'Test summary',
      keyEvents: ['Event 1', 'Event 2'],
      charactersPresent: ['Character A'],
      locationsUsed: [],
      emotionalBeats: [],
      plotBeatsAdvanced: [],
      subplotsTouched: [],
      foreshadowing: [],
      payoffs: [],
      cliffhanger: null,
      openQuestions: [],
      tokenCount: 100,
    })),
    isGenerating: false,
    error: null,
  }),
}))

vi.mock('@/stores/projectStore', () => ({
  useProjectStore: vi.fn((selector) => {
    const state = {
      currentProject: {
        id: 'test-project',
        characters: [
          { id: 'char-1', name: 'Alice', role: 'protagonist' },
          { id: 'char-2', name: 'Bob', role: 'supporting' },
        ],
        chapters: [
          { id: 'ch-1', number: 1, title: 'Chapter 1', content: 'Test content' },
        ],
        specification: { genre: ['Fantasy'], targetAudience: 'Adult' },
        chapterSummaries: [],
        characterKnowledgeStates: [],
        factAssertions: [],
        worldbuildingEntries: [],
        subplots: [],
      },
      updateProject: vi.fn(),
    }
    return selector(state)
  }),
}))

describe('useStoryMemory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSummaryForChapter', () => {
    it('returns null when no summary exists', () => {
      const { result } = renderHook(() => useStoryMemory())

      const summary = result.current.getSummaryForChapter('non-existent')

      expect(summary).toBeNull()
    })
  })

  describe('getCharacterState', () => {
    it('returns null when no state exists for character', () => {
      const { result } = renderHook(() => useStoryMemory())

      const state = result.current.getCharacterState('non-existent')

      expect(state).toBeNull()
    })
  })

  describe('buildBasicContext', () => {
    it('returns empty context when no project memory exists', () => {
      const { result } = renderHook(() => useStoryMemory())

      const context = result.current.buildBasicContext({
        currentChapter: 1,
      })

      expect(context).toHaveProperty('relevantSummaries')
      expect(context).toHaveProperty('relevantCharacterStates')
      expect(context).toHaveProperty('relevantFacts')
      expect(context).toHaveProperty('activeSubplots')
      expect(context).toHaveProperty('openQuestions')
    })
  })

  describe('initial state', () => {
    it('has correct initial state', () => {
      const { result } = renderHook(() => useStoryMemory())

      expect(result.current.isProcessing).toBe(false)
      expect(result.current.lastSummarizedChapter).toBeNull()
      expect(result.current.error).toBeNull()
    })
  })
})
