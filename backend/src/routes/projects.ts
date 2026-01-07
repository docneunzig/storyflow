import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import type { Project, ProjectMetadata } from '../types/project.js'

const router = Router()

// In-memory storage (will be replaced with IndexedDB on frontend)
// This is a minimal backend for API structure - real data lives in browser IndexedDB
const projects = new Map<string, Project>()

// GET /api/projects - List all projects
router.get('/', (req, res) => {
  const projectList = Array.from(projects.values())
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  res.json(projectList)
})

// POST /api/projects - Create new project
router.post('/', (req, res) => {
  const { metadata } = req.body

  const now = new Date().toISOString()
  const project: Project = {
    id: uuidv4(),
    version: 1,
    metadata: {
      workingTitle: metadata?.workingTitle || 'Untitled Novel',
      authorName: metadata?.authorName || '',
      createdAt: now,
      lastModified: now,
      currentPhase: metadata?.currentPhase || 'specification',
    },
    specification: null,
    plot: null,
    characters: [],
    scenes: [],
    chapters: [],
    worldbuilding: null,
    relationships: [],
    revisions: [],
    qualityScores: [],
    statistics: null,
    marketAnalysis: null,
    createdAt: now,
    updatedAt: now,
    lastExportedAt: null,
  }

  projects.set(project.id, project)
  res.status(201).json(project)
})

// GET /api/projects/:id - Get project by ID
router.get('/:id', (req, res) => {
  const project = projects.get(req.params.id)
  if (!project) {
    return res.status(404).json({ error: 'Project not found' })
  }
  res.json(project)
})

// PUT /api/projects/:id - Update project
router.put('/:id', (req, res) => {
  const existing = projects.get(req.params.id)
  if (!existing) {
    return res.status(404).json({ error: 'Project not found' })
  }

  const updated: Project = {
    ...existing,
    ...req.body,
    id: existing.id, // Preserve ID
    updatedAt: new Date().toISOString(),
    metadata: {
      ...existing.metadata,
      ...req.body.metadata,
      lastModified: new Date().toISOString(),
    },
  }

  projects.set(updated.id, updated)
  res.json(updated)
})

// DELETE /api/projects/:id - Delete project
router.delete('/:id', (req, res) => {
  const exists = projects.has(req.params.id)
  if (!exists) {
    return res.status(404).json({ error: 'Project not found' })
  }

  projects.delete(req.params.id)
  res.status(204).send()
})

// POST /api/projects/:id/export - Export project
router.post('/:id/export', (req, res) => {
  const project = projects.get(req.params.id)
  if (!project) {
    return res.status(404).json({ error: 'Project not found' })
  }

  const { format = 'json' } = req.body

  // Update last exported timestamp
  project.lastExportedAt = new Date().toISOString()
  projects.set(project.id, project)

  if (format === 'json') {
    res.json(project)
  } else {
    // Other formats (docx, md) will be implemented
    res.json({ message: `Export as ${format} coming soon`, project })
  }
})

// POST /api/projects/import - Import project from JSON
router.post('/import', (req, res) => {
  try {
    const importedProject = req.body as Project
    const now = new Date().toISOString()

    const project: Project = {
      ...importedProject,
      id: uuidv4(), // Generate new ID
      createdAt: now,
      updatedAt: now,
      metadata: {
        ...importedProject.metadata,
        createdAt: now,
        lastModified: now,
      },
    }

    projects.set(project.id, project)
    res.status(201).json(project)
  } catch (error) {
    res.status(400).json({ error: 'Invalid project data' })
  }
})

export { router as projectsRouter }
