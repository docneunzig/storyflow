import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, BookOpen, Trash2, Calendar } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/Toaster'
import {
  getAllProjects,
  createProject as dbCreateProject,
  deleteProject as dbDeleteProject,
  createEmptyProject,
} from '@/lib/db'

export function ProjectList() {
  const navigate = useNavigate()
  const { projects, setProjects, isLoading, setIsLoading } = useProjectStore()

  useEffect(() => {
    let isCancelled = false

    async function loadProjects() {
      setIsLoading(true)
      try {
        // Load from IndexedDB (local storage)
        const localProjects = await getAllProjects()
        // Check if component unmounted while loading
        if (isCancelled) return
        setProjects(localProjects)
      } catch (error) {
        // Check if component unmounted while loading
        if (isCancelled) return
        console.error('Failed to load projects:', error)
        toast({ title: 'Error', description: 'Failed to load projects', variant: 'error' })
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadProjects()

    return () => {
      isCancelled = true
    }
  }, [])

  async function createProject() {
    try {
      // Create project locally in IndexedDB
      const newProject = createEmptyProject('Untitled Novel')
      await dbCreateProject(newProject)
      navigate(`/projects/${newProject.id}/specification`)
      toast({ title: 'Success', description: 'Project created', variant: 'success' })
    } catch (error) {
      console.error('Failed to create project:', error)
      toast({ title: 'Error', description: 'Failed to create project', variant: 'error' })
    }
  }

  async function deleteProject(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return
    }

    try {
      // Delete from IndexedDB
      await dbDeleteProject(id)
      setProjects(projects.filter(p => p.id !== id))
      toast({ title: 'Success', description: 'Project deleted', variant: 'success' })
    } catch (error) {
      console.error('Failed to delete project:', error)
      toast({ title: 'Error', description: 'Failed to delete project', variant: 'error' })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto py-12 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Storyflow</h1>
            <p className="text-text-secondary mt-1">AI-Powered Novel Writing Assistant</p>
          </div>
          <button onClick={createProject} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Project
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-pulse text-text-secondary">Loading projects...</div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 text-text-secondary mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-xl font-semibold text-text-primary mb-2">No projects yet</h2>
            <p className="text-text-secondary mb-6">Create your first novel project to get started</p>
            <button onClick={createProject} className="btn-primary">
              Create Your First Novel
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="card-interactive flex items-center justify-between group"
              >
                <Link
                  to={`/projects/${project.id}/specification`}
                  className="flex-1 flex items-center gap-4"
                >
                  <BookOpen className="h-8 w-8 text-accent flex-shrink-0" aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold text-text-primary group-hover:text-accent transition-colors">
                      {project.metadata?.workingTitle || 'Untitled'}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-text-secondary mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" aria-hidden="true" />
                        {formatDate(project.updatedAt)}
                      </span>
                      <span className="capitalize">{project.metadata?.currentPhase || 'specification'}</span>
                      {project.statistics?.totalWords > 0 && (
                        <span>{project.statistics.totalWords.toLocaleString()} words</span>
                      )}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    deleteProject(project.id, project.metadata?.workingTitle || 'Untitled')
                  }}
                  className="p-2 text-text-secondary hover:text-error opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Delete project"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
