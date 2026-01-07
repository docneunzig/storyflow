import type { Project } from '@/types/project'

interface SectionProps {
  project: Project
}

export function MarketSection({ project }: SectionProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Market Analysis</h1>
      <p className="text-text-secondary mb-8">
        Position your novel competitively within its genre.
      </p>

      <div className="card">
        <p className="text-text-secondary">Market analysis coming soon...</p>
      </div>
    </div>
  )
}
