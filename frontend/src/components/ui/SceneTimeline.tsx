import { useMemo, useRef, useEffect, useState } from 'react'
import { Clock, BookOpen, ChevronLeft, ChevronRight, Zap, Target, User } from 'lucide-react'
import type { Scene, Chapter, Character } from '@/types/project'

interface SceneTimelineProps {
  scenes: Scene[]
  chapters: Chapter[]
  characters?: Character[]
  onSceneClick?: (scene: Scene) => void
}

// POV character color palette - distinct colors for different POV characters
const POV_COLORS = [
  { border: 'border-blue-500', bg: 'bg-blue-500/20', dot: 'bg-blue-500', text: 'text-blue-400' },
  { border: 'border-purple-500', bg: 'bg-purple-500/20', dot: 'bg-purple-500', text: 'text-purple-400' },
  { border: 'border-emerald-500', bg: 'bg-emerald-500/20', dot: 'bg-emerald-500', text: 'text-emerald-400' },
  { border: 'border-amber-500', bg: 'bg-amber-500/20', dot: 'bg-amber-500', text: 'text-amber-400' },
  { border: 'border-rose-500', bg: 'bg-rose-500/20', dot: 'bg-rose-500', text: 'text-rose-400' },
  { border: 'border-cyan-500', bg: 'bg-cyan-500/20', dot: 'bg-cyan-500', text: 'text-cyan-400' },
  { border: 'border-orange-500', bg: 'bg-orange-500/20', dot: 'bg-orange-500', text: 'text-orange-400' },
  { border: 'border-pink-500', bg: 'bg-pink-500/20', dot: 'bg-pink-500', text: 'text-pink-400' },
  { border: 'border-lime-500', bg: 'bg-lime-500/20', dot: 'bg-lime-500', text: 'text-lime-400' },
  { border: 'border-indigo-500', bg: 'bg-indigo-500/20', dot: 'bg-indigo-500', text: 'text-indigo-400' },
]

const NO_POV_COLOR = { border: 'border-text-secondary', bg: 'bg-text-secondary/10', dot: 'bg-text-secondary', text: 'text-text-secondary' }


const PACING_INDICATORS: Record<string, { color: string; width: string }> = {
  Slow: { color: 'bg-blue-400', width: 'w-8' },
  Moderate: { color: 'bg-text-secondary', width: 'w-12' },
  Fast: { color: 'bg-orange-400', width: 'w-16' },
  Intense: { color: 'bg-error', width: 'w-20' },
}

