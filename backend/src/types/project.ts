/**
 * Backend type definitions - synchronized with frontend types
 *
 * IMPORTANT: Keep these types in sync with frontend/src/types/project.ts
 * All union types and enums should match exactly.
 */

// =============================================================================
// Union Types (must match frontend exactly)
// =============================================================================

export type ProjectPhase =
  | 'specification'
  | 'plotting'
  | 'characters'
  | 'scenes'
  | 'writing'
  | 'revision'
  | 'complete'

export type TargetAudience = 'Children' | 'Middle Grade' | 'YA' | 'New Adult' | 'Adult'
export type POV = 'First Person' | 'Third Limited' | 'Third Omniscient' | 'Second Person' | 'Multiple POV'
export type Tense = 'Past' | 'Present'
export type NovelLanguage = 'en' | 'de' | 'fr' | 'es' | 'it'
export type ChildrensAgeCategory = '4-6' | '7-10' | '11-14' | '15-18'

export type PlotFramework =
  | 'Three-Act Structure'
  | "Hero's Journey"
  | 'Save the Cat'
  | 'Seven-Point Structure'
  | 'Freeform'

export type ContentStatus = 'outline' | 'drafted' | 'revised' | 'locked'
export type CharacterRole = 'protagonist' | 'antagonist' | 'supporting' | 'minor'
export type CharacterStatus = 'alive' | 'deceased' | 'unknown'
export type RelationshipType = 'family' | 'romantic' | 'conflict' | 'alliance' | 'mentor' | 'sibling' | 'rival' | 'friend'
export type ChapterStatus = 'outline' | 'draft' | 'revision' | 'final' | 'locked'

export type WikiCategory =
  | 'locations'
  | 'characters'
  | 'timeline'
  | 'magicTechnology'
  | 'culturesFactions'
  | 'objects'
  | 'terminology'
  | 'rules'

export type SubplotType =
  | 'romance'
  | 'mystery'
  | 'revenge'
  | 'redemption'
  | 'discovery'
  | 'survival'
  | 'rivalry'
  | 'coming-of-age'
  | 'custom'

export type SubplotStatus =
  | 'setup'
  | 'developing'
  | 'escalating'
  | 'climax'
  | 'resolved'
  | 'abandoned'

export type SubplotTouchType = 'setup' | 'development' | 'escalation' | 'callback' | 'resolution'
export type SuggestionStatus = 'pending' | 'approved' | 'modified' | 'rejected'
export type BrainstormTag = 'character' | 'setting' | 'plot' | 'theme' | 'scene' | 'question' | 'inspiration'
export type ConfidenceLevel = 'explicit' | 'inferred' | 'suggested'

// =============================================================================
// Core Project Types
// =============================================================================

export interface Project {
  id: string
  version: number
  metadata: ProjectMetadata
  specification: NovelSpecification | null
  brainstorm: BrainstormSession | null
  plot: PlotStructure | null
  characters: Character[]
  scenes: Scene[]
  chapters: Chapter[]
  worldbuilding: WorldbuildingWiki | null
  worldbuildingEntries: WikiEntry[]
  relationships: CharacterRelationship[]
  revisions: RevisionHistory[]
  qualityScores: ChapterQualityScore[]
  subplots: Subplot[]
  subplotTouches: SubplotTouch[]
  statistics: WritingStatistics | null
  marketAnalysis: MarketAnalysis | null
  createdAt: string
  updatedAt: string
  lastExportedAt: string | null
}

export interface ProjectMetadata {
  workingTitle: string
  authorName: string
  createdAt: string
  lastModified: string
  currentPhase: ProjectPhase
}

export interface NovelSpecification {
  genre: string[]
  subgenre: string[]
  targetAudience: TargetAudience
  childrensAgeCategory?: ChildrensAgeCategory
  novelLanguage: NovelLanguage
  writingStyle: {
    reference: string
    custom: string
  }
  tone: string
  pov: POV
  tense: Tense
  targetWordCount: number
  targetChapterCount: number
  chapterLengthRange: {
    min: number
    max: number
  }
  settingType: string[]
  timePeriod: string
  themes: string[]
  pacing: number
  complexity: number
}

// =============================================================================
// Plot Types
// =============================================================================

export interface PlotStructure {
  framework: PlotFramework
  beats: PlotBeat[]
  overallArc: string
  centralConflict: string
  stakes: string
}

export interface PlotBeat {
  id: string
  frameworkPosition: string
  title: string
  summary: string
  detailedDescription: string
  charactersInvolved: string[]
  location: string | null
  timelinePosition: number
  emotionalArc: string
  stakes: string
  foreshadowing: string[]
  payoffs: string[]
  chapterTarget: number | null
  wordCountEstimate: number
  status: ContentStatus
  userNotes: string
}

