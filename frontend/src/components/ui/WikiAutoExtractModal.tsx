import { useState, useEffect, useCallback, useMemo } from 'react'
import { X, Sparkles, Plus, Check } from 'lucide-react'
import type { WikiCategory, WikiEntry, Chapter, Character } from '@/types/project'
import { generateId } from '@/lib/db'

interface ExtractedNoun {
  name: string
  category: WikiCategory
  context: string // Sentence where it was found
  isNew: boolean // Whether it's already in wiki
  selected: boolean
}

interface WikiAutoExtractModalProps {
  isOpen: boolean
  onClose: () => void
  onAddEntries: (entries: WikiEntry[]) => void
  chapter: Chapter
  existingWikiEntries: WikiEntry[]
  existingCharacters: Character[]
}

const CATEGORY_COLORS: Record<WikiCategory, string> = {
  locations: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  characters: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  timeline: 'bg-green-500/20 text-green-400 border-green-500/30',
  magicTechnology: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  culturesFactions: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  objects: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  terminology: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  rules: 'bg-red-500/20 text-red-400 border-red-500/30',
}

// Simple proper noun extraction - finds capitalized words that might be names/places
function extractProperNouns(content: string): { name: string; context: string }[] {
  const results: { name: string; context: string }[] = []
  const seen = new Set<string>()

  // Split content into sentences
  const sentences = content.split(/[.!?]+/).filter(s => s.trim())

  for (const sentence of sentences) {
    // Find words that start with capital letter (not at sentence start)
    // This regex finds capitalized words that aren't at the start of a sentence
    const words = sentence.trim().split(/\s+/)

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      // Skip first word of sentence, common words, and already seen
      if (i === 0) continue

      // Check if word starts with capital letter
      if (/^[A-Z][a-z]+$/.test(word)) {
        const cleanWord = word.replace(/[,;:'"]/g, '')

        // Skip common words that are often capitalized
        const skipWords = ['I', 'The', 'A', 'An', 'It', 'He', 'She', 'They', 'We', 'You', 'But', 'And', 'Or', 'So', 'Yet', 'For', 'Nor']
        if (skipWords.includes(cleanWord)) continue

        if (!seen.has(cleanWord.toLowerCase()) && cleanWord.length > 2) {
          seen.add(cleanWord.toLowerCase())
          results.push({
            name: cleanWord,
            context: sentence.trim().substring(0, 100) + (sentence.length > 100 ? '...' : ''),
          })
        }
      }

      // Also check for multi-word proper nouns (e.g., "Shadow Valley")
      if (i < words.length - 1 && /^[A-Z][a-z]+$/.test(word)) {
        const nextWord = words[i + 1]
        if (/^[A-Z][a-z]+$/.test(nextWord)) {
          const compound = `${word} ${nextWord}`.replace(/[,;:'"]/g, '')
          if (!seen.has(compound.toLowerCase())) {
            seen.add(compound.toLowerCase())
            results.push({
              name: compound,
              context: sentence.trim().substring(0, 100) + (sentence.length > 100 ? '...' : ''),
            })
          }
        }
      }
    }
  }

  return results
}

// Categorize extracted nouns based on context keywords
function categorizeNoun(name: string, context: string): WikiCategory {
  const contextLower = context.toLowerCase()
  const nameLower = name.toLowerCase()

  // Location indicators
  if (contextLower.includes('forest') || contextLower.includes('valley') ||
      contextLower.includes('mountain') || contextLower.includes('city') ||
      contextLower.includes('village') || contextLower.includes('kingdom') ||
      contextLower.includes('land') || contextLower.includes('realm') ||
      contextLower.includes('traveled to') || contextLower.includes('arrived at') ||
      contextLower.includes('in the') || contextLower.includes('to the') ||
      nameLower.includes('forest') || nameLower.includes('valley') ||
      nameLower.includes('mountain') || nameLower.includes('keep') ||
      nameLower.includes('castle') || nameLower.includes('tower')) {
    return 'locations'
  }

  // Magic/Technology indicators
  if (contextLower.includes('spell') || contextLower.includes('magic') ||
      contextLower.includes('enchant') || contextLower.includes('power') ||
      contextLower.includes('artifact') || contextLower.includes('device')) {
    return 'magicTechnology'
  }

  // Object indicators
  if (contextLower.includes('sword') || contextLower.includes('weapon') ||
      contextLower.includes('held') || contextLower.includes('carried') ||
      contextLower.includes('wore') || contextLower.includes('ring') ||
      contextLower.includes('amulet') || contextLower.includes('staff')) {
    return 'objects'
  }

  // Culture/Faction indicators
  if (contextLower.includes('tribe') || contextLower.includes('clan') ||
      contextLower.includes('guild') || contextLower.includes('order') ||
      contextLower.includes('people') || contextLower.includes('nation')) {
    return 'culturesFactions'
  }

  // Default to location for place-like names, terminology for others
  if (/^[A-Z][a-z]+\s+[A-Z][a-z]+$/.test(name)) {
    return 'locations' // Multi-word names are often places
  }

  return 'terminology' // Default category
}

export function WikiAutoExtractModal({
  isOpen,
  onClose,
  onAddEntries,
  chapter,
  existingWikiEntries,
  existingCharacters,
}: WikiAutoExtractModalProps) {
  const [extractedNouns, setExtractedNouns] = useState<ExtractedNoun[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Extract proper nouns when modal opens
  useEffect(() => {
    if (isOpen && chapter.content) {
      setIsProcessing(true)

      // Simulate AI processing delay
      setTimeout(() => {
        const extracted = extractProperNouns(chapter.content || '')

        // Check each noun against existing entries
        const existingNames = new Set([
          ...existingWikiEntries.map(e => e.name.toLowerCase()),
          ...existingCharacters.map(c => c.name.toLowerCase()),
        ])

        const nouns: ExtractedNoun[] = extracted.map(({ name, context }) => ({
          name,
          category: categorizeNoun(name, context),
          context,
          isNew: !existingNames.has(name.toLowerCase()),
          selected: !existingNames.has(name.toLowerCase()), // Pre-select new nouns
        }))

        // Only show new nouns (filter out existing)
        setExtractedNouns(nouns.filter(n => n.isNew))
        setIsProcessing(false)
      }, 500)
    }
  }, [isOpen, chapter.content, existingWikiEntries, existingCharacters])

  // Handle selection toggle
  const toggleSelection = useCallback((index: number) => {
    setExtractedNouns(prev => prev.map((noun, i) =>
      i === index ? { ...noun, selected: !noun.selected } : noun
    ))
  }, [])

  // Handle category change
  const changeCategory = useCallback((index: number, category: WikiCategory) => {
    setExtractedNouns(prev => prev.map((noun, i) =>
      i === index ? { ...noun, category } : noun
    ))
  }, [])

  // Get selected count
  const selectedCount = useMemo(() =>
    extractedNouns.filter(n => n.selected).length,
    [extractedNouns]
  )

  // Handle confirm - create wiki entries
  const handleConfirm = useCallback(() => {
    const selectedNouns = extractedNouns.filter(n => n.selected)

    const newEntries: WikiEntry[] = selectedNouns.map(noun => ({
      id: generateId(),
      category: noun.category,
      name: noun.name,
      description: `[Extracted from Chapter ${chapter.number}] ${noun.context}`,
      tags: [chapter.title || `Chapter ${chapter.number}`],
      relatedEntries: [],
      sourceChapters: [chapter.id],
    }))

    onAddEntries(newEntries)
    onClose()
  }, [extractedNouns, chapter, onAddEntries, onClose])

  // Handle Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wiki-extract-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
            <h2 id="wiki-extract-title" className="text-lg font-semibold text-text-primary">
              New Wiki Entries Detected
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-text-secondary" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Sparkles className="h-8 w-8 text-accent animate-pulse mb-4" aria-hidden="true" />
              <p className="text-text-secondary">Scanning chapter for new terms...</p>
            </div>
          ) : extractedNouns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Check className="h-8 w-8 text-success mb-4" aria-hidden="true" />
              <p className="text-text-primary font-medium">No new terms detected</p>
              <p className="text-text-secondary text-sm mt-1">
                All proper nouns in this chapter are already in your wiki.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-text-secondary mb-4">
                We found {extractedNouns.length} potential new wiki entries in Chapter {chapter.number}.
                Select which ones to add to your worldbuilding wiki.
              </p>

              <div className="space-y-3">
                {extractedNouns.map((noun, index) => {
                  return (
                    <div
                      key={`${noun.name}-${index}`}
                      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                        noun.selected
                          ? 'bg-accent/10 border-accent/40'
                          : 'bg-surface-elevated border-border hover:border-accent/30'
                      }`}
                      onClick={() => toggleSelection(index)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          noun.selected ? 'bg-accent' : 'border border-border'
                        }`}>
                          {noun.selected && <Check className="h-3 w-3 text-white" aria-hidden="true" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-text-primary">{noun.name}</span>

                            {/* Category selector */}
                            <select
                              value={noun.category}
                              onChange={(e) => {
                                e.stopPropagation()
                                changeCategory(index, e.target.value as WikiCategory)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className={`text-xs px-2 py-0.5 rounded border ${CATEGORY_COLORS[noun.category]} bg-transparent cursor-pointer focus:outline-none`}
                            >
                              <option value="locations">Location</option>
                              <option value="characters">Character</option>
                              <option value="objects">Object</option>
                              <option value="terminology">Terminology</option>
                              <option value="magicTechnology">Magic/Tech</option>
                              <option value="culturesFactions">Culture/Faction</option>
                            </select>
                          </div>

                          <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                            "{noun.context}"
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-text-secondary">
            {selectedCount > 0 ? `${selectedCount} item${selectedCount !== 1 ? 's' : ''} selected` : 'No items selected'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg text-text-primary hover:bg-surface-elevated transition-colors"
            >
              {extractedNouns.length === 0 ? 'Close' : 'Skip'}
            </button>
            {extractedNouns.length > 0 && selectedCount > 0 && (
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add to Wiki
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
