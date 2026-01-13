import type { Project } from '@/types/project'
import { jsPDF } from 'jspdf'

// PDF export options
interface PDFOptions {
  title: string
  author: string
  fontSize: number
  lineHeight: number
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number
  pageSize: 'letter' | 'a4' | 'trade6x9'
  includePageNumbers: boolean
  includeTitle: boolean
}

// Page size configurations (in mm)
const PAGE_SIZES = {
  letter: { width: 215.9, height: 279.4 },
  a4: { width: 210, height: 297 },
  trade6x9: { width: 152.4, height: 228.6 },
}

// Default PDF options
const DEFAULT_OPTIONS: PDFOptions = {
  title: 'Untitled',
  author: 'Unknown Author',
  fontSize: 12,
  lineHeight: 1.5,
  marginTop: 25,
  marginBottom: 25,
  marginLeft: 25,
  marginRight: 25,
  pageSize: 'letter',
  includePageNumbers: true,
  includeTitle: true,
}

// Simple word wrap function
function wrapText(text: string, maxWidth: number, pdf: jsPDF): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const testWidth = pdf.getTextWidth(testLine)

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

// Main export function
export async function exportToPDF(
  project: Project,
  customOptions: Partial<PDFOptions> = {}
): Promise<void> {
  const options: PDFOptions = {
    ...DEFAULT_OPTIONS,
    title: project.metadata?.workingTitle || DEFAULT_OPTIONS.title,
    author: project.metadata?.authorName || DEFAULT_OPTIONS.author,
    ...customOptions,
  }

  const chapters = (project.chapters || [])
    .filter(ch => ch.content && ch.content.trim().length > 0)
    .sort((a, b) => a.number - b.number)

  if (chapters.length === 0) {
    throw new Error('No chapters with content to export')
  }

  const pageSize = PAGE_SIZES[options.pageSize]
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageSize.width, pageSize.height],
  })

  // Calculate content area
  const contentWidth = pageSize.width - options.marginLeft - options.marginRight
  const lineSpacing = options.fontSize * 0.352778 * options.lineHeight // Convert pt to mm

  // Set font
  pdf.setFont('times', 'normal')
  pdf.setFontSize(options.fontSize)

  let pageNumber = 1
  let currentY = options.marginTop

  // Add page number helper
  const addPageNumber = () => {
    if (options.includePageNumbers) {
      pdf.setFontSize(10)
      pdf.text(
        String(pageNumber),
        pageSize.width / 2,
        pageSize.height - options.marginBottom / 2,
        { align: 'center' }
      )
      pdf.setFontSize(options.fontSize)
    }
  }

  // Add new page helper
  const addNewPage = () => {
    addPageNumber()
    pdf.addPage()
    pageNumber++
    currentY = options.marginTop
  }

  // Check if we need a new page
  const checkNewPage = (neededHeight: number) => {
    if (currentY + neededHeight > pageSize.height - options.marginBottom) {
      addNewPage()
      return true
    }
    return false
  }

  // Title page
  if (options.includeTitle) {
    pdf.setFontSize(24)
    pdf.setFont('times', 'bold')
    pdf.text(options.title, pageSize.width / 2, pageSize.height / 2 - 20, { align: 'center' })

    pdf.setFontSize(14)
    pdf.setFont('times', 'italic')
    pdf.text(`by ${options.author}`, pageSize.width / 2, pageSize.height / 2 + 10, { align: 'center' })

    addNewPage()
    pdf.setFont('times', 'normal')
    pdf.setFontSize(options.fontSize)
  }

  // Process each chapter
  for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex++) {
    const chapter = chapters[chapterIndex]

    // Chapter break - start on new page (except first chapter)
    if (chapterIndex > 0) {
      addNewPage()
    }

    // Chapter title
    const chapterTitle = chapter.title || `Chapter ${chapter.number}`
    pdf.setFont('times', 'bold')
    pdf.setFontSize(options.fontSize + 4)
    currentY += lineSpacing * 2
    pdf.text(chapterTitle, pageSize.width / 2, currentY, { align: 'center' })
    pdf.setFont('times', 'normal')
    pdf.setFontSize(options.fontSize)
    currentY += lineSpacing * 2

    // Process chapter content
    const paragraphs = (chapter.content || '').split(/\n\n+/)

    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) continue

      // Handle scene breaks (e.g., "***" or "* * *")
      if (/^\s*[\*\#\-]{3,}\s*$/.test(paragraph)) {
        currentY += lineSpacing
        checkNewPage(lineSpacing * 2)
        pdf.text('* * *', pageSize.width / 2, currentY, { align: 'center' })
        currentY += lineSpacing * 2
        continue
      }

      // Wrap paragraph text
      const cleanText = paragraph.trim().replace(/\n/g, ' ')
      const lines = wrapText(cleanText, contentWidth, pdf)

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        checkNewPage(lineSpacing)

        let xPos = options.marginLeft
        // First line of paragraph gets indent
        if (lineIndex === 0) {
          xPos += 10 // ~10mm indent
        }

        pdf.text(lines[lineIndex], xPos, currentY)
        currentY += lineSpacing
      }

      // Paragraph spacing
      currentY += lineSpacing * 0.5
    }
  }

  // Add final page number
  addPageNumber()

  // Download
  const filename = `${options.title.replace(/[^a-z0-9]/gi, '_')}.pdf`
  pdf.save(filename)
}

// Preset configurations for common formats
export const PDF_PRESETS = {
  'standard-manuscript': {
    fontSize: 12,
    lineHeight: 2.0,
    marginTop: 25,
    marginBottom: 25,
    marginLeft: 25,
    marginRight: 25,
    pageSize: 'letter' as const,
    includePageNumbers: true,
    includeTitle: true,
  },
  'paperback-trade': {
    fontSize: 11,
    lineHeight: 1.4,
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 22,
    marginRight: 16,
    pageSize: 'trade6x9' as const,
    includePageNumbers: true,
    includeTitle: true,
  },
  'ebook-preview': {
    fontSize: 12,
    lineHeight: 1.5,
    marginTop: 15,
    marginBottom: 15,
    marginLeft: 15,
    marginRight: 15,
    pageSize: 'a4' as const,
    includePageNumbers: true,
    includeTitle: true,
  },
}
