// Review Section - Modular Architecture
// This file re-exports the ReviewSection from the legacy file for now
// The extracted components (ChapterSelector, DimensionCard, SuggestionsList)
// and hooks (useCritique) are available for future incremental refactoring

// Re-export constants and types for use by other modules
export * from './constants'
export * from './types'

// Re-export extracted components
export { ChapterSelector } from './ChapterSelector'
export { DimensionCard } from './DimensionCard'
export { SuggestionsList } from './SuggestionsList'

// Re-export hooks
export { useCritique } from './hooks'

// The main ReviewSection is still in the legacy file due to its complexity (2,862 lines)
// It will be incrementally refactored to use the extracted components
// For now, re-export from the legacy file in parent directory
import { ReviewSection as ReviewSectionLegacy } from '../ReviewSection.legacy'
export const ReviewSection = ReviewSectionLegacy
