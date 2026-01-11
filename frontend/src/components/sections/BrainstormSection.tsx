import { useState, useEffect, useCallback } from 'react'
import { Lightbulb, Sparkles, MessageSquare, ArrowRight, Check, Send } from 'lucide-react'
import type { Project, BrainstormSession, BrainstormTag, PlotFoundation, CharacterFoundation, SceneFoundation } from '@/types/project'
import { updateProject as updateProjectInDb } from '@/lib/db'
import { useProjectStore } from '@/stores/projectStore'
import { useLanguageStore } from '@/stores/languageStore'
import { cn } from '@/lib/utils'

interface SectionProps {
  project: Project
}

// Tag configuration - base data (labels are translated in the component)
const TAG_CONFIG: { value: BrainstormTag; emoji: string; color: string }[] = [
  { value: 'character', emoji: '🎭', color: 'bg-purple-500' },
  { value: 'setting', emoji: '📍', color: 'bg-blue-500' },
  { value: 'plot', emoji: '⚡', color: 'bg-yellow-500' },
  { value: 'theme', emoji: '💭', color: 'bg-green-500' },
  { value: 'scene', emoji: '🎬', color: 'bg-red-500' },
  { value: 'question', emoji: '❓', color: 'bg-orange-500' },
  { value: 'inspiration', emoji: '✨', color: 'bg-pink-500' },
]

type Phase = 'input' | 'analyzing' | 'questions' | 'foundations' | 'review'

