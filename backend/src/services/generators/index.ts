/**
 * Generator Module Exports
 * Central export file for all AI generation functions
 */

// Character generators
export {
  generateSampleCharacterContent,
  generateCharacterDialogue,
  deepenCharacter,
  generateCharacterInteraction,
  type CharacterContext,
} from './character.generator.js'

// Chapter generators
export {
  generateSampleChapterContent,
  continueWriting,
  generateChapterDraft,
  type ChapterContext,
} from './chapter.generator.js'

// Scene generators
export {
  generateSampleSceneContent,
  generateSceneProse,
  expandSelection,
  condenseSelection,
  rewriteSelection,
  generateAlternatives,
  type SceneContext,
} from './scene.generator.js'

// Plot generators
export {
  expandBeat,
  suggestTwists,
  suggestTitles,
  suggestTones,
  suggestThemes,
  type PlotContext,
  type ExpandedScene,
} from './plot.generator.js'

// Wiki generators
export {
  extractWikiElements,
  expandWikiEntry,
  type WikiContext,
  type WikiElement,
} from './wiki.generator.js'

// Brainstorm generators
export {
  analyzeBrainstorm,
  generateFoundations,
  type BrainstormContext,
  type BrainstormQuestion,
} from './brainstorm.generator.js'

// Market generators
export {
  generateSynopsis,
  generateQueryLetter,
  generateBookDescription,
  analyzeMarket,
  suggestKeywords,
  type MarketContext,
  type ComparableTitle,
} from './market.generator.js'
