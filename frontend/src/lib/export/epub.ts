import type { Project, Chapter } from '@/types/project'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'

// EPUB 3.0 export functionality
// EPUBs are essentially ZIP files with a specific structure

interface EPUBOptions {
  title: string
  author: string
  description?: string
  language?: string
  publisher?: string
  coverImage?: string // Base64 encoded image
}

// XML escaping utility
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Convert markdown-like text to XHTML
function textToXHTML(text: string): string {
  if (!text) return '<p></p>'

  // Split into paragraphs
  const paragraphs = text.split(/\n\n+/)

  return paragraphs
    .map(para => {
      // Handle markdown-style formatting
      let html = escapeXml(para.trim())

      // Bold: **text** or __text__
      html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')

      // Italic: *text* or _text_
      html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
      html = html.replace(/_(.+?)_/g, '<em>$1</em>')

      // Preserve single line breaks as <br/>
      html = html.replace(/\n/g, '<br/>')

      return `<p>${html}</p>`
    })
    .join('\n')
}

// Generate mimetype file
function generateMimetype(): string {
  return 'application/epub+zip'
}

// Generate container.xml
function generateContainer(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
}

// Generate content.opf (package document)
function generateContentOPF(options: EPUBOptions, chapters: Chapter[]): string {
  const uuid = crypto.randomUUID()
  const now = new Date().toISOString()

  const manifestItems = chapters
    .map((_, i) => `    <item id="chapter${i + 1}" href="chapter${i + 1}.xhtml" media-type="application/xhtml+xml"/>`)
    .join('\n')

  const spineItems = chapters
    .map((_, i) => `    <itemref idref="chapter${i + 1}"/>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">urn:uuid:${uuid}</dc:identifier>
    <dc:title>${escapeXml(options.title)}</dc:title>
    <dc:creator>${escapeXml(options.author)}</dc:creator>
    <dc:language>${options.language || 'en'}</dc:language>
    ${options.description ? `<dc:description>${escapeXml(options.description)}</dc:description>` : ''}
    ${options.publisher ? `<dc:publisher>${escapeXml(options.publisher)}</dc:publisher>` : ''}
    <meta property="dcterms:modified">${now.slice(0, 19)}Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="css" href="styles.css" media-type="text/css"/>
${manifestItems}
  </manifest>
  <spine>
${spineItems}
  </spine>
</package>`
}

// Generate navigation document
function generateNav(options: EPUBOptions, chapters: Chapter[]): string {
  const tocItems = chapters
    .map((ch, i) => `        <li><a href="chapter${i + 1}.xhtml">${escapeXml(ch.title || `Chapter ${ch.number}`)}</a></li>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>${escapeXml(options.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
${tocItems}
    </ol>
  </nav>
</body>
</html>`
}

// Generate chapter XHTML
function generateChapter(chapter: Chapter): string {
  const title = chapter.title || `Chapter ${chapter.number}`
  const content = textToXHTML(chapter.content || '')

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>${escapeXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <section epub:type="chapter">
    <h1>${escapeXml(title)}</h1>
    ${content}
  </section>
</body>
</html>`
}

// Generate CSS styles
function generateStyles(): string {
  return `body {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1em;
  line-height: 1.6;
  margin: 1em;
  text-align: justify;
}

h1 {
  font-size: 1.5em;
  font-weight: bold;
  text-align: center;
  margin-bottom: 2em;
  page-break-before: always;
}

p {
  text-indent: 1.5em;
  margin: 0 0 0.5em 0;
}

p:first-of-type {
  text-indent: 0;
}

em {
  font-style: italic;
}

strong {
  font-weight: bold;
}

nav#toc h1 {
  page-break-before: avoid;
}

nav#toc ol {
  list-style-type: none;
  padding-left: 0;
}

nav#toc li {
  margin: 0.5em 0;
}

nav#toc a {
  color: inherit;
  text-decoration: none;
}

nav#toc a:hover {
  text-decoration: underline;
}`
}

// Main export function
export async function exportToEPUB(project: Project): Promise<void> {
  const chapters = (project.chapters || [])
    .filter(ch => ch.content && ch.content.trim().length > 0)
    .sort((a, b) => a.number - b.number)

  if (chapters.length === 0) {
    throw new Error('No chapters with content to export')
  }

  const options: EPUBOptions = {
    title: project.metadata?.workingTitle || 'Untitled',
    author: project.metadata?.authorName || 'Unknown Author',
    description: (project.specification as { logline?: string })?.logline || undefined,
    language: 'en',
    publisher: undefined,
  }

  const zip = new JSZip()

  // Add mimetype (must be first and uncompressed)
  zip.file('mimetype', generateMimetype(), { compression: 'STORE' })

  // Add META-INF folder
  zip.folder('META-INF')?.file('container.xml', generateContainer())

  // Add OEBPS folder (content)
  const oebps = zip.folder('OEBPS')
  if (!oebps) throw new Error('Failed to create OEBPS folder')

  // Add package document
  oebps.file('content.opf', generateContentOPF(options, chapters))

  // Add navigation
  oebps.file('nav.xhtml', generateNav(options, chapters))

  // Add styles
  oebps.file('styles.css', generateStyles())

  // Add chapters
  chapters.forEach((chapter, index) => {
    oebps.file(`chapter${index + 1}.xhtml`, generateChapter(chapter))
  })

  // Generate the ZIP file
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  })

  // Download
  const filename = `${options.title.replace(/[^a-z0-9]/gi, '_')}.epub`
  saveAs(blob, filename)
}