// =============================================================================
// Character Types
// =============================================================================

export interface Character {
  id: string
  name: string
  aliases: string[]
  role: CharacterRole
  archetype: string
  age: number | null
  gender: string
  physicalDescription: string
  distinguishingFeatures: string[]
  personalitySummary: string
  strengths: string[]
  flaws: string[]
  fears: string[]
  desires: string[]
  needs: string[]
  misbelief: string
  backstory: string
  formativeExperiences: string[]
  secrets: string[]
  speechPatterns: string
  vocabularyLevel: string
  catchphrases: string[]
  internalVoice: string
  characterArc: string
  arcCatalyst: string
  firstAppearance: string | null
  scenesPresent: string[]
  status: CharacterStatus
  userNotes: string
}

export interface CharacterRelationship {
  sourceCharacterId: string
  targetCharacterId: string
  relationshipType: RelationshipType
  dynamicDescription: string
  evolution: string
  keyScenes: string[]
}

// =============================================================================
// Scene Types
// =============================================================================

export interface Scene {
  id: string
  title: string
  chapterId: string | null
  sequenceInChapter: number
  plotBeatId: string | null
  locationId: string | null
  timeInStory: string
  weatherAtmosphere: string
  povCharacterId: string | null
  charactersPresent: string[]
  summary: string
  detailedOutline: string
  openingHook: string
  keyMoments: string[]
  closingHook: string
  sceneGoal: string
  conflictType: string
  conflictDescription: string
  characterGoals: CharacterGoal[]
  openingEmotion: string
  closingEmotion: string
  tone: string
  estimatedWordCount: number
  pacing: string
  setupFor: string[]
  payoffFor: string[]
  status: ContentStatus
  userNotes: string
}

export interface CharacterGoal {
  characterId: string
  goal: string
  outcome: string
}

// =============================================================================
// Chapter Types
// =============================================================================

export interface Chapter {
  id: string
  number: number
  title: string
  sceneIds: string[]
  content: string
  wordCount: number
  status: ChapterStatus
  lockedPassages: LockedPassage[]
  currentRevision: number
}

export interface LockedPassage {
  start: number
  end: number
  reason: string
}

// =============================================================================
// Worldbuilding Types
// =============================================================================

export interface WorldbuildingWiki {
  locations: WikiEntry[]
  timeline: WikiEntry[]
  magicTechnology: WikiEntry[]
  culturesFactions: WikiEntry[]
  objects: WikiEntry[]
  terminology: WikiEntry[]
  rules: WikiEntry[]
}

export interface WikiEntry {
  id: string
  category: WikiCategory
  name: string
  description: string
  relatedEntries: string[]
  sourceChapters: string[]
  tags: string[]
}

// =============================================================================
// Revision & Quality Types
// =============================================================================

export interface RevisionHistory {
  chapterId: string
  revisionNumber: number
  timestamp: string
  previousContent: string
  changes: RevisionChange[]
  qualityScoreBefore: number
  qualityScoreAfter: number
}

export interface RevisionChange {
  start: number
  end: number
  originalText: string
  newText: string
  reason: string
}

export interface ChapterQualityScore {
  chapterId: string
  revisionNumber: number
  timestamp: string
  dimensions: QualityDimensions
  overallScore: number
  strengths: string[]
  weaknesses: string[]
  specificSuggestions: Suggestion[]
  bestsellerComparison: string
}

export interface QualityDimensions {
  plotCoherence: number
  characterConsistency: number
  characterVoice: number
  pacing: number
  dialogueQuality: number
  proseStyle: number
  emotionalImpact: number
  tensionManagement: number
  worldbuildingIntegration: number
  themeExpression: number
  marketAppeal: number
  originality: number
}

export interface Suggestion {
  id: string
  priority: number
  dimension: keyof QualityDimensions
  description: string
  specificText: string
  suggestedChange: string
  status: SuggestionStatus
}

// =============================================================================
// Statistics Types
// =============================================================================

export interface WritingStatistics {
  totalWords: number
  wordsPerDay: DailyWordCount[]
  sessionsLogged: WritingSession[]
  averageSessionLength: number
  chaptersCompleted: number
  totalChapters: number
  revisionsCompleted: number
  averageQualityScore: number
}

export interface DailyWordCount {
  date: string
  count: number
}

export interface WritingSession {
  date: string
  duration: number
  wordsWritten: number
}

