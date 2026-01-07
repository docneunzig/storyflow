import type { Project } from '@/types/project'

interface SectionProps {
  project: Project
}

export function CharactersSection({ project }: SectionProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Characters</h1>
      <p className="text-text-secondary mb-8">
        Create deep, consistent, and compelling characters.
      </p>

      <div className="card">
        <p className="text-text-secondary">Character gallery coming soon...</p>
      </div>
    </div>
  )
}
