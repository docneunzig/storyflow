import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Info, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ConfirmDialogVariant = 'default' | 'destructive' | 'warning' | 'info'

export interface ConfirmDialogOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmDialogVariant
}

interface ConfirmDialogState extends ConfirmDialogOptions {
  isOpen: boolean
  resolve: ((value: boolean) => void) | null
}

// Singleton state and callbacks for the dialog
let dialogState: ConfirmDialogState = {
  isOpen: false,
  title: '',
  message: '',
  resolve: null,
}

let setDialogState: React.Dispatch<React.SetStateAction<ConfirmDialogState>> | null = null

/**
 * Show a confirmation dialog and return a promise that resolves to true if confirmed.
 * Usage:
 * ```
 * const confirmed = await showConfirmDialog({
 *   title: 'Delete Character',
 *   message: 'Are you sure you want to delete this character? This action cannot be undone.',
 *   variant: 'destructive',
 *   confirmLabel: 'Delete',
 * })
 * if (confirmed) { // proceed with deletion }
 * ```
 */
export function showConfirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (setDialogState) {
      setDialogState({
        isOpen: true,
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel || 'Confirm',
        cancelLabel: options.cancelLabel || 'Cancel',
        variant: options.variant || 'default',
        resolve,
      })
    } else {
      // Fallback if dialog not mounted - use native confirm
      resolve(window.confirm(`${options.title}\n\n${options.message}`))
    }
  })
}

const variantConfig: Record<
  ConfirmDialogVariant,
  { icon: typeof AlertTriangle; iconColor: string; bgColor: string; buttonClass: string }
> = {
  default: {
    icon: Info,
    iconColor: 'text-accent',
    bgColor: 'bg-accent/10',
    buttonClass: 'bg-accent text-white hover:bg-accent/90',
  },
  destructive: {
    icon: Trash2,
    iconColor: 'text-error',
    bgColor: 'bg-error/10',
    buttonClass: 'bg-error text-white hover:bg-error/90',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-warning',
    bgColor: 'bg-warning/10',
    buttonClass: 'bg-warning text-black hover:bg-warning/90',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    buttonClass: 'bg-blue-500 text-white hover:bg-blue-600',
  },
}

/**
 * ConfirmDialog component - must be mounted in your app tree (typically in App.tsx or layout).
 */
export function ConfirmDialog() {
  const [state, setState] = useState<ConfirmDialogState>(dialogState)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  // Register the setter for the singleton pattern
  useEffect(() => {
    setDialogState = setState
    return () => {
      setDialogState = null
    }
  }, [])

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!state.isOpen) return

    // Focus confirm button when dialog opens
    confirmButtonRef.current?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel()
      } else if (e.key === 'Tab') {
        // Simple focus trap between two buttons
        const focusable = [cancelButtonRef.current, confirmButtonRef.current].filter(Boolean)
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [state.isOpen])

  const handleConfirm = useCallback(() => {
    state.resolve?.(true)
    setState((s) => ({ ...s, isOpen: false, resolve: null }))
  }, [state.resolve])

  const handleCancel = useCallback(() => {
    state.resolve?.(false)
    setState((s) => ({ ...s, isOpen: false, resolve: null }))
  }, [state.resolve])

  if (!state.isOpen) return null

  const variant = state.variant || 'default'
  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <div className="fixed inset-0 z-overlay flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200"
        role="alertdialog"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        aria-modal="true"
      >
        {/* Close button */}
        <button
          onClick={handleCancel}
          className="absolute top-3 right-3 p-1 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-elevated transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border pr-10">
          <div className={cn('p-2 rounded-lg', config.bgColor)}>
            <Icon className={cn('h-6 w-6', config.iconColor)} aria-hidden="true" />
          </div>
          <h2 id="confirm-dialog-title" className="text-lg font-semibold text-text-primary">
            {state.title}
          </h2>
        </div>

        {/* Content */}
        <div className="p-4">
          <p id="confirm-dialog-description" className="text-text-secondary">
            {state.message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-border">
          <button
            ref={cancelButtonRef}
            onClick={handleCancel}
            className="flex-1 py-2 px-4 border border-border rounded-lg text-text-primary hover:bg-surface-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
          >
            {state.cancelLabel || 'Cancel'}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={handleConfirm}
            className={cn(
              'flex-1 py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface',
              config.buttonClass,
              variant === 'destructive' && 'focus:ring-error',
              variant === 'warning' && 'focus:ring-warning',
              variant === 'info' && 'focus:ring-blue-500',
              variant === 'default' && 'focus:ring-accent'
            )}
          >
            {state.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
