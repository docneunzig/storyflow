import { useRef } from 'react'
import { FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'
import type { Chapter, WikiEntry, Character, CharacterVoiceDNA } from '@/types/project'
import { WikiConsistencyWarning } from '@/components/ui/WikiConsistencyWarning'
import { VoiceConsistencyInline } from '@/components/write/VoiceConsistencyInline'
import { StyledChapterContent } from './StyledChapterContent'

interface ChapterContentProps {
  chapter: Chapter
  wikiEntries: WikiEntry[]
  characters: Character[]
  voiceDNA: Record<string, CharacterVoiceDNA>
  isExpanded: boolean
  onToggleExpanded: () => void
  onTextSelection: () => void
  onEditChapter: () => void
  onFixDialogue?: (lineNumber: number, originalDialogue: string, fixedDialogue: string) => void
}

export function ChapterContent({
  chapter,
  wikiEntries,
  characters,
  voiceDNA,
  isExpanded,
  onToggleExpanded,
  onTextSelection,
  onEditChapter,
  onFixDialogue,
}: ChapterContentProps) {
  const t = useLanguageStore((state) => state.t)
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <button
        onClick={onToggleExpanded}
        className="w-full px-6 py-3 flex items-center justify-between hover:bg-surface-elevated/30 transition-colors border-b border-border"
        aria-expanded={isExpanded}
        aria-controls="chapter-content-section"
      >
        <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
          <FileText className="h-4 w-4" aria-hidden="true" />
          Chapter Content
        </h3>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-text-secondary" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 text-text-secondary" aria-hidden="true" />
        )}
      </button>
      {isExpanded && (
        <div id="chapter-content-section" className="flex-1 overflow-y-auto p-6">
          {/* Wiki Consistency Warning */}
          {chapter.content && (
            <div className="max-w-3xl mx-auto mb-4">
              <WikiConsistencyWarning
                chapter={chapter}
                wikiEntries={wikiEntries}
              />
            </div>
          )}

          {/* Voice Consistency Warning */}
          {chapter.content && characters.length > 0 && Object.keys(voiceDNA).length > 0 && (
            <div className="max-w-3xl mx-auto mb-4">
              <VoiceConsistencyInline
                chapter={chapter}
                characters={characters}
                voiceDNA={voiceDNA}
                onFixDialogue={onFixDialogue}
              />
            </div>
          )}

          {chapter.content ? (
            <div
              ref={contentRef}
              className="max-w-3xl mx-auto"
              onMouseUp={onTextSelection}
            >
              <StyledChapterContent content={chapter.content} />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto text-center py-12">
              <FileText className="h-12 w-12 text-text-secondary mx-auto mb-4" aria-hidden="true" />
              <h3 className="text-lg font-medium text-text-primary mb-2">
                {t.write.noChaptersYet}
              </h3>
              <p className="text-text-secondary mb-4">
                {t.write.createFirstChapter}
              </p>
              <button
                onClick={onEditChapter}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                {t.write.generate}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
