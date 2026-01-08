import { useState, useEffect } from 'react'
import { X, Target } from 'lucide-react'
import type { PlotBeat, PlotFramework, Character, ContentStatus } from '@/types/project'
import { generateId } from '@/lib/db'

interface PlotBeatModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (beat: PlotBeat) => void
  editBeat?: PlotBeat | null
  characters: Character[]
  framework: PlotFramework
}

const FRAMEWORK_POSITIONS: Record<PlotFramework, string[]> = {
  'Three-Act Structure': [
    'Act 1: Setup',
    'Act 1: Inciting Incident',
    'Act 1: First Plot Point',
    'Act 2: Rising Action',
    'Act 2: Midpoint',
    'Act 2: Crisis',
    'Act 2: Second Plot Point',
    'Act 3: Climax',
    'Act 3: Resolution',
  ],
  "Hero's Journey": [
    'Ordinary World',
    'Call to Adventure',
    'Refusal of the Call',
    'Meeting the Mentor',
    'Crossing the Threshold',
    'Tests, Allies, Enemies',
    'Approach to Inmost Cave',
    'Ordeal',
    'Reward',
    'The Road Back',
    'Resurrection',
    'Return with Elixir',
  ],
  'Save the Cat': [
    'Opening Image',
    'Theme Stated',
    'Setup',
    'Catalyst',
    'Debate',
    'Break into Two',
    'B Story',
    'Fun and Games',
    'Midpoint',
    'Bad Guys Close In',
    'All Is Lost',
    'Dark Night of the Soul',
    'Break into Three',
    'Finale',
    'Final Image',
  ],
  'Seven-Point Structure': [
    'Hook',
    'Plot Turn 1',
    'Pinch Point 1',
    'Midpoint',
    'Pinch Point 2',
    'Plot Turn 2',
    'Resolution',
  ],
  'Freeform': [],
}

const STATUS_OPTIONS: ContentStatus[] = ['outline', 'drafted', 'revised', 'locked']

