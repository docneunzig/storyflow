import { create } from 'zustand'
import type { WritingStatistics } from '@/types/project'

export type SaveStatus = 'unsaved' | 'saving' | 'saved'

interface ProjectUIState {
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
  clearError: () => void
}

export const useProjectUIStore = create<ProjectUIState>((set) => ({
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
  clearError: () => set({ error: null }),
}))
