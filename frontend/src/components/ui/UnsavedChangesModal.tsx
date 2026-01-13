import { AlertTriangle } from 'lucide-react'
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning'

export function UnsavedChangesModal() {
  const { isBlocked, confirmNavigation, cancelNavigation } = useUnsavedChangesWarning()

  if (!isBlocked) return null

  return (
    <div className="fixed inset-0 z-overlay flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={cancelNavigation}
      />

      {/* Modal */}
      <div
        className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200"
        role="alertdialog"
        aria-labelledby="unsaved-changes-title"
        aria-describedby="unsaved-changes-description"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="p-2 bg-warning/10 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-warning" aria-hidden="true" />
          </div>
          <h2 id="unsaved-changes-title" className="text-lg font-semibold text-text-primary">
            Unsaved Changes
          </h2>
        </div>

        {/* Content */}
        <div className="p-4">
          <p id="unsaved-changes-description" className="text-text-secondary">
            You have unsaved changes that will be lost if you navigate away.
            Would you like to save your changes first?
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-border">
          <button
            onClick={cancelNavigation}
            className="flex-1 py-2 px-4 border border-border rounded-lg text-text-primary hover:bg-surface-elevated transition-colors"
          >
            Stay on Page
          </button>
          <button
            onClick={confirmNavigation}
            className="flex-1 py-2 px-4 bg-error text-white rounded-lg hover:bg-error/90 transition-colors"
          >
            Leave Without Saving
          </button>
        </div>
      </div>
    </div>
  )
}
