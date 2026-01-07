import Dexie, { type Table } from 'dexie'
import type { Project } from '@/types/project'

// Define the database schema
export class StoryflowDatabase extends Dexie {
  projects!: Table<Project, string>

  constructor() {
    super('storyflow')

    // Define the schema
    this.version(1).stores({
      // Primary key is 'id', indexed fields follow
      projects: 'id, metadata.workingTitle, updatedAt, createdAt',
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
  return db.projects.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteProject(id: string): Promise<void> {
  return db.projects.delete(id)
}

// Generate a unique ID for new projects
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
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
}
