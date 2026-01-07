import type { Project } from '@/types/project'

interface SectionProps {
  project: Project
}

export function WriteSection({ project }: SectionProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Write</h1>
      <p className="text-text-secondary mb-8">
        Generate your manuscript with AI assistance.
      </p>

      <div className="card">
        <p className="text-text-secondary">Writing editor coming soon...</p>
      </div>
    </div>
  )
}
