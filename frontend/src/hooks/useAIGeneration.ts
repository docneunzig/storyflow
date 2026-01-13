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
  context?: Record<string, unknown>
  payload?: Record<string, unknown>
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

/**
 * Convert technical errors to user-friendly messages
 */
function getUserFriendlyError(err: Error): { message: string; error: string } {
  const errorMsg = err.message

  if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
    return {
      message: 'Connection lost',
      error: 'Unable to connect to the AI service. Please check your internet connection and try again.',
    }
  }
  if (errorMsg.includes('timeout') || errorMsg.includes('TIMEOUT')) {
    return {
      message: 'Request timed out',
      error: 'The AI service is taking longer than expected. Please try again in a moment.',
    }
  }
  if (errorMsg.includes('503') || errorMsg.includes('Service Unavailable')) {
    return {
      message: 'Service temporarily unavailable',
      error: 'The AI service is currently experiencing high demand. Please try again in a few minutes.',
    }
  }
  if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
    return {
      message: 'Authentication error',
      error: 'There was a problem with your session. Please refresh the page and try again.',
    }
  }
  if (errorMsg.includes('429') || errorMsg.includes('Too Many Requests')) {
    return {
      message: 'Rate limit reached',
      error: "You've made too many requests. Please wait a moment before trying again.",
    }
  }
  if (errorMsg.includes('500') || errorMsg.includes('Internal Server')) {
    return {
      message: 'Server error',
      error: 'Something went wrong on our end. Please try again in a moment.',
    }
  }

  return {
    message: 'Generation failed',
    error: errorMsg,
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
  // Track mounted state to prevent state updates after unmount (memory leak fix)
  const isMountedRef = useRef<boolean>(true)

  // Track mounted state and cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      // Cleanup EventSource
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      // Cleanup AbortController
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [])

  /**
   * Safely update progress state, only if component is still mounted
   */
  const updateProgressSafe = useCallback(
    (newProgress: AIGenerationProgress, onProgress?: (progress: AIGenerationProgress) => void) => {
      // Guard against state updates after unmount
      if (!isMountedRef.current) return

      setStatus(newProgress.status)
      setProgress(newProgress.progress)
      setMessage(newProgress.message)
      if (newProgress.result !== undefined) setResult(newProgress.result)
      if (newProgress.error !== undefined) setError(newProgress.error)
      onProgress?.(newProgress)
    },
    []
  )

  /**
   * Cleanup function for generation resources
   */
  const cleanupGeneration = useCallback(() => {
    isGeneratingRef.current = false
    abortControllerRef.current = null
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  const generate = useCallback(
    async (options: AIGenerationOptions): Promise<string | null> => {
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
      updateProgressSafe(
        {
          status: 'generating',
          progress: 0,
          message: 'Initializing AI generation...',
        },
        onProgress
      )
      setResult(null)
      setError(null)

      try {
        updateProgressSafe(
          {
            status: 'generating',
            progress: 5,
            message: `Starting ${action} generation...`,
          },
          onProgress
        )

        // Start the API call
        const response = await fetch('/api/ai/generate', {
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

        // Check if cancelled during fetch or component unmounted
        if (!isMountedRef.current) {
          return null
        }

        if (abortControllerRef.current?.signal.aborted) {
          updateProgressSafe(
            {
              status: 'cancelled',
              progress: 0,
              message: 'Generation cancelled',
            },
            onProgress
          )
          return null
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
        }

        const data = await response.json()

        // Check mounted again after async operation
        if (!isMountedRef.current) {
          return null
        }

        const generatedResult = data.result || data.content || null

        updateProgressSafe(
          {
            status: 'completed',
            progress: 100,
            message: 'Generation complete!',
            result: generatedResult || undefined,
          },
          onProgress
        )

        return generatedResult
      } catch (err) {
        // Don't update state if unmounted
        if (!isMountedRef.current) {
          return null
        }

        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            updateProgressSafe(
              {
                status: 'cancelled',
                progress: 0,
                message: 'Generation cancelled by user',
              },
              onProgress
            )
            return null
          }

          const { message: userMessage, error: userError } = getUserFriendlyError(err)

          updateProgressSafe(
            {
              status: 'error',
              progress: 0,
              message: userMessage,
              error: userError,
            },
            onProgress
          )
        }
        return null
      } finally {
        cleanupGeneration()
      }
    },
    [updateProgressSafe, cleanupGeneration]
  )

  // Streaming generate function - uses SSE for real-time updates
  const generateWithStreaming = useCallback(
    async (options: AIGenerationOptions): Promise<string | null> => {
      const { agentTarget, action, context, payload, onProgress } = options

      // Prevent concurrent generations
      if (isGeneratingRef.current) {
        console.warn('AI generation already in progress')
        return null
      }

      abortControllerRef.current = new AbortController()
      isGeneratingRef.current = true

      // Reset state
      updateProgressSafe(
        {
          status: 'generating',
          progress: 0,
          message: 'Initializing AI generation...',
        },
        onProgress
      )
      setResult(null)
      setError(null)

      return new Promise((resolve) => {
        // Start the API call to get generationId
        fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentTarget, action, context, payload }),
          signal: abortControllerRef.current!.signal,
        })
          .then(async (response) => {
            // Check if unmounted
            if (!isMountedRef.current) {
              resolve(null)
              return
            }

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}))
              throw new Error(errorData.message || `HTTP ${response.status}`)
            }
            return response.json()
          })
          .then((data) => {
            // Check if unmounted
            if (!isMountedRef.current || !data) {
              resolve(null)
              return
            }

            const { generationId, result: generatedResult } = data

            // If we got a result directly, use it
            if (generatedResult) {
              updateProgressSafe(
                {
                  status: 'completed',
                  progress: 100,
                  message: 'Generation complete!',
                  result: generatedResult,
                },
                onProgress
              )
              resolve(generatedResult)
              return
            }

            // Otherwise, connect to SSE for streaming updates
            if (generationId) {
              const eventSource = new EventSource(`/api/ai/stream/${generationId}`)
              eventSourceRef.current = eventSource

              eventSource.onmessage = (event) => {
                // Check if unmounted before processing
                if (!isMountedRef.current) {
                  eventSource.close()
                  resolve(null)
                  return
                }

                try {
                  const eventData = JSON.parse(event.data)

                  if (eventData.type === 'progress') {
                    updateProgressSafe(
                      {
                        status: mapStatus(eventData.status),
                        progress: eventData.progress || 0,
                        message: eventData.message || '',
                        result: eventData.result,
                        error: eventData.error,
                      },
                      onProgress
                    )

                    if (eventData.status === 'completed') {
                      eventSource.close()
                      eventSourceRef.current = null
                      resolve(eventData.result || null)
                    } else if (eventData.status === 'error' || eventData.status === 'cancelled') {
                      eventSource.close()
                      eventSourceRef.current = null
                      resolve(null)
                    }
                  }
                } catch (e) {
                  console.error('Error parsing SSE message:', e)
                }
              }

              eventSource.onerror = () => {
                eventSource.close()
                eventSourceRef.current = null

                // Only update state if still mounted
                if (isMountedRef.current) {
                  updateProgressSafe(
                    {
                      status: 'error',
                      progress: 0,
                      message: 'Connection lost',
                      error: 'Lost connection to the AI service.',
                    },
                    onProgress
                  )
                }
                resolve(null)
              }
            } else {
              resolve(null)
            }
          })
          .catch((err) => {
            // Only update state if still mounted
            if (!isMountedRef.current) {
              resolve(null)
              return
            }

            if (err.name === 'AbortError') {
              updateProgressSafe(
                {
                  status: 'cancelled',
                  progress: 0,
                  message: 'Generation cancelled by user',
                },
                onProgress
              )
            } else {
              const { message: userMessage, error: userError } = getUserFriendlyError(err)
              updateProgressSafe(
                {
                  status: 'error',
                  progress: 0,
                  message: userMessage,
                  error: userError,
                },
                onProgress
              )
            }
            resolve(null)
          })
          .finally(() => {
            cleanupGeneration()
          })
      })
    },
    [updateProgressSafe, cleanupGeneration]
  )

  const cancel = useCallback(() => {
    if (abortControllerRef.current && isGeneratingRef.current) {
      if (isMountedRef.current) {
        setStatus('cancelling')
        setMessage('Cancelling generation...')
      }
      abortControllerRef.current.abort()
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [])

  const reset = useCallback(() => {
    if (!isMountedRef.current) return
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
