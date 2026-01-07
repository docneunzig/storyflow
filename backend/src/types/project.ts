// Backend type definitions matching frontend types

export interface Project {
  id: string
  version: number
  metadata: ProjectMetadata
  specification: NovelSpecification | null
  plot: PlotStructure | null
  characters: Character[]
  scenes: Scene[]
  chapters: Chapter[]
  worldbuilding: WorldbuildingWiki | null
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
  targetAudience: string
  writingStyle: {
    reference: string
    custom: string
  }
  tone: string
  pov: string
  tense: string
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

export interface PlotStructure {
  framework: string
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
  status: string
  userNotes: string
}

export interface Character {
  id: string
  name: string
  aliases: string[]
  role: string
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
  status: string
  userNotes: string
}

export interface CharacterRelationship {
  sourceCharacterId: string
  targetCharacterId: string
  relationshipType: string
  dynamicDescription: string
  evolution: string
  keyScenes: string[]
}

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
  status: string
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
  status: string
  lockedPassages: LockedPassage[]
  currentRevision: number
}

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
  category: string
  name: string
  description: string
  relatedEntries: string[]
  sourceChapters: string[]
  tags: string[]
}

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
  dimensions: Record<string, number>
  overallScore: number
  strengths: string[]
  weaknesses: string[]
  specificSuggestions: Suggestion[]
  bestsellerComparison: string
}

export interface Suggestion {
  id: string
  priority: number
  dimension: string
  description: string
  specificText: string
  suggestedChange: string
  status: string
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
  duration: number
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
