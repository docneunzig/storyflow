import { useState, useMemo, useCallback } from 'react'
import { Search, Users, Sparkles, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'
import type { MysteryElements, Chapter, Character, Clue, RedHerring, Suspect, ChapterTension } from '@/types/project'
import { ClueTracker } from './ClueTracker'
import { SuspectTimeline } from './SuspectTimeline'
import { RedHerringManager } from './RedHerringManager'
import { TensionGraph } from './TensionGraph'

interface MysteryDashboardProps {
  mysteryElements: MysteryElements | null
  chapters: Chapter[]
  characters: Character[]
  onUpdateMysteryElements: (updates: Partial<MysteryElements>) => void
}

type Tab = 'overview' | 'clues' | 'suspects' | 'red-herrings' | 'tension'

export function MysteryDashboard({
  mysteryElements,
  chapters,
  characters,
  onUpdateMysteryElements,
}: MysteryDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  // Initialize mystery elements if null
  const elements: MysteryElements = mysteryElements || {
    clues: [],
    redHerrings: [],
    suspects: [],
    revelationSchedule: [],
    tensionCurve: [],
  }

  // Helper to get character name
  const getCharacterName = useCallback((characterId: string) => {
    const character = characters.find(c => c.id === characterId)
    return character?.name || 'Unknown'
  }, [characters])

  // Clue handlers
  const handleAddClue = useCallback((clue: Omit<Clue, 'id'>) => {
    const newClue: Clue = { ...clue, id: crypto.randomUUID() }
    onUpdateMysteryElements({ clues: [...elements.clues, newClue] })
  }, [elements.clues, onUpdateMysteryElements])

  const handleUpdateClue = useCallback((id: string, updates: Partial<Clue>) => {
    const updatedClues = elements.clues.map(c => c.id === id ? { ...c, ...updates } : c)
    onUpdateMysteryElements({ clues: updatedClues })
  }, [elements.clues, onUpdateMysteryElements])

  const handleDeleteClue = useCallback((id: string) => {
    onUpdateMysteryElements({ clues: elements.clues.filter(c => c.id !== id) })
  }, [elements.clues, onUpdateMysteryElements])

  // Red herring handlers
  const handleAddRedHerring = useCallback((herring: Omit<RedHerring, 'id'>) => {
    const newHerring: RedHerring = { ...herring, id: crypto.randomUUID() }
    onUpdateMysteryElements({ redHerrings: [...elements.redHerrings, newHerring] })
  }, [elements.redHerrings, onUpdateMysteryElements])

  const handleUpdateRedHerring = useCallback((id: string, updates: Partial<RedHerring>) => {
    const updated = elements.redHerrings.map(h => h.id === id ? { ...h, ...updates } : h)
    onUpdateMysteryElements({ redHerrings: updated })
  }, [elements.redHerrings, onUpdateMysteryElements])

  const handleDeleteRedHerring = useCallback((id: string) => {
    onUpdateMysteryElements({ redHerrings: elements.redHerrings.filter(h => h.id !== id) })
  }, [elements.redHerrings, onUpdateMysteryElements])

  // Suspect handlers
  const handleAddSuspect = useCallback((suspect: Omit<Suspect, 'id'>) => {
    const newSuspect: Suspect = { ...suspect, id: crypto.randomUUID() }
    onUpdateMysteryElements({ suspects: [...elements.suspects, newSuspect] })
  }, [elements.suspects, onUpdateMysteryElements])

  const handleUpdateSuspect = useCallback((id: string, updates: Partial<Suspect>) => {
    const updated = elements.suspects.map(s => s.id === id ? { ...s, ...updates } : s)
    onUpdateMysteryElements({ suspects: updated })
  }, [elements.suspects, onUpdateMysteryElements])

  const handleDeleteSuspect = useCallback((id: string) => {
    onUpdateMysteryElements({ suspects: elements.suspects.filter(s => s.id !== id) })
  }, [elements.suspects, onUpdateMysteryElements])

  // Tension handlers
  const handleUpdateTension = useCallback((chapterId: string, updates: Partial<ChapterTension>) => {
    const existing = elements.tensionCurve.find(t => t.chapterId === chapterId)
    if (existing) {
      const updated = elements.tensionCurve.map(t =>
        t.chapterId === chapterId ? { ...t, ...updates } : t
      )
      onUpdateMysteryElements({ tensionCurve: updated })
    } else {
      onUpdateMysteryElements({
        tensionCurve: [...elements.tensionCurve, updates as ChapterTension]
      })
    }
  }, [elements.tensionCurve, onUpdateMysteryElements])

  // Stats for overview
  const stats = useMemo(() => {
    const cluesPlanted = elements.clues.filter(c => c.status === 'planted').length
    const cluesRevealed = elements.clues.filter(c => c.status === 'revealed').length
    const criticalClues = elements.clues.filter(c => c.importance === 'critical')
    const criticalRevealed = criticalClues.filter(c => c.status === 'revealed').length
    const activeRedHerrings = elements.redHerrings.filter(h => !h.revealedAsRedHerringInChapterId).length
    const guiltyParty = elements.suspects.find(s => s.isGuilty)
    const clearedSuspects = elements.suspects.filter(s => s.isRevealed && !s.isGuilty).length

    return {
      totalClues: elements.clues.length,
      cluesPlanted,
      cluesRevealed,
      criticalProgress: criticalClues.length > 0 ? `${criticalRevealed}/${criticalClues.length}` : 'N/A',
      redHerringsActive: activeRedHerrings,
      redHerringsTotal: elements.redHerrings.length,
      suspectsTotal: elements.suspects.length,
      clearedSuspects,
      hasGuiltyParty: !!guiltyParty,
      guiltyPartyName: guiltyParty ? getCharacterName(guiltyParty.characterId) : null,
    }
  }, [elements, getCharacterName])

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Search },
    { id: 'clues', label: 'Clues', icon: Search, count: elements.clues.length },
    { id: 'suspects', label: 'Suspects', icon: Users, count: elements.suspects.length },
    { id: 'red-herrings', label: 'Red Herrings', icon: Sparkles, count: elements.redHerrings.length },
    { id: 'tension', label: 'Tension', icon: TrendingUp },
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
                  ? 'bg-accent text-white'
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
                  <Search className="h-5 w-5 text-accent" />
                  <span className="text-sm text-text-secondary">Clues</span>
                </div>
                <div className="text-2xl font-bold">{stats.totalClues}</div>
                <div className="text-xs text-text-secondary">
                  {stats.cluesRevealed} revealed, {stats.cluesPlanted} hidden
                </div>
              </div>

              <div className="bg-surface-elevated rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-error" />
                  <span className="text-sm text-text-secondary">Critical Clues</span>
                </div>
                <div className="text-2xl font-bold">{stats.criticalProgress}</div>
                <div className="text-xs text-text-secondary">revealed</div>
              </div>

              <div className="bg-surface-elevated rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-warning" />
                  <span className="text-sm text-text-secondary">Suspects</span>
                </div>
                <div className="text-2xl font-bold">{stats.suspectsTotal}</div>
                <div className="text-xs text-text-secondary">
                  {stats.clearedSuspects} cleared
                </div>
              </div>

              <div className="bg-surface-elevated rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  <span className="text-sm text-text-secondary">Red Herrings</span>
                </div>
                <div className="text-2xl font-bold">{stats.redHerringsActive}</div>
                <div className="text-xs text-text-secondary">
                  of {stats.redHerringsTotal} active
                </div>
              </div>
            </div>

            {/* Guilty Party Status */}
            <div className={`rounded-lg p-4 border ${
              stats.hasGuiltyParty
                ? 'bg-success/10 border-success/30'
                : 'bg-warning/10 border-warning/30'
            }`}>
              <div className="flex items-center gap-2">
                {stats.hasGuiltyParty ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="font-medium">Guilty party set: {stats.guiltyPartyName}</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    <span className="font-medium">No guilty party designated yet</span>
                  </>
                )}
              </div>
              {!stats.hasGuiltyParty && (
                <p className="text-sm text-text-secondary mt-1">
                  Go to the Suspects tab to mark which suspect is actually guilty.
                </p>
              )}
            </div>

            {/* Quick access to recent items */}
            {elements.clues.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Recent Clues</h3>
                <div className="space-y-2">
                  {elements.clues.slice(-3).reverse().map((clue) => (
                    <div key={clue.id} className="bg-surface rounded-lg p-3 border border-border">
                      <p className="text-sm font-medium">{clue.description}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
                        <span className={`px-1.5 py-0.5 rounded ${
                          clue.importance === 'critical' ? 'bg-error/20 text-error' :
                          clue.importance === 'supporting' ? 'bg-warning/20 text-warning' :
                          'bg-text-secondary/20'
                        }`}>
                          {clue.importance}
                        </span>
                        <span>{clue.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'clues' && (
          <ClueTracker
            clues={elements.clues}
            chapters={chapters}
            onAddClue={handleAddClue}
            onUpdateClue={handleUpdateClue}
            onDeleteClue={handleDeleteClue}
          />
        )}

        {activeTab === 'suspects' && (
          <SuspectTimeline
            suspects={elements.suspects}
            characters={characters}
            chapters={chapters}
            onAddSuspect={handleAddSuspect}
            onUpdateSuspect={handleUpdateSuspect}
            onDeleteSuspect={handleDeleteSuspect}
          />
        )}

        {activeTab === 'red-herrings' && (
          <RedHerringManager
            redHerrings={elements.redHerrings}
            suspects={elements.suspects}
            chapters={chapters}
            onAddRedHerring={handleAddRedHerring}
            onUpdateRedHerring={handleUpdateRedHerring}
            onDeleteRedHerring={handleDeleteRedHerring}
            getCharacterName={getCharacterName}
          />
        )}

        {activeTab === 'tension' && (
          <TensionGraph
            tensionData={elements.tensionCurve}
            chapters={chapters}
            onUpdateTension={handleUpdateTension}
          />
        )}
      </div>
    </div>
  )
}
