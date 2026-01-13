import { useMemo } from 'react'
import { TrendingUp, AlertTriangle, Zap } from 'lucide-react'
import type { ChapterTension, Chapter } from '@/types/project'

interface TensionGraphProps {
  tensionData: ChapterTension[]
  chapters: Chapter[]
  onUpdateTension: (chapterId: string, updates: Partial<ChapterTension>) => void
}

export function TensionGraph({
  tensionData,
  chapters,
  onUpdateTension,
}: TensionGraphProps) {
  const sortedData = useMemo(() => {
    return [...tensionData].sort((a, b) => a.chapterNumber - b.chapterNumber)
  }, [tensionData])

  const maxValue = 10
  const graphHeight = 200

  // Calculate positions for each metric line
  const getPoints = (metric: 'tensionLevel' | 'suspenseLevel' | 'dangerLevel') => {
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

  const averages = useMemo(() => {
    if (sortedData.length === 0) return { tension: 0, suspense: 0, danger: 0 }
    return {
      tension: sortedData.reduce((sum, d) => sum + d.tensionLevel, 0) / sortedData.length,
      suspense: sortedData.reduce((sum, d) => sum + d.suspenseLevel, 0) / sortedData.length,
      danger: sortedData.reduce((sum, d) => sum + d.dangerLevel, 0) / sortedData.length,
    }
  }, [sortedData])

  return (
    <div className="space-y-4">
      {/* Legend and Averages */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-error" />
            <span className="text-sm">Tension</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-sm">Suspense</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-sm">Danger</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-text-secondary">
          <span>Avg Tension: <strong className="text-error">{averages.tension.toFixed(1)}</strong></span>
          <span>Avg Suspense: <strong className="text-warning">{averages.suspense.toFixed(1)}</strong></span>
          <span>Avg Danger: <strong className="text-purple-400">{averages.danger.toFixed(1)}</strong></span>
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

            {/* Lines */}
            <polyline
              points={getPoints('tensionLevel')}
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points={getPoints('suspenseLevel')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points={getPoints('dangerLevel')}
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
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
                    fill="#ef4444"
                  />
                  <circle
                    cx={x}
                    cy={(maxValue - d.suspenseLevel) / maxValue * graphHeight}
                    r="3"
                    fill="#f59e0b"
                  />
                  <circle
                    cx={x}
                    cy={(maxValue - d.dangerLevel) / maxValue * graphHeight}
                    r="3"
                    fill="#a855f7"
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
          <p>No tension data yet. Add tension levels for your chapters below.</p>
        </div>
      )}

      {/* Chapter Controls */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm text-text-secondary">Chapter Tension Levels</h4>
        {chapters.map((chapter) => {
          const data = tensionData.find(t => t.chapterId === chapter.id) || {
            chapterId: chapter.id,
            chapterNumber: chapter.number,
            tensionLevel: 5,
            suspenseLevel: 5,
            dangerLevel: 5,
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
                  <div className="flex items-center gap-1 text-xs text-error mb-1">
                    <AlertTriangle className="h-3 w-3" />
                    Tension: {data.tensionLevel}
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={data.tensionLevel}
                    onChange={(e) => onUpdateTension(chapter.id, {
                      chapterId: chapter.id,
                      chapterNumber: chapter.number,
                      tensionLevel: parseInt(e.target.value),
                      suspenseLevel: data.suspenseLevel,
                      dangerLevel: data.dangerLevel,
                    })}
                    className="w-full accent-error"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-warning mb-1">
                    <TrendingUp className="h-3 w-3" />
                    Suspense: {data.suspenseLevel}
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={data.suspenseLevel}
                    onChange={(e) => onUpdateTension(chapter.id, {
                      chapterId: chapter.id,
                      chapterNumber: chapter.number,
                      tensionLevel: data.tensionLevel,
                      suspenseLevel: parseInt(e.target.value),
                      dangerLevel: data.dangerLevel,
                    })}
                    className="w-full accent-warning"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs text-purple-400 mb-1">
                    <Zap className="h-3 w-3" />
                    Danger: {data.dangerLevel}
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={data.dangerLevel}
                    onChange={(e) => onUpdateTension(chapter.id, {
                      chapterId: chapter.id,
                      chapterNumber: chapter.number,
                      tensionLevel: data.tensionLevel,
                      suspenseLevel: data.suspenseLevel,
                      dangerLevel: parseInt(e.target.value),
                    })}
                    className="w-full accent-purple-500"
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
