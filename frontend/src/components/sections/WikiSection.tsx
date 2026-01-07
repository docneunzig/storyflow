import { BookOpen } from 'lucide-react'
import type { Project } from '@/types/project'

interface SectionProps {
  project: Project
}

export function WikiSection({ project }: SectionProps) {
  const wikiEntries = project.worldbuildingEntries || []

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Worldbuilding Wiki</h1>
      <p className="text-text-secondary mb-8">
        Maintain internal consistency with organized worldbuilding details.
      </p>

      {wikiEntries.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="h-12 w-12 text-text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No wiki entries yet</h3>
          <p className="text-text-secondary mb-4">
            Start building your world by documenting locations, items, and lore.
          </p>
        </div>
      ) : (
        <div className="card">
          <p className="text-text-secondary">Wiki browser coming soon...</p>
        </div>
      )}
    </div>
  )
}
