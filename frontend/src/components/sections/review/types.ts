import type { HarshnessLevel } from './constants'

export interface DimensionScore {
  dimensionId: string
  score: number // 1-10
  feedback: string
  suggestions: string[]
}

// Prioritized suggestion with impact level
export interface PrioritizedSuggestion {
  id: string
  dimensionId: string
  dimensionName: string
  suggestion: string
  impact: 'high' | 'medium' | 'low'
  impactScore: number // Calculated score for sorting
  reason: string
  status: 'pending' | 'approved' | 'rejected' // Approval status
  targetPassage?: string // New field for targeted rewrites
}

export interface CritiqueResult {
  chapterId: string
  overallScore: number
  dimensions: DimensionScore[]
  summary: string
  strengths: string[]
  areasForImprovement: string[]
  prioritizedSuggestions: PrioritizedSuggestion[] // Ordered by impact
  generatedAt: string
  harshnessLevel: HarshnessLevel
  bestsellerComparison: string // Comparison to successful titles in genre
}

// Diff result for showing before/after comparison
export interface DiffChange {
  id: string
  type: 'insertion' | 'deletion'
  content: string
  suggestionSource: string[]
  accepted: boolean | null // null = pending, true = accepted, false = rejected
}

export interface DiffResult {
  originalContent: string
  revisedContent: string
  appliedSuggestions: string[]
  chapterId: string
  generatedAt: string
  changes: DiffChange[]
}

// Improvement history entry
export interface ImprovementHistoryEntry {
  iteration: number
  score: number
  timestamp: string
}

// Locked passage
export interface LockedPassage {
  start: number
  end: number
  reason: string
}

// Radical alternative (for breakthrough mode)
export interface RadicalAlternative {
  editor: string
  content: string
  score: number
}

// Previous version (for breakthrough mode)
export interface PreviousVersion {
  content: string
  score: number
  strategy: string
}

// Breakthrough improvement mode
export type BreakthroughMode = 'standard' | 'radical' | 'surgery' | 'synthesis'
