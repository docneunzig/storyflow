import { useState, useRef } from 'react'
import { Download, Upload, FileJson, FileText, Loader2, FileType, Sparkles, BookOpen, Mail, BookMarked, Copy, Check, X, Book, FileBox } from 'lucide-react'
import { useAIGeneration } from '@/hooks/useAIGeneration'
import { AIProgressModal } from '@/components/ui/AIProgressModal'
import type { Project } from '@/types/project'
import { createProject } from '@/lib/db'
import { useProjectStore } from '@/stores/projectStore'
import { useLanguageStore } from '@/stores/languageStore'
import { toast } from '@/components/ui/Toaster'
import { useNavigate } from 'react-router-dom'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  convertInchesToTwip,
} from 'docx'
import { saveAs } from 'file-saver'
import { exportToEPUB } from '@/lib/export/epub'
import { exportToPDF, PDF_PRESETS } from '@/lib/export/pdf'

// DOCX Export Preset Types
type DOCXPreset = 'standard-manuscript' | 'modern' | 'paperback' | 'print-ready-6x9'

interface DOCXPresetConfig {
  name: string
  description: string
  font: string
  fontSize: number // in points
  lineSpacing: number // 240 = single, 480 = double
  marginTop: number // in inches
  marginBottom: number
  marginLeft: number
  marginRight: number
  firstLineIndent: number // in inches
  pageWidth?: number // in inches (optional, default is letter 8.5)
  pageHeight?: number // in inches (optional, default is letter 11)
}

interface SectionProps {
  project: Project
}

// DOCX Preset Configurations
const DOCX_PRESETS: Record<DOCXPreset, DOCXPresetConfig> = {
  'standard-manuscript': {
    name: 'Standard Manuscript',
    description: '12pt Times New Roman, double-spaced, 1" margins',
    font: 'Times New Roman',
    fontSize: 12,
    lineSpacing: 480, // Double-spaced (240 = single, 480 = double)
    marginTop: 1,
    marginBottom: 1,
    marginLeft: 1,
    marginRight: 1,
    firstLineIndent: 0.5,
  },
  'modern': {
    name: 'Modern',
    description: '11pt Arial, 1.5 spacing, 0.75" margins',
    font: 'Arial',
    fontSize: 11,
    lineSpacing: 360, // 1.5 spacing
    marginTop: 0.75,
    marginBottom: 0.75,
    marginLeft: 0.75,
    marginRight: 0.75,
    firstLineIndent: 0.3,
  },
  'paperback': {
    name: 'Paperback',
    description: '11pt Garamond, single-spaced, 0.8" margins',
    font: 'Garamond',
    fontSize: 11,
    lineSpacing: 240, // Single-spaced
    marginTop: 0.8,
    marginBottom: 0.8,
    marginLeft: 0.8,
    marginRight: 0.8,
    firstLineIndent: 0.25,
  },
  'print-ready-6x9': {
    name: 'Print-Ready 6x9',
    description: '11pt Garamond, 1.15 spacing, 6"x9" trade paperback',
    font: 'Garamond',
    fontSize: 11,
    lineSpacing: 276, // 1.15 spacing
    marginTop: 0.75,
    marginBottom: 0.75,
    marginLeft: 0.875, // Slightly larger inside margin for binding
    marginRight: 0.625,
    firstLineIndent: 0.3,
    pageWidth: 6,
    pageHeight: 9,
  },
}

