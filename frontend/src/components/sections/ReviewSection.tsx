import type { Project } from '@/types/project'

interface SectionProps {
  project: Project
}

export function ReviewSection({ project }: SectionProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Review</h1>
      <p className="text-text-secondary mb-8">
        Critique and improve your manuscript to bestseller quality.
      </p>

      <div className="card">
        <p className="text-text-secondary">Review dashboard coming soon...</p>
      </div>
    </div>
  )
}
