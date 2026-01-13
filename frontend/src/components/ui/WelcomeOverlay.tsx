import { useState, useEffect } from 'react'
import { X, BookOpen, Sparkles, Keyboard, Lightbulb, ChevronRight, ChevronLeft } from 'lucide-react'
import { useOnboarding } from '@/hooks/useOnboarding'

interface WelcomeOverlayProps {
  onClose: () => void
}

const WELCOME_STEPS = [
  {
    icon: BookOpen,
    title: 'Welcome to StoryFlow',
    description: 'Your AI-powered novel writing companion. Let\'s take a quick tour of the key features.',
    color: 'bg-accent',
  },
  {
    icon: Sparkles,
    title: 'AI-Assisted Writing',
    description: 'Press Cmd+Enter (or Ctrl+Enter) anywhere to access AI generation. The AI learns from your specification and adapts to your style.',
    color: 'bg-purple-500',
  },
  {
    icon: Lightbulb,
    title: 'Work Your Way Through',
    description: 'Start with Specification, then Brainstorm your ideas. Build your Plot, Characters, and Scenes before Writing your chapters.',
    color: 'bg-success',
  },
  {
    icon: Keyboard,
    title: 'Keyboard Shortcuts',
    description: 'Press ? at any time to see all shortcuts. Use Cmd+1-7 to quickly navigate between sections.',
    color: 'bg-warning',
  },
]

export function WelcomeOverlay({ onClose }: WelcomeOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const { dismissAll } = useOnboarding()

  const handleNext = () => {
    if (currentStep < WELCOME_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = () => {
    dismissAll()
    onClose()
  }

  const handleSkip = () => {
    dismissAll()
    onClose()
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep])

  const step = WELCOME_STEPS[currentStep]
  const Icon = step.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-surface border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface-elevated transition-colors z-10"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-text-secondary" aria-hidden="true" />
        </button>

        {/* Icon header */}
        <div className={`${step.color} p-8 flex justify-center`}>
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <Icon className="h-10 w-10 text-white" aria-hidden="true" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <h2 className="text-xl font-bold text-text-primary mb-3">
            {step.title}
          </h2>
          <p className="text-text-secondary leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 pb-4">
          {WELCOME_STEPS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'bg-accent w-6'
                  : 'bg-border hover:bg-text-secondary'
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Skip tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium"
            >
              {currentStep === WELCOME_STEPS.length - 1 ? (
                'Get Started'
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
