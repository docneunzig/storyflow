import { useState, useCallback, useMemo } from 'react'
import {
  AlertTriangle,
  BookOpen,
  Users,
  Mic,
  Gauge,
  MessageSquare,
  Pen,
  Heart,
  Zap,
  Globe,
  Lightbulb,
  Target,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Star,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Check,
  X,
  Play,
  Edit2,
  Save,
  GitCompare,
  ArrowLeft,
  Copy,
  CheckCircle,
  Lock,
  Unlock,
} from 'lucide-react'
import type { Project, Chapter, ChapterQualityScore, QualityDimensions } from '@/types/project'
import { useAIGeneration } from '@/hooks/useAIGeneration'
import { AIProgressModal } from '@/components/ui/AIProgressModal'
import { useProjectStore } from '@/stores/projectStore'
import { updateProject as updateProjectInDb } from '@/lib/db'

interface SectionProps {
  project: Project
}

// The 12 quality dimensions for critique with weights (must sum to 100%)
interface QualityDimension {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  weight: number // Percentage weight for overall score calculation
}

const QUALITY_DIMENSIONS: QualityDimension[] = [
  {
    id: 'plot-coherence',
    name: 'Plot Coherence',
    description: 'How well the story events connect and make logical sense',
    icon: <BookOpen className="h-4 w-4" />,
    color: 'text-blue-400',
    weight: 12, // 12% - highest priority
  },
  {
    id: 'character-consistency',
    name: 'Character Consistency',
    description: 'Characters behave in ways true to their established personalities',
    icon: <Users className="h-4 w-4" />,
    color: 'text-purple-400',
    weight: 10, // 10%
  },
  {
    id: 'character-voice',
    name: 'Character Voice',
    description: 'Each character has a distinct, recognizable way of speaking',
    icon: <Mic className="h-4 w-4" />,
    color: 'text-pink-400',
    weight: 8, // 8%
  },
  {
    id: 'pacing',
    name: 'Pacing',
    description: 'The story moves at an appropriate speed with good rhythm',
    icon: <Gauge className="h-4 w-4" />,
    color: 'text-orange-400',
    weight: 10, // 10%
  },
  {
    id: 'dialogue-quality',
    name: 'Dialogue Quality',
    description: 'Conversations feel natural and serve the story well',
    icon: <MessageSquare className="h-4 w-4" />,
    color: 'text-cyan-400',
    weight: 8, // 8%
  },
  {
    id: 'prose-style',
    name: 'Prose Style',
    description: 'The writing is clear, engaging, and fits the genre',
    icon: <Pen className="h-4 w-4" />,
    color: 'text-emerald-400',
    weight: 10, // 10%
  },
  {
    id: 'emotional-impact',
    name: 'Emotional Impact',
    description: 'The writing evokes intended emotions in readers',
    icon: <Heart className="h-4 w-4" />,
    color: 'text-red-400',
    weight: 10, // 10%
  },
  {
    id: 'tension-management',
    name: 'Tension Management',
    description: 'Tension builds and releases at appropriate moments',
    icon: <Zap className="h-4 w-4" />,
    color: 'text-yellow-400',
    weight: 8, // 8%
  },
  {
    id: 'world-building',
    name: 'World-building',
    description: 'The setting is vivid, consistent, and well-integrated',
    icon: <Globe className="h-4 w-4" />,
    color: 'text-teal-400',
    weight: 6, // 6%
  },
  {
    id: 'theme-expression',
    name: 'Theme Expression',
    description: 'Themes are woven naturally into the narrative',
    icon: <Lightbulb className="h-4 w-4" />,
    color: 'text-amber-400',
    weight: 6, // 6%
  },
  {
    id: 'market-appeal',
    name: 'Market Appeal',
    description: 'The content aligns with genre expectations and reader preferences',
    icon: <Target className="h-4 w-4" />,
    color: 'text-indigo-400',
    weight: 6, // 6%
  },
  {
    id: 'originality',
    name: 'Originality',
    description: 'The story offers fresh ideas or unique perspectives',
    icon: <Sparkles className="h-4 w-4" />,
    color: 'text-fuchsia-400',
    weight: 6, // 6%
  },
]
// Total weights: 12+10+8+10+8+10+10+8+6+6+6+6 = 100%

interface DimensionScore {
  dimensionId: string
  score: number // 1-10
  feedback: string
  suggestions: string[]
}

// Prioritized suggestion with impact level
interface PrioritizedSuggestion {
  id: string
  dimensionId: string
  dimensionName: string
  suggestion: string
  impact: 'high' | 'medium' | 'low'
  impactScore: number // Calculated score for sorting
  reason: string
  status: 'pending' | 'approved' | 'rejected' // Approval status
}

interface CritiqueResult {
  chapterId: string
  overallScore: number
  dimensions: DimensionScore[]
  summary: string
  strengths: string[]
  areasForImprovement: string[]
  prioritizedSuggestions: PrioritizedSuggestion[] // Ordered by impact
  generatedAt: string
  harshnessLevel: HarshnessLevel
}

// Harshness levels for critique feedback
type HarshnessLevel = 'gentle-mentor' | 'balanced' | 'brutal-honesty'

// Diff result for showing before/after comparison
interface DiffChange {
  id: string
  type: 'insertion' | 'deletion'
  content: string
  suggestionSource: string[]
  accepted: boolean | null // null = pending, true = accepted, false = rejected
}

interface DiffResult {
  originalContent: string
  revisedContent: string
  appliedSuggestions: string[]
  chapterId: string
  generatedAt: string
  changes: DiffChange[]
}

interface HarshnessOption {
  value: HarshnessLevel
  label: string
  description: string
}

const HARSHNESS_OPTIONS: HarshnessOption[] = [
  {
    value: 'gentle-mentor',
    label: 'Gentle Mentor',
    description: 'Encouraging and supportive feedback',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Fair mix of praise and criticism',
  },
  {
    value: 'brutal-honesty',
    label: 'Brutal Honesty',
    description: 'Direct, unfiltered critique',
  },
]

