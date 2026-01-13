import { useState, useMemo, useCallback } from 'react'
import { Heart, Users, Tag, TrendingUp, Flame } from 'lucide-react'
import type { RomanceElements, Chapter, Character, RelationshipBeat, RomanceTrope, ChapterChemistry } from '@/types/project'
import { RelationshipArcTracker } from './RelationshipArcTracker'
import { ChemistryMeter } from './ChemistryMeter'
import { TropeSelector } from './TropeSelector'
import { DualPOVManager } from './DualPOVManager'

interface RomanceDashboardProps {
  romanceElements: RomanceElements | null
  chapters: Chapter[]
  characters: Character[]
  onUpdateRomanceElements: (updates: Partial<RomanceElements>) => void
}

type Tab = 'overview' | 'arc' | 'pov' | 'tropes' | 'chemistry'

export function RomanceDashboard({
  romanceElements,
  chapters,
  characters,
  onUpdateRomanceElements,
}: RomanceDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  // Initialize romance elements if null
  const elements: RomanceElements = romanceElements || {
    protagonistAId: '',
    protagonistBId: '',
    relationshipArc: [],
    tropes: [],
    conflictType: 'both',
    heatLevel: 3,
    chemistryScores: [],
  }

  // Get protagonist characters
  const protagonistA = useMemo(() =>
    characters.find(c => c.id === elements.protagonistAId) || null,
    [characters, elements.protagonistAId]
  )
  const protagonistB = useMemo(() =>
    characters.find(c => c.id === elements.protagonistBId) || null,
    [characters, elements.protagonistBId]
  )

  // Relationship beat handlers
  const handleAddBeat = useCallback((beat: Omit<RelationshipBeat, 'id'>) => {
    const newBeat: RelationshipBeat = { ...beat, id: crypto.randomUUID() }
    onUpdateRomanceElements({ relationshipArc: [...elements.relationshipArc, newBeat] })
  }, [elements.relationshipArc, onUpdateRomanceElements])

  const handleUpdateBeat = useCallback((id: string, updates: Partial<RelationshipBeat>) => {
    const updated = elements.relationshipArc.map(b => b.id === id ? { ...b, ...updates } : b)
    onUpdateRomanceElements({ relationshipArc: updated })
  }, [elements.relationshipArc, onUpdateRomanceElements])

  const handleDeleteBeat = useCallback((id: string) => {
    onUpdateRomanceElements({ relationshipArc: elements.relationshipArc.filter(b => b.id !== id) })
  }, [elements.relationshipArc, onUpdateRomanceElements])

  // Trope handlers
  const handleToggleTrope = useCallback((id: string) => {
    const updated = elements.tropes.map(t =>
      t.id === id ? { ...t, isActive: !t.isActive } : t
    )
    onUpdateRomanceElements({ tropes: updated })
  }, [elements.tropes, onUpdateRomanceElements])

  const handleAddTrope = useCallback((trope: Omit<RomanceTrope, 'id'>) => {
    const newTrope: RomanceTrope = { ...trope, id: crypto.randomUUID() }
    onUpdateRomanceElements({ tropes: [...elements.tropes, newTrope] })
  }, [elements.tropes, onUpdateRomanceElements])

  // Chemistry handlers
  const handleUpdateChemistry = useCallback((chapterId: string, updates: Partial<ChapterChemistry>) => {
    const existing = elements.chemistryScores.find(c => c.chapterId === chapterId)
    if (existing) {
      const updated = elements.chemistryScores.map(c =>
        c.chapterId === chapterId ? { ...c, ...updates } : c
      )
      onUpdateRomanceElements({ chemistryScores: updated })
    } else {
      onUpdateRomanceElements({
        chemistryScores: [...elements.chemistryScores, updates as ChapterChemistry]
      })
    }
  }, [elements.chemistryScores, onUpdateRomanceElements])

  // Protagonist handlers
  const handleSetProtagonists = useCallback((aId: string | null, bId: string | null) => {
    onUpdateRomanceElements({
      protagonistAId: aId || '',
      protagonistBId: bId || '',
    })
  }, [onUpdateRomanceElements])

  // Stats for overview
  const stats = useMemo(() => {
    const activeTropes = elements.tropes.filter(t => t.isActive).length
    const beatCount = elements.relationshipArc.length
    const hasHEA = elements.relationshipArc.some(b => b.type === 'hea')
    const hasBlackMoment = elements.relationshipArc.some(b => b.type === 'black-moment')
    const hasMeetCute = elements.relationshipArc.some(b => b.type === 'meet-cute')

    return {
      activeTropes,
      beatCount,
      hasHEA,
      hasBlackMoment,
      hasMeetCute,
      heatLevel: elements.heatLevel,
      conflictType: elements.conflictType,
      hasProtagonists: !!protagonistA && !!protagonistB,
    }
  }, [elements, protagonistA, protagonistB])

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Heart },
    { id: 'arc', label: 'Relationship Arc', icon: TrendingUp, count: elements.relationshipArc.length },
    { id: 'pov', label: 'Dual POV', icon: Users },
    { id: 'tropes', label: 'Tropes', icon: Tag, count: elements.tropes.filter(t => t.isActive).length },
    { id: 'chemistry', label: 'Chemistry', icon: Flame },
  ] as const

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-surface-elevated">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-pink-500 text-white'
                  : 'text-text-secondary hover:bg-surface hover:text-text-primary'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {'count' in tab && tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-surface-elevated'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface-elevated rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-pink-400" />
                  <span className="text-sm text-text-secondary">Protagonists</span>
                </div>
                <div className="text-lg font-bold">
                  {stats.hasProtagonists ? (
                    <span className="text-success">Set</span>
                  ) : (
                    <span className="text-warning">Not Set</span>
                  )}
                </div>
                {stats.hasProtagonists && (
                  <div className="text-xs text-text-secondary truncate">
                    {protagonistA?.name} & {protagonistB?.name}
                  </div>
                )}
              </div>

              <div className="bg-surface-elevated rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  <span className="text-sm text-text-secondary">Arc Beats</span>
                </div>
                <div className="text-2xl font-bold">{stats.beatCount}</div>
                <div className="text-xs text-text-secondary">relationship moments</div>
              </div>

              <div className="bg-surface-elevated rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-5 w-5 text-purple-400" />
                  <span className="text-sm text-text-secondary">Tropes</span>
                </div>
                <div className="text-2xl font-bold">{stats.activeTropes}</div>
                <div className="text-xs text-text-secondary">active tropes</div>
              </div>

              <div className="bg-surface-elevated rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="h-5 w-5 text-red-400" />
                  <span className="text-sm text-text-secondary">Heat Level</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      onClick={() => onUpdateRomanceElements({ heatLevel: level as 1|2|3|4|5 })}
                      className={`text-lg ${
                        level <= stats.heatLevel ? 'text-red-400' : 'text-text-secondary/30'
                      }`}
                    >
                      🌶️
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Arc Checklist */}
            <div className="bg-surface-elevated rounded-lg p-4 border border-border">
              <h3 className="font-medium mb-3">Romance Arc Checklist</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { key: 'hasMeetCute', label: 'Meet Cute', status: stats.hasMeetCute },
                  { key: 'hasBlackMoment', label: 'Black Moment', status: stats.hasBlackMoment },
                  { key: 'hasHEA', label: 'HEA/HFN', status: stats.hasHEA },
                ].map(item => (
                  <div
                    key={item.key}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      item.status
                        ? 'bg-success/10 text-success border border-success/30'
                        : 'bg-surface text-text-secondary border border-border'
                    }`}
                  >
                    <span>{item.status ? '✓' : '○'}</span>
                    <span className="text-sm">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conflict Type */}
            <div className="bg-surface-elevated rounded-lg p-4 border border-border">
              <h3 className="font-medium mb-3">Central Conflict</h3>
              <div className="flex gap-2">
                {(['internal', 'external', 'both'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => onUpdateRomanceElements({ conflictType: type })}
                    className={`px-4 py-2 rounded-lg text-sm capitalize ${
                      elements.conflictType === type
                        ? 'bg-pink-500 text-white'
                        : 'bg-surface border border-border hover:border-pink-500/50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-secondary mt-2">
                {elements.conflictType === 'internal'
                  ? 'The obstacles come from within the characters (fears, baggage, trust issues)'
                  : elements.conflictType === 'external'
                  ? 'The obstacles come from outside (circumstances, other people, society)'
                  : 'Both internal growth and external obstacles challenge the relationship'}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'arc' && (
          <RelationshipArcTracker
            beats={elements.relationshipArc}
            chapters={chapters}
            protagonistA={protagonistA}
            protagonistB={protagonistB}
            onAddBeat={handleAddBeat}
            onUpdateBeat={handleUpdateBeat}
            onDeleteBeat={handleDeleteBeat}
          />
        )}

        {activeTab === 'pov' && (
          <DualPOVManager
            protagonistA={protagonistA}
            protagonistB={protagonistB}
            chapters={chapters}
            beats={elements.relationshipArc}
            onSetProtagonists={handleSetProtagonists}
            characters={characters}
          />
        )}

        {activeTab === 'tropes' && (
          <TropeSelector
            tropes={elements.tropes}
            onToggleTrope={handleToggleTrope}
            onAddTrope={handleAddTrope}
          />
        )}

        {activeTab === 'chemistry' && (
          <ChemistryMeter
            chemistryData={elements.chemistryScores}
            chapters={chapters}
            onUpdateChemistry={handleUpdateChemistry}
          />
        )}
      </div>
    </div>
  )
}
