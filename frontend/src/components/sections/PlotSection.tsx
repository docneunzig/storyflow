import type { Project } from '@/types/project'

interface SectionProps {
  project: Project
}

export function PlotSection({ project }: SectionProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Plot Development</h1>
      <p className="text-text-secondary mb-8">
        Transform your story seed into a fully structured plot.
      </p>

      <div className="card">
        <p className="text-text-secondary">Plot canvas coming soon...</p>
      </div>
    </div>
  )
}