export function BrainstormSection({ project }: SectionProps) {
  const { updateProject, setSaveStatus } = useProjectStore()
  const t = useLanguageStore((state) => state.t)

  // Initialize or load existing brainstorm session
  const [session, setSession] = useState<BrainstormSession>(() => {
    if (project.brainstorm) {
      return project.brainstorm
    }
    return {
      id: crypto.randomUUID(),
      projectId: project.id,
      rawText: '',
      taggedSections: [],
      questionsAsked: [],
      answersGiven: [],
      plotFoundation: null,
      characterFoundation: null,
      sceneFoundation: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      finalized: false,
      version: 1,
    }
  })

  const [phase, setPhase] = useState<Phase>(() => {
    if (session.finalized) return 'review'
    if (session.plotFoundation) return 'foundations'
    if (session.questionsAsked.length > 0) return 'questions'
    return 'input'
  })

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [showPrompts, setShowPrompts] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const [, setIsGenerating] = useState(false)

  // Auto-save
  const saveSession = useCallback(async () => {
    if (!hasChanges) return
    setSaveStatus('saving')

    const updates: Partial<Project> = {
      brainstorm: {
        ...session,
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    }

    try {
      await updateProjectInDb(project.id, updates)
      updateProject(project.id, updates)
      setSaveStatus('saved')
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save brainstorm:', error)
      setSaveStatus('unsaved')
    }
  }, [project.id, session, hasChanges, updateProject, setSaveStatus])

  useEffect(() => {
    if (!hasChanges) return
    const timeout = setTimeout(saveSession, 1000)
    return () => clearTimeout(timeout)
  }, [hasChanges, saveSession])

  // Handle text input
  const handleTextChange = (text: string) => {
    setSession(prev => ({ ...prev, rawText: text }))
    setHasChanges(true)
  }

  // Analyze brainstorm and generate questions
  const handleAnalyze = async () => {
    if (!session.rawText.trim()) return

    setPhase('analyzing')
    setIsGenerating(true)

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentTarget: 'brainstorm',
          action: 'analyze-brainstorm',
          context: {
            specification: project.specification,
            brainstormText: session.rawText,
          },
        }),
      })

      const data = await response.json()

      if (data.status === 'success') {
        // Parse AI response to extract questions
        const questions = data.result.questions || generateDefaultQuestions()
        setSession(prev => ({
          ...prev,
          questionsAsked: questions,
        }))
        setPhase('questions')
        setHasChanges(true)
      }
    } catch (error) {
      console.error('Analysis failed:', error)
      // Fall back to default questions
      setSession(prev => ({
        ...prev,
        questionsAsked: generateDefaultQuestions(),
      }))
      setPhase('questions')
      setHasChanges(true)
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate foundations based on brainstorm and answers
  const handleGenerateFoundations = async () => {
    setIsGenerating(true)

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentTarget: 'brainstorm',
          action: 'generate-foundations',
          context: {
            specification: project.specification,
            brainstormText: session.rawText,
            questions: session.questionsAsked,
            answers: session.answersGiven,
          },
        }),
      })

      const data = await response.json()

      if (data.status === 'success') {
        setSession(prev => ({
          ...prev,
          plotFoundation: data.result.plotFoundation || generateDefaultPlotFoundation(session.rawText),
          characterFoundation: data.result.characterFoundation || generateDefaultCharacterFoundation(session.rawText),
          sceneFoundation: data.result.sceneFoundation || generateDefaultSceneFoundation(session.rawText),
        }))
        setPhase('foundations')
        setHasChanges(true)
      }
    } catch (error) {
      console.error('Foundation generation failed:', error)
      // Generate defaults
      setSession(prev => ({
        ...prev,
        plotFoundation: generateDefaultPlotFoundation(session.rawText),
        characterFoundation: generateDefaultCharacterFoundation(session.rawText),
        sceneFoundation: generateDefaultSceneFoundation(session.rawText),
      }))
      setPhase('foundations')
      setHasChanges(true)
    } finally {
      setIsGenerating(false)
    }
  }

  // Answer current question
  const handleAnswerQuestion = (skip: boolean = false) => {
    const question = session.questionsAsked[currentQuestionIndex]
    if (!question) return

    const answer = {
      questionId: question.id,
      answerText: skip ? '' : currentAnswer,
      skipped: skip,
      timestamp: new Date().toISOString(),
    }

    setSession(prev => ({
      ...prev,
      answersGiven: [...prev.answersGiven, answer],
    }))

    setCurrentAnswer('')
    setHasChanges(true)

    if (currentQuestionIndex < session.questionsAsked.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // All questions answered, generate foundations
      handleGenerateFoundations()
    }
  }

  // Toggle selection on a foundation item
  const togglePlotSeedSelection = (seedId: string) => {
    if (!session.plotFoundation) return
    setSession(prev => ({
      ...prev,
      plotFoundation: {
        ...prev.plotFoundation!,
        keyPlotPoints: prev.plotFoundation!.keyPlotPoints.map(seed =>
          seed.id === seedId ? { ...seed, selected: !seed.selected } : seed
        ),
      },
    }))
    setHasChanges(true)
  }

  const toggleCharacterSeedSelection = (seedId: string) => {
    if (!session.characterFoundation) return
    setSession(prev => ({
      ...prev,
      characterFoundation: {
        ...prev.characterFoundation!,
        identifiedCharacters: prev.characterFoundation!.identifiedCharacters.map(seed =>
          seed.id === seedId ? { ...seed, selected: !seed.selected } : seed
        ),
      },
    }))
    setHasChanges(true)
  }

  const toggleSceneSeedSelection = (seedId: string) => {
    if (!session.sceneFoundation) return
    const updatedEnvisioned = session.sceneFoundation.envisionedScenes.map(seed =>
      seed.id === seedId ? { ...seed, selected: !seed.selected } : seed
    )
    const updatedSuggested = session.sceneFoundation.suggestedScenes.map(seed =>
      seed.id === seedId ? { ...seed, selected: !seed.selected } : seed
    )
    setSession(prev => ({
      ...prev,
      sceneFoundation: {
        ...prev.sceneFoundation!,
        envisionedScenes: updatedEnvisioned,
        suggestedScenes: updatedSuggested,
      },
    }))
    setHasChanges(true)
  }

  // Finalize and send to F2-F4
  const handleFinalize = async () => {
    // Mark session as finalized
    const finalizedSession = { ...session, finalized: true }
    setSession(finalizedSession)

    // TODO: Convert selected seeds to actual Plot Beats, Characters, and Scenes
    // This would update project.plot.beats, project.characters, project.scenes

    setPhase('review')
    setHasChanges(true)
    await saveSession()
  }

  // Render based on current phase
  const renderPhase = () => {
    switch (phase) {
      case 'input':
        return renderInputPhase()
      case 'analyzing':
        return renderAnalyzingPhase()
      case 'questions':
        return renderQuestionsPhase()
      case 'foundations':
        return renderFoundationsPhase()
      case 'review':
        return renderReviewPhase()
    }
  }

  const renderInputPhase = () => {
    const writingPrompts = [
      t.brainstorm.prompts.coreStory,
      t.brainstorm.prompts.mainPeople,
      t.brainstorm.prompts.clearScenes,
      t.brainstorm.prompts.readerFeeling,
      t.brainstorm.prompts.inspiration,
      t.brainstorm.prompts.ownQuestions,
    ]

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-yellow-400" />
              {t.brainstorm.brainstormMode}
            </h1>
            <p className="text-text-secondary mt-1">
              {t.brainstorm.writeFreely}
            </p>
          </div>
          <button
            onClick={() => setShowPrompts(!showPrompts)}
            className="text-sm text-text-secondary hover:text-text-primary"
          >
            {showPrompts ? t.brainstorm.hidePrompts : t.brainstorm.showPrompts}
          </button>
        </div>

        {/* Writing Prompts */}
        {showPrompts && (
          <div className="bg-surface-elevated border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-text-secondary mb-2">{t.brainstorm.needInspiration}</h3>
            <div className="grid grid-cols-2 gap-2">
              {writingPrompts.map((prompt, i) => (
                <p key={i} className="text-sm text-text-secondary/80 italic">• {prompt}</p>
              ))}
            </div>
          </div>
        )}

        {/* Tag Palette */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-text-secondary">{t.brainstorm.optionalTags}</span>
          {TAG_CONFIG.map(tag => (
            <span
              key={tag.value}
              className="px-2 py-1 text-xs rounded-full bg-surface-elevated border border-border text-text-secondary"
            >
              {tag.emoji} {t.brainstorm.tags[tag.value]}
            </span>
          ))}
        </div>

        {/* Main Text Area */}
        <div className="relative">
          <textarea
            value={session.rawText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={t.brainstorm.startWritingPlaceholder}
            className="w-full h-96 p-4 bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-secondary/50 focus:ring-2 focus:ring-accent focus:border-accent outline-none resize-none"
          />
          <div className="absolute bottom-4 right-4 text-sm text-text-secondary">
            {session.rawText.split(/\s+/).filter(Boolean).length} {t.brainstorm.words}
          </div>
        </div>

        {/* Analyze Button */}
        <div className="flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={!session.rawText.trim()}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="h-4 w-4" />
            {t.brainstorm.analyzeAndGenerateQuestions}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  const renderAnalyzingPhase = () => (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent" />
      <p className="text-text-secondary">{t.brainstorm.analyzingBrainstorm}</p>
      <p className="text-sm text-text-secondary/70">{t.brainstorm.findingElements}</p>
    </div>
  )

  const renderQuestionsPhase = () => {
    const currentQuestion = session.questionsAsked[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / session.questionsAsked.length) * 100

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-accent" />
            {t.brainstorm.clarifyVision}
          </h1>
          <p className="text-text-secondary mt-1">
            {t.brainstorm.answerQuestions}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-text-secondary">
            <span>{t.brainstorm.questionOf.replace('{current}', String(currentQuestionIndex + 1)).replace('{total}', String(session.questionsAsked.length))}</span>
            <span>{Math.round(progress)}% {t.brainstorm.complete}</span>
          </div>
          <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
            <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Current Question */}
        {currentQuestion && (
          <div className="card p-6 space-y-4">
            <div className="text-sm text-accent font-medium">{currentQuestion.category}</div>
            <p className="text-lg text-text-primary">{currentQuestion.questionText}</p>

            {currentQuestion.contextQuote && (
              <div className="bg-surface-elevated p-3 rounded-lg border-l-4 border-accent">
                <p className="text-sm text-text-secondary italic">
                  {t.brainstorm.fromYourBrainstorm} "{currentQuestion.contextQuote}"
                </p>
              </div>
            )}

            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder={t.brainstorm.yourThoughts}
              className="w-full h-32 p-3 bg-surface border border-border rounded-lg text-text-primary focus:ring-2 focus:ring-accent focus:border-accent outline-none resize-none"
            />

            <div className="flex justify-between">
              <button
                onClick={() => handleAnswerQuestion(true)}
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                {t.brainstorm.skipQuestion}
              </button>
              <button
                onClick={() => handleAnswerQuestion(false)}
                disabled={!currentAnswer.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {currentQuestionIndex < session.questionsAsked.length - 1 ? t.brainstorm.nextQuestion : t.brainstorm.generateIdeas}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderFoundationsPhase = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-yellow-400" />
          {t.brainstorm.storyFoundations}
        </h1>
        <p className="text-text-secondary mt-1">
          {t.brainstorm.reviewSelect}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plot Foundation */}
        <div className="card p-4 space-y-4">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            📊 {t.brainstorm.plotFoundation}
          </h2>
          {session.plotFoundation && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-text-secondary">{t.brainstorm.premise}</label>
                <p className="text-sm text-text-primary">{session.plotFoundation.premise}</p>
              </div>
              <div>
                <label className="text-xs text-text-secondary">{t.brainstorm.centralConflict}</label>
                <p className="text-sm text-text-primary">{session.plotFoundation.centralConflict}</p>
              </div>
              <div>
                <label className="text-xs text-text-secondary">{t.brainstorm.keyPlotPoints}</label>
                <div className="space-y-2 mt-1">
                  {session.plotFoundation.keyPlotPoints.map(seed => (
                    <label
                      key={seed.id}
                      className={cn(
                        "flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                        seed.selected ? "bg-accent/20 border border-accent" : "bg-surface-elevated border border-transparent hover:border-border"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={seed.selected}
                        onChange={() => togglePlotSeedSelection(seed.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">{seed.title}</span>
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded",
                            seed.confidence === 'explicit' ? 'bg-green-500/20 text-green-400' :
                            seed.confidence === 'inferred' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          )}>
                            {seed.confidence}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary mt-1">{seed.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Character Foundation */}
        <div className="card p-4 space-y-4">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            🎭 {t.brainstorm.characterFoundation}
          </h2>
          {session.characterFoundation && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-text-secondary">{t.brainstorm.identifiedCharacters}</label>
                <div className="space-y-2 mt-1">
                  {session.characterFoundation.identifiedCharacters.map(seed => (
                    <label
                      key={seed.id}
                      className={cn(
                        "flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                        seed.selected ? "bg-accent/20 border border-accent" : "bg-surface-elevated border border-transparent hover:border-border"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={seed.selected}
                        onChange={() => toggleCharacterSeedSelection(seed.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">
                            {seed.name || seed.workingName}
                          </span>
                          <span className="text-xs text-text-secondary">({seed.role})</span>
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded",
                            seed.confidence === 'explicit' ? 'bg-green-500/20 text-green-400' :
                            seed.confidence === 'inferred' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          )}>
                            {seed.confidence}
                          </span>
                        </div>
                        {seed.knownTraits.length > 0 && (
                          <p className="text-xs text-text-secondary mt-1">
                            Traits: {seed.knownTraits.join(', ')}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {session.characterFoundation.missingArchetypes.length > 0 && (
                <div>
                  <label className="text-xs text-text-secondary">{t.brainstorm.suggestedArchetypes}</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {session.characterFoundation.missingArchetypes.map((archetype, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-surface-elevated rounded-full text-text-secondary">
                        + {archetype}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scene Foundation */}
        <div className="card p-4 space-y-4">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            🎬 {t.brainstorm.sceneFoundation}
          </h2>
          {session.sceneFoundation && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-text-secondary">{t.brainstorm.envisionedScenes}</label>
                <div className="space-y-2 mt-1">
                  {session.sceneFoundation.envisionedScenes.map(seed => (
                    <label
                      key={seed.id}
                      className={cn(
                        "flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                        seed.selected ? "bg-accent/20 border border-accent" : "bg-surface-elevated border border-transparent hover:border-border"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={seed.selected}
                        onChange={() => toggleSceneSeedSelection(seed.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-text-primary">{seed.title}</span>
                        <p className="text-xs text-text-secondary mt-1">{seed.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {session.sceneFoundation.keyMoments.length > 0 && (
                <div>
                  <label className="text-xs text-text-secondary">{t.brainstorm.keyMoments}</label>
                  <ul className="list-disc list-inside text-xs text-text-secondary mt-1">
                    {session.sceneFoundation.keyMoments.map((moment, i) => (
                      <li key={i}>{moment}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setPhase('input')}
          className="text-text-secondary hover:text-text-primary"
        >
          ← {t.brainstorm.backToBrainstorm}
        </button>
        <button
          onClick={handleFinalize}
          className="btn-primary flex items-center gap-2"
        >
          <Check className="h-4 w-4" />
          {t.brainstorm.finalizeAndContinue}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  const renderReviewPhase = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
          <Check className="h-8 w-8 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">{t.brainstorm.brainstormComplete}</h1>
        <p className="text-text-secondary mt-2">
          {t.brainstorm.foundationsPrepared}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <a
          href={`/projects/${project.id}/plot`}
          className="card p-4 text-center hover:border-accent transition-colors"
        >
          <div className="text-2xl mb-2">📊</div>
          <div className="font-medium text-text-primary">{t.plot.title}</div>
          <div className="text-xs text-text-secondary mt-1">
            {session.plotFoundation?.keyPlotPoints.filter(s => s.selected).length || 0} {t.brainstorm.seedsReady}
          </div>
        </a>
        <a
          href={`/projects/${project.id}/characters`}
          className="card p-4 text-center hover:border-accent transition-colors"
        >
          <div className="text-2xl mb-2">🎭</div>
          <div className="font-medium text-text-primary">{t.characters.title}</div>
          <div className="text-xs text-text-secondary mt-1">
            {session.characterFoundation?.identifiedCharacters.filter(s => s.selected).length || 0} {t.brainstorm.seedsReady}
          </div>
        </a>
        <a
          href={`/projects/${project.id}/scenes`}
          className="card p-4 text-center hover:border-accent transition-colors"
        >
          <div className="text-2xl mb-2">🎬</div>
          <div className="font-medium text-text-primary">{t.scenes.title}</div>
          <div className="text-xs text-text-secondary mt-1">
            {(session.sceneFoundation?.envisionedScenes.filter(s => s.selected).length || 0) +
             (session.sceneFoundation?.suggestedScenes.filter(s => s.selected).length || 0)} {t.brainstorm.seedsReady}
          </div>
        </a>
      </div>

      <div className="text-center">
        <button
          onClick={() => {
            setSession(prev => ({ ...prev, finalized: false }))
            setPhase('input')
            setHasChanges(true)
          }}
          className="text-text-secondary hover:text-text-primary"
        >
          ← {t.brainstorm.returnToAddMore}
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl pb-12">
      {renderPhase()}
    </div>
  )
}

// Helper functions for generating default content
function generateDefaultQuestions(): import('@/types/project').BrainstormQuestion[] {
  return [
    {
      id: crypto.randomUUID(),
      category: 'Premise',
      questionText: 'What is the central conflict or challenge your protagonist faces?',
      contextQuote: null,
      priority: 1,
    },
    {
      id: crypto.randomUUID(),
      category: 'Character',
      questionText: 'What does your main character want most, and what\'s stopping them?',
      contextQuote: null,
      priority: 2,
    },
    {
      id: crypto.randomUUID(),
      category: 'Ending',
      questionText: 'Do you envision a hopeful ending, a tragic one, or something ambiguous?',
      contextQuote: null,
      priority: 3,
    },
    {
      id: crypto.randomUUID(),
      category: 'Tone',
      questionText: 'What emotional journey do you want readers to experience?',
      contextQuote: null,
      priority: 4,
    },
    {
      id: crypto.randomUUID(),
      category: 'Stakes',
      questionText: 'What happens if the protagonist fails? What\'s truly at risk?',
      contextQuote: null,
      priority: 5,
    },
  ]
}

function generateDefaultPlotFoundation(_brainstormText: string): PlotFoundation {
  return {
    premise: 'A story unfolds with compelling characters facing meaningful challenges.',
    centralConflict: 'The protagonist must overcome obstacles to achieve their goal.',
    suggestedStructure: {
      framework: 'Three-Act Structure',
      reasoning: 'A classic framework that works for most story types.',
    },
    keyPlotPoints: [
      {
        id: crypto.randomUUID(),
        title: 'The Beginning',
        description: 'Establish the world and introduce the protagonist.',
        storyPhase: 'beginning',
        confidence: 'suggested',
        sourceQuote: null,
        selected: true,
      },
      {
        id: crypto.randomUUID(),
        title: 'The Catalyst',
        description: 'An event that disrupts the status quo.',
        storyPhase: 'beginning',
        confidence: 'suggested',
        sourceQuote: null,
        selected: true,
      },
      {
        id: crypto.randomUUID(),
        title: 'The Climax',
        description: 'The protagonist faces their greatest challenge.',
        storyPhase: 'end',
        confidence: 'suggested',
        sourceQuote: null,
        selected: true,
      },
    ],
    potentialSubplots: [],
    openQuestions: ['What specific events drive the plot forward?'],
  }
}

function generateDefaultCharacterFoundation(_brainstormText: string): CharacterFoundation {
  return {
    identifiedCharacters: [
      {
        id: crypto.randomUUID(),
        name: null,
        workingName: 'The Protagonist',
        role: 'protagonist',
        knownTraits: [],
        inferredTraits: ['determined', 'flawed'],
        potentialArc: 'Grows through the challenges they face.',
        keyRelationships: [],
        confidence: 'suggested',
        sourceQuotes: [],
        selected: true,
      },
    ],
    relationshipHints: [],
    missingArchetypes: ['Mentor', 'Antagonist', 'Ally'],
    openQuestions: ['Who opposes the protagonist?', 'Who supports them?'],
  }
}

function generateDefaultSceneFoundation(_brainstormText: string): SceneFoundation {
  return {
    envisionedScenes: [],
    suggestedScenes: [
      {
        id: crypto.randomUUID(),
        title: 'Opening Scene',
        description: 'Introduce the protagonist in their ordinary world.',
        charactersInvolved: ['Protagonist'],
        emotionalBeat: 'Curiosity',
        storyFunction: 'Establish character and setting',
        vividness: 'sketched',
        sourceQuote: null,
        selected: true,
      },
    ],
    keyMoments: ['The inciting incident', 'The point of no return', 'The climax'],
    settingNotes: [],
    openQuestions: ['Where does the story take place?'],
  }
}
