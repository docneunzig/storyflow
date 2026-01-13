// Progress Emitter for real-time AI generation progress
// Uses Server-Sent Events (SSE) to stream progress to the frontend

import { EventEmitter } from 'events'

export interface GenerationProgress {
  generationId: string
  status: 'initializing' | 'analyzing' | 'generating' | 'processing' | 'completed' | 'error' | 'cancelled'
  progress: number // 0-100
  message: string
  result?: string
  error?: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}

// Global event emitter for progress updates
const progressEmitter = new EventEmitter()
progressEmitter.setMaxListeners(100) // Allow many concurrent connections

// Store active generation progress
const generationProgress = new Map<string, GenerationProgress>()

// Emit progress update for a generation
export function emitProgress(progress: GenerationProgress): void {
  generationProgress.set(progress.generationId, progress)
  progressEmitter.emit(`progress:${progress.generationId}`, progress)
}

// Get current progress for a generation
export function getProgress(generationId: string): GenerationProgress | null {
  return generationProgress.get(generationId) || null
}

// Subscribe to progress updates for a generation
export function subscribeToProgress(
  generationId: string,
  callback: (progress: GenerationProgress) => void
): () => void {
  const eventName = `progress:${generationId}`
  progressEmitter.on(eventName, callback)

  // Return unsubscribe function
  return () => {
    progressEmitter.off(eventName, callback)
  }
}

// Clean up progress for a generation
export function cleanupProgress(generationId: string): void {
  generationProgress.delete(generationId)
}

// Helper to update progress through generation stages
export function createProgressTracker(generationId: string) {
  return {
    initialize: () => {
      emitProgress({
        generationId,
        status: 'initializing',
        progress: 5,
        message: 'Initializing AI generation...',
      })
    },
    analyzing: () => {
      emitProgress({
        generationId,
        status: 'analyzing',
        progress: 20,
        message: 'Analyzing context and requirements...',
      })
    },
    generating: (message?: string) => {
      emitProgress({
        generationId,
        status: 'generating',
        progress: 50,
        message: message || 'Generating content with AI...',
      })
    },
    processing: () => {
      emitProgress({
        generationId,
        status: 'processing',
        progress: 80,
        message: 'Processing and formatting response...',
      })
    },
    complete: (result: string, usage?: { inputTokens: number; outputTokens: number }) => {
      emitProgress({
        generationId,
        status: 'completed',
        progress: 100,
        message: 'Generation complete!',
        result,
        usage,
      })
    },
    error: (errorMessage: string) => {
      emitProgress({
        generationId,
        status: 'error',
        progress: 0,
        message: 'Generation failed',
        error: errorMessage,
      })
    },
    cancelled: () => {
      emitProgress({
        generationId,
        status: 'cancelled',
        progress: 0,
        message: 'Generation cancelled by user',
      })
    },
  }
}

export { progressEmitter }
