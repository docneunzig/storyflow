import type { Project } from '@/types/project'

interface SectionProps {
  project: Project
}

export function StatsSection({ project }: SectionProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Statistics</h1>
      <p className="text-text-secondary mb-8">
        Track your writing progress and maintain motivation.
      </p>

      <div className="card">
        <p className="text-text-secondary">Statistics dashboard coming soon...</p>
      </div>
    </div>
  )
}