export function PlotBeatModal({
  isOpen,
  onClose,
  onSave,
  editBeat,
  characters,
  framework,
}: PlotBeatModalProps) {
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [detailedDescription, setDetailedDescription] = useState('')
  const [frameworkPosition, setFrameworkPosition] = useState('')
  const [charactersInvolved, setCharactersInvolved] = useState<string[]>([])
  const [location, setLocation] = useState('')
  const [timelinePosition, setTimelinePosition] = useState(1)
  const [emotionalArc, setEmotionalArc] = useState('')
  const [stakes, setStakes] = useState('')
  const [chapterTarget, setChapterTarget] = useState<number | null>(null)
  const [wordCountEstimate, setWordCountEstimate] = useState(2500)
  const [status, setStatus] = useState<ContentStatus>('outline')
  const [userNotes, setUserNotes] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (editBeat) {
        setTitle(editBeat.title)
        setSummary(editBeat.summary)
        setDetailedDescription(editBeat.detailedDescription)
        setFrameworkPosition(editBeat.frameworkPosition)
        setCharactersInvolved(editBeat.charactersInvolved)
        setLocation(editBeat.location || '')
        setTimelinePosition(editBeat.timelinePosition)
        setEmotionalArc(editBeat.emotionalArc)
        setStakes(editBeat.stakes)
        setChapterTarget(editBeat.chapterTarget)
        setWordCountEstimate(editBeat.wordCountEstimate)
        setStatus(editBeat.status)
        setUserNotes(editBeat.userNotes)
      } else {
        // Reset form for new beat
        setTitle('')
        setSummary('')
        setDetailedDescription('')
        setFrameworkPosition(FRAMEWORK_POSITIONS[framework][0] || '')
        setCharactersInvolved([])
        setLocation('')
        setTimelinePosition(1)
        setEmotionalArc('')
        setStakes('')
        setChapterTarget(null)
        setWordCountEstimate(2500)
        setStatus('outline')
        setUserNotes('')
      }
    }
  }, [isOpen, editBeat, framework])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    const beat: PlotBeat = {
      id: editBeat?.id || generateId(),
      frameworkPosition,
      title: title.trim(),
      summary: summary.trim(),
      detailedDescription: detailedDescription.trim(),
      charactersInvolved,
      location: location.trim() || null,
      timelinePosition,
      emotionalArc: emotionalArc.trim(),
      stakes: stakes.trim(),
      foreshadowing: editBeat?.foreshadowing || [],
      payoffs: editBeat?.payoffs || [],
      chapterTarget,
      wordCountEstimate,
      status,
      userNotes: userNotes.trim(),
    }

    onSave(beat)
    onClose()
  }

  const toggleCharacter = (charId: string) => {
    setCharactersInvolved(prev =>
      prev.includes(charId)
        ? prev.filter(id => id !== charId)
        : [...prev, charId]
    )
  }

  if (!isOpen) return null

  const positions = FRAMEWORK_POSITIONS[framework]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="h-5 w-5 text-accent" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-text-primary">
              {editBeat ? 'Edit Plot Beat' : 'New Plot Beat'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-elevated transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-text-secondary" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="beat-title" className="block text-sm font-medium text-text-primary mb-1">
              Beat Title *
            </label>
            <input
              id="beat-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Hero discovers the truth"
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>

          {/* Framework Position (if not freeform) */}
          {framework !== 'Freeform' && positions.length > 0 && (
            <div>
              <label htmlFor="beat-framework" className="block text-sm font-medium text-text-primary mb-1">
                Framework Position
              </label>
              <select
                id="beat-framework"
                value={frameworkPosition}
                onChange={e => setFrameworkPosition(e.target.value)}
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {positions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
          )}

          {/* Summary */}
          <div>
            <label htmlFor="beat-summary" className="block text-sm font-medium text-text-primary mb-1">
              Summary *
            </label>
            <textarea
              id="beat-summary"
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Brief description of what happens in this beat..."
              rows={2}
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              required
            />
          </div>

          {/* Detailed Description */}
          <div>
            <label htmlFor="beat-description" className="block text-sm font-medium text-text-primary mb-1">
              Detailed Description
            </label>
            <textarea
              id="beat-description"
              value={detailedDescription}
              onChange={e => setDetailedDescription(e.target.value)}
              placeholder="More detailed notes about this plot point..."
              rows={3}
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-2 gap-4">
            {/* Timeline Position */}
            <div>
              <label htmlFor="beat-timeline" className="block text-sm font-medium text-text-primary mb-1">
                Timeline Position
              </label>
              <input
                id="beat-timeline"
                type="number"
                value={timelinePosition}
                onChange={e => setTimelinePosition(parseInt(e.target.value) || 1)}
                min={1}
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="beat-status" className="block text-sm font-medium text-text-primary mb-1">
                Status
              </label>
              <select
                id="beat-status"
                value={status}
                onChange={e => setStatus(e.target.value as ContentStatus)}
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Characters Involved */}
          {characters.length > 0 && (
            <div>
              <span id="beat-characters-label" className="block text-sm font-medium text-text-primary mb-2">
                Characters Involved
              </span>
              <div className="flex flex-wrap gap-2" role="group" aria-labelledby="beat-characters-label">
                {characters.map(char => (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => toggleCharacter(char.id)}
                    aria-pressed={charactersInvolved.includes(char.id)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      charactersInvolved.includes(char.id)
                        ? 'bg-accent text-white border-accent'
                        : 'bg-surface-elevated border-border text-text-secondary hover:border-accent/50'
                    }`}
                  >
                    {char.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Location */}
          <div>
            <label htmlFor="beat-location" className="block text-sm font-medium text-text-primary mb-1">
              Location
            </label>
            <input
              id="beat-location"
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Where does this take place?"
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Emotional Arc & Stakes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="beat-emotional-arc" className="block text-sm font-medium text-text-primary mb-1">
                Emotional Arc
              </label>
              <input
                id="beat-emotional-arc"
                type="text"
                value={emotionalArc}
                onChange={e => setEmotionalArc(e.target.value)}
                placeholder="e.g., Fear to hope"
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="beat-stakes" className="block text-sm font-medium text-text-primary mb-1">
                Stakes
              </label>
              <input
                id="beat-stakes"
                type="text"
                value={stakes}
                onChange={e => setStakes(e.target.value)}
                placeholder="What's at risk?"
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* Chapter Target & Word Count */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="beat-chapter" className="block text-sm font-medium text-text-primary mb-1">
                Target Chapter
              </label>
              <input
                id="beat-chapter"
                type="number"
                value={chapterTarget || ''}
                onChange={e => setChapterTarget(e.target.value ? parseInt(e.target.value) : null)}
                min={1}
                placeholder="Optional"
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label htmlFor="beat-word-count" className="block text-sm font-medium text-text-primary mb-1">
                Estimated Words
              </label>
              <input
                id="beat-word-count"
                type="number"
                value={wordCountEstimate}
                onChange={e => setWordCountEstimate(parseInt(e.target.value) || 0)}
                min={0}
                step={100}
                className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {/* User Notes */}
          <div>
            <label htmlFor="beat-notes" className="block text-sm font-medium text-text-primary mb-1">
              Notes
            </label>
            <textarea
              id="beat-notes"
              value={userNotes}
              onChange={e => setUserNotes(e.target.value)}
              placeholder="Personal notes about this beat..."
              rows={2}
              className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !summary.trim()}
              className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editBeat ? 'Save Changes' : 'Create Beat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
