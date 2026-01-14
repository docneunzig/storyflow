import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'
import { calculateProjectPhase } from '@/stores/projectStore'
import { getPhaseProgress, PHASE_RECOMMENDED } from '@/components/layout/Sidebar'
import type { Project } from '@/types/project'
import { cn } from '@/lib/utils'

// Mapping from current section to next section in workflow
const SECTION_NEXT: Record<string, string> = {
  'specification': 'brainstorm',
  'brainstorm': 'plot',
  'plot': 'characters',
  'characters': 'scenes',
  'scenes': 'write',
  'write': 'review',
  'review': 'export',
  'export': 'export', // End of workflow
}

// Section display names (using navItems translation keys)
const SECTION_NAV_KEY: Record<string, string> = {
  'specification': 'specification',
  'brainstorm': 'brainstorm',
  'plot': 'plot',
  'characters': 'characters',
  'scenes': 'scenes',
  'write': 'draft',
  'review': 'review',
  'export': 'export',
}

export interface ValidationStatus {
  isValid: boolean
  warnings: string[]
  errors?: string[]
}

interface NextStepBannerProps {
  currentSection: string
  projectId: string
  project: Project
  validationStatus?: ValidationStatus
  className?: string
}

export function NextStepBanner({
  currentSection,
  projectId,
  project,
  validationStatus,
  className,
}: NextStepBannerProps) {
  const navigate = useNavigate()
  const t = useLanguageStore((state) => state.t)

  // Calculate current phase and progress
  const currentPhase = calculateProjectPhase(project)
  const { percent } = getPhaseProgress(currentPhase)

  // Determine next section
  const nextSection = SECTION_NEXT[currentSection] || 'brainstorm'
  const isEndOfWorkflow = currentSection === 'export'

  // Get recommended section based on phase
  const recommendedSection = PHASE_RECOMMENDED[currentPhase]
  const isOnRecommendedPath = currentSection === recommendedSection || nextSection === recommendedSection

  // Get display name for next section
  const nextSectionNavKey = SECTION_NAV_KEY[nextSection] as keyof typeof t.navItems
  const nextSectionName = t.navItems[nextSectionNavKey] || nextSection

  const handleContinue = () => {
    navigate(`/projects/${projectId}/${nextSection}`)
  }

  // Don't show banner on export page (end of workflow)
  if (isEndOfWorkflow) {
    return null
  }

  const hasWarnings = validationStatus && validationStatus.warnings.length > 0
  const hasErrors = validationStatus && validationStatus.errors && validationStatus.errors.length > 0
  const isComplete = validationStatus?.isValid !== false && !hasWarnings

  return (
    <div
      className={cn(
        'mt-6 p-4 rounded-lg border transition-all',
        isComplete
          ? 'bg-green-500/5 border-green-500/20'
          : hasErrors
          ? 'bg-red-500/5 border-red-500/20'
          : hasWarnings
          ? 'bg-amber-500/5 border-amber-500/20'
          : 'bg-accent/5 border-accent/20',
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Status and progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isComplete ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : hasWarnings || hasErrors ? (
              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
            ) : null}
            <span className="text-sm font-medium text-text-primary">
              {isComplete
                ? t.nextStepBanner.sectionComplete
                : t.nextStepBanner.phaseComplete.replace('{percent}', String(percent))
              }
            </span>
          </div>

          {/* Validation warnings */}
          {hasWarnings && !hasErrors && (
            <div className="mt-2">
              <p className="text-xs text-text-secondary mb-1">
                {t.nextStepBanner.validationWarnings}
              </p>
              <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-0.5">
                {validationStatus!.warnings.slice(0, 3).map((warning, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-amber-500">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Errors */}
          {hasErrors && (
            <div className="mt-2">
              <ul className="text-xs text-red-600 dark:text-red-400 space-y-0.5">
                {validationStatus!.errors!.map((error, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-red-500">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right side - Continue button */}
        <div className="flex-shrink-0">
          <button
            onClick={handleContinue}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all',
              isComplete
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : hasErrors
                ? 'bg-surface-elevated hover:bg-surface-elevated/80 text-text-secondary'
                : hasWarnings
                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                : 'bg-accent hover:bg-accent/90 text-white'
            )}
          >
            <span>
              {hasWarnings && !isComplete
                ? t.nextStepBanner.continueAnyway
                : t.nextStepBanner.continueToNext.replace('{section}', nextSectionName)
              }
            </span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1 bg-surface-elevated rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isComplete ? 'bg-green-500' : 'bg-accent'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
