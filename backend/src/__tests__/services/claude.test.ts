import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import {
  registerGeneration,
  cancelGeneration,
  cleanupGeneration,
  isGenerationCancelled,
  isClaudeCliAuthenticated,
  ACTION_PROMPTS,
} from '../../services/claude.js'

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}))

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
}))

describe('claude.ts service', () => {
  describe('Generation lifecycle management', () => {
    const testGenerationId = 'test-gen-123'

    beforeEach(() => {
      cleanupGeneration(testGenerationId)
    })

    afterEach(() => {
      cleanupGeneration(testGenerationId)
    })

    it('should register a new generation', () => {
      registerGeneration(testGenerationId)
      expect(isGenerationCancelled(testGenerationId)).toBe(false)
    })

    it('should cancel a registered generation', () => {
      registerGeneration(testGenerationId)
      cancelGeneration(testGenerationId)
      expect(isGenerationCancelled(testGenerationId)).toBe(true)
    })

    it('should cleanup a generation', () => {
      registerGeneration(testGenerationId)
      cleanupGeneration(testGenerationId)
      // After cleanup, the generation should not be tracked
      expect(isGenerationCancelled(testGenerationId)).toBe(false)
    })

    it('should return false for non-existent generation', () => {
      expect(isGenerationCancelled('non-existent')).toBe(false)
    })
  })

  describe('isClaudeCliAuthenticated', () => {
    it('should return true when history file exists', () => {
      expect(isClaudeCliAuthenticated()).toBe(true)
    })
  })
})

describe('ACTION_PROMPTS', () => {
  // These tests verify the structure and existence of action prompts

  it('should be a valid object with action functions', () => {
    expect(ACTION_PROMPTS).toBeDefined()
    expect(typeof ACTION_PROMPTS).toBe('object')
    expect(Object.keys(ACTION_PROMPTS).length).toBeGreaterThan(0)
  })

  it('should have all core generation actions defined', () => {
    const coreActions = [
      'generate-chapter',
      'generate-scene',
      'continue-writing',
      'expand-selection',
      'condense-selection',
      'rewrite-selection',
    ]

    for (const action of coreActions) {
      expect(ACTION_PROMPTS[action]).toBeDefined()
      expect(typeof ACTION_PROMPTS[action]).toBe('function')
    }
  })

  it('should have all brainstorm and critique actions defined', () => {
    const brainstormActions = [
      'analyze-brainstorm',
      'generate-foundations',
      'critique-chapter',
      'extract-facts',
      'check-continuity',
    ]

    for (const action of brainstormActions) {
      expect(ACTION_PROMPTS[action]).toBeDefined()
      expect(typeof ACTION_PROMPTS[action]).toBe('function')
    }
  })

  it('should have all character and voice actions defined', () => {
    const voiceActions = [
      'analyze-voice',
      'check-voice-consistency',
      'fix-voice',
    ]

    for (const action of voiceActions) {
      expect(ACTION_PROMPTS[action]).toBeDefined()
      expect(typeof ACTION_PROMPTS[action]).toBe('function')
    }
  })

  it('should generate valid prompts when called with context', () => {
    const mockContext = {
      specification: { title: 'Test Novel', genre: ['Fantasy'] },
      characters: [{ name: 'Test Character', role: 'protagonist' }],
    }

    // Test that prompt functions return strings
    const generateChapterPrompt = ACTION_PROMPTS['generate-chapter']
    const result = generateChapterPrompt(mockContext)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('should include context in generated prompts', () => {
    const mockContext = {
      specification: {
        title: 'The Great Adventure',
        genre: ['Fantasy', 'Adventure'],
        targetAudience: 'Adult',
      },
    }

    const result = ACTION_PROMPTS['generate-chapter'](mockContext)
    // The prompt should mention the genre from context
    expect(result.toLowerCase()).toContain('fantasy')
  })
})
