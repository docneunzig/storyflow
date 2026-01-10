import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProjectStore } from '@/stores/projectStore'
import { Loader2, AlertCircle, Home } from 'lucide-react'
import { getProject } from '@/lib/db'

// Section component imports (stubs for now)
import { SpecificationSection } from '@/components/sections/SpecificationSection'
import { BrainstormSection } from '@/components/sections/BrainstormSection'
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
    let isCancelled = false

    async function loadProject(id: string) {
      setIsLoading(true)
      setError(null)
      try {
        // Load from IndexedDB (local storage)
        const project = await getProject(id)
        // Check if navigation happened while loading
        if (isCancelled) return
        if (project) {
          setCurrentProject(project)
        } else {
          setError('Project not found')
        }
      } catch (error) {
        // Check if navigation happened while loading
        if (isCancelled) return
        console.error('Failed to load project:', error)
        setError('Failed to load project')
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    if (projectId && (!currentProject || currentProject.id !== projectId)) {
      loadProject(projectId)
    }

    return () => {
      isCancelled = true
    }
  }, [projectId])

  const { error } = useProjectStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-accent animate-spin" />
      </div>
    )
  }

  if (error || !currentProject) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-error" />
        <h2 className="text-xl font-semibold text-text-primary">Project Not Found</h2>
        <p className="text-text-secondary text-center max-w-md">
          {error || "The project you're looking for doesn't exist or may have been deleted."}
        </p>
        <Link
          to="/"
          className="btn-primary flex items-center gap-2 mt-4"
        >
          <Home className="h-4 w-4" />
          Go to Projects
        </Link>
      </div>
    )
  }

  // Render the appropriate section based on the route
  switch (section) {
    case 'specification':
      return <SpecificationSection project={currentProject} />
    case 'brainstorm':
      return <BrainstormSection project={currentProject} />
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
