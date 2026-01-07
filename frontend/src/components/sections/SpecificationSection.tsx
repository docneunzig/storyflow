import type { Project } from '@/types/project'

interface SectionProps {
  project: Project
}

export function SpecificationSection({ project }: SectionProps) {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Novel Specification</h1>
      <p className="text-text-secondary mb-8">
        Define all parameters that shape your novel before writing begins.
      </p>

      {/* Specification form will be implemented here */}
      <div className="card">
        <p className="text-text-secondary">Specification form coming soon...</p>
        <p className="text-sm text-text-secondary mt-2">
          Project: {project.metadata?.workingTitle || 'Untitled'}
        </p>
      </div>
    </div>
  )
}
