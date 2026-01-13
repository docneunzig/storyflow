import {
  BookOpen,
  Users,
  Mic,
  Gauge,
  MessageSquare,
  Pen,
  Heart,
  Zap,
  Globe,
  Lightbulb,
  Target,
  Sparkles,
} from 'lucide-react'
import React from 'react'

// The 12 quality dimensions for critique with weights (must sum to 100%)
export interface QualityDimension {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  weight: number
}

export const QUALITY_DIMENSIONS: QualityDimension[] = [
  {
    id: 'plot-coherence',
    name: 'Plot Coherence',
    description: 'How well the story events connect and make logical sense',
    icon: React.createElement(BookOpen, { className: 'h-4 w-4' }),
    color: 'text-blue-400',
    weight: 12,
  },
  {
    id: 'character-consistency',
    name: 'Character Consistency',
    description: 'Characters behave in ways true to their established personalities',
    icon: React.createElement(Users, { className: 'h-4 w-4' }),
    color: 'text-purple-400',
    weight: 10,
  },
  {
    id: 'character-voice',
    name: 'Character Voice',
    description: 'Each character has a distinct, recognizable way of speaking',
    icon: React.createElement(Mic, { className: 'h-4 w-4' }),
    color: 'text-pink-400',
    weight: 8,
  },
  {
    id: 'pacing',
    name: 'Pacing',
    description: 'The story moves at an appropriate speed with good rhythm',
    icon: React.createElement(Gauge, { className: 'h-4 w-4' }),
    color: 'text-orange-400',
    weight: 10,
  },
  {
    id: 'dialogue-quality',
    name: 'Dialogue Quality',
    description: 'Conversations feel natural and serve the story well',
    icon: React.createElement(MessageSquare, { className: 'h-4 w-4' }),
    color: 'text-cyan-400',
    weight: 8,
  },
  {
    id: 'prose-style',
    name: 'Prose Style',
    description: 'The writing is clear, engaging, and fits the genre',
    icon: React.createElement(Pen, { className: 'h-4 w-4' }),
    color: 'text-emerald-400',
    weight: 10,
  },
  {
    id: 'emotional-impact',
    name: 'Emotional Impact',
    description: 'The writing evokes intended emotions in readers',
    icon: React.createElement(Heart, { className: 'h-4 w-4' }),
    color: 'text-red-400',
    weight: 10,
  },
  {
    id: 'tension-management',
    name: 'Tension Management',
    description: 'Tension builds and releases at appropriate moments',
    icon: React.createElement(Zap, { className: 'h-4 w-4' }),
    color: 'text-yellow-400',
    weight: 8,
  },
  {
    id: 'world-building',
    name: 'World-building',
    description: 'The setting is vivid, consistent, and well-integrated',
    icon: React.createElement(Globe, { className: 'h-4 w-4' }),
    color: 'text-teal-400',
    weight: 6,
  },
  {
    id: 'theme-expression',
    name: 'Theme Expression',
    description: 'Themes are woven naturally into the narrative',
    icon: React.createElement(Lightbulb, { className: 'h-4 w-4' }),
    color: 'text-amber-400',
    weight: 6,
  },
  {
    id: 'market-appeal',
    name: 'Market Appeal',
    description: 'The content aligns with genre expectations and reader preferences',
    icon: React.createElement(Target, { className: 'h-4 w-4' }),
    color: 'text-indigo-400',
    weight: 6,
  },
  {
    id: 'originality',
    name: 'Originality',
    description: 'The story offers fresh ideas or unique perspectives',
    icon: React.createElement(Sparkles, { className: 'h-4 w-4' }),
    color: 'text-fuchsia-400',
    weight: 6,
  },
]

// Harshness levels for critique feedback
export type HarshnessLevel = 'gentle-mentor' | 'balanced' | 'brutal-honesty'

export interface HarshnessOption {
  value: HarshnessLevel
  label: string
  description: string
}

export const HARSHNESS_OPTIONS: HarshnessOption[] = [
  {
    value: 'gentle-mentor',
    label: 'Gentle Mentor',
    description: 'Encouraging and supportive feedback',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Fair mix of praise and criticism',
  },
  {
    value: 'brutal-honesty',
    label: 'Brutal Honesty',
    description: 'Direct, unfiltered critique',
  },
]

export type ReviewTab = 'critique' | 'reader' | 'continuity'
