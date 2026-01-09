import { create } from 'zustand'
import type { Project, WritingStatistics, ProjectPhase } from '@/types/project'

type SaveStatus = 'unsaved' | 'saving' | 'saved'

// Calculate the appropriate project phase based on progress
export function calculateProjectPhase(project: Project): ProjectPhase {
  const spec = project.specification
  const chapters = project.chapters || []
  const scenes = project.scenes || []
  const characters = project.characters || []
  const plotBeats = project.plot?.beats || []

  // Count completed chapters
  const finalizedChapters = chapters.filter(c =>
    c.status === 'final' || c.status === 'locked'
  ).length
  const draftedChapters = chapters.filter(c =>
    c.status === 'draft' || c.status === 'revision' || c.status === 'final' || c.status === 'locked'
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

  // Check for plotting phase (have spec filled out)
  const hasSpec = spec && (
    (spec.genre && spec.genre.length > 0) ||
    spec.targetAudience ||
    (spec.themes && spec.themes.length > 0)
  )

  if (hasSpec) {
    return 'plotting'
  }

  // Default to specification phase
  return 'specification'
}

interface ProjectState {
  // Current project
  currentProject: Project | null
  setCurrentProject: (project: Project | null) => void

  // Session tracking
  sessionStartWordCount: number
  sessionStartTime: number | null
  setSessionStartWordCount: (count: number) => void

  // Project list
  projects: Project[]
  setProjects: (projects: Project[]) => void
  addProject: (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  removeProject: (id: string) => void

  // Save status
  saveStatus: SaveStatus
  setSaveStatus: (status: SaveStatus) => void

  // Statistics
  statistics: WritingStatistics | null
  setStatistics: (stats: WritingStatistics | null) => void

  // Loading state
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // Error state
  error: string | null
  setError: (error: string | null) => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  // Current project
  currentProject: null,
  setCurrentProject: (project) => {
    const state = get()
    // When setting a new project, initialize session start word count if not already set
    if (project && state.sessionStartTime === null) {
      const totalWords = (project.chapters || []).reduce((sum, ch) => sum + (ch.wordCount || 0), 0)
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

  // Project list
  projects: [],
  setProjects: (projects) => set({ projects }),
  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
      currentProject:
        state.currentProject?.id === id
          ? { ...state.currentProject, ...updates }
          : state.currentProject,
    })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    })),

  // Save status
  saveStatus: 'saved',
  setSaveStatus: (status) => set({ saveStatus: status }),

  // Statistics
  statistics: null,
  setStatistics: (stats) => set({ statistics: stats }),

  // Loading state
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Error state
  error: null,
  setError: (error) => set({ error }),
}))
