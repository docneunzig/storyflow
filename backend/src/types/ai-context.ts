/**
 * AI Generation Context Types
 *
 * Strongly typed interfaces for all AI generation functions.
 * Replaces Record<string, any> with specific types for compile-time safety.
 */

import type {
  Character,
  PlotBeat,
  Scene,
  Chapter,
  WikiEntry,
  NovelSpecification,
  PlotStructure,
  CharacterRelationship,
  Subplot,
  BrainstormSession,
  ChapterSummary,
  CharacterKnowledgeState,
} from './project.js'

// =============================================================================
// Base Context Types
// =============================================================================

/** Common fields shared across many generation contexts */
export interface BaseGenerationContext {
  projectId?: string
  specification?: NovelSpecification
  novelLanguage?: NovelLanguage
}

export type NovelLanguage = 'en' | 'de' | 'fr' | 'es' | 'it'

/** Story memory context for AI continuity */
export interface StoryMemoryContext {
  relevantSummaries?: ChapterSummary[]
  relevantCharacterStates?: CharacterKnowledgeState[]
  relevantFacts?: string[]
  relevantWorldbuilding?: WikiEntry[]
  activeSubplots?: Subplot[]
  openQuestions?: string[]
  recentEmotionalBeats?: string[]
  unresolvedSetups?: string[]
}

// =============================================================================
// Chapter Generation Contexts
// =============================================================================

export interface ChapterGenerationContext extends BaseGenerationContext {
  title?: string
  synopsis?: string
  setting?: string
  worldSetting?: string
  pov?: string
  pointOfView?: string
  tense?: string
  narrativeTense?: string
  audience?: string
  targetAudience?: string
  themes?: string[]
  tone?: string
  characters?: Character[] | CharacterGroups
  plotBeats?: PlotBeat[]
  previousChapters?: ChapterSummary[]
  wikiContext?: WikiEntry[]
  storyMemory?: StoryMemoryContext
}

export interface CharacterGroups {
  main?: Character[]
  supporting?: Character[]
}

export interface ChapterDraftContext extends BaseGenerationContext {
  chapterNumber?: number
  title?: string
  synopsis?: string
  outline?: string
  scenes?: Scene[]
  targetWordCount?: number
  previousChapterSummary?: string
  characters?: Character[]
  plotBeats?: PlotBeat[]
  storyMemory?: StoryMemoryContext
}

// =============================================================================
// Scene Generation Contexts
// =============================================================================

export interface SceneGenerationContext extends BaseGenerationContext {
  title?: string
  summary?: string
  detailedOutline?: string
  setting?: string
  location?: string
  weatherAtmosphere?: string
  timeInStory?: string
  povCharacter?: Character
  charactersPresent?: Character[]
  sceneGoal?: string
  conflictType?: string
  conflictDescription?: string
  openingEmotion?: string
  closingEmotion?: string
  tone?: string
  pacing?: string
  targetWordCount?: number
  previousSceneSummary?: string
  plotBeat?: PlotBeat
  storyMemory?: StoryMemoryContext
}

export interface SceneProseContext extends BaseGenerationContext {
  scene?: Scene
  characters?: Character[]
  targetWordCount?: number
  styleGuidelines?: string
  previousContent?: string
  storyMemory?: StoryMemoryContext
}

// =============================================================================
// Character Generation Contexts
// =============================================================================

export interface CharacterGenerationContext extends BaseGenerationContext {
  role?: CharacterRole
  archetype?: string
  existingCharacters?: Character[]
  relationshipHints?: string[]
  storyContext?: string
}

export type CharacterRole = 'protagonist' | 'antagonist' | 'supporting' | 'minor'

export interface CharacterDialogueContext extends BaseGenerationContext {
  character?: Character
  situation?: string
  emotion?: string
  speakingTo?: Character
  previousDialogue?: string[]
  tone?: string
}

export interface CharacterInteractionContext extends BaseGenerationContext {
  characters?: Character[]
  situation?: string
  setting?: string
  emotionalContext?: string
  relationships?: CharacterRelationship[]
}

export interface DeepenCharacterContext extends BaseGenerationContext {
  character?: Character
  aspectToDeepen?: 'backstory' | 'personality' | 'motivation' | 'arc' | 'voice' | 'all'
  existingCharacters?: Character[]
  plotContext?: PlotStructure
}

