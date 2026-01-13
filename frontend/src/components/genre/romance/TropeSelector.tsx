import { useState } from 'react'
import { Tag, Check, Plus, X } from 'lucide-react'
import type { RomanceTrope } from '@/types/project'

interface TropeSelectorProps {
  tropes: RomanceTrope[]
  onToggleTrope: (id: string) => void
  onAddTrope: (trope: Omit<RomanceTrope, 'id'>) => void
}

const COMMON_TROPES = [
  { name: 'Enemies to Lovers', description: 'Characters who start as adversaries develop romantic feelings' },
  { name: 'Friends to Lovers', description: 'Longtime friends realize they have deeper feelings' },
  { name: 'Second Chance Romance', description: 'Former lovers reunite and rekindle their relationship' },
  { name: 'Fake Dating', description: 'Characters pretend to date, then develop real feelings' },
  { name: 'Forced Proximity', description: 'Characters are stuck together and romance develops' },
  { name: 'Slow Burn', description: 'Romance develops gradually over a long period' },
  { name: 'Opposites Attract', description: 'Very different personalities find love together' },
  { name: 'Love Triangle', description: 'Three characters entangled in romantic tensions' },
  { name: 'Forbidden Love', description: 'Romance that society or circumstances don\'t allow' },
  { name: 'Grumpy x Sunshine', description: 'A pessimist falls for an optimist' },
  { name: 'Only One Bed', description: 'Characters must share sleeping space, leading to tension' },
  { name: 'Marriage of Convenience', description: 'Characters marry for practical reasons, love follows' },
  { name: 'Secret Identity', description: 'One character hides who they really are' },
  { name: 'Billionaire Romance', description: 'Wealthy protagonist in a romance' },
  { name: 'Small Town Romance', description: 'Love story set in a close-knit community' },
  { name: 'Workplace Romance', description: 'Characters fall in love at work' },
  { name: 'Childhood Sweethearts', description: 'Characters knew each other as children' },
  { name: 'Age Gap', description: 'Significant age difference between protagonists' },
  { name: 'Brother\'s Best Friend', description: 'Falling for someone close to family' },
  { name: 'Rescue Romance', description: 'One character saves the other' },
]

export function TropeSelector({
  tropes,
  onToggleTrope,
  onAddTrope,
}: TropeSelectorProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newTrope, setNewTrope] = useState({ name: '', description: '' })
  const [showCommon, setShowCommon] = useState(true)

  const activeTropes = tropes.filter(t => t.isActive)
  const inactiveTropes = tropes.filter(t => !t.isActive)

  // Find common tropes not yet added
  const availableCommonTropes = COMMON_TROPES.filter(
    ct => !tropes.some(t => t.name.toLowerCase() === ct.name.toLowerCase())
  )

  const handleAddCommonTrope = (commonTrope: typeof COMMON_TROPES[0]) => {
    onAddTrope({
      name: commonTrope.name,
      description: commonTrope.description,
      isActive: true,
    })
  }

  const handleAddCustomTrope = () => {
    if (!newTrope.name) return
    onAddTrope({
      name: newTrope.name,
      description: newTrope.description,
      isActive: true,
    })
    setNewTrope({ name: '', description: '' })
    setIsAdding(false)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-pink-400" />
          <h3 className="font-medium">Romance Tropes</h3>
          <span className="text-xs bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded-full">
            {activeTropes.length} active
          </span>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/20 text-pink-400 rounded-lg hover:bg-pink-500/30 text-sm"
        >
          <Plus className="h-4 w-4" />
          Custom Trope
        </button>
      </div>

      {/* Add Custom Trope Form */}
      {isAdding && (
        <div className="bg-pink-500/10 rounded-lg p-4 border border-pink-500/30 space-y-3">
          <h4 className="font-medium text-pink-400">Add Custom Trope</h4>
          <input
            type="text"
            value={newTrope.name}
            onChange={(e) => setNewTrope(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Trope name..."
            className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-sm"
          />
          <textarea
            value={newTrope.description}
            onChange={(e) => setNewTrope(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description..."
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm resize-none"
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCustomTrope}
              disabled={!newTrope.name}
              className="px-3 py-1.5 bg-pink-500 text-white rounded-lg text-sm disabled:opacity-50"
            >
              Add Trope
            </button>
          </div>
        </div>
      )}

      {/* Active Tropes */}
      {activeTropes.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-secondary mb-2">Active in Your Story</h4>
          <div className="flex flex-wrap gap-2">
            {activeTropes.map((trope) => (
              <div
                key={trope.id}
                className="flex items-center gap-2 bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded-lg px-3 py-1.5"
              >
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">{trope.name}</span>
                <button
                  onClick={() => onToggleTrope(trope.id)}
                  className="p-0.5 hover:bg-pink-500/30 rounded"
                  title="Deactivate"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inactive/Added Tropes */}
      {inactiveTropes.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-secondary mb-2">Available (Click to Activate)</h4>
          <div className="flex flex-wrap gap-2">
            {inactiveTropes.map((trope) => (
              <button
                key={trope.id}
                onClick={() => onToggleTrope(trope.id)}
                className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-1.5 hover:border-pink-500/50 transition-colors group"
              >
                <span className="text-sm">{trope.name}</span>
                <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Common Tropes Library */}
      <div>
        <button
          onClick={() => setShowCommon(!showCommon)}
          className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-2 hover:text-text-primary"
        >
          {showCommon ? '▼' : '▶'} Common Romance Tropes
          <span className="text-xs bg-surface-elevated px-2 py-0.5 rounded-full">
            {availableCommonTropes.length} available
          </span>
        </button>

        {showCommon && availableCommonTropes.length > 0 && (
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
            {availableCommonTropes.map((trope, index) => (
              <button
                key={index}
                onClick={() => handleAddCommonTrope(trope)}
                className="text-left bg-surface rounded-lg p-3 border border-border hover:border-pink-500/50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{trope.name}</span>
                  <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-pink-400" />
                </div>
                <p className="text-xs text-text-secondary mt-1">{trope.description}</p>
              </button>
            ))}
          </div>
        )}

        {showCommon && availableCommonTropes.length === 0 && (
          <p className="text-sm text-text-secondary">
            You've added all common tropes! Add custom tropes above.
          </p>
        )}
      </div>
    </div>
  )
}
