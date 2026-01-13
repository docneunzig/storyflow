import { METADATA_CHIP_STYLES } from './constants'

interface StyledChapterContentProps {
  content: string
}

// Component to render chapter content with styled metadata
export function StyledChapterContent({ content }: StyledChapterContentProps) {
  // Parse metadata patterns like [Setting: Value] and render as chips
  const parseContent = (text: string) => {
    const parts: React.ReactNode[] = []
    let lastIndex = 0

    // Match metadata patterns: [Key: Value] at start of lines or content
    const metadataRegex = /\[(Setting|POV|Tense|Target Audience|Chapter):\s*([^\]]+)\]/g
    let match

    while ((match = metadataRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index)
        // Filter out empty lines around metadata
        if (beforeText.trim()) {
          parts.push(<span key={`text-${lastIndex}`}>{beforeText}</span>)
        }
      }

      const [, key, value] = match
      const chipStyle = METADATA_CHIP_STYLES[key] || 'bg-surface-elevated text-text-secondary border-border'

      parts.push(
        <span
          key={`chip-${match.index}`}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${chipStyle} mr-2 mb-2`}
        >
          <span className="opacity-70">{key}:</span>
          <span>{value.trim()}</span>
        </span>
      )

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(<span key={`text-end`}>{text.substring(lastIndex)}</span>)
    }

    return parts.length > 0 ? parts : text
  }

  // Split content into metadata section and main content
  const lines = content.split('\n')
  const metadataLines: string[] = []
  const contentLines: string[] = []
  let inMetadata = true

  for (const line of lines) {
    if (inMetadata && (line.match(/^\[(Setting|POV|Tense|Target Audience|Chapter):/) || line.trim() === '')) {
      metadataLines.push(line)
    } else {
      inMetadata = false
      contentLines.push(line)
    }
  }

  const hasMetadata = metadataLines.some(l => l.includes('['))

  return (
    <div>
      {/* Metadata chips */}
      {hasMetadata && (
        <div className="flex flex-wrap gap-1 mb-6 pb-4 border-b border-border/50">
          {parseContent(metadataLines.join('\n'))}
        </div>
      )}
      {/* Main content */}
      <div className="prose prose-invert prose-lg font-serif whitespace-pre-wrap selection:bg-accent/30">
        {contentLines.join('\n')}
      </div>
    </div>
  )
}