export function ExportSection({ project }: SectionProps) {
  const navigate = useNavigate()
  useProjectStore() // State subscription only
  const t = useLanguageStore((state) => state.t)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<DOCXPreset>('standard-manuscript')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // AI Generation state
  const { generate, isGenerating, cancel, status, progress, message } = useAIGeneration()
  const [showAIProgress, setShowAIProgress] = useState(false)
  const [aiProgressTitle, setAIProgressTitle] = useState('Generating...')
  const [generatedContent, setGeneratedContent] = useState<{ type: string; content: string } | null>(null)
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)

  // AI Generation handlers
  async function handleGenerateSynopsis(length: 'elevator' | 'one-page' | 'two-page') {
    const lengthLabels = {
      'elevator': t.export.elevatorPitch,
      'one-page': t.export.onePageSynopsis,
      'two-page': t.export.twoPageSynopsis
    }
    setAIProgressTitle(t.export.generating.replace('{type}', lengthLabels[length]))
    setShowAIProgress(true)

    try {
      const result = await generate({
        agentTarget: 'export',
        action: 'generate-synopsis',
        context: {
          specification: project.specification,
          plot: project.plot,
          characters: project.characters,
          chapters: project.chapters,
          length
        }
      })

      if (result && !result.includes('cancelled')) {
        setGeneratedContent({ type: lengthLabels[length], content: result })
        toast({ title: t.common.success, description: t.export.synopsisGenerated.replace('{type}', lengthLabels[length]), variant: 'success' })
      }
    } catch (error) {
      console.error('Synopsis generation failed:', error)
      toast({ title: t.common.error, description: t.export.failedGenerateSynopsis, variant: 'error' })
    } finally {
      setShowAIProgress(false)
    }
  }

  async function handleGenerateQueryLetter() {
    setAIProgressTitle(t.export.generating.replace('{type}', t.export.queryLetter))
    setShowAIProgress(true)

    try {
      const result = await generate({
        agentTarget: 'export',
        action: 'generate-query-letter',
        context: {
          specification: project.specification,
          plot: project.plot,
          characters: project.characters,
          chapters: project.chapters
        }
      })

      if (result && !result.includes('cancelled')) {
        setGeneratedContent({ type: t.export.queryLetter, content: result })
        toast({ title: t.common.success, description: t.export.queryLetterGenerated, variant: 'success' })
      }
    } catch (error) {
      console.error('Query letter generation failed:', error)
      toast({ title: t.common.error, description: t.export.failedGenerateQueryLetter, variant: 'error' })
    } finally {
      setShowAIProgress(false)
    }
  }

  async function handleGenerateBookDescription() {
    setAIProgressTitle(t.export.generating.replace('{type}', t.export.bookDescription))
    setShowAIProgress(true)

    try {
      const result = await generate({
        agentTarget: 'export',
        action: 'generate-book-description',
        context: {
          specification: project.specification,
          plot: project.plot,
          characters: project.characters
        }
      })

      if (result && !result.includes('cancelled')) {
        setGeneratedContent({ type: t.export.bookDescription, content: result })
        toast({ title: t.common.success, description: t.export.bookDescriptionGenerated, variant: 'success' })
      }
    } catch (error) {
      console.error('Book description generation failed:', error)
      toast({ title: t.common.error, description: t.export.failedGenerateBookDescription, variant: 'error' })
    } finally {
      setShowAIProgress(false)
    }
  }

  async function handleCopyToClipboard() {
    if (!generatedContent) return
    try {
      await navigator.clipboard.writeText(generatedContent.content)
      setCopiedToClipboard(true)
      toast({ title: t.export.copied, description: t.export.copiedToClipboard, variant: 'success' })
      setTimeout(() => setCopiedToClipboard(false), 2000)
    } catch (error) {
      toast({ title: t.common.error, description: t.export.failedCopyClipboard, variant: 'error' })
    }
  }

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

      toast({ title: t.common.success, description: t.export.projectExportedJson, variant: 'success' })
    } catch (error) {
      console.error('Export failed:', error)
      toast({ title: t.common.error, description: t.export.failedExport, variant: 'error' })
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

      toast({ title: t.common.success, description: t.export.projectExportedMarkdown, variant: 'success' })
    } catch (error) {
      console.error('Export failed:', error)
      toast({ title: t.common.error, description: t.export.failedExport, variant: 'error' })
    } finally {
      setIsExporting(false)
    }
  }

  async function exportAsDOCX() {
    setIsExporting(true)
    try {
      const preset = DOCX_PRESETS[selectedPreset]
      const title = project.metadata?.workingTitle || 'Untitled Novel'
      const author = project.metadata?.authorName || 'Unknown Author'

      // Build document sections
      const children: Paragraph[] = []
      const currentYear = new Date().getFullYear()

      // ============ TITLE PAGE ============
      // Add some vertical space at the top
      for (let i = 0; i < 8; i++) {
        children.push(new Paragraph({ children: [] }))
      }

      // Title - large, bold, centered
      children.push(
        new Paragraph({
          children: [new TextRun({ text: title, font: 'Georgia', size: 36 * 2, bold: true })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      )

      // Subtitle line (if we had one, we'd put it here)
      children.push(new Paragraph({ children: [] }))

      // Author name
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `by`, font: preset.font, size: preset.fontSize * 2, italics: true })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: author, font: 'Georgia', size: 24 * 2 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      )

      // Page break after title page
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      )

      // ============ COPYRIGHT PAGE ============
      // Add some vertical space
      for (let i = 0; i < 20; i++) {
        children.push(new Paragraph({ children: [] }))
      }

      // Copyright notice
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `Copyright © ${currentYear} ${author}`, font: preset.font, size: preset.fontSize * 2 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: 'All rights reserved.', font: preset.font, size: preset.fontSize * 2 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        new Paragraph({
          children: [new TextRun({ text: 'This is a work of fiction. Names, characters, places, and incidents either are the product of the author\'s imagination or are used fictitiously.', font: preset.font, size: (preset.fontSize - 2) * 2, italics: true })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: '[Publisher information placeholder]', font: preset.font, size: (preset.fontSize - 2) * 2 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: '[ISBN placeholder]', font: preset.font, size: (preset.fontSize - 2) * 2 })],
          alignment: AlignmentType.CENTER,
        })
      )

      // Page break after copyright page
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      )

      // Add chapters
      if (project.chapters && project.chapters.length > 0) {
        for (let chapterIndex = 0; chapterIndex < project.chapters.length; chapterIndex++) {
          const chapter = project.chapters[chapterIndex]

          // Add page break before each chapter (except the first one, since title page already has one)
          if (chapterIndex > 0) {
            children.push(
              new Paragraph({
                children: [new PageBreak()],
              })
            )
          }

          // Chapter heading - Georgia 16pt bold, centered
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Chapter ${chapter.number}: ${chapter.title || 'Untitled'}`,
                  font: 'Georgia',
                  size: 16 * 2, // 16pt in half-points
                  bold: true,
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { before: 400, after: 400 },
            })
          )

          // Chapter content - split by paragraphs
          const content = chapter.content || ''
          const paragraphs = content.split(/\n\n+/)

          for (const para of paragraphs) {
            const trimmedPara = para.trim()
            if (trimmedPara) {
              // Check if this is a scene break (common patterns: ***, ---, ~~~, ###, or just asterisks)
              const isSceneBreak = /^(\*\s*\*\s*\*|\*{3,}|---+|~~~+|###*)$/.test(trimmedPara)

              if (isSceneBreak) {
                // Scene break - centered "* * *" with extra spacing
                children.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: '* * *',
                        font: preset.font,
                        size: preset.fontSize * 2,
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 400, after: 400, line: preset.lineSpacing },
                  })
                )
              } else {
                // Regular paragraph
                children.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: trimmedPara,
                        font: preset.font,
                        size: preset.fontSize * 2, // docx uses half-points
                      }),
                    ],
                    indent: { firstLine: convertInchesToTwip(preset.firstLineIndent) },
                    spacing: { line: preset.lineSpacing },
                  })
                )
              }
            }
          }
        }
      } else {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'No chapters written yet.',
                font: preset.font,
                size: preset.fontSize * 2,
                italics: true,
              }),
            ],
          })
        )
      }

      // ============ BACK MATTER ============
      // Page break before back matter
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      )

      // About the Author section
      // Add some vertical space at the top
      for (let i = 0; i < 6; i++) {
        children.push(new Paragraph({ children: [] }))
      }

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'About the Author',
              font: 'Georgia',
              size: 18 * 2,
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `[Author bio placeholder - Add a brief biography of ${author} here.]`,
              font: preset.font,
              size: preset.fontSize * 2,
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: '[Author photo placeholder]',
              font: preset.font,
              size: (preset.fontSize - 2) * 2,
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      )

      // Page break before "Also By" section
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      )

      // Also By section
      // Add some vertical space at the top
      for (let i = 0; i < 6; i++) {
        children.push(new Paragraph({ children: [] }))
      }

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Also By ${author}`,
              font: 'Georgia',
              size: 18 * 2,
              bold: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: '[List of other books by the author placeholder]',
              font: preset.font,
              size: preset.fontSize * 2,
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: '[Add book titles here]',
              font: preset.font,
              size: (preset.fontSize - 2) * 2,
              italics: true,
            }),
          ],
          alignment: AlignmentType.CENTER,
        })
      )

      // Create the document with optional custom page size
      const pageProperties: {
        margin: { top: number; bottom: number; left: number; right: number }
        size?: { width: number; height: number }
      } = {
        margin: {
          top: convertInchesToTwip(preset.marginTop),
          bottom: convertInchesToTwip(preset.marginBottom),
          left: convertInchesToTwip(preset.marginLeft),
          right: convertInchesToTwip(preset.marginRight),
        },
      }

      // Add custom page size if specified
      if (preset.pageWidth && preset.pageHeight) {
        pageProperties.size = {
          width: convertInchesToTwip(preset.pageWidth),
          height: convertInchesToTwip(preset.pageHeight),
        }
      }

      const doc = new Document({
        sections: [
          {
            properties: {
              page: pageProperties,
            },
            children,
          },
        ],
      })

      // Generate and download
      const blob = await Packer.toBlob(doc)
      saveAs(blob, `${title.replace(/[^a-z0-9]/gi, '-')}.docx`)

      toast({
        title: t.common.success,
        description: t.export.exportedDocxFormat.replace('{format}', preset.name),
        variant: 'success',
      })
    } catch (error) {
      console.error('DOCX export failed:', error)
      toast({ title: t.common.error, description: t.export.failedExportDocx, variant: 'error' })
    } finally {
      setIsExporting(false)
    }
  }

  // EPUB Export
  async function exportAsEPUB() {
    setIsExporting(true)
    try {
      await exportToEPUB(project)
      toast({
        title: t.common.success,
        description: 'Project exported as EPUB successfully',
        variant: 'success',
      })
    } catch (error) {
      console.error('EPUB export failed:', error)
      toast({
        title: t.common.error,
        description: error instanceof Error ? error.message : 'Failed to export as EPUB',
        variant: 'error',
      })
    } finally {
      setIsExporting(false)
    }
  }

  // PDF Export
  const [selectedPDFPreset, setSelectedPDFPreset] = useState<keyof typeof PDF_PRESETS>('standard-manuscript')

  async function exportAsPDF() {
    setIsExporting(true)
    try {
      await exportToPDF(project, PDF_PRESETS[selectedPDFPreset])
      toast({
        title: t.common.success,
        description: 'Project exported as PDF successfully',
        variant: 'success',
      })
    } catch (error) {
      console.error('PDF export failed:', error)
      toast({
        title: t.common.error,
        description: error instanceof Error ? error.message : 'Failed to export as PDF',
        variant: 'error',
      })
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
        title: t.common.success,
        description: t.export.projectImported.replace('{title}', importedData.metadata.workingTitle),
        variant: 'success',
      })

      // Navigate to the imported project
      navigate(`/projects/${newId}/specification`)
    } catch (error) {
      console.error('Import failed:', error)
      toast({
        title: t.common.error,
        description: t.export.failedImport,
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
      <h1 className="text-2xl font-bold text-text-primary mb-6">{t.export.title}</h1>
      <p className="text-text-secondary mb-8">
        {t.export.subtitle}
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* JSON Export - Full Backup */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent/10 rounded-lg">
              <FileJson className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">{t.export.jsonBackup}</h3>
              <p className="text-sm text-text-secondary">{t.export.fullProjectExport}</p>
            </div>
          </div>
          <p className="text-text-secondary text-sm mb-4">
            {t.export.jsonDescription}
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
            {t.export.exportJson}
          </button>
        </div>

        {/* Markdown Export */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent/10 rounded-lg">
              <FileText className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">{t.export.formats.markdown}</h3>
              <p className="text-sm text-text-secondary">{t.export.plainTextManuscript}</p>
            </div>
          </div>
          <p className="text-text-secondary text-sm mb-4">
            {t.export.markdownDescription}
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
            {t.export.exportMarkdown}
          </button>
        </div>

        {/* Import */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-success/10 rounded-lg">
              <Upload className="h-6 w-6 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">{t.export.importProject}</h3>
              <p className="text-sm text-text-secondary">{t.export.restoreFromBackup}</p>
            </div>
          </div>
          <p className="text-text-secondary text-sm mb-4">
            {t.export.importDescription}
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
            {t.export.importJson}
          </button>
        </div>
      </div>

      {/* DOCX Professional Formats */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4">{t.export.professionalFormats}</h2>
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <FileType className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">{t.export.docxExport}</h3>
              <p className="text-sm text-text-secondary">{t.export.professionalManuscript}</p>
            </div>
          </div>

          <p className="text-text-secondary text-sm mb-4">
            {t.export.docxDescription}
          </p>

          {/* Preset Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t.export.formatPreset}
            </label>
            <div className="grid gap-2">
              {(Object.keys(DOCX_PRESETS) as DOCXPreset[]).map((presetKey) => {
                const preset = DOCX_PRESETS[presetKey]
                const isSelected = selectedPreset === presetKey
                return (
                  <button
                    key={presetKey}
                    onClick={() => setSelectedPreset(presetKey)}
                    className={`text-left p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-border hover:border-purple-500/50 hover:bg-surface-elevated'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-text-primary">{preset.name}</span>
                      {isSelected && (
                        <span className="text-xs px-2 py-0.5 bg-purple-500 text-white rounded">
                          {t.export.selected}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary mt-1">{preset.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <button
            onClick={exportAsDOCX}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {t.export.exportDocx}
          </button>
        </div>

        {/* EPUB & PDF Exports */}
        <div className="grid gap-6 md:grid-cols-2 mt-6">
          {/* EPUB Export */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Book className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">EPUB Export</h3>
                <p className="text-sm text-text-secondary">E-reader compatible format</p>
              </div>
            </div>
            <p className="text-text-secondary text-sm mb-4">
              Export your manuscript as an EPUB file, compatible with Kindle, Apple Books, Kobo, and other e-readers. Perfect for beta readers and personal review.
            </p>
            <button
              onClick={exportAsEPUB}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export EPUB
            </button>
          </div>

          {/* PDF Export */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <FileBox className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">PDF Export</h3>
                <p className="text-sm text-text-secondary">Universal document format</p>
              </div>
            </div>
            <p className="text-text-secondary text-sm mb-4">
              Export as a PDF for printing, sharing, or archiving. Choose from different formatting presets.
            </p>

            {/* PDF Preset Selection */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-text-secondary mb-2">
                Format Preset
              </label>
              <select
                value={selectedPDFPreset}
                onChange={(e) => setSelectedPDFPreset(e.target.value as keyof typeof PDF_PRESETS)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm"
              >
                <option value="standard-manuscript">Standard Manuscript (12pt, double-spaced)</option>
                <option value="paperback-trade">Trade Paperback (6x9, single-spaced)</option>
                <option value="ebook-preview">E-book Preview (A4, for screen reading)</option>
              </select>
            </div>

            <button
              onClick={exportAsPDF}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* AI Publishing Tools */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          {t.export.aiPublishingTools}
        </h2>
        <p className="text-text-secondary text-sm mb-4">
          {t.export.aiToolsDescription}
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Synopsis Generator */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-accent/10 rounded-lg">
                <BookOpen className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">{t.export.synopsis}</h3>
                <p className="text-sm text-text-secondary">{t.export.storySummaryForAgents}</p>
              </div>
            </div>
            <p className="text-text-secondary text-sm mb-4">
              {t.export.synopsisDescription}
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleGenerateSynopsis('elevator')}
                disabled={isGenerating}
                className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
              >
                <Sparkles className="h-3 w-3" />
                {t.export.elevatorPitch}
              </button>
              <button
                onClick={() => handleGenerateSynopsis('one-page')}
                disabled={isGenerating}
                className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
              >
                <Sparkles className="h-3 w-3" />
                {t.export.onePageSynopsis}
              </button>
              <button
                onClick={() => handleGenerateSynopsis('two-page')}
                disabled={isGenerating}
                className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
              >
                <Sparkles className="h-3 w-3" />
                {t.export.twoPageSynopsis}
              </button>
            </div>
          </div>

          {/* Query Letter Generator */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-success/10 rounded-lg">
                <Mail className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">{t.export.queryLetter}</h3>
                <p className="text-sm text-text-secondary">{t.export.industryStandardFormat}</p>
              </div>
            </div>
            <p className="text-text-secondary text-sm mb-4">
              {t.export.queryLetterDescription}
            </p>
            <button
              onClick={handleGenerateQueryLetter}
              disabled={isGenerating}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {t.export.generateQueryLetter}
            </button>
          </div>

          {/* Book Description Generator */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-warning/10 rounded-lg">
                <BookMarked className="h-6 w-6 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">{t.export.bookDescription}</h3>
                <p className="text-sm text-text-secondary">{t.export.backCoverCopy}</p>
              </div>
            </div>
            <p className="text-text-secondary text-sm mb-4">
              {t.export.bookDescriptionDescription}
            </p>
            <button
              onClick={handleGenerateBookDescription}
              disabled={isGenerating}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {t.export.generateDescription}
            </button>
          </div>
        </div>
      </div>

      {/* AI Progress Modal */}
      <AIProgressModal
        isOpen={showAIProgress}
        title={aiProgressTitle}
        onClose={() => setShowAIProgress(false)}
        onCancel={() => {
          cancel()
          setShowAIProgress(false)
        }}
        status={status}
        progress={progress}
        message={message}
      />

      {/* Generated Content Modal */}
      {generatedContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-surface rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text-primary">{generatedContent.type}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyToClipboard}
                  className="p-2 rounded-lg hover:bg-surface-elevated transition-colors"
                  title={t.export.copyToClipboard}
                >
                  {copiedToClipboard ? (
                    <Check className="h-5 w-5 text-success" />
                  ) : (
                    <Copy className="h-5 w-5 text-text-secondary" />
                  )}
                </button>
                <button
                  onClick={() => setGeneratedContent(null)}
                  className="p-2 rounded-lg hover:bg-surface-elevated transition-colors"
                >
                  <X className="h-5 w-5 text-text-secondary" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {generatedContent.content}
              </div>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setGeneratedContent(null)}
                className="btn-secondary"
              >
                {t.export.close}
              </button>
              <button
                onClick={handleCopyToClipboard}
                className="btn-primary flex items-center gap-2"
              >
                {copiedToClipboard ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedToClipboard ? t.export.copied : t.export.copyToClipboard}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
