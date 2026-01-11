import { useState } from 'react'
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  FileText,
  Mic,
  Eye,
  SkipForward,
  Wand2
} from 'lucide-react'
import type {
  Scene,
  Chapter,
  Character,
  SceneGenerationResult,
  GenerationCheckpoint,
  CharacterVoiceDNA
} from '@/types/project'

interface GuidedGenerationPanelProps {
  chapter: Chapter
  scenes: Scene[]
  characters: Character[]
  voiceDNA: Record<string, CharacterVoiceDNA>
  generationResults: Record<string, SceneGenerationResult>
  currentCheckpoint: GenerationCheckpoint | null
  onGenerateScene: (sceneId: string) => void
  onApproveGeneration: (sceneId: string) => void
  onRejectGeneration: (sceneId: string, feedback?: string) => void
  onRegenerateScene: (sceneId: string) => void
  onSkipScene: (sceneId: string) => void
  onFinalize: () => void
  isGenerating?: boolean
  generatingSceneId?: string
}

interface SceneGenerationCardProps {
  scene: Scene
  index: number
  result: SceneGenerationResult | null
  characters: Character[]
  voiceDNA: Record<string, CharacterVoiceDNA>
  isGenerating: boolean
  isCurrentScene: boolean
  onGenerate: () => void
  onApprove: () => void
  onReject: (feedback?: string) => void
  onRegenerate: () => void
  onSkip: () => void
}

