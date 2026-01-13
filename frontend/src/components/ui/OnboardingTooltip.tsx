import { useState, useEffect } from 'react'
import { X, Lightbulb, ChevronRight } from 'lucide-react'
import { useOnboarding, ONBOARDING_CONTENT, type OnboardingStep } from '@/hooks/useOnboarding'
import { cn } from '@/lib/utils'

interface OnboardingTooltipProps {
  step: OnboardingStep
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  showDismissAll?: boolean
}

export function OnboardingTooltip({
  step,
  position = 'bottom',
  className,
  showDismissAll = false,
}: OnboardingTooltipProps) {
  const { shouldShowStep, completeStep, dismissAll } = useOnboarding()
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const content = ONBOARDING_CONTENT[step]

  // Check if should show and add delay for animation
  useEffect(() => {
    if (shouldShowStep(step)) {
      // Small delay before showing for smoother experience
      const timer = setTimeout(() => {
        setIsAnimating(true)
        setIsVisible(true)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [shouldShowStep, step])

  const handleDismiss = () => {
    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
      completeStep(step)
    }, 200)
  }

  const handleDismissAll = () => {
    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
      dismissAll()
    }, 200)
  }

  if (!isVisible) return null

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowClasses = {
    top: 'bottom-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-accent',
    bottom: 'top-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-accent',
    left: 'right-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-accent',
    right: 'left-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-accent',
  }

  return (
    <div
      className={cn(
        'absolute z-40',
        positionClasses[position],
        isAnimating ? 'animate-in fade-in slide-in-from-bottom-2 duration-300' : 'animate-out fade-out duration-200',
        className
      )}
      role="tooltip"
    >
      {/* Arrow */}
      <div
        className={cn(
          'absolute w-0 h-0 border-[6px]',
          arrowClasses[position]
        )}
      />

      {/* Tooltip content */}
      <div className="bg-accent text-white rounded-lg shadow-xl w-72 overflow-hidden">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">{content.title}</h3>
              <p className="text-xs text-white/80 leading-relaxed">
                {content.description}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 rounded hover:bg-white/20 transition-colors flex-shrink-0"
              aria-label="Dismiss tip"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Footer with dismiss options */}
        <div className="px-4 py-2 bg-black/10 flex items-center justify-between">
          <button
            onClick={handleDismiss}
            className="text-xs text-white/70 hover:text-white flex items-center gap-1 transition-colors"
          >
            Got it
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
          </button>
          {showDismissAll && (
            <button
              onClick={handleDismissAll}
              className="text-xs text-white/50 hover:text-white/70 transition-colors"
            >
              Don't show tips
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Wrapper component to position the tooltip relative to a target
interface OnboardingTooltipWrapperProps {
  step: OnboardingStep
  position?: 'top' | 'bottom' | 'left' | 'right'
  children: React.ReactNode
  showDismissAll?: boolean
}

export function OnboardingTooltipWrapper({
  step,
  position = 'bottom',
  children,
  showDismissAll = false,
}: OnboardingTooltipWrapperProps) {
  return (
    <div className="relative inline-block">
      {children}
      <OnboardingTooltip step={step} position={position} showDismissAll={showDismissAll} />
    </div>
  )
}
