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
  childrensAgeCategory?: ChildrensAgeCategory // Only used when targetAudience is Children/Middle Grade/YA
  novelLanguage: NovelLanguage // Language the novel will be written in
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

// Novel language for AI generation and content
export type NovelLanguage = 'en' | 'de' | 'fr' | 'es' | 'it'

// Granular age categories for children's/YA books
export type ChildrensAgeCategory =
  | '4-6'   // Picture Book / Early Reader
  | '7-10'  // Chapter Books
  | '11-14' // Middle Grade
  | '15-18' // Young Adult

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

// =============================================================================
// FEATURE 1: Continuity Graph - Automatic Fact Tracking
// =============================================================================

export interface FactAssertion {
  id: string
  subjectId: string // character ID, location name, or object name
  subjectType: 'character' | 'location' | 'object' | 'event'
  factType: FactType
  assertion: string // "has blue eyes", "is located in the attic"
  assertedInChapterId: string
  assertedAtPosition: number // character offset in chapter
  quote: string // exact text that establishes this fact
  confidence: ConfidenceLevel
  validFrom?: string // for temporal facts - when this became true
  validUntil?: string // for temporal facts - when this stopped being true
  supersededBy?: string // ID of fact that replaced this one (for conflict tracking)
  createdAt: string
}

export type FactType =
  | 'physical' // eye color, height, scars
  | 'knowledge' // who knows what
  | 'location' // where something/someone is
  | 'relationship' // how characters relate
  | 'temporal' // dates, times, sequence
  | 'possession' // who owns what
  | 'state' // alive/dead, married/single, etc.

export interface ContinuityConflict {
  id: string
  existingFactId: string
  newFactId: string
  description: string // "Sarah's eye color changed from blue to green"
  severity: 'high' | 'medium' | 'low'
  resolved: boolean
  resolution?: string // how the author resolved it
  detectedAt: string
}

// =============================================================================
// FEATURE 2: Character Voice DNA Fingerprinting
// =============================================================================

export interface CharacterVoiceDNA {
  characterId: string
  // Quantitative metrics
  avgSentenceLength: number
  contractionRatio: number // 0-1, how often they use contractions
  questionFrequency: number // 0-1, how often they ask questions
  exclamationFrequency: number // 0-1, how often they use exclamations
  // Vocabulary patterns
  uniqueVocabulary: string[] // words this character uses that others don't
  prohibitedVocabulary: string[] // words this character would never use
  fillerWords: string[] // "um", "like", "well", etc.
  catchphrases: string[] // frequently repeated phrases
  // Emotional markers
  emotionalMarkers: Record<string, number> // frequency of emotion-related words
  // Sample dialogue for reference
  sampleDialogue: string[] // 10-20 representative lines
  // Narrative description
  speechPatternNotes: string
  // Meta
  analyzedAt: string
  dialogueSamplesCount: number
}

export interface VoiceDeviationWarning {
  id: string
  characterId: string
  chapterId: string
  dialogueText: string
  position: number
  matchScore: number // 0-1, how well it matches the voice DNA
  deviations: VoiceDeviation[]
  suggestions: string[]
  acknowledged: boolean
}

export interface VoiceDeviation {
  type: 'vocabulary' | 'length' | 'pattern' | 'emotion' | 'formality'
  description: string
}

// =============================================================================
// FEATURE 3: Subplot Thread Tracker
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
  color: string // for visualization
  createdAt: string
}

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

export interface SubplotTouch {
  id: string
  subplotId: string
  sceneId: string
  chapterId: string
  touchType: 'setup' | 'development' | 'escalation' | 'reference' | 'payoff'
  tensionLevel: number // 1-10
  notes: string
}

export interface SubplotTensionPoint {
  chapterNumber: number
  tensionLevel: number
}

export interface SubplotWarning {
  subplotId: string
  type: 'dormant' | 'unresolved' | 'rushed_resolution' | 'missing_setup'
  message: string
  lastTouchedChapter: number
  currentChapter: number
}

// =============================================================================
// FEATURE 4: Reader Experience Predictor
// =============================================================================

