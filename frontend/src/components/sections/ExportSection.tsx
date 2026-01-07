import { useState, useRef } from 'react'
import { Download, Upload, FileJson, FileText, Loader2 } from 'lucide-react'
import type { Project } from '@/types/project'
import { createProject, updateProject } from '@/lib/db'
import { useProjectStore } from '@/stores/projectStore'
import { toast } from '@/components/ui/Toaster'
import { useNavigate } from 'react-router-dom'

interface SectionProps {
  project: Project
}

export function ExportSection({ project }: SectionProps) {
  const navigate = useNavigate()
  const { setCurrentProject } = useProjectStore()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function exportAsJSON() {
    setIsExporting(true)
    try {
      // Create a clean copy of the project for export
      const exportData = {
        ...project,
        exportedAt: new Date().toISOString(),
        exportVersion: '1.0',
      }

      const jsonString = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `${project.metadata?.workingTitle || 'untitled'}-backup.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({ title: 'Success', description: 'Project exported as JSON', variant: 'success' })
    } catch (error) {
      console.error('Export failed:', error)
      toast({ title: 'Error', description: 'Failed to export project', variant: 'error' })
    } finally {
      setIsExporting(false)
    }
  }

  async function exportAsMarkdown() {
    setIsExporting(true)
    try {
      let markdown = `# ${project.metadata?.workingTitle || 'Untitled Novel'}\n\n`
      markdown += `By ${project.metadata?.authorName || 'Unknown Author'}\n\n`
      markdown += `---\n\n`

      // Add chapters
      if (project.chapters && project.chapters.length > 0) {
        for (const chapter of project.chapters) {
          markdown += `## Chapter ${chapter.number}: ${chapter.title || 'Untitled'}\n\n`
          markdown += chapter.content || '_No content yet_'
          markdown += '\n\n---\n\n'
        }
      } else {
        markdown += '_No chapters written yet._\n'
      }

      const blob = new Blob([markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `${project.metadata?.workingTitle || 'untitled'}.md`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({ title: 'Success', description: 'Project exported as Markdown', variant: 'success' })
    } catch (error) {
      console.error('Export failed:', error)
      toast({ title: 'Error', description: 'Failed to export project', variant: 'error' })
    } finally {
      setIsExporting(false)
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleFileImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      const importedData = JSON.parse(text) as Project

      // Validate the imported data has required fields
      if (!importedData.metadata || !importedData.id) {
        throw new Error('Invalid project file format')
      }

      // Generate a new ID for the imported project to avoid conflicts
      const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const now = new Date().toISOString()

      const importedProject: Project = {
        ...importedData,
        id: newId,
        createdAt: now,
        updatedAt: now,
        metadata: {
          ...importedData.metadata,
          workingTitle: `${importedData.metadata.workingTitle} (Imported)`,
          createdAt: now,
          lastModified: now,
        },
      }

      // Save to IndexedDB
      await createProject(importedProject)

      toast({
        title: 'Success',
        description: `Project "${importedData.metadata.workingTitle}" imported successfully`,
        variant: 'success',
      })

      // Navigate to the imported project
      navigate(`/projects/${newId}/specification`)
    } catch (error) {
      console.error('Import failed:', error)
      toast({
        title: 'Error',
        description: 'Failed to import project. Make sure the file is a valid Storyflow JSON export.',
        variant: 'error',
      })
    } finally {
      setIsImporting(false)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-6">Export</h1>
      <p className="text-text-secondary mb-8">
        Export your manuscript in professional formats or backup your project.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* JSON Export - Full Backup */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent/10 rounded-lg">
              <FileJson className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">JSON Backup</h3>
              <p className="text-sm text-text-secondary">Full project export</p>
            </div>
          </div>
          <p className="text-text-secondary text-sm mb-4">
            Export your entire project including all characters, scenes, chapters, and settings.
            Use this for backup or to transfer between devices.
          </p>
          <button
            onClick={exportAsJSON}
            disabled={isExporting}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export JSON
          </button>
        </div>

        {/* Markdown Export */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent/10 rounded-lg">
              <FileText className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Markdown</h3>
              <p className="text-sm text-text-secondary">Plain text manuscript</p>
            </div>
          </div>
          <p className="text-text-secondary text-sm mb-4">
            Export your manuscript as a Markdown file. Great for reading on any device or
            converting to other formats.
          </p>
          <button
            onClick={exportAsMarkdown}
            disabled={isExporting}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export Markdown
          </button>
        </div>

        {/* Import */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-success/10 rounded-lg">
              <Upload className="h-6 w-6 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Import Project</h3>
              <p className="text-sm text-text-secondary">Restore from backup</p>
            </div>
          </div>
          <p className="text-text-secondary text-sm mb-4">
            Import a previously exported JSON backup. This will create a new project with all
            your data restored.
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={handleImportClick}
            disabled={isImporting}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            {isImporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Import JSON
          </button>
        </div>
      </div>

      {/* DOCX Coming Soon */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Professional Formats</h2>
        <div className="card border-dashed opacity-75">
          <p className="text-text-secondary text-center py-4">
            DOCX export with professional formatting presets coming soon...
          </p>
        </div>
      </div>
    </div>
  )
}
