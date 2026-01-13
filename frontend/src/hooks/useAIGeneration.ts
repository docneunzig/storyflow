import { useState, useCallback, useRef, useEffect } from 'react'

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
  useStreaming?: boolean // Enable SSE streaming for real-time progress
}

// Map backend status to frontend status
function mapStatus(backendStatus: string): AIGenerationStatus {
  switch (backendStatus) {
    case 'initializing':
    case 'analyzing':
    case 'generating':
    case 'processing':
      return 'generating'
    case 'completed':
      return 'completed'
    case 'error':
      return 'error'
    case 'cancelled':
      return 'cancelled'
    default:
      return 'generating'
  }
}

export function useAIGeneration() {
  const [status, setStatus] = useState<AIGenerationStatus>('idle')
  const [progress, setProgress] = useState<number>(0)
  const [message, setMessage] = useState<string>('')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const isGeneratingRef = useRef<boolean>(false)

  // Clean up EventSource on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

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
        progress: 5,
        message: `Starting ${action} generation...`,
      })

      // Start the API call
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

      // Wait for initial response to get generationId
      const response = await fetchPromise

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

      // If streaming is enabled and we have a generationId, the SSE would have been
      // updating us in real-time. Since the generate endpoint returns synchronously
      // after completion, we can just use the result directly.
      const generatedResult = data.result || data.content || null

      updateProgress({
        status: 'completed',
        progress: 100,
        message: 'Generation complete!',
        result: generatedResult || undefined,
      })

      return generatedResult
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

        // Convert technical errors to user-friendly messages
        let userMessage = 'Generation failed'
        let userError = err.message

        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          userMessage = 'Connection lost'
          userError = 'Unable to connect to the AI service. Please check your internet connection and try again.'
        } else if (err.message.includes('timeout') || err.message.includes('TIMEOUT')) {
          userMessage = 'Request timed out'
          userError = 'The AI service is taking longer than expected. Please try again in a moment.'
        } else if (err.message.includes('503') || err.message.includes('Service Unavailable')) {
          userMessage = 'Service temporarily unavailable'
          userError = 'The AI service is currently experiencing high demand. Please try again in a few minutes.'
        } else if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          userMessage = 'Authentication error'
          userError = 'There was a problem with your session. Please refresh the page and try again.'
        } else if (err.message.includes('429') || err.message.includes('Too Many Requests')) {
          userMessage = 'Rate limit reached'
          userError = 'You\'ve made too many requests. Please wait a moment before trying again.'
        } else if (err.message.includes('500') || err.message.includes('Internal Server')) {
          userMessage = 'Server error'
          userError = 'Something went wrong on our end. Please try again in a moment.'
        }

        updateProgress({
          status: 'error',
          progress: 0,
          message: userMessage,
          error: userError,
        })
      }
      return null
    } finally {
      isGeneratingRef.current = false
      abortControllerRef.current = null
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [])

  // Streaming generate function - uses SSE for real-time updates
  const generateWithStreaming = useCallback(async (options: AIGenerationOptions): Promise<string | null> => {
    const { agentTarget, action, context, payload, onProgress } = options

    // Prevent concurrent generations
    if (isGeneratingRef.current) {
      console.warn('AI generation already in progress')
      return null
    }

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

    return new Promise((resolve) => {
      // Start the API call to get generationId
      fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentTarget, action, context, payload }),
        signal: abortControllerRef.current!.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `HTTP ${response.status}`)
          }
          return response.json()
        })
        .then((data) => {
          const { generationId, result: generatedResult } = data

          // If we got a result directly, use it
          if (generatedResult) {
            updateProgress({
              status: 'completed',
              progress: 100,
              message: 'Generation complete!',
              result: generatedResult,
            })
            resolve(generatedResult)
            return
          }

          // Otherwise, connect to SSE for streaming updates
          if (generationId) {
            const eventSource = new EventSource(`/api/ai/stream/${generationId}`)
            eventSourceRef.current = eventSource

            eventSource.onmessage = (event) => {
              try {
                const data = JSON.parse(event.data)

                if (data.type === 'progress') {
                  updateProgress({
                    status: mapStatus(data.status),
                    progress: data.progress || 0,
                    message: data.message || '',
                    result: data.result,
                    error: data.error,
                  })

                  if (data.status === 'completed') {
                    eventSource.close()
                    resolve(data.result || null)
                  } else if (data.status === 'error' || data.status === 'cancelled') {
                    eventSource.close()
                    resolve(null)
                  }
                }
              } catch (e) {
                console.error('Error parsing SSE message:', e)
              }
            }

            eventSource.onerror = () => {
              eventSource.close()
              updateProgress({
                status: 'error',
                progress: 0,
                message: 'Connection lost',
                error: 'Lost connection to the AI service.',
              })
              resolve(null)
            }
          } else {
            resolve(null)
          }
        })
        .catch((err) => {
          if (err.name === 'AbortError') {
            updateProgress({
              status: 'cancelled',
              progress: 0,
              message: 'Generation cancelled by user',
            })
          } else {
            updateProgress({
              status: 'error',
              progress: 0,
              message: 'Generation failed',
              error: err.message,
            })
          }
          resolve(null)
        })
        .finally(() => {
          isGeneratingRef.current = false
          abortControllerRef.current = null
        })
    })
  }, [])

  const cancel = useCallback(() => {
    if (abortControllerRef.current && isGeneratingRef.current) {
      setStatus('cancelling')
      setMessage('Cancelling generation...')
      abortControllerRef.current.abort()
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
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
    generateWithStreaming,
    cancel,
    reset,
  }
}