export interface ReaderState {
  chapterId: string
  chapterNumber: number
  // Information tracking
  knownFacts: string[] // facts the reader knows at this point
  activeQuestions: ActiveQuestion[] // mysteries the reader is tracking
  // Emotional state
  emotionalState: ReaderEmotionalState
  // Predictions
  predictedReactions: string[]
  engagementLevel: number // 0-1
  // Pacing
  readingPaceEstimate: 'fast' | 'medium' | 'slow'
  informationDensity: number // 0-1
}

export interface ActiveQuestion {
  id: string
  question: string // "Who killed the butler?"
  raisedInChapterId: string
  intensity: number // 0-1, how much the reader cares
  answeredInChapterId?: string
}

export interface ReaderEmotionalState {
  tension: number // 0-1
  curiosity: number // 0-1
  satisfaction: number // 0-1
  confusion: number // 0-1
  attachment: Record<string, number> // character ID -> attachment level (0-1)
}

export interface TwistImpactPrediction {
  twistDescription: string
  chapterId: string
  foreshadowingRefs: string[] // chapter/scene IDs where it was set up
  predictedSurpriseLevel: number // 0-1
  predictedSatisfactionLevel: number // 0-1
  reasoning: string
}

// =============================================================================
// FEATURE 5: Smart First Draft Generator (extends Scene)
// =============================================================================

export interface SceneGenerationResult {
  sceneId: string
  generatedProse: string
  outlineAdherenceScore: number // 0-1, how well it followed the outline
  voiceMatchScores: Record<string, number> // character ID -> voice match (0-1)
  continuityIssues: string[]
  status: 'pending_review' | 'approved' | 'rejected' | 'needs_revision'
  generatedAt: string
}

export interface GenerationCheckpoint {
  id: string
  chapterId: string
  sceneIndex: number
  totalScenes: number
  generatedContent: string
  approved: boolean
  notes: string
  timestamp: string
}

// =============================================================================
// FEATURE 6: Series Bible with Cross-Book Consistency
// =============================================================================

export interface Series {
  id: string
  name: string
  description: string
  projectIds: string[] // ordered list of book projects
  seriesBible: WikiEntry[] // shared world-building entries
  sharedCharacters: SeriesCharacterMapping[]
  crossBookPromises: CrossBookPromise[]
  timeline: SeriesTimelineEvent[]
  createdAt: string
  updatedAt: string
}

export interface SeriesCharacterMapping {
  seriesCharacterId: string // unique ID across series
  seriesCharacterName: string
  bookMappings: Record<string, string> // projectId -> character ID in that book
  lastKnownState: CharacterSeriesState
}

export interface CharacterSeriesState {
  isAlive: boolean
  lastSeenBookNumber: number
  significantChanges: string[] // "lost arm in book 2", "married in book 3"
}

export interface CrossBookPromise {
  id: string
  promiseText: string // "The prophecy will be fulfilled"
  madeInBookNumber: number
  madeInChapterId: string
  requiredResolutionBy: number | null // book number, null = eventually
  resolvedInBookNumber: number | null
  resolvedInChapterId: string | null
  status: 'open' | 'resolved' | 'abandoned'
}

export interface SeriesTimelineEvent {
  id: string
  event: string
  bookNumber: number
  chapterId: string | null
  relativeTime: string // "10 years before book 1", "during book 2 ch 5"
}

// =============================================================================
// FEATURE 7: Deadline-Aware Pacing Dashboard
// =============================================================================

export interface ProjectDeadline {
  targetCompletionDate: string
  targetWordCount: number
  targetQualityScore: number
  milestones: DeadlineMilestone[]
  createdAt: string
}

export interface DeadlineMilestone {
  id: string
  name: string // "First draft complete", "Revisions done"
  targetDate: string
  targetWords: number | null
  targetChapters: number | null
  status: 'pending' | 'completed' | 'missed'
  completedAt: string | null
}

export interface VelocityStats {
  // Writing speed
  avgDraftWordsPerHour: number
  avgRevisionWordsPerHour: number
  // Projections
  projectedCompletionDate: string
  onTrack: boolean
  daysAheadOrBehind: number
  requiredDailyOutput: number
  // Productivity patterns
  bestProductivityHours: number[] // 0-23
  bestProductivityDays: number[] // 0-6 (Sunday-Saturday)
  // Session quality
  avgSessionDuration: number // minutes
  avgWordsPerSession: number
  longestStreak: number // consecutive days
  currentStreak: number
  // Weekly metrics
  wordsThisWeek: number
  weekOverWeekChange: number // percentage change from last week
}

