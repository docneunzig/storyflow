import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, BookOpen, Trash2, Calendar, Search, Library, ChevronDown, ChevronUp } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { formatDate, generateId } from '@/lib/utils'
import { toast } from '@/components/ui/Toaster'
import { ProjectCardSkeleton, ListSkeleton } from '@/components/ui/Skeleton'
import {
  getAllProjects,
  createProject as dbCreateProject,
  deleteProject as dbDeleteProject,
  createEmptyProject,
} from '@/lib/db'
import { SeriesManager } from '@/components/ui/SeriesManager'
import type { Series, CrossBookPromise } from '@/types/project'

export function ProjectList() {
  const navigate = useNavigate()
  const { projects, setProjects, isLoading, setIsLoading } = useProjectStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSeriesManager, setShowSeriesManager] = useState(false)
  const [series, setSeries] = useState<Series[]>([])

  // Series handlers
  const handleCreateSeries = useCallback((newSeries: Omit<Series, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const createdSeries: Series = {
      ...newSeries,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    setSeries(prev => [...prev, createdSeries])
    toast({ title: `Series "${newSeries.name}" created`, variant: 'success' })
  }, [])

  const handleUpdateSeries = useCallback((seriesId: string, updates: Partial<Series>) => {
    setSeries(prev => prev.map(s =>
      s.id === seriesId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
    ))
    toast({ title: 'Series updated', variant: 'success' })
  }, [])

  const handleDeleteSeries = useCallback((seriesId: string) => {
    const seriesName = series.find(s => s.id === seriesId)?.name
    setSeries(prev => prev.filter(s => s.id !== seriesId))
    toast({ title: `Series "${seriesName}" deleted`, variant: 'success' })
  }, [series])

  const handleAddBookToSeries = useCallback((seriesId: string, projectId: string) => {
    setSeries(prev => prev.map(s =>
      s.id === seriesId
        ? { ...s, projectIds: [...s.projectIds, projectId], updatedAt: new Date().toISOString() }
        : s
    ))
    toast({ title: 'Book added to series', variant: 'success' })
  }, [])

  const handleRemoveBookFromSeries = useCallback((seriesId: string, projectId: string) => {
    setSeries(prev => prev.map(s =>
      s.id === seriesId
        ? { ...s, projectIds: s.projectIds.filter(id => id !== projectId), updatedAt: new Date().toISOString() }
        : s
    ))
    toast({ title: 'Book removed from series', variant: 'success' })
  }, [])

  const handleUpdatePromise = useCallback((seriesId: string, promiseId: string, updates: Partial<CrossBookPromise>) => {
    setSeries(prev => prev.map(s =>
      s.id === seriesId
        ? {
            ...s,
            crossBookPromises: s.crossBookPromises.map(p =>
              p.id === promiseId ? { ...p, ...updates } : p
            ),
            updatedAt: new Date().toISOString()
          }
        : s
    ))
    toast({ title: 'Promise updated', variant: 'success' })
  }, [])

  // Filter projects by search query
  const filteredProjects = projects.filter(project => {
    if (!searchQuery.trim()) return true
    const title = project.metadata?.workingTitle || 'Untitled'
    return title.toLowerCase().includes(searchQuery.toLowerCase())
  })

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

        {/* Series Manager Toggle */}
        <div className="mb-6">
          <button
            onClick={() => setShowSeriesManager(!showSeriesManager)}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg hover:bg-surface-elevated transition-colors text-text-primary"
          >
            <Library className="h-4 w-4 text-purple-400" aria-hidden="true" />
            <span className="font-medium">Series Manager</span>
            {series.length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full">
                {series.length}
              </span>
            )}
            {showSeriesManager ? (
              <ChevronUp className="h-4 w-4 text-text-secondary ml-auto" />
            ) : (
              <ChevronDown className="h-4 w-4 text-text-secondary ml-auto" />
            )}
          </button>
        </div>

        {/* Series Manager Panel */}
        {showSeriesManager && (
          <div className="mb-8 border border-border rounded-xl bg-surface overflow-hidden">
            <SeriesManager
              series={series}
              projects={projects}
              onCreateSeries={handleCreateSeries}
              onUpdateSeries={handleUpdateSeries}
              onDeleteSeries={handleDeleteSeries}
              onAddBookToSeries={handleAddBookToSeries}
              onRemoveBookFromSeries={handleRemoveBookFromSeries}
              onUpdatePromise={handleUpdatePromise}
            />
          </div>
        )}

        {/* Search Bar - shown when there are projects */}
        {projects.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              aria-label="Search projects"
            />
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4">
            <ListSkeleton count={4}>
              <ProjectCardSkeleton />
            </ListSkeleton>
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
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-12 w-12 text-text-secondary mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-text-primary mb-2">No matching projects</h2>
            <p className="text-text-secondary">Try a different search term</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProjects.map((project) => (
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
                      {project.statistics && project.statistics.totalWords && project.statistics.totalWords > 0 && (
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
