import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import type { Project } from '@/types/project'

interface SectionProps {
  project: Project
}

function ErrorThrower() {
  throw new Error('Test error to verify Error Boundary is working')
}

export function ReviewSection({ project }: SectionProps) {
  const [shouldThrow, setShouldThrow] = useState(false)

  // Development-only error trigger for testing Error Boundary
  if (shouldThrow) {
    return <ErrorThrower />
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Review</h1>
      <p className="text-text-secondary mb-8">
        Critique and improve your manuscript to bestseller quality.
      </p>

      <div className="card">
        <p className="text-text-secondary">Review dashboard coming soon...</p>
      </div>

      {/* Development-only error testing button */}
      {import.meta.env.DEV && (
        <div className="mt-8 p-4 border border-warning/30 bg-warning/5 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium text-warning">Development Testing</span>
          </div>
          <p className="text-xs text-text-secondary mb-3">
            Click the button below to test the Error Boundary component.
          </p>
          <button
            onClick={() => setShouldThrow(true)}
            className="px-3 py-1.5 text-sm bg-error/10 text-error border border-error/30 rounded hover:bg-error/20 transition-colors"
          >
            Trigger Test Error
          </button>
        </div>
      )}
    </div>
  )
}