// =============================================================================
// Inline Writing Contexts
// =============================================================================

export interface SelectionContext extends BaseGenerationContext {
  selectedText: string
  surroundingContext?: string
  chapterContent?: string
  characters?: Character[]
  tone?: string
  style?: string
}

export interface ExpandSelectionContext extends SelectionContext {
  expansionFactor?: number // e.g., 2 = double the length
  focusAspects?: ('description' | 'emotion' | 'action' | 'dialogue')[]
}

export interface CondenseSelectionContext extends SelectionContext {
  targetReduction?: number // e.g., 0.5 = half the length
  preserveElements?: string[]
}

export interface RewriteSelectionContext extends SelectionContext {
  rewriteGoal?: 'clarity' | 'style' | 'tone' | 'pacing' | 'voice'
  targetStyle?: string
  instructions?: string
}

export interface GenerateAlternativesContext extends SelectionContext {
  numberOfAlternatives?: number
  variationType?: 'subtle' | 'moderate' | 'dramatic'
}

export interface ContinueWritingContext extends BaseGenerationContext {
  existingContent: string
  targetWordCount?: number
  direction?: string
  plotBeat?: PlotBeat
  characters?: Character[]
  storyMemory?: StoryMemoryContext
}

// =============================================================================
// Plot Generation Contexts
// =============================================================================

export interface ExpandBeatContext extends BaseGenerationContext {
  beat?: PlotBeat
  detailLevel?: 'outline' | 'detailed' | 'prose'
  connectedBeats?: PlotBeat[]
  characters?: Character[]
}

export interface SuggestTwistsContext extends BaseGenerationContext {
  currentPlot?: PlotStructure
  characters?: Character[]
  genre?: string[]
  targetSurpriseLevel?: 'mild' | 'moderate' | 'shocking'
}

// =============================================================================
// Suggestion Contexts
// =============================================================================

export interface SuggestTitlesContext extends BaseGenerationContext {
  genre?: string[]
  themes?: string[]
  tone?: string
  synopsis?: string
  mainCharacters?: Character[]
  numberOfSuggestions?: number
}

export interface SuggestTonesContext extends BaseGenerationContext {
  genre?: string[]
  themes?: string[]
  targetAudience?: string
  existingTone?: string
}

export interface SuggestThemesContext extends BaseGenerationContext {
  genre?: string[]
  synopsis?: string
  characters?: Character[]
  existingThemes?: string[]
}

export interface SuggestKeywordsContext extends BaseGenerationContext {
  title?: string
  genre?: string[]
  synopsis?: string
  themes?: string[]
  targetMarket?: string
}

// =============================================================================
// Wiki/Worldbuilding Contexts
// =============================================================================

export interface ExtractWikiElementsContext extends BaseGenerationContext {
  chapterContent: string
  existingEntries?: WikiEntry[]
  categoriesToExtract?: WikiCategory[]
}

export type WikiCategory =
  | 'locations'
  | 'characters'
  | 'timeline'
  | 'magicTechnology'
  | 'culturesFactions'
  | 'objects'
  | 'terminology'
  | 'rules'

export interface ExpandWikiEntryContext extends BaseGenerationContext {
  entry: WikiEntry
  relatedEntries?: WikiEntry[]
  chapterReferences?: string[]
  expansionAspects?: string[]
}

// =============================================================================
// Marketing Contexts
// =============================================================================

export interface GenerateSynopsisContext extends BaseGenerationContext {
  plot?: PlotStructure
  characters?: Character[]
  themes?: string[]
  targetLength?: 'short' | 'medium' | 'long'
  tone?: string
}

export interface GenerateQueryLetterContext extends BaseGenerationContext {
  title?: string
  genre?: string[]
  synopsis?: string
  wordCount?: number
  comparableTitles?: string[]
  authorBio?: string
}

export interface GenerateBookDescriptionContext extends BaseGenerationContext {
  title?: string
  genre?: string[]
  synopsis?: string
  mainCharacters?: Character[]
  themes?: string[]
  targetPlatform?: 'amazon' | 'general' | 'back-cover'
}