export function SceneTimeline({ scenes, chapters, characters = [], onSceneClick }: SceneTimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Create a mapping of POV character IDs to colors
  const povColorMap = useMemo(() => {
    const map = new Map<string, typeof POV_COLORS[0]>()
    // Get unique POV character IDs from scenes
    const uniquePovIds = [...new Set(scenes.map(s => s.povCharacterId).filter(Boolean))] as string[]
    uniquePovIds.forEach((povId, index) => {
      map.set(povId, POV_COLORS[index % POV_COLORS.length])
    })
    return map
  }, [scenes])

  // Get character name by ID
  const getCharacterName = (id: string | null | undefined): string | null => {
    if (!id) return null
    const char = characters.find(c => c.id === id)
    return char?.name || null
  }

  // Get POV color for a scene
  const getPovColor = (povCharacterId: string | null | undefined) => {
    if (!povCharacterId) return NO_POV_COLOR
    return povColorMap.get(povCharacterId) || NO_POV_COLOR
  }

  // Get POV legend entries (only characters that have scenes)
  const povLegendEntries = useMemo(() => {
    return Array.from(povColorMap.entries()).map(([povId, color]) => ({
      id: povId,
      name: getCharacterName(povId) || 'Unknown',
      color,
    }))
  }, [povColorMap, characters])

  // Sort scenes by timeInStory for chronological display
  const sortedScenes = useMemo(() => {
    return [...scenes].sort((a, b) => {
      // Parse time strings for comparison
      const parseTime = (time: string | null | undefined): number => {
        if (!time) return Infinity // Scenes without time go to the end
        // Try to extract meaningful order from common formats
        // e.g., "Day 1", "Morning", "Chapter 1 - Evening", timestamps, etc.
        const dayMatch = time.match(/day\s*(\d+)/i)
        if (dayMatch) return parseInt(dayMatch[1]) * 1000

        const chapterMatch = time.match(/chapter\s*(\d+)/i)
        if (chapterMatch) return parseInt(chapterMatch[1]) * 100

        // Time of day ordering
        const timeOfDay = time.toLowerCase()
        if (timeOfDay.includes('dawn') || timeOfDay.includes('sunrise')) return 1
        if (timeOfDay.includes('morning')) return 2
        if (timeOfDay.includes('noon') || timeOfDay.includes('midday')) return 3
        if (timeOfDay.includes('afternoon')) return 4
        if (timeOfDay.includes('evening') || timeOfDay.includes('dusk')) return 5
        if (timeOfDay.includes('night') || timeOfDay.includes('midnight')) return 6

        // Fallback: alphabetical
        return time.charCodeAt(0)
      }

      return parseTime(a.timeInStory) - parseTime(b.timeInStory)
    })
  }, [scenes])

  // Group scenes by chapter
  const chapterGroups = useMemo(() => {
    const groups: Map<string | null, { chapter: Chapter | null; scenes: Scene[] }> = new Map()

    // Initialize with null for unassigned scenes
    groups.set(null, { chapter: null, scenes: [] })

    // Initialize chapter groups
    chapters.forEach(chapter => {
      groups.set(chapter.id, { chapter, scenes: [] })
    })

    // Assign scenes to chapters
    sortedScenes.forEach(scene => {
      const chapterId = scene.chapterId || null
      const group = groups.get(chapterId)
      if (group) {
        group.scenes.push(scene)
      } else {
        // Chapter not found, put in unassigned
        groups.get(null)?.scenes.push(scene)
      }
    })

    // Convert to array and sort by chapter number
    return Array.from(groups.values())
      .filter(g => g.scenes.length > 0)
      .sort((a, b) => {
        if (!a.chapter) return 1 // Unassigned goes last
        if (!b.chapter) return -1
        return a.chapter.number - b.chapter.number
      })
  }, [sortedScenes, chapters])

  // Check scroll state
  const updateScrollState = () => {
    const container = scrollContainerRef.current
    if (!container) return

    setCanScrollLeft(container.scrollLeft > 0)
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    )
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    updateScrollState()
    container.addEventListener('scroll', updateScrollState)
    window.addEventListener('resize', updateScrollState)

    return () => {
      container.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [scenes])

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = 400
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  if (scenes.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-text-secondary border border-border rounded-lg">
        <p>No scenes to display on timeline.</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Scroll buttons */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-surface-elevated border border-border rounded-full flex items-center justify-center shadow-lg hover:bg-surface transition-colors"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5 text-text-primary" />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-surface-elevated border border-border rounded-full flex items-center justify-center shadow-lg hover:bg-surface transition-colors"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5 text-text-primary" />
        </button>
      )}

      {/* Timeline container */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-thin scrollbar-track-surface scrollbar-thumb-border pb-4"
        style={{ scrollbarWidth: 'thin' }}
      >
        <div className="flex gap-0 min-w-max">
          {chapterGroups.map((group, groupIndex) => (
            <div key={group.chapter?.id || 'unassigned'} className="flex-shrink-0">
              {/* Chapter header */}
              <div
                className={`
                  px-4 py-2 mb-2 rounded-t-lg border-b-2
                  ${group.chapter
                    ? 'bg-surface-elevated border-accent'
                    : 'bg-surface border-text-secondary'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className={`h-4 w-4 ${group.chapter ? 'text-accent' : 'text-text-secondary'}`} />
                  <span className={`font-medium text-sm ${group.chapter ? 'text-text-primary' : 'text-text-secondary'}`}>
                    {group.chapter
                      ? `Chapter ${group.chapter.number}: ${group.chapter.title}`
                      : 'Unassigned'
                    }
                  </span>
                  <span className="text-xs text-text-secondary ml-2">
                    ({group.scenes.length} scene{group.scenes.length !== 1 ? 's' : ''})
                  </span>
                </div>
              </div>

              {/* Timeline track for this chapter */}
              <div className="relative px-2">
                {/* Horizontal line connecting scenes */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />

                {/* Scenes */}
                <div className="flex gap-4 relative">
                  {group.scenes.map((scene, sceneIndex) => (
                    <div
                      key={scene.id}
                      className="flex flex-col items-center cursor-pointer group"
                      onClick={() => onSceneClick?.(scene)}
                    >
                      {/* Scene card - colored by POV character */}
                      <div
                        className={`
                          w-48 p-3 rounded-lg border-2 transition-all
                          hover:shadow-lg hover:scale-105 hover:z-10
                          ${getPovColor(scene.povCharacterId).border} ${getPovColor(scene.povCharacterId).bg}
                        `}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-text-primary text-sm line-clamp-1" title={scene.title}>
                            {scene.title}
                          </h4>
                          <span className="text-xs text-text-secondary bg-surface px-1.5 py-0.5 rounded flex-shrink-0 ml-2">
                            #{sortedScenes.indexOf(scene) + 1}
                          </span>
                        </div>

                        {/* POV Character indicator */}
                        {scene.povCharacterId && (
                          <div className={`flex items-center gap-1 text-xs mb-2 ${getPovColor(scene.povCharacterId).text}`}>
                            <User className="h-3 w-3" />
                            <span className="line-clamp-1 font-medium">{getCharacterName(scene.povCharacterId)}</span>
                          </div>
                        )}

                        {scene.timeInStory && (
                          <div className="flex items-center gap-1 text-xs text-text-secondary mb-2">
                            <Clock className="h-3 w-3" />
                            <span className="line-clamp-1">{scene.timeInStory}</span>
                          </div>
                        )}

                        {scene.sceneGoal && (
                          <div className="flex items-center gap-1 text-xs text-text-secondary mb-2">
                            <Target className="h-3 w-3 flex-shrink-0" />
                            <span className="line-clamp-1">{scene.sceneGoal}</span>
                          </div>
                        )}

                        {/* Pacing indicator */}
                        {scene.pacing && (
                          <div className="flex items-center gap-2 mt-2">
                            <Zap className="h-3 w-3 text-text-secondary" />
                            <div className="flex-1 h-1 bg-surface rounded-full overflow-hidden">
                              <div
                                className={`h-full ${PACING_INDICATORS[scene.pacing]?.color || 'bg-text-secondary'} ${PACING_INDICATORS[scene.pacing]?.width || 'w-8'}`}
                              />
                            </div>
                            <span className="text-xs text-text-secondary">{scene.pacing}</span>
                          </div>
                        )}

                        {/* Word count */}
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <span className="text-xs text-text-secondary">
                            ~{scene.estimatedWordCount.toLocaleString()} words
                          </span>
                        </div>
                      </div>

                      {/* Connection dot on the timeline - colored by POV */}
                      <div className={`w-3 h-3 rounded-full ${getPovColor(scene.povCharacterId).dot} border-2 border-background mt-2`} />

                      {/* Arrow to next scene (except for last in group) */}
                      {sceneIndex < group.scenes.length - 1 && (
                        <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `calc(${(sceneIndex + 1) * 208}px - 8px)` }}>
                          <div className="w-4 h-0.5 bg-accent" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Chapter boundary separator (except for last group) */}
              {groupIndex < chapterGroups.length - 1 && (
                <div className="flex items-center justify-center mx-4 h-full">
                  <div className="w-1 h-32 bg-gradient-to-b from-border via-accent to-border rounded-full" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-6 text-xs">
        {/* POV Character Legend */}
        {povLegendEntries.length > 0 && (
          <div className="flex items-center gap-4">
            <span className="font-medium text-text-secondary">POV:</span>
            {povLegendEntries.map(({ id, name, color }) => (
              <div key={id} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${color.dot}`} />
                <span className="text-text-secondary">{name}</span>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded ${NO_POV_COLOR.dot}`} />
              <span className="text-text-secondary">No POV</span>
            </div>
          </div>
        )}
        <div className="flex items-center gap-4">
          <span className="font-medium text-text-secondary">Pacing:</span>
          {Object.entries(PACING_INDICATORS).map(([pacing, { color }]) => (
            <div key={pacing} className="flex items-center gap-1">
              <div className={`w-3 h-2 rounded ${color}`} />
              <span className="text-text-secondary">{pacing}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