export function ReviewSection({ project }: SectionProps) {
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  const [critiqueResult, setCritiqueResult] = useState<CritiqueResult | null>(null)
  const [showAIProgress, setShowAIProgress] = useState(false)
  const [expandedDimensions, setExpandedDimensions] = useState<Set<string>>(new Set())
  const [harshnessLevel, setHarshnessLevel] = useState<HarshnessLevel>('balanced')
  const [editingSuggestionId, setEditingSuggestionId] = useState<string | null>(null)
  const [editingSuggestionText, setEditingSuggestionText] = useState('')
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null)
  const [showDiffView, setShowDiffView] = useState(false)

  // Get updateProject from store to persist quality scores
  const updateProject = useProjectStore((state) => state.updateProject)

  // Improvement loop state
  const [qualityThreshold, setQualityThreshold] = useState(9.8)
  const [maxIterations, setMaxIterations] = useState(5)
  const [isAutoImproving, setIsAutoImproving] = useState(false)
  const [currentIteration, setCurrentIteration] = useState(0)
  const [improvementHistory, setImprovementHistory] = useState<{ iteration: number; score: number; timestamp: string }[]>([])
  const [iterationLimitWarning, setIterationLimitWarning] = useState<string | null>(null)
  const [showContinueConfirmation, setShowContinueConfirmation] = useState(false)
  const [skipRequested, setSkipRequested] = useState(false)
  const [skippedToFinal, setSkippedToFinal] = useState(false)

  // Locked passages state
  const [lockedPassages, setLockedPassages] = useState<{ start: number; end: number; reason: string }[]>([])
  const [showLockPassageModal, setShowLockPassageModal] = useState(false)
  const [pendingLockSelection, setPendingLockSelection] = useState<{ start: number; end: number; text: string } | null>(null)

  const {
    status: aiStatus,
    progress: aiProgress,
    message: aiMessage,
    error: aiError,
    isGenerating,
    generate,
    cancel,
    reset: resetAI,
  } = useAIGeneration()

  const chapters = useMemo(() => project.chapters || [], [project.chapters])
  const selectedChapter = useMemo(
    () => chapters.find(c => c.id === selectedChapterId),
    [chapters, selectedChapterId]
  )

  // Get feedback text based on harshness level
  const getFeedbackText = useCallback((score: number, dimName: string, harshness: HarshnessLevel): string => {
    const dimLower = dimName.toLowerCase()

    if (harshness === 'gentle-mentor') {
      if (score >= 8) return `Wonderful work on the ${dimLower}! You've done an excellent job here and should be proud of this achievement.`
      if (score >= 6) return `You're making good progress with the ${dimLower}. With a bit more attention, this could really shine. Keep it up!`
      return `The ${dimLower} has potential to grow. Don't be discouraged - every writer faces challenges here. You've got this!`
    }

    if (harshness === 'brutal-honesty') {
      if (score >= 8) return `The ${dimLower} is competent. It meets professional standards.`
      if (score >= 6) return `The ${dimLower} is mediocre. This won't pass muster with discerning readers or agents.`
      return `The ${dimLower} is weak and needs significant work. Readers will notice these problems immediately.`
    }

    // Balanced (default)
    if (score >= 8) return `The ${dimLower} in this chapter is excellent.`
    if (score >= 6) return `The ${dimLower} is solid but could be improved.`
    return `The ${dimLower} needs work.`
  }, [])

  // Get strengths based on harshness level
  const getStrengths = useCallback((harshness: HarshnessLevel): string[] => {
    if (harshness === 'gentle-mentor') {
      return [
        'Your narrative voice is developing beautifully - keep trusting your instincts!',
        'The pacing in your action sequences shows real promise and skill',
        'Your characters have compelling motivations that draw readers in',
      ]
    }
    if (harshness === 'brutal-honesty') {
      return [
        'Narrative voice is consistent',
        'Pacing is functional in action sequences',
        'Character motivations exist',
      ]
    }
    return [
      'Strong narrative voice throughout',
      'Good pacing in action sequences',
      'Compelling character motivations',
    ]
  }, [])

  // Get areas for improvement based on harshness level
  const getAreasForImprovement = useCallback((harshness: HarshnessLevel): string[] => {
    if (harshness === 'gentle-mentor') {
      return [
        'The dialogue has room to grow more natural - perhaps try reading it aloud?',
        'You might explore adding richer world-building details when you feel ready',
        'Consider whether themes could be woven more subtly into the fabric of your story',
      ]
    }
    if (harshness === 'brutal-honesty') {
      return [
        'Dialogue sounds artificial and stilted. Real people don\'t talk this way.',
        'World-building is superficial. The setting feels generic and underdeveloped.',
        'Themes are heavy-handed. Show, don\'t tell. Stop lecturing the reader.',
      ]
    }
    return [
      'Some dialogue could feel more natural',
      'Consider deepening the world-building details',
      'Theme expression could be more subtle',
    ]
  }, [])

  // Generate mock critique scores (in real impl, AI would analyze the chapter)
  const generateMockCritique = useCallback((chapter: Chapter, harshness: HarshnessLevel): CritiqueResult => {
    const dimensions: DimensionScore[] = QUALITY_DIMENSIONS.map(dim => {
      // Generate varied but realistic scores
      const baseScore = 6 + Math.floor(Math.random() * 4) // 6-9
      const score = Math.min(10, Math.max(1, baseScore + (Math.random() > 0.5 ? 1 : -1)))

      return {
        dimensionId: dim.id,
        score: Math.round(score * 10) / 10,
        feedback: getFeedbackText(score, dim.name, harshness),
        suggestions: score < 8 ? [
          `Consider enhancing the ${dim.name.toLowerCase()} by adding more detail`,
          `Review similar successful works for inspiration on ${dim.name.toLowerCase()}`,
        ] : [],
      }
    })

    // Calculate weighted average for overall score
    const overallScore = dimensions.reduce((sum, d) => {
      const dimension = QUALITY_DIMENSIONS.find(dim => dim.id === d.dimensionId)
      const weight = dimension?.weight || (100 / dimensions.length) // Fallback to equal weight
      return sum + (d.score * weight / 100)
    }, 0)

    // Generate prioritized suggestions based on dimension weight and score delta
    // Impact = weight * (10 - score) / 10 — higher weight and lower score = higher impact
    const prioritizedSuggestions: PrioritizedSuggestion[] = []
    let suggestionId = 1

    dimensions.forEach(dimScore => {
      const dimension = QUALITY_DIMENSIONS.find(d => d.id === dimScore.dimensionId)
      if (!dimension || dimScore.score >= 9) return // Skip near-perfect scores

      // Calculate impact score: weight * score deficit
      const scoreDelta = 10 - dimScore.score
      const impactScore = (dimension.weight / 100) * scoreDelta

      // Determine impact level
      const impact: 'high' | 'medium' | 'low' =
        impactScore >= 0.4 ? 'high' :
        impactScore >= 0.2 ? 'medium' : 'low'

      // Generate specific suggestions for each dimension
      const suggestionTemplates = {
        'plot-coherence': [
          'Review cause-and-effect chains between major plot events',
          'Ensure each scene advances the central conflict logically',
        ],
        'character-consistency': [
          'Create a character trait checklist and verify actions align',
          'Review dialogue for voice consistency with established personality',
        ],
        'character-voice': [
          'Give each character unique speech patterns or vocabulary',
          'Read dialogue aloud to test distinctiveness between characters',
        ],
        'pacing': [
          'Vary sentence length to control reading speed',
          'Add breathing room after intense scenes',
        ],
        'dialogue-quality': [
          'Remove small talk that doesn\'t reveal character or advance plot',
          'Add subtext—what characters mean vs. what they say',
        ],
        'prose-style': [
          'Eliminate unnecessary adverbs and strengthen verb choices',
          'Balance showing and telling based on scene importance',
        ],
        'emotional-impact': [
          'Deepen POV character\'s internal reactions to events',
          'Use sensory details to ground emotional moments',
        ],
        'tension-management': [
          'End chapters on unresolved questions or mini-cliffhangers',
          'Vary tension levels—build up, then partial release, then higher peak',
        ],
        'world-building': [
          'Integrate world details through character interaction, not exposition',
          'Add sensory details unique to your setting',
        ],
        'theme-expression': [
          'Let characters embody opposing views on your theme through conflict',
          'Use imagery and symbolism rather than explicit statements',
        ],
        'market-appeal': [
          'Study comparable titles for genre conventions and reader expectations',
          'Ensure your unique elements don\'t alienate the target audience',
        ],
        'originality': [
          'Combine familiar elements in unexpected ways',
          'Subvert a common trope while honoring what readers love about it',
        ],
      }

      const templates = suggestionTemplates[dimension.id as keyof typeof suggestionTemplates] || [
        `Focus on improving ${dimension.name.toLowerCase()} in key scenes`,
      ]

      templates.forEach((template) => {
        prioritizedSuggestions.push({
          id: `suggestion-${suggestionId++}`,
          dimensionId: dimension.id,
          dimensionName: dimension.name,
          suggestion: template,
          impact,
          impactScore,
          reason: `Improving ${dimension.name.toLowerCase()} (${dimension.weight}% weight, score ${dimScore.score.toFixed(1)}/10) will significantly boost overall quality.`,
          status: 'pending', // Initial status
        })
      })
    })

    // Sort by impact score (highest first)
    prioritizedSuggestions.sort((a, b) => b.impactScore - a.impactScore)

    return {
      chapterId: chapter.id,
      overallScore: Math.round(overallScore * 10) / 10,
      dimensions,
      summary: `Chapter "${chapter.title}" has been analyzed across 12 quality dimensions. The overall weighted score is ${overallScore.toFixed(1)}/10 (weights: Plot 12%, Characters 10%, Pacing 10%, etc.).`,
      strengths: getStrengths(harshness),
      areasForImprovement: getAreasForImprovement(harshness),
      prioritizedSuggestions,
      generatedAt: new Date().toISOString(),
      harshnessLevel: harshness,
    }
  }, [getFeedbackText, getStrengths, getAreasForImprovement])

  const handleGetCritique = useCallback(async () => {
    if (!selectedChapter) return

    setShowAIProgress(true)

    // Build context for AI critique
    const context = {
      chapter: {
        number: selectedChapter.number,
        title: selectedChapter.title,
        content: selectedChapter.content,
        wordCount: selectedChapter.wordCount,
      },
      specification: project.specification,
      dimensions: QUALITY_DIMENSIONS.map(d => ({ id: d.id, name: d.name })),
      harshnessLevel,
    }

    const result = await generate({
      agentTarget: 'review',
      action: 'critique-chapter',
      context,
    })

    if (result) {
      // Generate mock critique (in real impl, parse AI result)
      const critique = generateMockCritique(selectedChapter, harshnessLevel)
      setCritiqueResult(critique)

      // Persist quality score to the project for statistics tracking
      const qualityScore: ChapterQualityScore = {
        chapterId: selectedChapter.id,
        revisionNumber: selectedChapter.currentRevision || 1,
        timestamp: new Date().toISOString(),
        dimensions: {
          plotCoherence: critique.dimensions.find(d => d.dimensionId === 'plot-coherence')?.score || 0,
          characterConsistency: critique.dimensions.find(d => d.dimensionId === 'character-consistency')?.score || 0,
          characterVoice: critique.dimensions.find(d => d.dimensionId === 'character-voice')?.score || 0,
          pacing: critique.dimensions.find(d => d.dimensionId === 'pacing')?.score || 0,
          dialogueQuality: critique.dimensions.find(d => d.dimensionId === 'dialogue-quality')?.score || 0,
          proseStyle: critique.dimensions.find(d => d.dimensionId === 'prose-style')?.score || 0,
          emotionalImpact: critique.dimensions.find(d => d.dimensionId === 'emotional-impact')?.score || 0,
          tensionManagement: critique.dimensions.find(d => d.dimensionId === 'tension-management')?.score || 0,
          worldbuildingIntegration: critique.dimensions.find(d => d.dimensionId === 'world-building')?.score || 0,
          themeExpression: critique.dimensions.find(d => d.dimensionId === 'theme-expression')?.score || 0,
          marketAppeal: critique.dimensions.find(d => d.dimensionId === 'market-appeal')?.score || 0,
          originality: critique.dimensions.find(d => d.dimensionId === 'originality')?.score || 0,
        },
        overallScore: critique.overallScore,
        strengths: critique.strengths,
        weaknesses: critique.areasForImprovement,
        specificSuggestions: critique.prioritizedSuggestions.map((s, idx) => ({
          id: s.id,
          priority: idx + 1,
          dimension: s.dimensionId as keyof QualityDimensions,
          description: s.suggestion,
          specificText: '',
          suggestedChange: s.reason,
          status: s.status,
        })),
        bestsellerComparison: '',
      }

      // Update project with new quality score
      const existingScores = project.qualityScores || []
      // Remove any previous score for same chapter/revision
      const filteredScores = existingScores.filter(
        s => !(s.chapterId === selectedChapter.id && s.revisionNumber === (selectedChapter.currentRevision || 1))
      )
      const updatedScores = [...filteredScores, qualityScore]

      // Persist to database and update store
      await updateProjectInDb(project.id, { qualityScores: updatedScores })
      updateProject(project.id, { qualityScores: updatedScores })
    }
  }, [selectedChapter, project.id, project.specification, project.qualityScores, generate, generateMockCritique, harshnessLevel, updateProject])

  const handleCloseAIProgress = useCallback(() => {
    setShowAIProgress(false)
    resetAI()
  }, [resetAI])

  const toggleDimensionExpanded = useCallback((dimensionId: string) => {
    setExpandedDimensions(prev => {
      const next = new Set(prev)
      if (next.has(dimensionId)) {
        next.delete(dimensionId)
      } else {
        next.add(dimensionId)
      }
      return next
    })
  }, [])

  // Approve a suggestion for implementation
  const handleApproveSuggestion = useCallback((suggestionId: string) => {
    setCritiqueResult(prev => {
      if (!prev) return prev
      return {
        ...prev,
        prioritizedSuggestions: prev.prioritizedSuggestions.map(s =>
          s.id === suggestionId ? { ...s, status: 'approved' as const } : s
        ),
      }
    })
  }, [])

  // Reject a suggestion
  const handleRejectSuggestion = useCallback((suggestionId: string) => {
    setCritiqueResult(prev => {
      if (!prev) return prev
      return {
        ...prev,
        prioritizedSuggestions: prev.prioritizedSuggestions.map(s =>
          s.id === suggestionId ? { ...s, status: 'rejected' as const } : s
        ),
      }
    })
  }, [])

  // Start editing a suggestion
  const handleStartEditSuggestion = useCallback((suggestionId: string, currentText: string) => {
    setEditingSuggestionId(suggestionId)
    setEditingSuggestionText(currentText)
  }, [])

  // Save edited suggestion
  const handleSaveEditSuggestion = useCallback(() => {
    if (!editingSuggestionId || !editingSuggestionText.trim()) return

    setCritiqueResult(prev => {
      if (!prev) return prev
      return {
        ...prev,
        prioritizedSuggestions: prev.prioritizedSuggestions.map(s =>
          s.id === editingSuggestionId ? { ...s, suggestion: editingSuggestionText.trim() } : s
        ),
      }
    })
    setEditingSuggestionId(null)
    setEditingSuggestionText('')
  }, [editingSuggestionId, editingSuggestionText])

  // Cancel editing
  const handleCancelEditSuggestion = useCallback(() => {
    setEditingSuggestionId(null)
    setEditingSuggestionText('')
  }, [])

  // Count approved suggestions
  const approvedCount = useMemo(() => {
    return critiqueResult?.prioritizedSuggestions.filter(s => s.status === 'approved').length || 0
  }, [critiqueResult])

  // Handle implementing approved suggestions
  const handleImplementApproved = useCallback(async () => {
    if (!selectedChapter || approvedCount === 0) return

    const approved = critiqueResult?.prioritizedSuggestions.filter(s => s.status === 'approved') || []

    // Store original content before implementation
    const originalContent = selectedChapter.content || ''

    // Show AI progress modal
    setShowAIProgress(true)

    const context = {
      chapter: {
        number: selectedChapter.number,
        title: selectedChapter.title,
        content: selectedChapter.content,
        wordCount: selectedChapter.wordCount,
      },
      approvedSuggestions: approved.map(s => ({
        dimension: s.dimensionName,
        suggestion: s.suggestion,
      })),
    }

    const result = await generate({
      agentTarget: 'review',
      action: 'implement-suggestions',
      context,
    })

    // After AI generation completes, generate mock revised content for demo
    if (result) {
      // In real implementation, this would be the AI-generated revised content
      // For demo, we'll create a mock revision showing improvements
      const revisedContent = generateMockRevisedContent(originalContent, approved)

      // Extract individual changes for per-change acceptance
      const changes = extractChangesFromDiff(originalContent, revisedContent, approved.map(s => s.suggestion))

      setDiffResult({
        originalContent,
        revisedContent,
        appliedSuggestions: approved.map(s => s.suggestion),
        chapterId: selectedChapter.id,
        generatedAt: new Date().toISOString(),
        changes,
      })
      setShowDiffView(true)
    }
  }, [selectedChapter, approvedCount, critiqueResult, generate])

  // Auto-improvement loop - continues until quality threshold is reached
  const handleAutoImprove = useCallback(async () => {
    if (!selectedChapter || !critiqueResult) return

    setIsAutoImproving(true)
    setCurrentIteration(0)
    setImprovementHistory([])
    setIterationLimitWarning(null)
    setSkipRequested(false)
    setSkippedToFinal(false)

    let currentScore = critiqueResult.overallScore
    let iteration = 0

    // Add initial score to history
    setImprovementHistory([{
      iteration: 0,
      score: currentScore,
      timestamp: new Date().toISOString(),
    }])

    while (currentScore < qualityThreshold && iteration < maxIterations) {
      iteration++
      setCurrentIteration(iteration)

      // Auto-approve high priority suggestions
      const highPrioritySuggestions = critiqueResult.prioritizedSuggestions.filter(s => s.status === 'pending')
      if (highPrioritySuggestions.length === 0) break

      // Simulate improvement (in real implementation, would apply changes and re-critique)
      setShowAIProgress(true)
      await generate({
        agentTarget: 'review',
        action: 'auto-improve',
        context: {
          chapter: selectedChapter,
          iteration,
          targetScore: qualityThreshold,
        },
      })

      // Simulate score improvement (mock - increments towards threshold)
      const improvement = Math.random() * 0.8 + 0.2 // Random improvement between 0.2 and 1.0
      currentScore = Math.min(10, currentScore + improvement)

      // Update history
      setImprovementHistory(prev => [...prev, {
        iteration,
        score: Math.round(currentScore * 10) / 10,
        timestamp: new Date().toISOString(),
      }])

      // Update critique result with new score
      setCritiqueResult(prev => prev ? {
        ...prev,
        overallScore: Math.round(currentScore * 10) / 10,
      } : null)

      // Check if we've reached the threshold
      if (currentScore >= qualityThreshold) {
        break
      }
    }

    // Check if we hit the iteration limit without reaching threshold
    if (iteration >= maxIterations && currentScore < qualityThreshold) {
      setIterationLimitWarning(
        `Maximum iterations (${maxIterations}) reached. Score improved from ${critiqueResult.overallScore.toFixed(1)} to ${currentScore.toFixed(1)} but did not reach threshold of ${qualityThreshold}. Consider reviewing manually or adjusting expectations - further improvements may show diminishing returns.`
      )
    }

    setIsAutoImproving(false)
    setShowAIProgress(false)
  }, [selectedChapter, critiqueResult, qualityThreshold, maxIterations, generate])

  // Handle continuing improvement with extended iterations after acknowledging diminishing returns
  const handleContinueRevising = useCallback(() => {
    // User acknowledged diminishing returns, extend the iteration limit
    setMaxIterations(prev => prev + 5) // Add 5 more iterations
    setIterationLimitWarning(null) // Clear the warning
    setShowContinueConfirmation(false)
    // Start auto-improve again (will continue from current score)
    handleAutoImprove()
  }, [handleAutoImprove])

  // Handle skipping to final - accept current state and stop auto-improvement
  const handleSkipToFinal = useCallback(() => {
    setSkipRequested(true)
    setSkippedToFinal(true)
    setIsAutoImproving(false)
    setShowAIProgress(false)
    cancel() // Cancel any ongoing AI generation
  }, [cancel])

  // Handle locking a passage
  const handleLockPassage = useCallback((start: number, end: number, reason: string) => {
    setLockedPassages(prev => [...prev, { start, end, reason }])
    setShowLockPassageModal(false)
    setPendingLockSelection(null)
  }, [])

  // Handle unlocking a passage
  const handleUnlockPassage = useCallback((index: number) => {
    setLockedPassages(prev => prev.filter((_, i) => i !== index))
  }, [])

  // Check if a position is within a locked passage
  const isPositionLocked = useCallback((position: number): boolean => {
    return lockedPassages.some(p => position >= p.start && position <= p.end)
  }, [lockedPassages])

  // Check if text selection overlaps with locked passages
  const isSelectionLocked = useCallback((start: number, end: number): boolean => {
    return lockedPassages.some(p =>
      (start >= p.start && start <= p.end) ||
      (end >= p.start && end <= p.end) ||
      (start <= p.start && end >= p.end)
    )
  }, [lockedPassages])

  // Generate mock revised content based on approved suggestions
  // Respects locked passages - locked text will not be modified
  const generateMockRevisedContent = useCallback((original: string, suggestions: PrioritizedSuggestion[]): string => {
    if (!original) {
      return `[Revised content would appear here based on ${suggestions.length} approved suggestions]`
    }

    // If there are locked passages, we need to protect them during revision
    // Split content into locked and unlocked segments
    const segments: { start: number; end: number; text: string; locked: boolean }[] = []

    if (lockedPassages.length === 0) {
      // No locked passages, entire content is editable
      segments.push({ start: 0, end: original.length, text: original, locked: false })
    } else {
      // Sort locked passages by start position
      const sortedLocked = [...lockedPassages].sort((a, b) => a.start - b.start)

      let currentPos = 0
      for (const locked of sortedLocked) {
        // Add unlocked segment before this locked passage
        if (locked.start > currentPos) {
          segments.push({
            start: currentPos,
            end: locked.start,
            text: original.substring(currentPos, locked.start),
            locked: false,
          })
        }
        // Add the locked segment
        segments.push({
          start: locked.start,
          end: locked.end,
          text: original.substring(locked.start, locked.end),
          locked: true,
        })
        currentPos = locked.end
      }
      // Add remaining unlocked content after last locked passage
      if (currentPos < original.length) {
        segments.push({
          start: currentPos,
          end: original.length,
          text: original.substring(currentPos),
          locked: false,
        })
      }
    }

    // Apply improvements only to unlocked segments
    const revisedSegments = segments.map(segment => {
      if (segment.locked) {
        // Return locked content unchanged
        return segment.text
      }

      // Apply mock improvements to unlocked content
      let revised = segment.text
      suggestions.forEach(suggestion => {
        if (suggestion.dimensionId === 'dialogue-quality') {
          // Mock: Add more subtext to dialogue
          revised = revised.replace(/said\./g, 'said, his voice betraying more than his words.')
        }
        if (suggestion.dimensionId === 'prose-style') {
          // Mock: Strengthen verbs
          revised = revised.replace(/walked/g, 'strode')
          revised = revised.replace(/looked/g, 'gazed')
        }
        if (suggestion.dimensionId === 'emotional-impact') {
          // Mock: Add sensory details
          if (!revised.includes('[sensory detail added]') && revised.length > 50) {
            revised = revised + ' [sensory detail added]'
          }
        }
      })
      return revised
    })

    // Join all segments back together
    let revised = revisedSegments.join('')

    // Add a summary of changes at the end, noting any locked passages
    const lockedCount = lockedPassages.length
    revised += `\n\n---\n[${suggestions.length} improvement(s) applied based on approved suggestions]`
    if (lockedCount > 0) {
      revised += `\n[${lockedCount} passage(s) preserved (locked)]`
    }

    return revised
  }, [lockedPassages])

  // Extract individual changes from diff for per-change acceptance
  const extractChangesFromDiff = useCallback((original: string, revised: string, suggestions: string[]): DiffChange[] => {
    const changes: DiffChange[] = []

    // Find insertions (text in revised but not in original)
    const originalWords = new Set(original.split(/\s+/))
    const revisedWords = revised.split(/\s+/)

    let insertionBuffer: string[] = []
    let changeIdx = 0

    for (const word of revisedWords) {
      if (!originalWords.has(word) || word.includes('[') || word.includes('---')) {
        insertionBuffer.push(word)
      } else if (insertionBuffer.length > 0) {
        // Flush the insertion buffer as a change
        changes.push({
          id: `change-${changeIdx++}`,
          type: 'insertion',
          content: insertionBuffer.join(' '),
          suggestionSource: suggestions,
          accepted: null, // Pending by default
        })
        insertionBuffer = []
      }
    }

    // Flush remaining buffer
    if (insertionBuffer.length > 0) {
      changes.push({
        id: `change-${changeIdx++}`,
        type: 'insertion',
        content: insertionBuffer.join(' '),
        suggestionSource: suggestions,
        accepted: null,
      })
    }

    return changes
  }, [])

  // Simple diff computation to identify inserted text (for revised pane - green highlights)
  const computeInsertionHighlights = useCallback((original: string, revised: string, appliedSuggestions?: string[]): React.ReactNode[] => {
    // Generate tooltip text from applied suggestions
    const tooltipText = appliedSuggestions && appliedSuggestions.length > 0
      ? `Added based on:\n• ${appliedSuggestions.slice(0, 3).join('\n• ')}${appliedSuggestions.length > 3 ? `\n• ...and ${appliedSuggestions.length - 3} more` : ''}`
      : 'Added text based on approved improvements'

    if (!original || !revised) {
      return [<span key="0" className="bg-success/30 text-success cursor-help" title={tooltipText}>{revised}</span>]
    }

    const result: React.ReactNode[] = []
    const originalWords = original.split(/(\s+)/)
    const revisedWords = revised.split(/(\s+)/)

    // Create a Set of original words for quick lookup
    const originalSet = new Set(originalWords)

    let keyIdx = 0
    let insertedBuffer: string[] = []

    const flushInsertedBuffer = () => {
      if (insertedBuffer.length > 0) {
        result.push(
          <span
            key={keyIdx++}
            className="bg-success/30 text-success px-0.5 rounded cursor-help hover:bg-success/50 transition-colors"
            title={tooltipText}
          >
            {insertedBuffer.join('')}
          </span>
        )
        insertedBuffer = []
      }
    }

    // Track position in original to detect truly new content
    let originalIdx = 0

    for (let i = 0; i < revisedWords.length; i++) {
      const word = revisedWords[i]

      // Check if this word exists at or near the expected position in original
      const foundInOriginal = originalIdx < originalWords.length && originalWords[originalIdx] === word

      if (foundInOriginal) {
        flushInsertedBuffer()
        result.push(<span key={keyIdx++}>{word}</span>)
        originalIdx++
      } else if (!originalSet.has(word) || word.includes('[') || word.includes('---')) {
        // This is new/inserted text
        insertedBuffer.push(word)
      } else {
        // Word exists somewhere in original, might be reordered
        flushInsertedBuffer()
        result.push(<span key={keyIdx++}>{word}</span>)
        // Try to find and skip to this position in original
        const foundIdx = originalWords.indexOf(word, originalIdx)
        if (foundIdx !== -1) {
          originalIdx = foundIdx + 1
        }
      }
    }

    flushInsertedBuffer()
    return result
  }, [])

  // Compute deletion highlights for original pane (red highlights for removed text)
  const computeDeletionHighlights = useCallback((original: string, revised: string, appliedSuggestions?: string[]): React.ReactNode[] => {
    // Generate tooltip text for deletions
    const tooltipText = appliedSuggestions && appliedSuggestions.length > 0
      ? `Removed based on:\n• ${appliedSuggestions.slice(0, 3).join('\n• ')}${appliedSuggestions.length > 3 ? `\n• ...and ${appliedSuggestions.length - 3} more` : ''}`
      : 'Removed as part of approved improvements'

    if (!original) {
      return [<span key="0">(No content)</span>]
    }
    if (!revised) {
      return [<span key="0" className="bg-error/30 text-error line-through cursor-help" title={tooltipText}>{original}</span>]
    }

    const result: React.ReactNode[] = []
    const originalWords = original.split(/(\s+)/)
    const revisedWords = revised.split(/(\s+)/)

    // Create a Set of revised words for quick lookup
    const revisedSet = new Set(revisedWords)

    let keyIdx = 0
    let deletedBuffer: string[] = []

    const flushDeletedBuffer = () => {
      if (deletedBuffer.length > 0) {
        result.push(
          <span
            key={keyIdx++}
            className="bg-error/30 text-error line-through px-0.5 rounded cursor-help hover:bg-error/50 transition-colors"
            title={tooltipText}
          >
            {deletedBuffer.join('')}
          </span>
        )
        deletedBuffer = []
      }
    }

    // Track position in revised to detect truly deleted content
    let revisedIdx = 0

    for (let i = 0; i < originalWords.length; i++) {
      const word = originalWords[i]

      // Check if this word exists at or near the expected position in revised
      const foundInRevised = revisedIdx < revisedWords.length && revisedWords[revisedIdx] === word

      if (foundInRevised) {
        flushDeletedBuffer()
        result.push(<span key={keyIdx++}>{word}</span>)
        revisedIdx++
      } else if (!revisedSet.has(word)) {
        // This text was deleted
        deletedBuffer.push(word)
      } else {
        // Word exists somewhere in revised, might be reordered
        flushDeletedBuffer()
        result.push(<span key={keyIdx++}>{word}</span>)
        // Try to find and skip to this position in revised
        const foundIdx = revisedWords.indexOf(word, revisedIdx)
        if (foundIdx !== -1) {
          revisedIdx = foundIdx + 1
        }
      }
    }

    flushDeletedBuffer()
    return result
  }, [])

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-success'
    if (score >= 6) return 'text-warning'
    return 'text-error'
  }

  const getScoreBarColor = (score: number) => {
    if (score >= 8) return 'bg-success'
    if (score >= 6) return 'bg-warning'
    return 'bg-error'
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 mb-6">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Review</h1>
        <p className="text-text-secondary">
          Critique and improve your manuscript with AI-powered analysis across 12 quality dimensions.
        </p>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Chapter Selection Sidebar */}
        <div className="w-72 flex-shrink-0 flex flex-col border border-border rounded-lg bg-surface overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-text-primary">Select Chapter</h2>
            <p className="text-xs text-text-secondary mt-1">
              Choose a chapter to critique
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {chapters.length === 0 ? (
              <div className="p-4 text-center">
                <BookOpen className="h-8 w-8 text-text-secondary mx-auto mb-2" />
                <p className="text-sm text-text-secondary">No chapters to review</p>
                <p className="text-xs text-text-secondary mt-1">
                  Write some chapters first
                </p>
              </div>
            ) : (
              chapters.map(chapter => (
                <button
                  key={chapter.id}
                  onClick={() => setSelectedChapterId(chapter.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedChapterId === chapter.id
                      ? 'bg-accent/20 border border-accent/30'
                      : 'hover:bg-surface-elevated border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Ch. {chapter.number}</span>
                    {chapter.content && (
                      <span className="text-xs text-success">Has content</span>
                    )}
                  </div>
                  <h3 className="font-medium text-text-primary text-sm truncate">
                    {chapter.title}
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">
                    {chapter.wordCount.toLocaleString()} words
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Critique Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedChapter ? (
            <>
              {/* Chapter Header */}
              <div className="flex-shrink-0 p-4 border border-border rounded-lg bg-surface mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Chapter {selectedChapter.number}</p>
                    <h2 className="text-xl font-semibold text-text-primary">
                      {selectedChapter.title}
                    </h2>
                    <p className="text-sm text-text-secondary mt-1">
                      {selectedChapter.wordCount.toLocaleString()} words | Status: {selectedChapter.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Harshness Level Selector */}
                    <div className="flex flex-col items-end">
                      <label htmlFor="harshness-level" className="text-xs text-text-secondary mb-1">
                        Feedback Tone
                      </label>
                      <select
                        id="harshness-level"
                        value={harshnessLevel}
                        onChange={(e) => setHarshnessLevel(e.target.value as HarshnessLevel)}
                        className="px-3 py-1.5 text-sm bg-surface-elevated border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                        aria-label="Critique harshness level"
                      >
                        {HARSHNESS_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleGetCritique}
                      disabled={isGenerating || !selectedChapter.content}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!selectedChapter.content ? "Chapter needs content to critique" : "Get AI critique"}
                    >
                      {critiqueResult ? (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Re-Critique
                        </>
                      ) : (
                        <>
                          <Star className="h-4 w-4" />
                          Get Critique
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Critique Results */}
              {critiqueResult && critiqueResult.chapterId === selectedChapterId ? (
                <div className="flex-1 overflow-y-auto space-y-4">
                  {/* Overall Score */}
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-text-primary">Overall Score</h3>
                      <div className={`text-3xl font-bold ${getScoreColor(critiqueResult.overallScore)}`}>
                        {critiqueResult.overallScore.toFixed(1)}/10
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary">{critiqueResult.summary}</p>
                  </div>

                  {/* Auto-Improve Controls */}
                  <div className="p-4 border border-accent/30 rounded-lg bg-accent/5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-accent flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Auto-Improve Loop
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleAutoImprove}
                          disabled={isGenerating || isAutoImproving || critiqueResult.overallScore >= qualityThreshold}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isAutoImproving ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Improving... ({currentIteration}/{maxIterations})
                            </>
                          ) : skippedToFinal ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Accepted as Final
                            </>
                          ) : critiqueResult.overallScore >= qualityThreshold ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Target Reached!
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              Start Auto-Improve
                            </>
                          )}
                        </button>
                        {isAutoImproving && (
                          <button
                            onClick={handleSkipToFinal}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-success text-success rounded-lg hover:bg-success/10 transition-colors"
                          >
                            <Check className="h-4 w-4" />
                            Skip to Final
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Settings */}
                    <div className="flex items-center gap-6 mb-3">
                      <div className="flex items-center gap-2">
                        <label htmlFor="quality-threshold" className="text-sm text-text-secondary">
                          Quality Threshold:
                        </label>
                        <input
                          id="quality-threshold"
                          type="number"
                          min="1"
                          max="10"
                          step="0.1"
                          value={qualityThreshold}
                          onChange={(e) => setQualityThreshold(parseFloat(e.target.value) || 9.8)}
                          disabled={isAutoImproving}
                          className="w-16 px-2 py-1 text-sm bg-surface border border-border rounded text-text-primary disabled:opacity-50"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label htmlFor="max-iterations" className="text-sm text-text-secondary">
                          Max Iterations:
                        </label>
                        <input
                          id="max-iterations"
                          type="number"
                          min="1"
                          max="20"
                          value={maxIterations}
                          onChange={(e) => setMaxIterations(parseInt(e.target.value) || 5)}
                          disabled={isAutoImproving}
                          className="w-16 px-2 py-1 text-sm bg-surface border border-border rounded text-text-primary disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Status */}
                    <div className="text-sm text-text-secondary">
                      {critiqueResult.overallScore >= qualityThreshold ? (
                        <span className="text-success">
                          ✓ Score {critiqueResult.overallScore.toFixed(1)} meets threshold of {qualityThreshold}
                        </span>
                      ) : (
                        <span>
                          Current: {critiqueResult.overallScore.toFixed(1)} → Target: {qualityThreshold}
                          (gap: {(qualityThreshold - critiqueResult.overallScore).toFixed(1)})
                        </span>
                      )}
                    </div>

                    {/* Improvement History */}
                    {improvementHistory.length > 1 && (
                      <div className="mt-3 pt-3 border-t border-accent/20">
                        <p className="text-xs font-medium text-text-primary mb-2">Improvement History:</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {improvementHistory.map((entry, idx) => (
                            <div
                              key={idx}
                              className={`px-2 py-1 rounded text-xs ${
                                entry.score >= qualityThreshold
                                  ? 'bg-success/20 text-success'
                                  : skippedToFinal && idx === improvementHistory.length - 1
                                  ? 'bg-success/20 text-success border border-success/30'
                                  : 'bg-surface text-text-secondary'
                              }`}
                            >
                              {entry.iteration === 0 ? 'Start' : `#${entry.iteration}`}: {entry.score.toFixed(1)}
                              {skippedToFinal && idx === improvementHistory.length - 1 && ' ✓'}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skipped to Final Success Message */}
                    {skippedToFinal && !isAutoImproving && (
                      <div className="mt-3 p-3 bg-success/10 border border-success/30 rounded-lg">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-success mb-1">Accepted as Final</p>
                            <p className="text-xs text-text-secondary">
                              Current state accepted at score {critiqueResult.overallScore.toFixed(1)}/10.
                              No more improvement suggestions will be queued. You can restart auto-improvement anytime.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Iteration Limit Warning */}
                    {iterationLimitWarning && (
                      <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-warning mb-1">Diminishing Returns Warning</p>
                            <p className="text-xs text-text-secondary mb-3">{iterationLimitWarning}</p>

                            {/* Continue Revising Confirmation */}
                            {!showContinueConfirmation ? (
                              <button
                                onClick={() => setShowContinueConfirmation(true)}
                                className="text-xs px-3 py-1.5 bg-warning/20 text-warning border border-warning/30 rounded hover:bg-warning/30 transition-colors"
                              >
                                Continue Revising Anyway
                              </button>
                            ) : (
                              <div className="p-2 bg-surface border border-border rounded-lg">
                                <p className="text-xs text-text-secondary mb-2">
                                  <strong>Are you sure?</strong> Additional iterations may have diminishing returns.
                                  The AI will try 5 more cycles, but improvements may be minimal.
                                </p>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={handleContinueRevising}
                                    className="text-xs px-3 py-1.5 bg-accent text-white rounded hover:bg-accent/90 transition-colors"
                                  >
                                    Yes, Continue (+5 cycles)
                                  </button>
                                  <button
                                    onClick={() => setShowContinueConfirmation(false)}
                                    className="text-xs px-3 py-1.5 border border-border text-text-secondary rounded hover:bg-surface-elevated transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Locked Passages Section */}
                    <div className="mt-4 pt-4 border-t border-accent/20">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-text-primary flex items-center gap-2">
                          <Lock className="h-4 w-4 text-purple-400" />
                          Locked Passages
                        </h4>
                        <button
                          onClick={() => {
                            // Prompt user to select text in chapter content
                            setPendingLockSelection({ start: 0, end: 50, text: selectedChapter?.content?.substring(0, 50) || 'Sample passage...' })
                            setShowLockPassageModal(true)
                          }}
                          disabled={!selectedChapter?.content}
                          className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                        >
                          + Lock Passage
                        </button>
                      </div>
                      <p className="text-xs text-text-secondary mb-2">
                        Locked passages will not be modified during auto-improvement.
                      </p>
                      {lockedPassages.length === 0 ? (
                        <p className="text-xs text-text-secondary italic">No passages locked</p>
                      ) : (
                        <div className="space-y-2">
                          {lockedPassages.map((passage, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 p-2 bg-purple-500/10 border border-purple-500/20 rounded text-xs"
                            >
                              <Lock className="h-3 w-3 text-purple-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-text-primary font-medium truncate">
                                  "{selectedChapter?.content?.substring(passage.start, Math.min(passage.end, passage.start + 50))}..."
                                </p>
                                <p className="text-text-secondary">
                                  Chars {passage.start}-{passage.end} | {passage.reason}
                                </p>
                              </div>
                              <button
                                onClick={() => handleUnlockPassage(idx)}
                                className="p-1 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 rounded transition-colors"
                                title="Unlock passage"
                              >
                                <Unlock className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 12 Quality Dimensions */}
                  <div className="p-4 border border-border rounded-lg bg-surface">
                    <h3 className="font-semibold text-text-primary mb-4">Quality Dimensions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {QUALITY_DIMENSIONS.map(dimension => {
                        const score = critiqueResult.dimensions.find(d => d.dimensionId === dimension.id)
                        if (!score) return null
                        const isExpanded = expandedDimensions.has(dimension.id)

                        return (
                          <div
                            key={dimension.id}
                            className="p-3 bg-surface-elevated rounded-lg border border-border"
                          >
                            <button
                              onClick={() => toggleDimensionExpanded(dimension.id)}
                              className="w-full text-left"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={dimension.color}>{dimension.icon}</span>
                                  <span className="text-sm font-medium text-text-primary">
                                    {dimension.name}
                                  </span>
                                  <span className="text-xs text-text-secondary bg-surface px-1.5 py-0.5 rounded">
                                    {dimension.weight}%
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-bold ${getScoreColor(score.score)}`}>
                                    {score.score.toFixed(1)}
                                  </span>
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-text-secondary" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-text-secondary" />
                                  )}
                                </div>
                              </div>
                              {/* Score Bar */}
                              <div className="mt-2 h-1.5 bg-surface rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${getScoreBarColor(score.score)} transition-all`}
                                  style={{ width: `${score.score * 10}%` }}
                                />
                              </div>
                            </button>
                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-xs text-text-secondary mb-2">
                                  {score.feedback}
                                </p>
                                {score.suggestions.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium text-text-primary mb-1">Suggestions:</p>
                                    <ul className="text-xs text-text-secondary list-disc list-inside">
                                      {score.suggestions.map((s, i) => (
                                        <li key={i}>{s}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Strengths and Areas for Improvement */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-success/30 bg-success/5 rounded-lg">
                      <h3 className="font-semibold text-success mb-3 flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Strengths
                      </h3>
                      <ul className="space-y-2">
                        {critiqueResult.strengths.map((s, i) => (
                          <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                            <span className="text-success mt-1">+</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 border border-warning/30 bg-warning/5 rounded-lg">
                      <h3 className="font-semibold text-warning mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Areas for Improvement
                      </h3>
                      <ul className="space-y-2">
                        {critiqueResult.areasForImprovement.map((a, i) => (
                          <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                            <span className="text-warning mt-1">!</span>
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Prioritized Suggestions - ordered by impact */}
                  {critiqueResult.prioritizedSuggestions.length > 0 && (
                    <div className="p-4 border border-accent/30 bg-accent/5 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-accent flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Prioritized Suggestions
                          <span className="text-xs font-normal text-text-secondary">
                            (ordered by impact)
                          </span>
                        </h3>
                        {approvedCount > 0 && (
                          <button
                            onClick={handleImplementApproved}
                            disabled={isGenerating}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-success text-white text-sm rounded-lg hover:bg-success/90 transition-colors disabled:opacity-50"
                          >
                            <Play className="h-3.5 w-3.5" />
                            Implement ({approvedCount})
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {critiqueResult.prioritizedSuggestions.slice(0, 10).map((suggestion, index) => (
                          <div
                            key={suggestion.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                              suggestion.status === 'approved'
                                ? 'bg-success/10 border-success/30'
                                : suggestion.status === 'rejected'
                                ? 'bg-surface-elevated/50 border-border opacity-50'
                                : 'bg-surface border-border'
                            }`}
                          >
                            {/* Priority number */}
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              suggestion.status === 'approved'
                                ? 'bg-success/20 text-success'
                                : suggestion.status === 'rejected'
                                ? 'bg-surface-elevated text-text-secondary'
                                : 'bg-accent/20 text-accent'
                            }`}>
                              {suggestion.status === 'approved' ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : suggestion.status === 'rejected' ? (
                                <X className="h-3.5 w-3.5" />
                              ) : (
                                index + 1
                              )}
                            </div>

                            {/* Impact indicator */}
                            <div className="flex-shrink-0 pt-0.5">
                              {suggestion.impact === 'high' && (
                                <div className="flex items-center gap-1 text-error" title="High Impact">
                                  <ArrowUp className="h-4 w-4" />
                                </div>
                              )}
                              {suggestion.impact === 'medium' && (
                                <div className="flex items-center gap-1 text-warning" title="Medium Impact">
                                  <ArrowRight className="h-4 w-4" />
                                </div>
                              )}
                              {suggestion.impact === 'low' && (
                                <div className="flex items-center gap-1 text-text-secondary" title="Low Impact">
                                  <ArrowDown className="h-4 w-4" />
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  suggestion.impact === 'high'
                                    ? 'bg-error/20 text-error'
                                    : suggestion.impact === 'medium'
                                    ? 'bg-warning/20 text-warning'
                                    : 'bg-surface-elevated text-text-secondary'
                                }`}>
                                  {suggestion.impact.toUpperCase()}
                                </span>
                                <span className="text-xs text-text-secondary">
                                  {suggestion.dimensionName}
                                </span>
                                {suggestion.status === 'approved' && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-success/20 text-success">
                                    APPROVED
                                  </span>
                                )}
                                {suggestion.status === 'rejected' && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-surface-elevated text-text-secondary">
                                    REJECTED
                                  </span>
                                )}
                              </div>
                              {/* Editable suggestion text */}
                              {editingSuggestionId === suggestion.id ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editingSuggestionText}
                                    onChange={(e) => setEditingSuggestionText(e.target.value)}
                                    className="w-full p-2 text-sm bg-surface-elevated border border-accent rounded-md text-text-primary resize-none focus:outline-none focus:ring-2 focus:ring-accent"
                                    rows={2}
                                    autoFocus
                                    aria-label="Edit suggestion text"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={handleSaveEditSuggestion}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-success text-white rounded hover:bg-success/90 transition-colors"
                                    >
                                      <Save className="h-3 w-3" />
                                      Save
                                    </button>
                                    <button
                                      onClick={handleCancelEditSuggestion}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-surface-elevated text-text-secondary rounded hover:bg-surface transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className={`text-sm ${suggestion.status === 'rejected' ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                                  {suggestion.suggestion}
                                </p>
                              )}
                              <p className="text-xs text-text-secondary mt-1">
                                {suggestion.reason}
                              </p>
                            </div>

                            {/* Action buttons */}
                            {suggestion.status === 'pending' && editingSuggestionId !== suggestion.id && (
                              <div className="flex-shrink-0 flex items-center gap-1">
                                <button
                                  onClick={() => handleStartEditSuggestion(suggestion.id, suggestion.suggestion)}
                                  className="p-1.5 rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                                  title="Modify suggestion"
                                  aria-label="Modify suggestion"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleApproveSuggestion(suggestion.id)}
                                  className="p-1.5 rounded-md bg-success/10 text-success hover:bg-success/20 transition-colors"
                                  title="Approve for implementation"
                                  aria-label="Approve suggestion"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleRejectSuggestion(suggestion.id)}
                                  className="p-1.5 rounded-md bg-surface-elevated text-text-secondary hover:bg-error/10 hover:text-error transition-colors"
                                  title="Reject suggestion"
                                  aria-label="Reject suggestion"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {critiqueResult.prioritizedSuggestions.length > 10 && (
                        <p className="text-xs text-text-secondary mt-3 text-center">
                          Showing top 10 of {critiqueResult.prioritizedSuggestions.length} suggestions
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Star className="h-12 w-12 text-text-secondary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                      Ready to Critique
                    </h3>
                    <p className="text-text-secondary max-w-md">
                      {selectedChapter.content
                        ? "Click 'Get Critique' to analyze this chapter across 12 quality dimensions."
                        : "This chapter has no content yet. Write some content first to get a critique."}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-text-secondary mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Select a Chapter
                </h3>
                <p className="text-text-secondary">
                  Choose a chapter from the sidebar to get an AI-powered critique.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Progress Modal */}
      <AIProgressModal
        isOpen={showAIProgress}
        onClose={handleCloseAIProgress}
        onCancel={cancel}
        status={aiStatus}
        progress={aiProgress}
        message={aiMessage}
        error={aiError}
        title="Analyzing Chapter"
        onSkipToFinal={isAutoImproving ? handleSkipToFinal : undefined}
      />

      {/* Lock Passage Modal */}
      {showLockPassageModal && pendingLockSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-text-primary">Lock Passage</h2>
              </div>
              <button
                onClick={() => {
                  setShowLockPassageModal(false)
                  setPendingLockSelection(null)
                }}
                className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
              >
                <X className="h-5 w-5 text-text-secondary" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-text-secondary mb-3">
                This passage will be protected from AI modifications during auto-improvement cycles.
              </p>
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg mb-4">
                <p className="text-sm text-text-primary italic">
                  "{pendingLockSelection.text}..."
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  Characters {pendingLockSelection.start} - {pendingLockSelection.end}
                </p>
              </div>
              <div className="mb-4">
                <label htmlFor="lock-reason" className="block text-sm font-medium text-text-primary mb-1">
                  Reason for locking (optional)
                </label>
                <input
                  id="lock-reason"
                  type="text"
                  placeholder="e.g., Perfect dialogue, Author's voice"
                  className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowLockPassageModal(false)
                    setPendingLockSelection(null)
                  }}
                  className="px-4 py-2 border border-border text-text-secondary rounded-lg hover:bg-surface-elevated transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const reasonInput = document.getElementById('lock-reason') as HTMLInputElement
                    handleLockPassage(
                      pendingLockSelection.start,
                      pendingLockSelection.end,
                      reasonInput?.value || 'Protected content'
                    )
                  }}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Lock Passage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diff View Modal */}
      {showDiffView && diffResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl shadow-2xl w-[90vw] max-w-6xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <GitCompare className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    Implementation Preview
                  </h2>
                  <p className="text-sm text-text-secondary">
                    {diffResult.appliedSuggestions.length} suggestion(s) applied
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDiffView(false)}
                className="p-2 rounded-lg hover:bg-surface-elevated transition-colors"
                aria-label="Close diff view"
              >
                <X className="h-5 w-5 text-text-secondary" />
              </button>
            </div>

            {/* Applied Suggestions Summary */}
            <div className="px-4 py-3 bg-surface-elevated/50 border-b border-border">
              <p className="text-xs font-medium text-text-secondary mb-2">Applied Suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {diffResult.appliedSuggestions.slice(0, 5).map((suggestion, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-success/10 text-success rounded-md border border-success/20"
                  >
                    <CheckCircle className="h-3 w-3" />
                    <span className="truncate max-w-[200px]">{suggestion}</span>
                  </span>
                ))}
                {diffResult.appliedSuggestions.length > 5 && (
                  <span className="text-xs text-text-secondary px-2 py-1">
                    +{diffResult.appliedSuggestions.length - 5} more
                  </span>
                )}
              </div>
            </div>

            {/* Diff Content - Side by Side */}
            <div className="flex-1 overflow-hidden flex">
              {/* Original (Left) */}
              <div className="flex-1 flex flex-col border-r border-border">
                <div className="px-4 py-2 bg-error/10 border-b border-border flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4 text-error" />
                  <span className="text-sm font-medium text-error">Original</span>
                  <span className="text-xs text-text-secondary ml-auto">
                    {diffResult.originalContent.length} characters
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <pre className="text-sm text-text-secondary whitespace-pre-wrap font-serif leading-relaxed">
                    {computeDeletionHighlights(diffResult.originalContent, diffResult.revisedContent, diffResult.appliedSuggestions)}
                  </pre>
                </div>
              </div>

              {/* Revised (Right) */}
              <div className="flex-1 flex flex-col">
                <div className="px-4 py-2 bg-success/10 border-b border-border flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-success">Revised</span>
                  <span className="text-xs text-text-secondary ml-auto">
                    {diffResult.revisedContent.length} characters
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <pre className="text-sm text-text-primary whitespace-pre-wrap font-serif leading-relaxed">
                    {computeInsertionHighlights(diffResult.originalContent, diffResult.revisedContent, diffResult.appliedSuggestions)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Individual Changes Section */}
            {diffResult.changes && diffResult.changes.length > 0 && (
              <div className="px-4 py-3 border-t border-border bg-surface-elevated/30">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-text-primary">
                    Individual Changes ({diffResult.changes.filter(c => c.accepted === true).length}/{diffResult.changes.length} accepted)
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setDiffResult(prev => prev ? {
                          ...prev,
                          changes: prev.changes.map(c => ({ ...c, accepted: true }))
                        } : null)
                      }}
                      className="px-2 py-1 text-xs bg-success/10 text-success rounded hover:bg-success/20 transition-colors"
                    >
                      Accept All
                    </button>
                    <button
                      onClick={() => {
                        setDiffResult(prev => prev ? {
                          ...prev,
                          changes: prev.changes.map(c => ({ ...c, accepted: false }))
                        } : null)
                      }}
                      className="px-2 py-1 text-xs bg-error/10 text-error rounded hover:bg-error/20 transition-colors"
                    >
                      Reject All
                    </button>
                  </div>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {diffResult.changes.map((change, idx) => (
                    <div
                      key={change.id}
                      className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                        change.accepted === true
                          ? 'bg-success/10 border-success/30'
                          : change.accepted === false
                          ? 'bg-error/10 border-error/30 opacity-50'
                          : 'bg-surface border-border'
                      }`}
                    >
                      <span className="text-xs text-text-secondary w-8">#{idx + 1}</span>
                      <span className={`flex-1 text-sm truncate ${
                        change.type === 'insertion' ? 'text-success' : 'text-error'
                      }`}>
                        {change.type === 'insertion' ? '+' : '-'} {change.content.slice(0, 60)}{change.content.length > 60 ? '...' : ''}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setDiffResult(prev => prev ? {
                              ...prev,
                              changes: prev.changes.map(c =>
                                c.id === change.id ? { ...c, accepted: true } : c
                              )
                            } : null)
                          }}
                          className={`p-1 rounded transition-colors ${
                            change.accepted === true
                              ? 'bg-success text-white'
                              : 'hover:bg-success/20 text-text-secondary hover:text-success'
                          }`}
                          title="Accept this change"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDiffResult(prev => prev ? {
                              ...prev,
                              changes: prev.changes.map(c =>
                                c.id === change.id ? { ...c, accepted: false } : c
                              )
                            } : null)
                          }}
                          className={`p-1 rounded transition-colors ${
                            change.accepted === false
                              ? 'bg-error text-white'
                              : 'hover:bg-error/20 text-text-secondary hover:text-error'
                          }`}
                          title="Reject this change"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="p-4 border-t border-border flex items-center justify-between">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(diffResult.revisedContent)
                }}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-surface-elevated border border-border rounded-lg hover:bg-surface transition-colors"
              >
                <Copy className="h-4 w-4" />
                Copy Revised
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDiffView(false)}
                  className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Discard Changes
                </button>
                <button
                  onClick={() => {
                    // In real implementation, this would apply only the accepted changes
                    const acceptedCount = diffResult.changes?.filter(c => c.accepted === true).length || 0
                    if (acceptedCount === 0) {
                      // No changes accepted, just close
                      setShowDiffView(false)
                      return
                    }
                    // Apply accepted changes (mock - in real impl would modify content)
                    setShowDiffView(false)
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-success text-white rounded-lg hover:bg-success/90 transition-colors"
                >
                  <Check className="h-4 w-4" />
                  Apply {diffResult.changes?.filter(c => c.accepted === true).length || 0} Change(s)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
