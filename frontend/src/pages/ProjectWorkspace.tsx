import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useProjectStore } from '@/stores/projectStore'
import { Loader2 } from 'lucide-react'

// Section component imports (stubs for now)
import { SpecificationSection } from '@/components/sections/SpecificationSection'
import { PlotSection } from '@/components/sections/PlotSection'
import { CharactersSection } from '@/components/sections/CharactersSection'
import { ScenesSection } from '@/components/sections/ScenesSection'
import { WriteSection } from '@/components/sections/WriteSection'
import { ReviewSection } from '@/components/sections/ReviewSection'
import { ExportSection } from '@/components/sections/ExportSection'
import { WikiSection } from '@/components/sections/WikiSection'
import { StatsSection } from '@/components/sections/StatsSection'
import { MarketSection } from '@/components/sections/MarketSection'

interface ProjectWorkspaceProps {
  section: string
}

export function ProjectWorkspace({ section }: ProjectWorkspaceProps) {
  const { projectId } = useParams<{ projectId: string }>()
  const { currentProject, setCurrentProject, isLoading, setIsLoading, setError } = useProjectStore()

  useEffect(() => {
    if (projectId && (!currentProject || currentProject.id !== projectId)) {
      loadProject(projectId)
    }
  }, [projectId])

  async function loadProject(id: string) {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/projects/${id}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentProject(data)
      } else if (response.status === 404) {
        setError('Project not found')
      } else {
        setError('Failed to load project')
      }
    } catch (error) {
      console.error('Failed to load project:', error)
      setError('Failed to load project')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-accent animate-spin" />
      </div>
    )
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary">Loading project...</p>
      </div>
    )
  }

  // Render the appropriate section based on the route
  switch (section) {
    case 'specification':
      return <SpecificationSection project={currentProject} />
    case 'plot':
      return <PlotSection project={currentProject} />
    case 'characters':
    case 'character-detail':
      return <CharactersSection project={currentProject} />
    case 'scenes':
    case 'scene-detail':
      return <ScenesSection project={currentProject} />
    case 'write':
    case 'chapter-editor':
      return <WriteSection project={currentProject} />
    case 'review':
      return <ReviewSection project={currentProject} />
    case 'export':
      return <ExportSection project={currentProject} />
    case 'wiki':
    case 'wiki-category':
      return <WikiSection project={currentProject} />
    case 'stats':
      return <StatsSection project={currentProject} />
    case 'market':
      return <MarketSection project={currentProject} />
    default:
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-text-secondary">Section not found</p>
        </div>
      )
  }
}
