// Write Section Constants and Utilities

// Status colors for chapter badges
export const STATUS_COLORS: Record<string, string> = {
  outline: 'bg-text-secondary/20 text-text-secondary border-text-secondary/30',
  draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  revision: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  final: 'bg-success/20 text-success border-success/30',
  locked: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

// Metadata chip styles for content rendering
export const METADATA_CHIP_STYLES: Record<string, string> = {
  Setting: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  POV: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Tense: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Target Audience': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  Chapter: 'bg-accent/20 text-accent border-accent/30',
}

// Helper to get today's date string in YYYY-MM-DD format
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

// Helper to get quality color based on score
export function getQualityColor(score: number): string {
  if (score >= 9.0) return 'text-success'
  if (score >= 7.5) return 'text-accent'
  if (score >= 6.0) return 'text-warning'
  return 'text-error'
}