// =============================================================================
// Market Analysis Types
// =============================================================================

export interface MarketAnalysis {
  comparableTitles: ComparableTitle[]
  genrePositioning: string
  uniqueness: string
  readerExpectations: string[]
  lengthRecommendation: string
  analyzedAt: string
}

export interface ComparableTitle {
  title: string
  author: string
  similarity: string
  marketPerformance: string
}

// =============================================================================
// Subplot Types
// =============================================================================

export interface Subplot {
  id: string
  name: string
  description: string
  type: SubplotType
  relatedCharacterIds: string[]
  setupSceneId: string | null
  payoffSceneId: string | null
  status: SubplotStatus
  tensionCurve: SubplotTensionPoint[]
  color: string
  createdAt: string
}

export interface SubplotTouch {
  id: string
  subplotId: string
  sceneId: string
  chapterId: string
  touchType: SubplotTouchType
  tensionLevel: number
  notes: string
}

export interface SubplotTensionPoint {
  chapterNumber: number
  tensionLevel: number
}

// =============================================================================
// Brainstorm Types
// =============================================================================

export interface BrainstormSession {
  id: string
  projectId: string
  rawText: string
  taggedSections: TaggedSection[]
  questionsAsked: BrainstormQuestion[]
  answersGiven: BrainstormAnswer[]
  plotFoundation: PlotFoundation | null
  characterFoundation: CharacterFoundation | null
  sceneFoundation: SceneFoundation | null
  createdAt: string
  updatedAt: string
  finalized: boolean
  version: number
}

export interface TaggedSection {
  startIndex: number
  endIndex: number
  tag: BrainstormTag
  text: string
}

export interface BrainstormQuestion {
  id: string
  category: string
  questionText: string
  contextQuote: string | null
  priority: number
}

export interface BrainstormAnswer {
  questionId: string
  answerText: string
  skipped: boolean
  timestamp: string
}

// =============================================================================
// Foundation Types
// =============================================================================

export interface PlotFoundation {
  premise: string
  centralConflict: string
  suggestedStructure: {
    framework: string
    reasoning: string
  }
  keyPlotPoints: PlotSeed[]
  potentialSubplots: string[]
  openQuestions: string[]
}

export interface PlotSeed {
  id: string
  title: string
  description: string
  storyPhase: 'beginning' | 'middle' | 'end'
  confidence: ConfidenceLevel
  sourceQuote: string | null
  selected: boolean
}

export interface CharacterFoundation {
  identifiedCharacters: CharacterSeed[]
  relationshipHints: RelationshipSeed[]
  missingArchetypes: string[]
  openQuestions: string[]
}

export interface CharacterSeed {
  id: string
  name: string | null
  workingName: string
  role: string
  knownTraits: string[]
  inferredTraits: string[]
  potentialArc: string | null
  keyRelationships: string[]
  confidence: ConfidenceLevel
  sourceQuotes: string[]
  selected: boolean
}

export interface RelationshipSeed {
  character1: string
  character2: string
  relationshipType: string
  description: string
  confidence: ConfidenceLevel
}

export interface SceneFoundation {
  envisionedScenes: SceneSeed[]
  suggestedScenes: SceneSeed[]
  keyMoments: string[]
  settingNotes: SettingSeed[]
  openQuestions: string[]
}

export interface SceneSeed {
  id: string
  title: string
  description: string
  charactersInvolved: string[]
  emotionalBeat: string
  storyFunction: string
  vividness: 'detailed' | 'sketched' | 'implied'
  sourceQuote: string | null
  selected: boolean
}

export interface SettingSeed {
  id: string
  name: string
  description: string
  atmosphere: string
  confidence: ConfidenceLevel
}

// =============================================================================
// Story Memory Types (Feature 8)
// =============================================================================

export interface ChapterSummary {
  id: string
  chapterId: string
  chapterNumber: number
  summary: string
  keyEvents: string[]
  charactersPresent: string[]
  locationsUsed: string[]
  emotionalBeats: string[]
  plotBeatsAdvanced: string[]
  subplotsTouched: string[]
  foreshadowing: string[] | { element: string; setup: string }[]
  payoffs: string[]
  cliffhanger: string | null
  openQuestions?: string[]
  generatedAt: string
  tokenCount: number
}

export interface CharacterKnowledgeState {
  id: string
  characterId: string
  asOfChapterId: string
  asOfChapterNumber: number
  knownFacts: string[]
  beliefs: string[]
  secrets: string[]
  relationships: Record<string, string>
  emotionalState: string
  activeGoals: string[]
  recentExperiences: string[]
  generatedAt: string
}
