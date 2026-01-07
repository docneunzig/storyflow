import type { Project } from '@/types/project'

interface SectionProps {
  project: Project
}

export function WikiSection({ project }: SectionProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Worldbuilding Wiki</h1>
      <p className="text-text-secondary mb-8">
        Maintain internal consistency with organized worldbuilding details.
      </p>

      <div className="card">
        <p className="text-text-secondary">Wiki browser coming soon...</p>
      </div>
    </div>
  )
}
