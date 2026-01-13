import { create } from 'zustand'
import type { Project } from '@/types/project'

interface ProjectListState {
  // Project list
  projects: Project[]
  setProjects: (projects: Project[]) => void
  addProject: (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  removeProject: (id: string) => void

  // Find project by ID
  getProjectById: (id: string) => Project | undefined
}

export const useProjectListStore = create<ProjectListState>((set, get) => ({
  // Project list
  projects: [],
  setProjects: (projects) => set({ projects }),
  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    })),

  // Find project by ID
  getProjectById: (id) => get().projects.find((p) => p.id === id),
}))
