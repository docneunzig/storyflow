/**
 * AI Generation Simulation Module
 * Provides simulated AI generation for testing and development
 */

import {
  // Character generators
  generateSampleCharacterContent,
  generateCharacterProfile,
  generateCharacterDialogue,
  deepenCharacter,
  generateCharacterInteraction,
  // Chapter generators
  generateSampleChapterContent,
  continueWriting,
  generateChapterDraft,
  generateChapterStructures,
  // Scene generators
  generateSampleSceneContent,
  generateSceneBlueprint,
  generateSceneProse,
  expandSelection,
  condenseSelection,
  rewriteSelection,
  generateAlternatives,
  // Plot generators
  expandBeat,
  suggestTwists,
  suggestTitles,
  suggestTones,
  suggestThemes,
  // Wiki generators
  extractWikiElements,
  expandWikiEntry,
  // Brainstorm generators
  analyzeBrainstorm,
  generateFoundations,
  // Market generators
  generateSynopsis,
  generateQueryLetter,
  generateBookDescription,
  analyzeMarket,
  suggestKeywords,
} from './generators/index.js'

export interface SimulationResult {
  result: string
  cancelled: boolean
}

export type CancellationChecker = () => boolean

/**
 * Simulate AI generation with cancellation support
 * @param action - The generation action to perform
 * @param context - Context data for generation
 * @param checkCancelled - Function to check if generation was cancelled
 * @returns Promise with result string and cancelled status
 */
export async function simulateAIGeneration(
  action: string,
  context: Record<string, unknown>,
  checkCancelled: CancellationChecker
): Promise<SimulationResult> {
  // Simulate processing time (6-8 seconds to allow testing cancel)
  const totalTime = 6000 + Math.random() * 2000
  const checkInterval = 100 // Check for cancellation every 100ms
  let elapsed = 0

  while (elapsed < totalTime) {
    await new Promise((resolve) => setTimeout(resolve, checkInterval))
    elapsed += checkInterval

    // Check if cancelled
    if (checkCancelled()) {
      return { result: '', cancelled: true }
    }
  }

  // Generate sample content based on action
  const result = generateContent(action, context)

  return { result, cancelled: false }
}

/**
 * Generate content based on action type
 * Routes to appropriate generator function
 */
function generateContent(action: string, context: Record<string, unknown>): string {
  switch (action) {
    // Chapter generation
    case 'generate-chapter':
      return generateSampleChapterContent(context)
    case 'generate-chapter-draft':
      return generateChapterDraft(context)
    case 'continue-writing':
      return continueWriting(context)
    case 'suggest-chapter-structure':
      return generateChapterStructures(context)

    // Scene generation
    case 'generate-scene':
      return generateSceneBlueprint(context)
    case 'generate-scene-prose':
      return generateSceneProse(context)

    // Character generation
    case 'generate-character':
      return generateCharacterProfile(context)
    case 'generate-dialogue':
      return generateCharacterDialogue(context)
    case 'deepen-character':
      return deepenCharacter(context)
    case 'generate-character-dialogue':
      return generateCharacterInteraction(context)

    // Inline editing actions
    case 'expand-selection':
      return expandSelection(context)
    case 'condense-selection':
      return condenseSelection(context)
    case 'rewrite-selection':
      return rewriteSelection(context)
    case 'generate-alternatives':
      return generateAlternatives(context)

    // Plot generation
    case 'expand-beat':
      return expandBeat(context)
    case 'suggest-twists':
      return suggestTwists(context)
    case 'suggest-titles':
      return suggestTitles(context)
    case 'suggest-tones':
      return suggestTones(context)
    case 'suggest-themes':
      return suggestThemes(context)

    // Wiki generation
    case 'extract-elements':
      return extractWikiElements(context)
    case 'expand-entry':
      return expandWikiEntry(context)

    // Brainstorm generation
    case 'analyze-brainstorm':
      return analyzeBrainstorm(context)
    case 'generate-foundations':
      return generateFoundations(context)

    // Market generation
    case 'generate-synopsis':
      return generateSynopsis(context)
    case 'generate-query-letter':
      return generateQueryLetter(context)
    case 'generate-book-description':
      return generateBookDescription(context)
    case 'analyze-market':
      return analyzeMarket(context)
    case 'suggest-keywords':
      return suggestKeywords(context)

    // Default fallback
    default:
      return `Generated content for action: ${action}\n\nThis is placeholder AI-generated content that demonstrates the generation system is working.`
  }
}

/**
 * Get list of all supported simulation actions
 */
export function getSupportedActions(): string[] {
  return [
    // Chapter
    'generate-chapter',
    'generate-chapter-draft',
    'continue-writing',
    // Scene
    'generate-scene',
    'generate-scene-prose',
    // Character
    'generate-character',
    'generate-dialogue',
    'deepen-character',
    'generate-character-dialogue',
    // Inline editing
    'expand-selection',
    'condense-selection',
    'rewrite-selection',
    'generate-alternatives',
    // Plot
    'expand-beat',
    'suggest-twists',
    'suggest-titles',
    'suggest-tones',
    'suggest-themes',
    // Wiki
    'extract-elements',
    'expand-entry',
    // Brainstorm
    'analyze-brainstorm',
    'generate-foundations',
    // Market
    'generate-synopsis',
    'generate-query-letter',
    'generate-book-description',
    'analyze-market',
    'suggest-keywords',
  ]
}
