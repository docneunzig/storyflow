import type { Project } from '@/types/project'

interface SectionProps {
  project: Project
}

export function ExportSection({ project }: SectionProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Export</h1>
      <p className="text-text-secondary mb-8">
        Export your manuscript in professional formats.
      </p>

      <div className="card">
        <p className="text-text-secondary">Export options coming soon...</p>
      </div>
    </div>
  )
}
