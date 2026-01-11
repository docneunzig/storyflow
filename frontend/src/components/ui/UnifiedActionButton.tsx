import { useState, useRef, useEffect } from 'react'
import { ChevronDown, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ActionOption {
  id: string
  label: string
  description?: string
  icon?: LucideIcon
  onClick: () => void
  disabled?: boolean
  variant?: 'default' | 'accent' | 'success' | 'warning'
}

interface UnifiedActionButtonProps {
  /** Primary action shown on the main button */
  primaryAction: ActionOption
  /** Additional actions shown in the dropdown */
  secondaryActions?: ActionOption[]
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Full width button */
  fullWidth?: boolean
  /** Disabled state */
  disabled?: boolean
  /** Loading state */
  loading?: boolean
  /** Class name for custom styling */
  className?: string
}

export function UnifiedActionButton({
  primaryAction,
  secondaryActions = [],
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  className,
}: UnifiedActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const hasSecondaryActions = secondaryActions.length > 0
  const PrimaryIcon = primaryAction.icon

  return (
    <div className={cn('relative inline-flex', fullWidth && 'w-full', className)}>
      {/* Main button group */}
      <div className={cn('inline-flex rounded-lg shadow-sm', fullWidth && 'w-full')}>
        {/* Primary action button */}
        <button
          onClick={primaryAction.onClick}
          disabled={disabled || loading || primaryAction.disabled}
          className={cn(
            'inline-flex items-center justify-center gap-2 font-medium transition-colors',
            'bg-accent text-white hover:bg-accent/90',
            'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            sizeClasses[size],
            hasSecondaryActions ? 'rounded-l-lg rounded-r-none' : 'rounded-lg',
            fullWidth && 'flex-1'
          )}
        >
          {loading ? (
            <div className={cn('animate-spin rounded-full border-2 border-white border-t-transparent', iconSizes[size])} />
          ) : PrimaryIcon ? (
            <PrimaryIcon className={iconSizes[size]} aria-hidden="true" />
          ) : null}
          <span>{primaryAction.label}</span>
        </button>

        {/* Dropdown toggle button */}
        {hasSecondaryActions && (
          <button
            ref={buttonRef}
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled || loading}
            className={cn(
              'inline-flex items-center justify-center px-2 transition-colors',
              'bg-accent text-white hover:bg-accent/90 border-l border-white/20',
              'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'rounded-r-lg rounded-l-none',
              size === 'sm' && 'py-1.5',
              size === 'md' && 'py-2',
              size === 'lg' && 'py-2.5'
            )}
            aria-expanded={isOpen}
            aria-haspopup="true"
            aria-label="More actions"
          >
            <ChevronDown
              className={cn(
                iconSizes[size],
                'transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {/* Dropdown menu */}
      {hasSecondaryActions && isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute right-0 top-full mt-1 z-50',
            'min-w-[200px] max-w-[280px] w-max',
            'bg-surface-elevated border border-border rounded-lg shadow-xl',
            'py-1 overflow-hidden',
            'animate-in fade-in-0 zoom-in-95 duration-100'
          )}
          role="menu"
          aria-orientation="vertical"
        >
          {secondaryActions.map((action) => {
            const ActionIcon = action.icon
            return (
              <button
                key={action.id}
                onClick={() => {
                  action.onClick()
                  setIsOpen(false)
                }}
                disabled={action.disabled}
                className={cn(
                  'w-full flex items-start gap-3 px-3 py-2 text-left transition-colors',
                  'hover:bg-surface text-text-primary',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
                  action.variant === 'accent' && 'text-accent',
                  action.variant === 'success' && 'text-green-400',
                  action.variant === 'warning' && 'text-yellow-400'
                )}
                role="menuitem"
              >
                {ActionIcon && (
                  <ActionIcon className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{action.label}</div>
                  {action.description && (
                    <div className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                      {action.description}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default UnifiedActionButton
