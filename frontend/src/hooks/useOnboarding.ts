import { useState, useEffect, useCallback } from 'react'

// Keys for tracking which tooltips have been dismissed
export type OnboardingStep =
  | 'specification-intro'
  | 'brainstorm-intro'
  | 'plot-intro'
  | 'characters-intro'
  | 'scenes-intro'
  | 'write-intro'
  | 'ai-features'
  | 'keyboard-shortcuts'

const STORAGE_KEY = 'storyflow_onboarding'

interface OnboardingState {
  completedSteps: OnboardingStep[]
  dismissed: boolean // User has dismissed all onboarding
}

const DEFAULT_STATE: OnboardingState = {
  completedSteps: [],
  dismissed: false,
}

function loadState(): OnboardingState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to load onboarding state:', error)
  }
  return DEFAULT_STATE
}

function saveState(state: OnboardingState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.warn('Failed to save onboarding state:', error)
  }
}

export interface UseOnboardingReturn {
  // Check if a specific step should be shown
  shouldShowStep: (step: OnboardingStep) => boolean
  // Mark a step as complete (dismissed)
  completeStep: (step: OnboardingStep) => void
  // Check if user is new (first time)
  isFirstTime: boolean
  // Dismiss all onboarding
  dismissAll: () => void
  // Reset onboarding (for testing)
  reset: () => void
  // Check if all onboarding is dismissed
  isDismissed: boolean
}

export function useOnboarding(): UseOnboardingReturn {
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load state from localStorage on mount
  useEffect(() => {
    setState(loadState())
    setIsLoaded(true)
  }, [])

  // Save state whenever it changes
  useEffect(() => {
    if (isLoaded) {
      saveState(state)
    }
  }, [state, isLoaded])

  const shouldShowStep = useCallback(
    (step: OnboardingStep): boolean => {
      if (!isLoaded) return false
      if (state.dismissed) return false
      return !state.completedSteps.includes(step)
    },
    [isLoaded, state.dismissed, state.completedSteps]
  )

  const completeStep = useCallback((step: OnboardingStep) => {
    setState((prev) => ({
      ...prev,
      completedSteps: prev.completedSteps.includes(step)
        ? prev.completedSteps
        : [...prev.completedSteps, step],
    }))
  }, [])

  const dismissAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      dismissed: true,
    }))
  }, [])

  const reset = useCallback(() => {
    setState(DEFAULT_STATE)
  }, [])

  const isFirstTime = isLoaded && state.completedSteps.length === 0 && !state.dismissed

  return {
    shouldShowStep,
    completeStep,
    isFirstTime,
    dismissAll,
    reset,
    isDismissed: state.dismissed,
  }
}

// Onboarding content for each step
export const ONBOARDING_CONTENT: Record<OnboardingStep, { title: string; description: string }> = {
  'specification-intro': {
    title: 'Define Your Story',
    description: 'Start here by setting your genre, target audience, and writing style. This helps the AI understand your vision.',
  },
  'brainstorm-intro': {
    title: 'Free Your Ideas',
    description: 'Write freely about your story ideas. The AI will analyze your brainstorm and generate questions to help develop your concept.',
  },
  'plot-intro': {
    title: 'Structure Your Story',
    description: 'Choose a plot framework and define your major story beats. This creates the backbone of your narrative.',
  },
  'characters-intro': {
    title: 'Bring Characters to Life',
    description: 'Create detailed character profiles with motivations, flaws, and arcs. The AI will help maintain consistent character voices.',
  },
  'scenes-intro': {
    title: 'Plan Your Scenes',
    description: 'Break your story into scenes. Drag and drop to reorder, and assign them to chapters.',
  },
  'write-intro': {
    title: 'Write Your Draft',
    description: 'Generate first drafts with AI assistance, then refine using the writer-critic loop. Press Cmd+Enter for AI help.',
  },
  'ai-features': {
    title: 'AI is Your Writing Partner',
    description: 'Use Cmd+Enter anywhere to access AI generation. The AI learns from your specification and brainstorm.',
  },
  'keyboard-shortcuts': {
    title: 'Work Faster with Shortcuts',
    description: 'Press ? at any time to see all keyboard shortcuts. Use Cmd+1-7 to navigate between sections.',
  },
}
