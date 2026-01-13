import { useEffect, useCallback, useState, useRef } from 'react'
import { X, Sparkles, Loader2, CheckCircle, XCircle, AlertCircle, Check, Clock } from 'lucide-react'
import type { AIGenerationStatus } from '@/hooks/useAIGeneration'

interface AIProgressModalProps {
  isOpen: boolean
  onClose: () => void
  onCancel: () => void
  status: AIGenerationStatus
  progress: number
  message: string
  error?: string | null
  title?: string
  onSkipToFinal?: () => void // Optional callback for "Skip to Final" during auto-improve
}

// Format elapsed time as MM:SS
function formatElapsedTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function AIProgressModal({
  isOpen,
  onClose,
  onCancel,
  status,
  progress,
  message,
  error,
  title = 'AI Generation',
  onSkipToFinal,
}: AIProgressModalProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number | null>(null)

  // Track elapsed time when generating
  useEffect(() => {
    if (status === 'generating' && isOpen) {
      // Start timer
      startTimeRef.current = Date.now()
      setElapsedTime(0)
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
        }
      }, 1000)
    } else {
      // Stop timer when not generating
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [status, isOpen])

  // Reset elapsed time when modal closes
  useEffect(() => {
    if (!isOpen) {
      setElapsedTime(0)
      startTimeRef.current = null
    }
  }, [isOpen])

  // Handle Escape key to close (only when not generating)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (status === 'generating') {
          // If generating, cancel instead of close
          onCancel()
        } else {
          onClose()
        }
      }
    },
    [status, onCancel, onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const isActive = status === 'generating' || status === 'cancelling'
  const canClose = !isActive

  const getStatusIcon = () => {
    switch (status) {
      case 'generating':
        return <Loader2 className="h-8 w-8 text-accent animate-spin" aria-hidden="true" />
      case 'cancelling':
        return <Loader2 className="h-8 w-8 text-warning animate-spin" aria-hidden="true" />
      case 'completed':
        return <CheckCircle className="h-8 w-8 text-success" aria-hidden="true" />
      case 'cancelled':
        return <XCircle className="h-8 w-8 text-warning" aria-hidden="true" />
      case 'error':
        return <AlertCircle className="h-8 w-8 text-error" aria-hidden="true" />
      default:
        return <Sparkles className="h-8 w-8 text-accent" aria-hidden="true" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'generating':
        return 'bg-accent'
      case 'cancelling':
        return 'bg-warning'
      case 'completed':
        return 'bg-success'
      case 'cancelled':
        return 'bg-warning'
      case 'error':
        return 'bg-error'
      default:
        return 'bg-accent'
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-progress-title"
    >
      {/* Backdrop - click to close only when not active */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={canClose ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
            <h2 id="ai-progress-title" className="text-lg font-semibold text-text-primary">
              {title}
            </h2>
          </div>
          {canClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-text-secondary" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col items-center text-center">
            {/* Status Icon */}
            <div className="mb-4">{getStatusIcon()}</div>

            {/* Status Message */}
            <p className="text-text-primary font-medium mb-2">{message}</p>

            {/* Error message if present */}
            {error && status === 'error' && (
              <p className="text-sm text-error mb-4 max-w-full break-words">{error}</p>
            )}

            {/* Progress Bar */}
            {isActive && (
              <div className="w-full mt-4">
                <div className="flex justify-between text-xs text-text-secondary mb-1">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-surface-elevated rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getStatusColor()} transition-all duration-500 ease-out`}
                    style={{ width: `${progress}%` }}
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                {/* Elapsed time */}
                <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-text-secondary">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  <span>Elapsed: {formatElapsedTime(elapsedTime)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex gap-3 justify-center">
          {status === 'generating' && (
            <>
              {onSkipToFinal && (
                <button
                  onClick={onSkipToFinal}
                  className="px-6 py-2 bg-success/10 text-success border border-success/30 rounded-lg hover:bg-success/20 transition-colors font-medium flex items-center gap-2"
                  aria-label="Skip to final and accept current state"
                >
                  <Check className="h-4 w-4" />
                  Skip to Final
                </button>
              )}
              <button
                onClick={onCancel}
                className="px-6 py-2 bg-error/10 text-error border border-error/30 rounded-lg hover:bg-error/20 transition-colors font-medium"
                aria-label="Cancel AI generation"
              >
                Cancel Generation
              </button>
            </>
          )}

          {status === 'cancelling' && (
            <button
              disabled
              className="px-6 py-2 bg-warning/10 text-warning border border-warning/30 rounded-lg opacity-50 cursor-not-allowed font-medium"
            >
              Cancelling...
            </button>
          )}

          {(status === 'completed' || status === 'cancelled' || status === 'error') && (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium"
            >
              {status === 'completed' ? 'Done' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