export interface AnalyzeMarketContext extends BaseGenerationContext {
  genre?: string[]
  subgenre?: string[]
  themes?: string[]
  targetAudience?: string
  wordCount?: number
  comparableTitles?: string[]
}

// =============================================================================
// Brainstorm Contexts
// =============================================================================

export interface AnalyzeBrainstormContext extends BaseGenerationContext {
  rawText: string
  existingTags?: string[]
  focusAreas?: ('plot' | 'character' | 'setting' | 'theme')[]
}

export interface GenerateFoundationsContext extends BaseGenerationContext {
  brainstormSession?: BrainstormSession
  answeredQuestions?: { question: string; answer: string }[]
  focusArea?: 'plot' | 'character' | 'scene' | 'all'
}

// =============================================================================
// Discriminated Union for All Contexts
// =============================================================================

export type GenerationAction =
  | 'generate-chapter'
  | 'generate-scene'
  | 'generate-character'
  | 'generate-dialogue'
  | 'expand-selection'
  | 'condense-selection'
  | 'rewrite-selection'
  | 'generate-alternatives'
  | 'continue-writing'
  | 'generate-chapter-draft'
  | 'generate-scene-prose'
  | 'expand-beat'
  | 'suggest-twists'
  | 'suggest-titles'
  | 'suggest-tones'
  | 'suggest-themes'
  | 'extract-elements'
  | 'expand-entry'
  | 'deepen-character'
  | 'generate-character-dialogue'
  | 'generate-synopsis'
  | 'generate-query-letter'
  | 'generate-book-description'
  | 'analyze-market'
  | 'suggest-keywords'
  | 'analyze-brainstorm'
  | 'generate-foundations'

export interface GenerationRequest<T extends GenerationAction = GenerationAction> {
  action: T
  context: GenerationContextForAction<T>
  generationId?: string
}

/** Maps action types to their specific context types */
export type GenerationContextForAction<T extends GenerationAction> =
  T extends 'generate-chapter' ? ChapterGenerationContext :
  T extends 'generate-chapter-draft' ? ChapterDraftContext :
  T extends 'generate-scene' ? SceneGenerationContext :
  T extends 'generate-scene-prose' ? SceneProseContext :
  T extends 'generate-character' ? CharacterGenerationContext :
  T extends 'generate-dialogue' ? CharacterDialogueContext :
  T extends 'generate-character-dialogue' ? CharacterInteractionContext :
  T extends 'deepen-character' ? DeepenCharacterContext :
  T extends 'expand-selection' ? ExpandSelectionContext :
  T extends 'condense-selection' ? CondenseSelectionContext :
  T extends 'rewrite-selection' ? RewriteSelectionContext :
  T extends 'generate-alternatives' ? GenerateAlternativesContext :
  T extends 'continue-writing' ? ContinueWritingContext :
  T extends 'expand-beat' ? ExpandBeatContext :
  T extends 'suggest-twists' ? SuggestTwistsContext :
  T extends 'suggest-titles' ? SuggestTitlesContext :
  T extends 'suggest-tones' ? SuggestTonesContext :
  T extends 'suggest-themes' ? SuggestThemesContext :
  T extends 'extract-elements' ? ExtractWikiElementsContext :
  T extends 'expand-entry' ? ExpandWikiEntryContext :
  T extends 'generate-synopsis' ? GenerateSynopsisContext :
  T extends 'generate-query-letter' ? GenerateQueryLetterContext :
  T extends 'generate-book-description' ? GenerateBookDescriptionContext :
  T extends 'analyze-market' ? AnalyzeMarketContext :
  T extends 'suggest-keywords' ? SuggestKeywordsContext :
  T extends 'analyze-brainstorm' ? AnalyzeBrainstormContext :
  T extends 'generate-foundations' ? GenerateFoundationsContext :
  BaseGenerationContext

/** Helper type for legacy code that still uses Record<string, any> */
export type LegacyContext = Record<string, unknown>

/** Type guard to check if context matches expected shape */
export function isValidContext<T extends GenerationAction>(
  action: T,
  context: unknown
): context is GenerationContextForAction<T> {
  // Basic validation - context should be an object
  return typeof context === 'object' && context !== null
}
