import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Search, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'

interface FindDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function FindDialog({ isOpen, onClose }: FindDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const currentProject = useProjectStore(state => state.currentProject)

  interface SearchResult {
    type: 'chapter' | 'scene' | 'character' | 'wiki' | 'plot'
    id: string
    title: string
    context: string
    matchIndex: number
  }

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isOpen])

  // Search through project content
  const performSearch = useCallback((query: string) => {
    if (!query.trim() || !currentProject) {
      setResults([])
      return
    }

    setIsSearching(true)
    const searchResults: SearchResult[] = []
    const queryLower = query.toLowerCase()

    // Search chapters
    currentProject.chapters?.forEach(chapter => {
      const content = chapter.content || ''
      const title = chapter.title || ''

      // Search in title
      if (title.toLowerCase().includes(queryLower)) {
        searchResults.push({
          type: 'chapter',
          id: chapter.id,
          title: `Chapter ${chapter.number}: ${chapter.title}`,
          context: `Title match`,
          matchIndex: title.toLowerCase().indexOf(queryLower)
        })
      }

      // Search in content
      const contentLower = content.toLowerCase()
      let startIndex = 0
      while ((startIndex = contentLower.indexOf(queryLower, startIndex)) !== -1) {
        const contextStart = Math.max(0, startIndex - 30)
        const contextEnd = Math.min(content.length, startIndex + query.length + 30)
        const context = content.substring(contextStart, contextEnd)
        searchResults.push({
          type: 'chapter',
          id: chapter.id,
          title: `Chapter ${chapter.number}: ${chapter.title}`,
          context: `...${context}...`,
          matchIndex: startIndex
        })
        startIndex += query.length
        // Limit matches per chapter
        if (searchResults.filter(r => r.id === chapter.id).length >= 5) break
      }
    })

    // Search scenes
    currentProject.scenes?.forEach(scene => {
      const content = scene.content || ''
      const title = scene.title || ''

      if (title.toLowerCase().includes(queryLower)) {
        searchResults.push({
          type: 'scene',
          id: scene.id,
          title: `Scene: ${scene.title}`,
          context: `Title match`,
          matchIndex: 0
        })
      }

      if (content.toLowerCase().includes(queryLower)) {
        const contentLower = content.toLowerCase()
        const startIndex = contentLower.indexOf(queryLower)
        const contextStart = Math.max(0, startIndex - 30)
        const contextEnd = Math.min(content.length, startIndex + query.length + 30)
        const context = content.substring(contextStart, contextEnd)
        searchResults.push({
          type: 'scene',
          id: scene.id,
          title: `Scene: ${scene.title}`,
          context: `...${context}...`,
          matchIndex: startIndex
        })
      }
    })

    // Search characters
    currentProject.characters?.forEach(character => {
      const name = character.name || ''
      const bio = character.bio || ''
      const backstory = character.backstory || ''

      if (name.toLowerCase().includes(queryLower)) {
        searchResults.push({
          type: 'character',
          id: character.id,
          title: `Character: ${character.name}`,
          context: `Name match`,
          matchIndex: 0
        })
      }

      if (bio.toLowerCase().includes(queryLower) || backstory.toLowerCase().includes(queryLower)) {
        const searchText = bio.toLowerCase().includes(queryLower) ? bio : backstory
        const searchTextLower = searchText.toLowerCase()
        const startIndex = searchTextLower.indexOf(queryLower)
        const contextStart = Math.max(0, startIndex - 30)
        const contextEnd = Math.min(searchText.length, startIndex + query.length + 30)
        const context = searchText.substring(contextStart, contextEnd)
        searchResults.push({
          type: 'character',
          id: character.id,
          title: `Character: ${character.name}`,
          context: `...${context}...`,
          matchIndex: startIndex
        })
      }
    })

    // Search wiki entries
    currentProject.worldbuildingEntries?.forEach(entry => {
      const name = entry.name || ''
      const description = entry.description || ''

      if (name.toLowerCase().includes(queryLower)) {
        searchResults.push({
          type: 'wiki',
          id: entry.id,
          title: `Wiki: ${entry.name}`,
          context: `Name match`,
          matchIndex: 0
        })
      }

      if (description.toLowerCase().includes(queryLower)) {
        const descLower = description.toLowerCase()
        const startIndex = descLower.indexOf(queryLower)
        const contextStart = Math.max(0, startIndex - 30)
        const contextEnd = Math.min(description.length, startIndex + query.length + 30)
        const context = description.substring(contextStart, contextEnd)
        searchResults.push({
          type: 'wiki',
          id: entry.id,
          title: `Wiki: ${entry.name}`,
          context: `...${context}...`,
          matchIndex: startIndex
        })
      }
    })

    // Search plot beats
    currentProject.plot?.beats?.forEach((beat, idx) => {
      const description = beat.description || ''

      if (description.toLowerCase().includes(queryLower)) {
        const descLower = description.toLowerCase()
        const startIndex = descLower.indexOf(queryLower)
        const contextStart = Math.max(0, startIndex - 30)
        const contextEnd = Math.min(description.length, startIndex + query.length + 30)
        const context = description.substring(contextStart, contextEnd)
        searchResults.push({
          type: 'plot',
          id: beat.id,
          title: `Plot Beat ${idx + 1}`,
          context: `...${context}...`,
          matchIndex: startIndex
        })
      }
    })

    setResults(searchResults)
    setCurrentIndex(0)
    setIsSearching(false)
  }, [currentProject])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery)
    }, 200)
    return () => clearTimeout(timer)
  }, [searchQuery, performSearch])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Previous result
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : results.length - 1))
      } else {
        // Next result
        setCurrentIndex(prev => (prev < results.length - 1 ? prev + 1 : 0))
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCurrentIndex(prev => (prev > 0 ? prev - 1 : results.length - 1))
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCurrentIndex(prev => (prev < results.length - 1 ? prev + 1 : 0))
    }
  }

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : results.length - 1))
  }

  const goToNext = () => {
    setCurrentIndex(prev => (prev < results.length - 1 ? prev + 1 : 0))
  }

  // Highlight query in context
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-warning/40 text-text-primary px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      chapter: '📖',
      scene: '🎬',
      character: '👤',
      wiki: '📚',
      plot: '📍'
    }
    return icons[type] || '📄'
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Dialog */}
      <div
        className="relative w-full max-w-2xl mx-4 bg-surface rounded-xl shadow-2xl border border-border overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Search className="h-5 w-5 text-text-secondary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Find in document..."
            className="flex-1 bg-transparent text-text-primary placeholder-text-secondary outline-none text-lg"
            aria-label="Search document"
          />
          {results.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span>{currentIndex + 1} of {results.length}</span>
              <button
                onClick={goToPrevious}
                className="p-1 hover:bg-surface-elevated rounded"
                title="Previous (Shift+Enter)"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                onClick={goToNext}
                className="p-1 hover:bg-surface-elevated rounded"
                title="Next (Enter)"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg"
            title="Close (Escape)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {searchQuery.trim() && results.length === 0 && !isSearching && (
            <div className="p-8 text-center">
              <AlertCircle className="h-8 w-8 text-text-secondary mx-auto mb-2 opacity-50" />
              <p className="text-text-secondary">No results found for "{searchQuery}"</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="divide-y divide-border">
              {results.map((result, idx) => (
                <div
                  key={`${result.type}-${result.id}-${idx}`}
                  className={`p-4 cursor-pointer transition-colors ${
                    idx === currentIndex
                      ? 'bg-accent/10 border-l-2 border-accent'
                      : 'hover:bg-surface-elevated'
                  }`}
                  onClick={() => setCurrentIndex(idx)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{getTypeIcon(result.type)}</span>
                    <span className="font-medium text-text-primary text-sm">
                      {result.title}
                    </span>
                    <span className="text-xs text-text-secondary px-1.5 py-0.5 bg-surface-elevated rounded capitalize">
                      {result.type}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary ml-6">
                    {highlightMatch(result.context, searchQuery)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {!searchQuery.trim() && (
            <div className="p-8 text-center text-text-secondary">
              <p>Type to search through chapters, scenes, characters, wiki entries, and plot beats.</p>
              <p className="text-xs mt-2 opacity-70">
                Press Enter to go to next result, Shift+Enter for previous
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
