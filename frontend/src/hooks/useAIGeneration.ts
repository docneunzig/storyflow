import { useState, useCallback, useRef } from 'react'

export type AIGenerationStatus = 'idle' | 'generating' | 'cancelling' | 'completed' | 'error' | 'cancelled'

export interface AIGenerationProgress {
  status: AIGenerationStatus
  progress: number // 0-100
  message: string
  result?: string
  error?: string
}

export interface AIGenerationOptions {
  agentTarget: string
  action: string
  context?: Record<string, any>
  payload?: Record<string, any>
  onProgress?: (progress: AIGenerationProgress) => void
}

export function useAIGeneration() {
  const [status, setStatus] = useState<AIGenerationStatus>('idle')
  const [progress, setProgress] = useState<number>(0)
  const [message, setMessage] = useState<string>('')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const isGeneratingRef = useRef<boolean>(false)

  const generate = useCallback(async (options: AIGenerationOptions): Promise<string | null> => {
    const { agentTarget, action, context, payload, onProgress } = options

    // Prevent concurrent generations
    if (isGeneratingRef.current) {
      console.warn('AI generation already in progress')
      return null
    }

    // Create new AbortController for this generation
    abortControllerRef.current = new AbortController()
    isGeneratingRef.current = true

    // Reset state
    setStatus('generating')
    setProgress(0)
    setMessage('Initializing AI generation...')
    setResult(null)
    setError(null)

    const updateProgress = (newProgress: AIGenerationProgress) => {
      setStatus(newProgress.status)
      setProgress(newProgress.progress)
      setMessage(newProgress.message)
      if (newProgress.result) setResult(newProgress.result)
      if (newProgress.error) setError(newProgress.error)
      onProgress?.(newProgress)
    }

    try {
      updateProgress({
        status: 'generating',
        progress: 10,
        message: `Starting ${action} generation...`,
      })

      // Simulate progress stages for better UX
      // In real implementation, this would be server-sent events or polling
      const progressStages = [
        { progress: 20, message: 'Analyzing context...', delay: 500 },
        { progress: 40, message: 'Generating content...', delay: 1500 },
        { progress: 60, message: 'Processing response...', delay: 1000 },
        { progress: 80, message: 'Finalizing...', delay: 500 },
      ]

      // Start the actual API call
      const fetchPromise = fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentTarget,
          action,
          context,
          payload,
        }),
        signal: abortControllerRef.current.signal,
      })

      // Simulate progress while waiting for the API
      // This provides feedback even if the API takes a while
      let currentStage = 0
      const progressInterval = setInterval(() => {
        if (abortControllerRef.current?.signal.aborted) {
          clearInterval(progressInterval)
          return
        }

        if (currentStage < progressStages.length) {
          const stage = progressStages[currentStage]
          updateProgress({
            status: 'generating',
            progress: stage.progress,
            message: stage.message,
          })
          currentStage++
        }
      }, 800)

      const response = await fetchPromise
      clearInterval(progressInterval)

      // Check if cancelled during fetch
      if (abortControllerRef.current?.signal.aborted) {
        updateProgress({
          status: 'cancelled',
          progress: 0,
          message: 'Generation cancelled',
        })
        return null
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()

      updateProgress({
        status: 'completed',
        progress: 100,
        message: 'Generation complete!',
        result: data.result || data.content || JSON.stringify(data),
      })

      return data.result || data.content || null
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          updateProgress({
            status: 'cancelled',
            progress: 0,
            message: 'Generation cancelled by user',
          })
          return null
        }

        updateProgress({
          status: 'error',
          progress: 0,
          message: 'Generation failed',
          error: err.message,
        })
      }
      return null
    } finally {
      isGeneratingRef.current = false
      abortControllerRef.current = null
    }
  }, [])

  const cancel = useCallback(() => {
    if (abortControllerRef.current && isGeneratingRef.current) {
      setStatus('cancelling')
      setMessage('Cancelling generation...')
      abortControllerRef.current.abort()
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setProgress(0)
    setMessage('')
    setResult(null)
    setError(null)
  }, [])

  return {
    // State
    status,
    progress,
    message,
    result,
    error,
    isGenerating: status === 'generating' || status === 'cancelling',

    // Actions
    generate,
    cancel,
    reset,
  }
}
