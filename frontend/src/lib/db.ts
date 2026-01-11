import Dexie, { type Table } from 'dexie'
import type { Project } from '@/types/project'

// Backup entry type
export interface ProjectBackup {
  id: string
  projectId: string
  projectTitle: string
  timestamp: string
  projectData: Project
  sizeBytes: number
}

// Define the database schema
export class StoryflowDatabase extends Dexie {
  projects!: Table<Project, string>
  backups!: Table<ProjectBackup, string>

  constructor() {
    super('storyflow')

    // Define the schema - version 2 adds backups table
    this.version(1).stores({
      // Primary key is 'id', indexed fields follow
      projects: 'id, metadata.workingTitle, updatedAt, createdAt',
    })

    this.version(2).stores({
      projects: 'id, metadata.workingTitle, updatedAt, createdAt',
      backups: 'id, projectId, timestamp, projectTitle',
    })
  }
}

// Create a singleton instance
export const db = new StoryflowDatabase()

// Helper functions for project operations
export async function getAllProjects(): Promise<Project[]> {
  return db.projects.orderBy('updatedAt').reverse().toArray()
}

export async function getProject(id: string): Promise<Project | undefined> {
  return db.projects.get(id)
}

export async function createProject(project: Project): Promise<string> {
  return db.projects.add(project)
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<number> {
  // Get the current project before updating for backup
  const currentProject = await db.projects.get(id)

  // Update the project
  const result = await db.projects.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  })

  // Create a backup of the current state (before changes) periodically
  // Only backup if there was significant change (content change) to avoid too many backups
  if (currentProject && (updates.chapters || updates.scenes || updates.characters || updates.plot)) {
    try {
      await createBackup(currentProject)
      // Clean up old backups, keeping only the last 5
      await cleanupOldBackups(id, 5)
    } catch (error) {
      // Backup failure shouldn't block the save
      console.warn('Failed to create backup:', error)
    }
  }

  return result
}

export async function deleteProject(id: string): Promise<void> {
  return db.projects.delete(id)
}

// Generate a unique ID for new projects
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

// Backup helper functions
export async function createBackup(project: Project): Promise<string> {
  const backup: ProjectBackup = {
    id: generateId(),
    projectId: project.id,
    projectTitle: project.metadata.workingTitle,
    timestamp: new Date().toISOString(),
    projectData: { ...project },
    sizeBytes: new Blob([JSON.stringify(project)]).size,
  }
  return db.backups.add(backup)
}

export async function getBackupsForProject(projectId: string): Promise<ProjectBackup[]> {
  return db.backups
    .where('projectId')
    .equals(projectId)
    .reverse()
    .sortBy('timestamp')
}

export async function getAllBackups(): Promise<ProjectBackup[]> {
  return db.backups.orderBy('timestamp').reverse().toArray()
}

export async function deleteBackup(backupId: string): Promise<void> {
  return db.backups.delete(backupId)
}

export async function restoreFromBackup(backupId: string): Promise<Project | null> {
  const backup = await db.backups.get(backupId)
  if (!backup) return null

  // Update the project with the backup data
  await db.projects.put({
    ...backup.projectData,
    updatedAt: new Date().toISOString(),
  })

  return backup.projectData
}

// Keep only the last N backups for a project (default 5)
export async function cleanupOldBackups(projectId: string, keepCount: number = 5): Promise<number> {
  const backups = await getBackupsForProject(projectId)
  if (backups.length <= keepCount) return 0

  const toDelete = backups.slice(keepCount)
  for (const backup of toDelete) {
    await deleteBackup(backup.id)
  }

  return toDelete.length
}

// Create a new empty project with default values
export function createEmptyProject(title: string, authorName: string = ''): Project {
  const now = new Date().toISOString()
  const id = generateId()

  return {
    id,
    version: 1,
    metadata: {
      workingTitle: title,
      authorName,
      createdAt: now,
      lastModified: now,
      currentPhase: 'specification',
    },
    specification: null,
    brainstorm: null,
    plot: null,
    characters: [],
    scenes: [],
    chapters: [],
    worldbuilding: null,
    worldbuildingEntries: [],
    relationships: [],
    revisions: [],
    qualityScores: [],
    subplots: [],
    subplotTouches: [],
    statistics: null,
    marketAnalysis: null,
    createdAt: now,
    updatedAt: now,
    lastExportedAt: null,
  }
}
