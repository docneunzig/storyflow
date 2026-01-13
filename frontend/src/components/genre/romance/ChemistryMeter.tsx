import { useMemo } from 'react'
import { Heart, Flame, Zap, TrendingUp } from 'lucide-react'
import type { ChapterChemistry, Chapter } from '@/types/project'

interface ChemistryMeterProps {
  chemistryData: ChapterChemistry[]
  chapters: Chapter[]
  onUpdateChemistry: (chapterId: string, updates: Partial<ChapterChemistry>) => void
}

export function ChemistryMeter({
  chemistryData,
  chapters,
  onUpdateChemistry,
}: ChemistryMeterProps) {
  const sortedData = useMemo(() => {
    return [...chemistryData].sort((a, b) => a.chapterNumber - b.chapterNumber)
  }, [chemistryData])

  const averages = useMemo(() => {
    if (sortedData.length === 0) return { tension: 0, intimacy: 0, conflict: 0 }
    return {
      tension: sortedData.reduce((sum, d) => sum + d.tensionLevel, 0) / sortedData.length,
      intimacy: sortedData.reduce((sum, d) => sum + d.intimacyLevel, 0) / sortedData.length,
      conflict: sortedData.reduce((sum, d) => sum + d.conflictLevel, 0) / sortedData.length,
    }
  }, [sortedData])

  const maxValue = 10
  const graphHeight = 180

  const getPoints = (metric: 'tensionLevel' | 'intimacyLevel' | 'conflictLevel') => {
    if (sortedData.length === 0) return ''
    const width = 100 / Math.max(sortedData.length - 1, 1)
    return sortedData
      .map((d, i) => {
        const x = i * width
        const y = ((maxValue - d[metric]) / maxValue) * graphHeight
        return `${x},${y}`
      })
      .join(' ')
  }

  return (
    <div className="space-y-4">
      {/* Legend and Averages */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-pink-400" />
            <span className="text-sm">Romantic Tension</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-400" />
            <span className="text-sm">Emotional Intimacy</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-400" />
            <span className="text-sm">Conflict</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-text-secondary">
          <span>Avg Tension: <strong className="text-pink-400">{averages.tension.toFixed(1)}</strong></span>
          <span>Avg Intimacy: <strong className="text-red-400">{averages.intimacy.toFixed(1)}</strong></span>
        </div>
      </div>

      {/* Graph */}
      {sortedData.length > 0 ? (
        <div className="bg-surface-elevated rounded-lg p-4 border border-border">
          <svg
            viewBox={`-20 -10 140 ${graphHeight + 40}`}
            className="w-full"
            style={{ height: graphHeight + 40 }}
          >
            {/* Grid lines */}
            {[0, 2, 4, 6, 8, 10].map((val) => (
              <g key={val}>
                <line
                  x1="0"
                  y1={(maxValue - val) / maxValue * graphHeight}
                  x2="100"
                  y2={(maxValue - val) / maxValue * graphHeight}
                  stroke="currentColor"
                  strokeOpacity="0.1"
                  strokeDasharray="2,2"
                />
                <text
                  x="-5"
                  y={(maxValue - val) / maxValue * graphHeight + 4}
                  fontSize="8"
                  fill="currentColor"
                  opacity="0.5"
                  textAnchor="end"
                >
                  {val}
                </text>
              </g>
            ))}

            {/* Area fills */}
            <polygon
              points={`0,${graphHeight} ${getPoints('intimacyLevel')} 100,${graphHeight}`}
              fill="#ef4444"
              fillOpacity="0.1"
            />

            {/* Lines */}
            <polyline
              points={getPoints('tensionLevel')}
              fill="none"
              stroke="#ec4899"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points={getPoints('intimacyLevel')}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points={getPoints('conflictLevel')}
              fill="none"
              stroke="#f97316"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="4,2"
            />

            {/* Data points */}
            {sortedData.map((d, i) => {
              const width = 100 / Math.max(sortedData.length - 1, 1)
              const x = i * width
              return (
                <g key={d.chapterId}>
                  <circle
                    cx={x}
                    cy={(maxValue - d.tensionLevel) / maxValue * graphHeight}
                    r="3"
                    fill="#ec4899"
                  />
                  <circle
                    cx={x}
                    cy={(maxValue - d.intimacyLevel) / maxValue * graphHeight}
                    r="3"
                    fill="#ef4444"
                  />
                  <circle
                    cx={x}
                    cy={(maxValue - d.conflictLevel) / maxValue * graphHeight}
                    r="3"
                    fill="#f97316"
                  />
                  <text
                    x={x}
                    y={graphHeight + 15}
                    fontSize="8"
                    fill="currentColor"
                    opacity="0.7"
                    textAnchor="middle"
                  >
                    Ch{d.chapterNumber}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      ) : (
        <div className="bg-surface-elevated rounded-lg p-8 border border-border text-center text-text-secondary">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No chemistry data yet. Add levels for your chapters below.</p>
        </div>
      )}

      {/* Chapter Controls */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm text-text-secondary">Chapter Chemistry Levels</h4>
        {chapters.map((chapter) => {
          const data = chemistryData.find(c => c.chapterId === chapter.id) || {
            chapterId: chapter.id,
            chapterNumber: chapter.number,
            tensionLevel: 5,
            intimacyLevel: 5,
            conflictLevel: 3,
          }

          return (
            <div
              key={chapter.id}
              className="bg-surface rounded-lg p-3 border border-border"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-medium">Ch {chapter.number}: {chapter.title}</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center gap-1 text-xs text-pink-400 mb-1">
                    <Flame className="h-3 w-3" />
                    Tension: {data.tensionLevel}
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={data.tensionLevel}
                    onChange={(e) => onUpdateChemistry(chapter.id, {
                      chapterId: chapter.id,
                      chapterNumber: chapter.number,
                      tensionLevel: parseInt(e.target.value),
                      intimacyLevel: data.intimacyLevel,
                      conflictLevel: data.conflictLevel,
                    })}
                    className="w-full accent-pink-400"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-red-400 mb-1">
                    <Heart className="h-3 w-3" />
                    Intimacy: {data.intimacyLevel}
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={data.intimacyLevel}
                    onChange={(e) => onUpdateChemistry(chapter.id, {
                      chapterId: chapter.id,
                      chapterNumber: chapter.number,
                      tensionLevel: data.tensionLevel,
                      intimacyLevel: parseInt(e.target.value),
                      conflictLevel: data.conflictLevel,
                    })}
                    className="w-full accent-red-400"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-orange-400 mb-1">
                    <Zap className="h-3 w-3" />
                    Conflict: {data.conflictLevel}
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={data.conflictLevel}
                    onChange={(e) => onUpdateChemistry(chapter.id, {
                      chapterId: chapter.id,
                      chapterNumber: chapter.number,
                      tensionLevel: data.tensionLevel,
                      intimacyLevel: data.intimacyLevel,
                      conflictLevel: parseInt(e.target.value),
                    })}
                    className="w-full accent-orange-400"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