export interface ProductivityInsight {
  type: 'positive' | 'warning' | 'suggestion'
  message: string
  data?: Record<string, any>
}

// =============================================================================
// FEATURE 8: Story Memory / RAG System
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
  foreshadowing: string[]
  payoffs: string[]
  cliffhanger: string | null
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
  relationships: Record<string, string> // characterId -> relationship description
  emotionalState: string
  activeGoals: string[]
  recentExperiences: string[]
  generatedAt: string
}

export interface StoryMemoryContext {
  relevantSummaries: ChapterSummary[]
  relevantCharacterStates: CharacterKnowledgeState[]
  relevantFacts: FactAssertion[]
  relevantWorldbuilding: WikiEntry[]
  activeSubplots: Subplot[]
  openQuestions: string[]
  recentEmotionalBeats: string[]
  unresolvedSetups: string[]
}

// =============================================================================
// FEATURE 9: Show Don't Tell Analyzer
// =============================================================================

export interface ShowDontTellViolation {
  id: string
  chapterId: string
  originalText: string
  position: { start: number; end: number }
  violationType: 'emotion' | 'trait' | 'state' | 'reaction'
  severity: 'high' | 'medium' | 'low'
  explanation: string
  alternatives: ShowDontTellAlternative[]
  status: 'pending' | 'fixed' | 'ignored'
}

export interface ShowDontTellAlternative {
  rewrite: string
  technique: 'action' | 'dialogue' | 'sensory' | 'physical' | 'metaphor'
  explanation: string
}

// =============================================================================
// FEATURE 10: Style Cloning
// =============================================================================

export interface StyleFingerprint {
  id: string
  name: string
  sourceName?: string // Original author/work name
  sentenceStructure: {
    avgLength: number
    variation: number // standard deviation
    complexity: number // 0-1, based on clause depth
    fragmentFrequency: number // 0-1, intentional fragments
  }
  vocabulary: {
    sophistication: number // 0-1, based on word rarity
    domainSpecific: string[] // frequent domain-specific terms
    avoided: string[] // words the style avoids
    favorites: string[] // distinctively overused words
  }
  narrativeTechniques: {
    pov: string
    tense: string
    streamOfConsciousness: number // 0-1
    dialogueToNarrativeRatio: number // 0-1
    internalizationFrequency: number // 0-1
  }
  rhythm: {
    punctuationStyle: string // "sparse", "dramatic", "standard"
    paragraphLength: 'short' | 'medium' | 'long' | 'varied'
    dialogueTagStyle: 'minimal' | 'descriptive' | 'action-oriented'
    sceneTransitionStyle: string
  }
  distinctiveMarkers: string[] // unique stylistic elements
  authorVoice: string // prose description of the voice
  samplePassages: {
    opening: string
    dialogue: string
    description: string
    action: string
    introspection: string
  }
  analyzedAt: string
}

// =============================================================================
// Extended Project interface to include new features
// =============================================================================

export interface ProjectExtended extends Project {
  // Feature 1: Continuity Graph
  factAssertions: FactAssertion[]
  continuityConflicts: ContinuityConflict[]
  // Feature 2: Voice DNA
  voiceDNA: Record<string, CharacterVoiceDNA> // characterId -> DNA
  voiceWarnings: VoiceDeviationWarning[]
  // Feature 3: Subplot Tracker
  subplots: Subplot[]
  subplotTouches: SubplotTouch[]
  // Feature 4: Reader Experience
  readerStates: ReaderState[]
  twistPredictions: TwistImpactPrediction[]
  // Feature 5: Smart Generation
  generationCheckpoints: GenerationCheckpoint[]
  sceneGenerationResults: SceneGenerationResult[]
  // Feature 7: Deadline (Feature 6 is at Series level)
  deadline: ProjectDeadline | null
  velocityStats: VelocityStats | null
  // Feature 8: Story Memory
  chapterSummaries: ChapterSummary[]
  characterKnowledgeStates: CharacterKnowledgeState[]
  // Feature 9: Show Don't Tell
  showDontTellViolations: ShowDontTellViolation[]
  // Feature 10: Style Cloning
  styleFingerprints: StyleFingerprint[]
  activeStyleId: string | null
}