function SceneGenerationCard({
  scene,
  index,
  result,
  characters,
  voiceDNA,
  isGenerating,
  isCurrentScene,
  onGenerate,
  onApprove,
  onReject,
  onRegenerate,
  onSkip
}: SceneGenerationCardProps) {
  const [showRejectFeedback, setShowRejectFeedback] = useState(false)
  const [rejectFeedback, setRejectFeedback] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  // Get characters involved in this scene
  const sceneCharacters = characters.filter(c =>
    scene.charactersPresent?.includes(c.id)
  )

  // Check voice match scores
  const voiceIssues = result?.voiceMatchScores
    ? Object.entries(result.voiceMatchScores)
        .filter(([, score]) => score < 0.7)
        .map(([charId, score]) => {
          const char = characters.find(c => c.id === charId)
          return { name: char?.name || 'Unknown', score }
        })
    : []

  const getStatusBadge = () => {
    if (!result) {
      if (isGenerating && isCurrentScene) {
        return (
          <span className="flex items-center gap-1 text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Generating...
          </span>
        )
      }
      return (
        <span className="text-xs bg-surface-elevated text-text-secondary px-2 py-0.5 rounded">
          Pending
        </span>
      )
    }

    switch (result.status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        )
      case 'rejected':
        return (
          <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        )
      case 'needs_revision':
        return (
          <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
            <AlertTriangle className="w-3 h-3" />
            Needs Revision
          </span>
        )
      case 'pending_review':
        return (
          <span className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
            <Eye className="w-3 h-3" />
            Ready for Review
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className={`card ${isCurrentScene ? 'ring-2 ring-accent' : ''}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center">
              {index + 1}
            </span>
            <div>
              <h4 className="font-medium text-text-primary">{scene.title}</h4>
              <p className="text-xs text-text-secondary">
                ~{scene.estimatedWordCount} words estimated
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Scene Purpose */}
        {scene.sceneGoal && (
          <p className="text-sm text-text-secondary mb-3">{scene.sceneGoal}</p>
        )}

        {/* Characters in Scene */}
        {sceneCharacters.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-text-secondary">Characters:</span>
            <div className="flex flex-wrap gap-1">
              {sceneCharacters.map(char => {
                const hasVoice = !!voiceDNA[char.id]
                return (
                  <span
                    key={char.id}
                    className={`text-xs px-2 py-0.5 rounded ${
                      hasVoice
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                    title={hasVoice ? 'Voice DNA available' : 'No voice DNA - dialogue may need review'}
                  >
                    {char.name}
                    {hasVoice && <Mic className="w-3 h-3 inline ml-1" />}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Generation Result */}
        {result && (
          <div className="space-y-3">
            {/* Quality Metrics */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-surface-elevated rounded-lg">
              <div>
                <span className="text-xs text-text-secondary block">Outline Adherence</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        result.outlineAdherenceScore >= 0.8 ? 'bg-green-500' :
                        result.outlineAdherenceScore >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${result.outlineAdherenceScore * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {(result.outlineAdherenceScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div>
                <span className="text-xs text-text-secondary block">Generated</span>
                <span className="text-sm text-text-primary">
                  {result.generatedProse.split(/\s+/).length.toLocaleString()} words
                </span>
              </div>
            </div>

            {/* Voice Match Issues */}
            {voiceIssues.length > 0 && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-xs text-yellow-400 font-medium mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Voice Consistency Warnings
                </p>
                <div className="space-y-1">
                  {voiceIssues.map((issue, i) => (
                    <p key={i} className="text-xs text-text-secondary">
                      {issue.name}: {(issue.score * 100).toFixed(0)}% match
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Continuity Issues */}
            {result.continuityIssues.length > 0 && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-400 font-medium mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Continuity Issues Detected
                </p>
                <ul className="space-y-1">
                  {result.continuityIssues.map((issue, i) => (
                    <li key={i} className="text-xs text-text-secondary">• {issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preview Button */}
            {result.generatedProse && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-accent hover:underline flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
            )}

            {/* Preview Content */}
            {showPreview && result.generatedProse && (
              <div className="max-h-60 overflow-y-auto p-3 bg-surface-elevated rounded-lg border border-border">
                <p className="text-sm text-text-secondary whitespace-pre-wrap font-serif">
                  {result.generatedProse.slice(0, 1000)}
                  {result.generatedProse.length > 1000 && '...'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-border">
          {!result ? (
            <div className="flex gap-2">
              <button
                onClick={onGenerate}
                disabled={isGenerating}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isGenerating && isCurrentScene ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Scene
                  </>
                )}
              </button>
              <button
                onClick={onSkip}
                disabled={isGenerating}
                className="btn-ghost px-3"
                title="Skip this scene"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          ) : result.status === 'pending_review' ? (
            showRejectFeedback ? (
              <div className="space-y-2">
                <textarea
                  value={rejectFeedback}
                  onChange={(e) => setRejectFeedback(e.target.value)}
                  placeholder="What should be different? (optional)"
                  className="input w-full h-20 resize-none text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onReject(rejectFeedback)
                      setRejectFeedback('')
                      setShowRejectFeedback(false)
                    }}
                    className="btn-secondary flex-1 text-red-400"
                  >
                    Reject & Regenerate
                  </button>
                  <button
                    onClick={() => setShowRejectFeedback(false)}
                    className="btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={onApprove}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectFeedback(true)}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )
          ) : result.status === 'approved' ? (
            <div className="flex gap-2">
              <button
                onClick={onRegenerate}
                disabled={isGenerating}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
            </div>
          ) : result.status === 'rejected' ? (
            <button
              onClick={onRegenerate}
              disabled={isGenerating}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function GuidedGenerationPanel({
  chapter: _chapter,
  scenes,
  characters,
  voiceDNA,
  generationResults,
  currentCheckpoint: _currentCheckpoint,
  onGenerateScene,
  onApproveGeneration,
  onRejectGeneration,
  onRegenerateScene,
  onSkipScene,
  onFinalize,
  isGenerating = false,
  generatingSceneId
}: GuidedGenerationPanelProps) {
  // Calculate overall progress
  const approvedCount = Object.values(generationResults).filter(r => r.status === 'approved').length
  const totalScenes = scenes.length
  const progressPercent = totalScenes > 0 ? (approvedCount / totalScenes) * 100 : 0

  // Get current scene to generate (first non-approved scene)
  const currentSceneIndex = scenes.findIndex(s => {
    const result = generationResults[s.id]
    return !result || result.status !== 'approved'
  })

  // Characters without voice DNA
  const missingVoiceDNA = characters.filter(c =>
    scenes.some(s => s.charactersPresent?.includes(c.id)) && !voiceDNA[c.id]
  )

  const allApproved = approvedCount === totalScenes && totalScenes > 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-2">
          <Wand2 className="w-5 h-5 text-accent" />
          Guided Generation
        </h3>
        <p className="text-sm text-text-secondary">
          Generate chapter content scene by scene with human checkpoints
        </p>
      </div>

      {/* Progress Bar */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-secondary">Progress</span>
          <span className="text-sm font-medium text-text-primary">
            {approvedCount} / {totalScenes} scenes approved
          </span>
        </div>
        <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent to-green-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Missing Voice DNA Warning */}
      {missingVoiceDNA.length > 0 && (
        <div className="p-4 bg-yellow-500/10 border-b border-yellow-500/30">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-400 font-medium">Voice DNA Missing</p>
              <p className="text-xs text-text-secondary mt-1">
                These characters don't have voice profiles: {missingVoiceDNA.map(c => c.name).join(', ')}.
                Dialogue may need manual review for consistency.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scene List */}
      <div className="flex-1 overflow-y-auto p-4">
        {scenes.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-50" />
            <p className="text-text-secondary">No scenes in this chapter</p>
            <p className="text-sm text-text-secondary mt-1">
              Add scenes in the Plot section first
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {scenes.map((scene, index) => (
              <SceneGenerationCard
                key={scene.id}
                scene={scene}
                index={index}
                result={generationResults[scene.id] || null}
                characters={characters}
                voiceDNA={voiceDNA}
                isGenerating={isGenerating}
                isCurrentScene={scene.id === generatingSceneId || index === currentSceneIndex}
                onGenerate={() => onGenerateScene(scene.id)}
                onApprove={() => onApproveGeneration(scene.id)}
                onReject={(feedback) => onRejectGeneration(scene.id, feedback)}
                onRegenerate={() => onRegenerateScene(scene.id)}
                onSkip={() => onSkipScene(scene.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Finalize Button */}
      {allApproved && (
        <div className="p-4 border-t border-border bg-green-500/10">
          <button
            onClick={onFinalize}
            className="btn-primary w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-5 h-5" />
            Finalize Chapter Draft
          </button>
          <p className="text-xs text-text-secondary text-center mt-2">
            This will combine all approved scenes into the chapter content
          </p>
        </div>
      )}
    </div>
  )
}

export default GuidedGenerationPanel
