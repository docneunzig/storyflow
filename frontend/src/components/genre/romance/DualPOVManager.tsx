import { useMemo } from 'react'
import { Users, BookOpen, ArrowLeftRight } from 'lucide-react'
import type { Chapter, Character, RelationshipBeat } from '@/types/project'

interface DualPOVManagerProps {
  protagonistA: Character | null
  protagonistB: Character | null
  chapters: Chapter[]
  beats: RelationshipBeat[]
  onSetProtagonists: (aId: string | null, bId: string | null) => void
  characters: Character[]
}

export function DualPOVManager({
  protagonistA,
  protagonistB,
  chapters,
  beats,
  onSetProtagonists,
  characters,
}: DualPOVManagerProps) {
  // Calculate POV distribution
  const povStats = useMemo(() => {
    const aBeats = beats.filter(b => b.povCharacterId === protagonistA?.id).length
    const bBeats = beats.filter(b => b.povCharacterId === protagonistB?.id).length
    const total = aBeats + bBeats
    return {
      aCount: aBeats,
      bCount: bBeats,
      aPercent: total > 0 ? Math.round((aBeats / total) * 100) : 50,
      bPercent: total > 0 ? Math.round((bBeats / total) * 100) : 50,
    }
  }, [beats, protagonistA?.id, protagonistB?.id])

  // Get chapter POV assignments (based on scenes or manual assignment)
  const chapterPOVs = useMemo(() => {
    return chapters.map(ch => {
      const chapterBeats = beats.filter(b => b.chapterId === ch.id)
      const aCount = chapterBeats.filter(b => b.povCharacterId === protagonistA?.id).length
      const bCount = chapterBeats.filter(b => b.povCharacterId === protagonistB?.id).length
      const dominant = aCount > bCount ? 'A' : bCount > aCount ? 'B' : 'mixed'
      return { chapterId: ch.id, chapterNumber: ch.number, dominant, aCount, bCount }
    })
  }, [chapters, beats, protagonistA?.id, protagonistB?.id])

  const availableProtagonists = characters.filter(c => c.role === 'protagonist' || c.role === 'supporting')

  return (
    <div className="space-y-4">
      {/* Protagonist Selection */}
      <div className="bg-surface-elevated rounded-lg p-4 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-pink-400" />
          <h3 className="font-medium">Romance Protagonists</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-text-secondary mb-1 block">Protagonist A</label>
            <select
              value={protagonistA?.id || ''}
              onChange={(e) => onSetProtagonists(e.target.value || null, protagonistB?.id || null)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select character...</option>
              {availableProtagonists
                .filter(c => c.id !== protagonistB?.id)
                .map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
            {protagonistA && (
              <p className="text-xs text-text-secondary mt-1 truncate">
                {protagonistA.personalitySummary?.substring(0, 50)}...
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-text-secondary mb-1 block">Protagonist B</label>
            <select
              value={protagonistB?.id || ''}
              onChange={(e) => onSetProtagonists(protagonistA?.id || null, e.target.value || null)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select character...</option>
              {availableProtagonists
                .filter(c => c.id !== protagonistA?.id)
                .map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
            {protagonistB && (
              <p className="text-xs text-text-secondary mt-1 truncate">
                {protagonistB.personalitySummary?.substring(0, 50)}...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* POV Balance */}
      {protagonistA && protagonistB && (
        <div className="bg-surface-elevated rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <ArrowLeftRight className="h-5 w-5 text-accent" />
            <h3 className="font-medium">POV Balance</h3>
          </div>

          <div className="space-y-3">
            {/* Visual balance bar */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium w-24 truncate">{protagonistA.name}</span>
              <div className="flex-1 h-6 bg-surface rounded-full overflow-hidden flex">
                <div
                  className="bg-pink-500 h-full flex items-center justify-end pr-2"
                  style={{ width: `${povStats.aPercent}%` }}
                >
                  {povStats.aPercent > 10 && (
                    <span className="text-xs text-white font-medium">{povStats.aPercent}%</span>
                  )}
                </div>
                <div
                  className="bg-purple-500 h-full flex items-center justify-start pl-2"
                  style={{ width: `${povStats.bPercent}%` }}
                >
                  {povStats.bPercent > 10 && (
                    <span className="text-xs text-white font-medium">{povStats.bPercent}%</span>
                  )}
                </div>
              </div>
              <span className="text-sm font-medium w-24 truncate text-right">{protagonistB.name}</span>
            </div>

            <div className="flex justify-between text-xs text-text-secondary">
              <span>{povStats.aCount} beats</span>
              <span>
                {Math.abs(povStats.aPercent - 50) <= 10
                  ? '✓ Well balanced'
                  : povStats.aPercent > 60
                  ? `⚠ ${protagonistA.name} heavy`
                  : `⚠ ${protagonistB.name} heavy`}
              </span>
              <span>{povStats.bCount} beats</span>
            </div>
          </div>
        </div>
      )}

      {/* Chapter POV Timeline */}
      {protagonistA && protagonistB && chapters.length > 0 && (
        <div className="bg-surface-elevated rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-accent" />
            <h3 className="font-medium">Chapter POV Pattern</h3>
          </div>

          <div className="flex gap-1 flex-wrap">
            {chapterPOVs.map((chPov) => (
              <div
                key={chPov.chapterId}
                className={`px-3 py-2 rounded text-center min-w-[60px] ${
                  chPov.dominant === 'A'
                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                    : chPov.dominant === 'B'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-surface text-text-secondary border border-border'
                }`}
                title={`${chPov.aCount} ${protagonistA.name} beats, ${chPov.bCount} ${protagonistB.name} beats`}
              >
                <div className="text-xs font-medium">Ch {chPov.chapterNumber}</div>
                <div className="text-[10px] opacity-75">
                  {chPov.dominant === 'A'
                    ? protagonistA.name.substring(0, 6)
                    : chPov.dominant === 'B'
                    ? protagonistB.name.substring(0, 6)
                    : 'Mixed'}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-text-secondary mt-2">
            Tip: Alternating POVs keeps both characters equally engaging. Consider balancing if one dominates.
          </p>
        </div>
      )}

      {/* No protagonists selected warning */}
      {(!protagonistA || !protagonistB) && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 text-center">
          <p className="text-warning text-sm">
            Select both protagonists above to track dual POV balance.
          </p>
        </div>
      )}
    </div>
  )
}
