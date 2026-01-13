import { create } from 'zustand'
import type { Project, ProjectPhase } from '@/types/project'

/**
 * Calculate the appropriate project phase based on progress
 */
export function calculateProjectPhase(project: Project): ProjectPhase {
  const spec = project.specification
  const brainstorm = project.brainstorm
  const chapters = project.chapters || []
  const scenes = project.scenes || []
  const characters = project.characters || []
  const plotBeats = project.plot?.beats || []

  // Count completed chapters
  const finalizedChapters = chapters.filter(
    (c) => c.status === 'final' || c.status === 'locked'
  ).length
  const draftedChapters = chapters.filter(
    (c) =>
      c.status === 'draft' ||
      c.status === 'revision' ||
      c.status === 'final' ||
      c.status === 'locked'
  ).length

  // Check for completion
  const targetWordCount = spec?.targetWordCount || 80000
  const totalWords = chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0)
  const isComplete = totalWords >= targetWordCount && finalizedChapters > 0

  if (isComplete) {
    return 'complete'
  }

  // Check for revision phase (have chapters, mostly done writing)
  if (draftedChapters >= 3 && totalWords >= targetWordCount * 0.7) {
    return 'revision'
  }

  // Check for writing phase (have scene blueprints and characters)
  if (scenes.length >= 3 && characters.length >= 2 && plotBeats.length >= 3) {
    return 'writing'
  }

  // Check for scenes phase (have characters and plot)
  if (characters.length >= 2 && plotBeats.length >= 3) {
    return 'scenes'
  }

  // Check for characters phase (have plot structure)
  if (plotBeats.length >= 3) {
    return 'characters'
  }

  // Check for plotting phase (have spec filled out OR brainstorm finalized)
  const hasSpec =
    spec &&
    ((spec.genre && spec.genre.length > 0) ||
      spec.targetAudience ||
      (spec.themes && spec.themes.length > 0))
  const hasBrainstorm = brainstorm && brainstorm.finalized

  if (hasSpec || hasBrainstorm) {
    return 'plotting'
  }

  // Default to specification phase
  return 'specification'
}

interface CurrentProjectState {
  // Current project
  currentProject: Project | null
  setCurrentProject: (project: Project | null) => void

  // Session tracking
  sessionStartWordCount: number
  sessionStartTime: number | null
  setSessionStartWordCount: (count: number) => void
  resetSession: () => void
}

export const useCurrentProjectStore = create<CurrentProjectState>((set, get) => ({
  // Current project
  currentProject: null,
  setCurrentProject: (project) => {
    const state = get()
    // When setting a new project, initialize session start word count if not already set
    if (project && state.sessionStartTime === null) {
      const totalWords = (project.chapters || []).reduce(
        (sum, ch) => sum + (ch.wordCount || 0),
        0
      )
      set({
        currentProject: project,
        sessionStartWordCount: totalWords,
        sessionStartTime: Date.now(),
      })
    } else {
      set({ currentProject: project })
    }
  },

  // Session tracking
  sessionStartWordCount: 0,
  sessionStartTime: null,
  setSessionStartWordCount: (count) => set({ sessionStartWordCount: count }),
  resetSession: () =>
    set({
      sessionStartWordCount: 0,
      sessionStartTime: null,
    }),
}))
