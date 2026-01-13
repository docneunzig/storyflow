import { useState, useEffect, useCallback } from 'react'
import { X, History, RotateCcw, Trash2, Calendar, FileText, AlertTriangle, Loader2 } from 'lucide-react'
import { getBackupsForProject, restoreFromBackup, deleteBackup, type ProjectBackup } from '@/lib/db'
import { useProjectStore } from '@/stores/projectStore'
import { toast } from '@/components/ui/Toaster'
import { showConfirmDialog } from '@/components/ui/ConfirmDialog'

interface VersionHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  return date.toLocaleDateString()
}

// Format full date
function formatFullDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString()
}

export function VersionHistoryModal({ isOpen, onClose, projectId }: VersionHistoryModalProps) {
  const [backups, setBackups] = useState<ProjectBackup[]>([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [selectedBackup, setSelectedBackup] = useState<ProjectBackup | null>(null)
  const { setCurrentProject } = useProjectStore()

  // Load backups when modal opens
  useEffect(() => {
    if (isOpen && projectId) {
      loadBackups()
    }
  }, [isOpen, projectId])

  const loadBackups = async () => {
    setLoading(true)
    try {
      const projectBackups = await getBackupsForProject(projectId)
      setBackups(projectBackups)
    } catch (error) {
      console.error('Failed to load backups:', error)
      toast({ title: 'Failed to load version history', variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Handle Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedBackup) {
          setSelectedBackup(null)
        } else {
          onClose()
        }
      }
    },
    [onClose, selectedBackup]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  const handleRestore = async (backup: ProjectBackup) => {
    const confirmed = await showConfirmDialog({
      title: 'Restore Version',
      message: `This will restore your project to the state from ${formatFullDate(backup.timestamp)}. Your current work will be overwritten. Are you sure?`,
      confirmLabel: 'Restore',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    })

    if (!confirmed) return

    setRestoring(backup.id)
    try {
      const restoredProject = await restoreFromBackup(backup.id)
      if (restoredProject) {
        setCurrentProject(restoredProject)
        toast({
          title: 'Version restored',
          description: `Project restored to ${formatRelativeTime(backup.timestamp)}`,
          variant: 'success'
        })
        onClose()
      }
    } catch (error) {
      console.error('Failed to restore backup:', error)
      toast({ title: 'Failed to restore version', variant: 'error' })
    } finally {
      setRestoring(null)
    }
  }

  const handleDelete = async (backup: ProjectBackup) => {
    const confirmed = await showConfirmDialog({
      title: 'Delete Version',
      message: `Delete the backup from ${formatFullDate(backup.timestamp)}? This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    })

    if (!confirmed) return

    try {
      await deleteBackup(backup.id)
      setBackups(backups.filter(b => b.id !== backup.id))
      if (selectedBackup?.id === backup.id) {
        setSelectedBackup(null)
      }
      toast({ title: 'Version deleted', variant: 'success' })
    } catch (error) {
      console.error('Failed to delete backup:', error)
      toast({ title: 'Failed to delete version', variant: 'error' })
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-history-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-3xl mx-4 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-accent" aria-hidden="true" />
            <h2 id="version-history-title" className="text-lg font-semibold text-text-primary">
              Version History
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-text-secondary" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Backup List */}
          <div className={`${selectedBackup ? 'w-1/2 border-r border-border' : 'w-full'} overflow-y-auto p-4`}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-accent animate-spin" />
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-12">
                <History className="h-12 w-12 text-text-secondary mx-auto mb-4" />
                <h3 className="text-lg font-medium text-text-primary mb-2">No versions yet</h3>
                <p className="text-text-secondary text-sm">
                  Versions are automatically saved when you make significant changes to your project.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-text-secondary mb-4">
                  {backups.length} version{backups.length !== 1 ? 's' : ''} available
                </p>
                {backups.map((backup) => (
                  <div
                    key={backup.id}
                    onClick={() => setSelectedBackup(backup)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedBackup?.id === backup.id
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50 hover:bg-surface-elevated'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-elevated flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">
                            {formatRelativeTime(backup.timestamp)}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {formatFullDate(backup.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-text-secondary">
                          {formatFileSize(backup.sizeBytes)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Backup Details */}
          {selectedBackup && (
            <div className="w-1/2 overflow-y-auto p-4">
              <h3 className="font-semibold text-text-primary mb-4">Version Details</h3>

              <div className="space-y-4">
                {/* Date */}
                <div>
                  <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Date</p>
                  <p className="text-text-primary">{formatFullDate(selectedBackup.timestamp)}</p>
                </div>

                {/* Size */}
                <div>
                  <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Size</p>
                  <p className="text-text-primary">{formatFileSize(selectedBackup.sizeBytes)}</p>
                </div>

                {/* Content Summary */}
                <div>
                  <p className="text-xs text-text-secondary uppercase tracking-wider mb-1">Content</p>
                  <div className="bg-surface-elevated rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Chapters:</span>
                      <span className="text-text-primary">{selectedBackup.projectData.chapters?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Scenes:</span>
                      <span className="text-text-primary">{selectedBackup.projectData.scenes?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Characters:</span>
                      <span className="text-text-primary">{selectedBackup.projectData.characters?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Plot Beats:</span>
                      <span className="text-text-primary">{selectedBackup.projectData.plot?.beats?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Total Words:</span>
                      <span className="text-text-primary">
                        {selectedBackup.projectData.chapters?.reduce((sum, ch) => sum + (ch.wordCount || 0), 0).toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-warning/10 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-warning">
                    Restoring this version will overwrite your current project data.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleRestore(selectedBackup)}
                    disabled={restoring === selectedBackup.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {restoring === selectedBackup.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    Restore
                  </button>
                  <button
                    onClick={() => handleDelete(selectedBackup)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-error/10 text-error border border-error/30 rounded-lg hover:bg-error/20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-between items-center">
          <p className="text-xs text-text-secondary">
            <FileText className="h-3 w-3 inline mr-1" />
            Up to 5 versions are kept automatically
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
