import { create } from 'zustand'
import type { Project, WritingStatistics } from '@/types/project'

type SaveStatus = 'unsaved' | 'saving' | 'saved'

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
