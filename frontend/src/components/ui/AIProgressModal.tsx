import { useEffect, useCallback } from 'react'
import { X, Sparkles, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
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
}: AIProgressModalProps) {
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
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex gap-3 justify-center">
          {status === 'generating' && (
            <button
              onClick={onCancel}
              className="px-6 py-2 bg-error/10 text-error border border-error/30 rounded-lg hover:bg-error/20 transition-colors font-medium"
              aria-label="Cancel AI generation"
            >
              Cancel Generation
            </button>
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
