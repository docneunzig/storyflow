// Project types based on the database schema

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

export type ProjectPhase =
  | 'specification'
  | 'plotting'
  | 'characters'
  | 'scenes'
  | 'writing'
  | 'revision'
  | 'complete'

export interface NovelSpecification {
  genre: string[]
  subgenre: string[]
  targetAudience: TargetAudience
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
  pacing: number // 1-10
  complexity: number // 1-10
}

export type TargetAudience = 'Children' | 'Middle Grade' | 'YA' | 'New Adult' | 'Adult'
export type POV = 'First Person' | 'Third Limited' | 'Third Omniscient' | 'Second Person' | 'Multiple POV'
export type Tense = 'Past' | 'Present'

export interface PlotStructure {
  framework: PlotFramework
  beats: PlotBeat[]
  overallArc: string
  centralConflict: string
  stakes: string
}

export type PlotFramework = 'Three-Act Structure' | 'Hero\'s Journey' | 'Save the Cat' | 'Seven-Point Structure' | 'Freeform'

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

export type ContentStatus = 'outline' | 'drafted' | 'revised' | 'locked'

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

export type CharacterRole = 'protagonist' | 'antagonist' | 'supporting' | 'minor'
export type CharacterStatus = 'alive' | 'deceased' | 'unknown'

export interface CharacterRelationship {
  sourceCharacterId: string
  targetCharacterId: string
  relationshipType: RelationshipType
  dynamicDescription: string
  evolution: string
  keyScenes: string[]
}

export type RelationshipType = 'family' | 'romantic' | 'conflict' | 'alliance' | 'mentor' | 'sibling' | 'rival' | 'friend'

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

export type ChapterStatus = 'outline' | 'draft' | 'revision' | 'final' | 'locked'

export interface LockedPassage {
  start: number
  end: number
  reason: string
}

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

export type WikiCategory =
  | 'locations'
  | 'characters'
  | 'timeline'
  | 'magicTechnology'
  | 'culturesFactions'
  | 'objects'
  | 'terminology'
  | 'rules'

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
  status: 'pending' | 'approved' | 'modified' | 'rejected'
}

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
  duration: number // minutes
  wordsWritten: number
}

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

// Brainstorm Session Types
export interface BrainstormSession {
  id: string
  projectId: string

  // Input
  rawText: string
  taggedSections: TaggedSection[]

  // Q&A Phase
  questionsAsked: BrainstormQuestion[]
  answersGiven: BrainstormAnswer[]

  // Generated Foundations
  plotFoundation: PlotFoundation | null
  characterFoundation: CharacterFoundation | null
  sceneFoundation: SceneFoundation | null

  // Meta
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

export type BrainstormTag = 'character' | 'setting' | 'plot' | 'theme' | 'scene' | 'question' | 'inspiration'

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

// Foundation Types
export type ConfidenceLevel = 'explicit' | 'inferred' | 'suggested'

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
