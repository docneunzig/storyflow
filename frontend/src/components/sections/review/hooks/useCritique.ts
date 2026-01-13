import { useState, useCallback } from 'react'
import type { Chapter, ChapterQualityScore, Project } from '@/types/project'
import { useAIGeneration } from '@/hooks/useAIGeneration'
import { useProjectStore } from '@/stores/projectStore'
import { updateProject as updateProjectInDb } from '@/lib/db'
import { QUALITY_DIMENSIONS, type HarshnessLevel } from '../constants'
import type { CritiqueResult, DimensionScore, PrioritizedSuggestion } from '../types'

interface UseCritiqueOptions {
  project: Project
}

// Get feedback text based on harshness level
function getFeedbackText(score: number, dimName: string, harshness: HarshnessLevel): string {
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
}

// Get strengths based on harshness level
function getStrengths(harshness: HarshnessLevel): string[] {
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
}

// Get areas for improvement based on harshness level
function getAreasForImprovement(harshness: HarshnessLevel): string[] {
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
}

export function useCritique({ project }: UseCritiqueOptions) {
  const [critiqueResult, setCritiqueResult] = useState<CritiqueResult | null>(null)
  const [showAIProgress, setShowAIProgress] = useState(false)
  const [harshnessLevel, setHarshnessLevel] = useState<HarshnessLevel>('balanced')

  const updateProject = useProjectStore((state) => state.updateProject)

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

  // Generate mock critique scores
  const generateMockCritique = useCallback((chapter: Chapter, harshness: HarshnessLevel): CritiqueResult => {
    const dimensions: DimensionScore[] = QUALITY_DIMENSIONS.map(dim => {
      const baseScore = 6 + Math.floor(Math.random() * 4)
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

    const overallScore = dimensions.reduce((sum, d) => {
      const dimension = QUALITY_DIMENSIONS.find(dim => dim.id === d.dimensionId)
      const weight = dimension?.weight || (100 / dimensions.length)
      return sum + (d.score * weight / 100)
    }, 0)

    // Generate prioritized suggestions
    const prioritizedSuggestions: PrioritizedSuggestion[] = []
    let suggestionId = 1

    dimensions.forEach(dimScore => {
      const dimension = QUALITY_DIMENSIONS.find(d => d.id === dimScore.dimensionId)
      if (!dimension || dimScore.score >= 9) return

      const scoreDelta = 10 - dimScore.score
      const impactScore = (dimension.weight / 100) * scoreDelta
      const impact: 'high' | 'medium' | 'low' =
        impactScore >= 0.4 ? 'high' : impactScore >= 0.2 ? 'medium' : 'low'

      prioritizedSuggestions.push({
        id: `suggestion-${suggestionId++}`,
        dimensionId: dimension.id,
        dimensionName: dimension.name,
        suggestion: `Focus on improving ${dimension.name.toLowerCase()} in key scenes`,
        impact,
        impactScore,
        reason: `Improving ${dimension.name.toLowerCase()} (${dimension.weight}% weight) will boost overall quality.`,
        status: 'pending',
      })
    })

    prioritizedSuggestions.sort((a, b) => b.impactScore - a.impactScore)

    return {
      chapterId: chapter.id,
      overallScore: Math.round(overallScore * 10) / 10,
      dimensions,
      summary: `Chapter "${chapter.title}" has been analyzed across 12 quality dimensions.`,
      strengths: getStrengths(harshness),
      areasForImprovement: getAreasForImprovement(harshness),
      prioritizedSuggestions,
      generatedAt: new Date().toISOString(),
      harshnessLevel: harshness,
      bestsellerComparison: `Analysis based on ${project.specification?.genre || 'general fiction'} standards.`,
    }
  }, [project.specification?.genre])

  // Parse AI critique response
  const parseAICritique = useCallback((aiResult: string, chapter: Chapter, harshness: HarshnessLevel): CritiqueResult | null => {
    try {
      let jsonStr = aiResult
      const jsonMatch = aiResult.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        jsonStr = jsonMatch[1]
      } else {
        const jsonStart = aiResult.indexOf('{')
        const jsonEnd = aiResult.lastIndexOf('}')
        if (jsonStart !== -1 && jsonEnd !== -1) {
          jsonStr = aiResult.substring(jsonStart, jsonEnd + 1)
        }
      }

      const parsed = JSON.parse(jsonStr)

      // Build dimensions from parsed response
      const dimensions: DimensionScore[] = QUALITY_DIMENSIONS.map(dim => {
        // Find matching dimension in parsed response
        const aiDim = parsed.dimensions?.[dim.id] || parsed.dimensions?.[dim.id.replace(/-/g, '_').toUpperCase()]

        if (aiDim && typeof aiDim.score === 'number') {
          return {
            dimensionId: dim.id,
            score: Math.min(10, Math.max(1, aiDim.score)),
            feedback: aiDim.feedback || getFeedbackText(aiDim.score, dim.name, harshness),
            suggestions: Array.isArray(aiDim.suggestions) ? aiDim.suggestions : [],
          }
        }

        return {
          dimensionId: dim.id,
          score: 7,
          feedback: `Analysis pending for ${dim.name}`,
          suggestions: [],
        }
      })

      const overallScore = parsed.overallScore ?? dimensions.reduce((sum, d) => {
        const dimension = QUALITY_DIMENSIONS.find(dim => dim.id === d.dimensionId)
        const weight = dimension?.weight || (100 / dimensions.length)
        return sum + (d.score * weight / 100)
      }, 0)

      return {
        chapterId: chapter.id,
        overallScore: Math.round(overallScore * 10) / 10,
        dimensions,
        summary: parsed.summary || `AI analysis of Chapter ${chapter.number}: ${chapter.title}`,
        strengths: parsed.overallStrengths || getStrengths(harshness),
        areasForImprovement: parsed.criticalIssues || getAreasForImprovement(harshness),
        prioritizedSuggestions: [],
        generatedAt: new Date().toISOString(),
        harshnessLevel: harshness,
        bestsellerComparison: parsed.marketComparison || `Analysis based on ${project.specification?.genre || 'general fiction'} standards.`,
      }
    } catch (err) {
      console.error('Failed to parse AI critique response:', err)
      return null
    }
  }, [project.specification?.genre])

  const handleGetCritique = useCallback(async (chapter: Chapter) => {
    setShowAIProgress(true)

    const context = {
      chapterContent: chapter.content,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title,
      wordCount: chapter.wordCount,
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
      let critique = parseAICritique(result, chapter, harshnessLevel)
      if (!critique) {
        console.warn('AI response parsing failed, using mock critique')
        critique = generateMockCritique(chapter, harshnessLevel)
      }
      setCritiqueResult(critique)

      // Persist quality score
      const qualityScore: ChapterQualityScore = {
        chapterId: chapter.id,
        revisionNumber: chapter.currentRevision || 1,
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
        specificSuggestions: critique.prioritizedSuggestions.map(s => ({
          id: s.id,
          priority: s.impact === 'high' ? 1 : s.impact === 'medium' ? 2 : 3,
          dimension: s.dimensionId as keyof import('@/types/project').QualityDimensions,
          description: s.suggestion,
          specificText: s.targetPassage || '',
          suggestedChange: s.suggestion,
          status: s.status === 'approved' ? 'approved' as const :
                  s.status === 'rejected' ? 'rejected' as const : 'pending' as const,
        })),
        bestsellerComparison: critique.bestsellerComparison,
      }

      const existingScores = project.qualityScores || []
      const updatedScores = [...existingScores, qualityScore]
      await updateProjectInDb(project.id, { qualityScores: updatedScores })
      updateProject(project.id, { qualityScores: updatedScores })
    }

    setShowAIProgress(false)
  }, [project, harshnessLevel, generate, parseAICritique, generateMockCritique, updateProject])

  const handleCloseAIProgress = useCallback(() => {
    setShowAIProgress(false)
    resetAI()
  }, [resetAI])

  return {
    critiqueResult,
    setCritiqueResult,
    showAIProgress,
    setShowAIProgress,
    harshnessLevel,
    setHarshnessLevel,
    aiStatus,
    aiProgress,
    aiMessage,
    aiError,
    isGenerating,
    cancel,
    handleGetCritique,
    handleCloseAIProgress,
  }
}
