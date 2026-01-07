import type { Project } from '@/types/project'

interface SectionProps {
  project: Project
}

export function ScenesSection({ project }: SectionProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Scenes</h1>
      <p className="text-text-secondary mb-8">
        Build detailed scene blueprints with timeline and chapter views.
      </p>

      <div className="card">
        <p className="text-text-secondary">Scene timeline coming soon...</p>
      </div>
    </div>
  )
}
