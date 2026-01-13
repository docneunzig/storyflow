// Design Tokens for StoryFlow
// Centralized design system constants for consistent UI

export const tokens = {
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },

  colors: {
    surface: {
      base: 'var(--surface)',
      elevated: 'var(--surface-elevated)',
      overlay: 'var(--surface-overlay)',
    },
    accent: {
      primary: 'var(--accent)',
      hover: 'var(--accent-hover)',
      muted: 'var(--accent-muted)',
    },
    status: {
      success: 'var(--success)',
      successMuted: 'var(--success-muted)',
      warning: 'var(--warning)',
      warningMuted: 'var(--warning-muted)',
      error: 'var(--error)',
      errorMuted: 'var(--error-muted)',
    },
    text: {
      primary: 'var(--text-primary)',
      secondary: 'var(--text-secondary)',
      muted: 'var(--text-muted)',
    },
    border: {
      default: 'var(--border)',
      subtle: 'var(--border-subtle)',
      focus: 'var(--border-focus)',
    },
  },

  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, sans-serif',
      mono: 'JetBrains Mono, Menlo, monospace',
      serif: 'Georgia, serif',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },

  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  transitions: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },

  zIndex: {
    dropdown: 50,
    modal: 100,
    popover: 150,
    tooltip: 200,
    toast: 250,
  },
} as const

// Tailwind class utilities for common patterns
export const tw = {
  // Card styles
  card: 'bg-surface rounded-lg border border-border p-4',
  cardElevated: 'bg-surface-elevated rounded-lg border border-border p-4 shadow-sm',

  // Button base styles (use with variant-specific classes)
  buttonBase: 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:pointer-events-none',

  // Input styles
  input: 'w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent',
  inputError: 'w-full bg-surface border border-error rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-error/50',

  // Text styles
  heading1: 'text-2xl font-bold text-text-primary',
  heading2: 'text-xl font-semibold text-text-primary',
  heading3: 'text-lg font-medium text-text-primary',
  bodyLarge: 'text-base text-text-primary',
  body: 'text-sm text-text-primary',
  bodySecondary: 'text-sm text-text-secondary',
  caption: 'text-xs text-text-secondary',

  // Label/Badge styles
  badge: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
  badgeSuccess: 'bg-success/10 text-success border border-success/20',
  badgeWarning: 'bg-warning/10 text-warning border border-warning/20',
  badgeError: 'bg-error/10 text-error border border-error/20',
  badgeAccent: 'bg-accent/10 text-accent border border-accent/20',
  badgeNeutral: 'bg-surface-elevated text-text-secondary border border-border',

  // Focus ring
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-accent/50',

  // Divider
  divider: 'border-t border-border',

  // Truncate text
  truncate: 'truncate overflow-hidden text-ellipsis whitespace-nowrap',

  // Flex utilities
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',
  flexStart: 'flex items-center justify-start',
  flexEnd: 'flex items-center justify-end',
  flexCol: 'flex flex-col',
  flexColCenter: 'flex flex-col items-center justify-center',

  // Gap shortcuts
  gap1: 'gap-1',
  gap2: 'gap-2',
  gap3: 'gap-3',
  gap4: 'gap-4',
} as const

// Quality score color helpers
export function getQualityColor(score: number): string {
  if (score >= 8) return 'text-success'
  if (score >= 6) return 'text-warning'
  return 'text-error'
}

export function getQualityBgColor(score: number): string {
  if (score >= 8) return 'bg-success/10'
  if (score >= 6) return 'bg-warning/10'
  return 'bg-error/10'
}

export function getQualityBorderColor(score: number): string {
  if (score >= 8) return 'border-success/30'
  if (score >= 6) return 'border-warning/30'
  return 'border-error/30'
}

// Progress bar color helper
export function getProgressColor(percentage: number): string {
  if (percentage >= 75) return 'bg-success'
  if (percentage >= 50) return 'bg-accent'
  if (percentage >= 25) return 'bg-warning'
  return 'bg-error'
}

// Status colors for chapter statuses
export const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  draft: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20' },
  'in-progress': { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/20' },
  'needs-revision': { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
  complete: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
}

export function getStatusColors(status: string) {
  return statusColors[status] || statusColors.draft
}
