import { NavLink, useNavigate } from 'react-router-dom'
import {
  FileText,
  Lightbulb,
  GitBranch,
  Users,
  Film,
  PenTool,
  CheckSquare,
  Download,
  Book,
  BarChart2,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Lock,
  Star,
  FolderOpen,
  ChevronDown,
  Globe,
} from 'lucide-react'
import { useState, useEffect, useMemo, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useProjectStore, calculateProjectPhase } from '@/stores/projectStore'
import { useLanguageStore } from '@/stores/languageStore'
import type { ProjectPhase, Project } from '@/types/project'

interface SidebarProps {
  projectId?: string
}

// Define which sections are unlocked at each phase
const PHASE_UNLOCKS: Record<ProjectPhase, string[]> = {
  'specification': ['specification', 'brainstorm', 'wiki', 'stats'],
  'plotting': ['specification', 'brainstorm', 'plot', 'wiki', 'stats'],
  'characters': ['specification', 'brainstorm', 'plot', 'characters', 'wiki', 'stats'],
  'scenes': ['specification', 'brainstorm', 'plot', 'characters', 'scenes', 'wiki', 'stats'],
  'writing': ['specification', 'brainstorm', 'plot', 'characters', 'scenes', 'write', 'wiki', 'stats', 'market'],
  'revision': ['specification', 'brainstorm', 'plot', 'characters', 'scenes', 'write', 'review', 'wiki', 'stats', 'market'],
  'complete': ['specification', 'brainstorm', 'plot', 'characters', 'scenes', 'write', 'review', 'export', 'wiki', 'stats', 'market'],
}

// Get the recommended section for current phase
const PHASE_RECOMMENDED: Record<ProjectPhase, string> = {
  'specification': 'specification',
  'plotting': 'plot',
  'characters': 'characters',
  'scenes': 'scenes',
  'writing': 'write',
  'revision': 'review',
  'complete': 'export',
}

// Unlock requirements for each section
interface UnlockRequirement {
  labelKey: keyof typeof MILESTONE_KEYS
  check: (project: Project) => boolean
}

// Keys for translation lookup
const MILESTONE_KEYS = {
  completeSpecification: 'completeSpecification',
  definePlotStructure: 'definePlotStructure',
  createCharacters: 'createCharacters',
  createScenes: 'createScenes',
  writeChapterContent: 'writeChapterContent',
  completeReview: 'completeReview',
} as const

const UNLOCK_REQUIREMENTS: Record<string, UnlockRequirement[]> = {
  'plot': [
    { labelKey: 'completeSpecification', check: (p) => !!p.specification?.genre },
  ],
  'characters': [
    { labelKey: 'definePlotStructure', check: (p) => (p.plot?.beats?.length ?? 0) >= 3 },
  ],
  'scenes': [
    { labelKey: 'createCharacters', check: (p) => (p.characters?.length ?? 0) >= 2 },
  ],
  'write': [
    { labelKey: 'createScenes', check: (p) => (p.scenes?.length ?? 0) >= 3 },
  ],
  'review': [
    { labelKey: 'writeChapterContent', check: (p) => p.chapters?.some(ch => (ch.wordCount ?? 0) > 100) ?? false },
  ],
  'export': [
    { labelKey: 'completeReview', check: (p) => (p.qualityScores?.length ?? 0) > 0 },
  ],
  'market': [
    { labelKey: 'createScenes', check: (p) => (p.scenes?.length ?? 0) >= 3 },
  ],
}

// Get unlock status for a section
function getUnlockStatus(path: string, project: Project | null): {
  requirements: { labelKey: keyof typeof MILESTONE_KEYS; met: boolean }[]
  progress: number
} {
  if (!project) return { requirements: [], progress: 0 }

  const requirements = UNLOCK_REQUIREMENTS[path] || []
  if (requirements.length === 0) return { requirements: [], progress: 100 }

  const checked = requirements.map(req => ({
    labelKey: req.labelKey,
    met: req.check(project)
  }))

  const metCount = checked.filter(r => r.met).length
  const progress = Math.round((metCount / requirements.length) * 100)

  return { requirements: checked, progress }
}

// Custom hook for detecting mobile viewport
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  )

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [breakpoint])

  return isMobile
}

interface NavItem {
  icon: typeof FileText
  labelKey: keyof import('@/lib/i18n').Translations['navItems']
  path: string
  shortcut?: string
}

interface NavGroup {
  labelKey: keyof import('@/lib/i18n').Translations['nav']
  items: NavItem[]
}

const navGroupsConfig: NavGroup[] = [
  {
    labelKey: 'plan',
    items: [
      { icon: FileText, labelKey: 'specification', path: 'specification', shortcut: '1' },
      { icon: Lightbulb, labelKey: 'brainstorm', path: 'brainstorm', shortcut: '2' },
      { icon: GitBranch, labelKey: 'plot', path: 'plot', shortcut: '3' },
    ],
  },
  {
    labelKey: 'build',
    items: [
      { icon: Users, labelKey: 'characters', path: 'characters', shortcut: '4' },
      { icon: Film, labelKey: 'scenes', path: 'scenes', shortcut: '5' },
      { icon: Book, labelKey: 'wiki', path: 'wiki' },
    ],
  },
  {
    labelKey: 'write',
    items: [
      { icon: PenTool, labelKey: 'draft', path: 'write', shortcut: '6' },
      { icon: CheckSquare, labelKey: 'review', path: 'review', shortcut: '7' },
    ],
  },
  {
    labelKey: 'publish',
    items: [
      { icon: BarChart2, labelKey: 'stats', path: 'stats' },
      { icon: Download, labelKey: 'export', path: 'export', shortcut: '8' },
      { icon: TrendingUp, labelKey: 'market', path: 'market' },
    ],
  },
]

// Flattened items for keyboard shortcut support (exported for Layout.tsx)
export const allNavItems = navGroupsConfig.flatMap(group => group.items)

// Lock tooltip component with hover details
interface LockTooltipProps {
  path: string
  label: string
  project: Project | null
  collapsed?: boolean
}

function LockTooltip({ path, label, project, collapsed }: LockTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const t = useLanguageStore((state) => state.t)
  const { requirements, progress } = useMemo(
    () => getUnlockStatus(path, project),
    [path, project]
  )

  if (requirements.length === 0) {
    return (
      <span title={t.lockTooltip.locked}>
        <Lock className="h-3 w-3 text-text-secondary/50" aria-hidden="true" />
      </span>
    )
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Lock className="h-3 w-3 text-text-secondary/50 cursor-help" aria-hidden="true" />

      {/* Tooltip */}
      {showTooltip && (
        <div
          className={cn(
            'absolute z-50 w-56 p-3 bg-surface-elevated border border-border rounded-lg shadow-xl',
            collapsed ? 'left-full ml-2 top-1/2 -translate-y-1/2' : 'left-0 bottom-full mb-2'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-4 w-4 text-yellow-400" />
            <span className="font-semibold text-text-primary text-sm">{label} ({t.lockTooltip.locked})</span>
          </div>

          <p className="text-xs text-text-secondary mb-2">{t.lockTooltip.completeToUnlock}</p>

          <div className="space-y-1.5">
            {requirements.map((req, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className={cn(
                  'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold',
                  req.met
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-surface text-text-secondary'
                )}>
                  {req.met ? '✓' : (i + 1)}
                </span>
                <span className={cn(
                  req.met ? 'text-green-400 line-through' : 'text-text-primary'
                )}>
                  {t.milestones[req.labelKey]}
                </span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-text-secondary mb-1">
              <span>{t.lockTooltip.progress}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Phase progress calculation
const PHASE_ORDER: ProjectPhase[] = [
  'specification', 'plotting', 'characters', 'scenes', 'writing', 'revision', 'complete'
]

const PHASE_LABELS: Record<ProjectPhase, string> = {
  'specification': 'Planning',
  'plotting': 'Plotting',
  'characters': 'Characters',
  'scenes': 'Scenes',
  'writing': 'Writing',
  'revision': 'Revision',
  'complete': 'Complete',
}

function getPhaseProgress(phase: ProjectPhase): { percent: number; label: string; next: string } {
  const index = PHASE_ORDER.indexOf(phase)
  const percent = Math.round(((index + 1) / PHASE_ORDER.length) * 100)
  const nextPhase = index < PHASE_ORDER.length - 1 ? PHASE_ORDER[index + 1] : null

  return {
    percent,
    label: PHASE_LABELS[phase],
    next: nextPhase ? `Next: ${PHASE_LABELS[nextPhase]}` : 'Project complete!'
  }
}

// Phase Progress Bar component - redesigned for visual prominence
function PhaseProgressBar({ phase, collapsed }: { phase: ProjectPhase; collapsed: boolean }) {
  const { percent, label, next } = getPhaseProgress(phase)
  const phaseIndex = PHASE_ORDER.indexOf(phase)

  if (collapsed) {
    return (
      <div className="px-2 py-3 border-b border-border" title={`${label} - ${percent}%`}>
        <div className="flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-green-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-accent/20">
            {percent}%
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 py-4 border-b border-border bg-gradient-to-r from-accent/5 to-transparent">
      {/* Phase Steps Indicator */}
      <div className="flex items-center justify-between mb-3">
        {PHASE_ORDER.map((p, i) => (
          <div key={p} className="flex items-center">
            <div
              className={`w-2 h-2 rounded-full transition-all ${
                i < phaseIndex
                  ? 'bg-green-500'
                  : i === phaseIndex
                  ? 'bg-accent ring-2 ring-accent/30 ring-offset-1 ring-offset-background'
                  : 'bg-surface-elevated'
              }`}
              title={PHASE_LABELS[p]}
            />
            {i < PHASE_ORDER.length - 1 && (
              <div
                className={`w-6 h-0.5 mx-0.5 ${
                  i < phaseIndex ? 'bg-green-500/50' : 'bg-surface-elevated'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Current Phase Info */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">{label}</span>
        </div>
        <span className="text-sm text-accent font-bold">{percent}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-surface-elevated rounded-full overflow-hidden mb-2 shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-accent via-blue-400 to-green-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Next Milestone */}
      <p className="text-xs text-text-secondary flex items-center gap-1">
        <span className="text-accent">→</span> {next}
      </p>
    </div>
  )
}

// Animated star tooltip for recommended sections
function StarTooltip({ collapsed }: { collapsed?: boolean }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const t = useLanguageStore((state) => state.t)

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Glow effect behind star */}
      <div className="absolute inset-0 animate-pulse">
        <div className="absolute inset-0 bg-yellow-400/30 blur-sm rounded-full" />
      </div>

      {/* Animated star */}
      <Star
        className="relative h-3 w-3 text-yellow-400 fill-yellow-400 cursor-help animate-[float_2s_ease-in-out_infinite] drop-shadow-[0_0_3px_rgba(250,204,21,0.5)]"
        aria-hidden="true"
      />

      {showTooltip && (
        <div
          className={cn(
            'absolute z-50 w-52 p-3 rounded-lg shadow-xl border border-yellow-500/20 overflow-hidden',
            'bg-gradient-to-br from-surface-elevated to-surface',
            collapsed ? 'left-full ml-3 top-1/2 -translate-y-1/2' : 'left-0 bottom-full mb-2'
          )}
        >
          {/* Subtle gradient accent */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none" />

          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-yellow-500/20">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              </div>
              <span className="font-semibold text-text-primary text-sm">{t.starTooltip.title}</span>
            </div>
            <p className="text-xs text-text-secondary mt-2 leading-relaxed">
              {t.starTooltip.description}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Language toggle component
function LanguageToggle({ collapsed }: { collapsed: boolean }) {
  const { language, setLanguage, t } = useLanguageStore()

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'de' : 'en')
  }

  if (collapsed) {
    return (
      <button
        onClick={toggleLanguage}
        className="flex items-center justify-center p-2 mx-2 rounded-md hover:bg-surface-elevated transition-colors"
        title={t.settings.language}
      >
        <Globe className="h-4 w-4 text-text-secondary" />
      </button>
    )
  }

  return (
    <div className="mx-3 mb-2">
      <div className="flex items-center gap-2 text-xs text-text-secondary mb-1.5">
        <Globe className="h-3 w-3" />
        <span>{t.settings.language}</span>
      </div>
      <div className="flex bg-surface-elevated rounded-lg p-0.5 border border-border">
        <button
          onClick={() => setLanguage('en')}
          className={cn(
            'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
            language === 'en'
              ? 'bg-accent text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          EN
        </button>
        <button
          onClick={() => setLanguage('de')}
          className={cn(
            'flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
            language === 'de'
              ? 'bg-accent text-white shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          )}
        >
          DE
        </button>
      </div>
    </div>
  )
}

// Breadcrumb project switcher
function ProjectSwitcher({ projectId, collapsed }: { projectId: string; collapsed: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const t = useLanguageStore((state) => state.t)

  const currentProject = useProjectStore((state) => state.currentProject)
  const projects = useProjectStore((state) => state.projects)

  // Get recent projects (excluding current, max 5)
  const recentProjects = useMemo(() => {
    return projects
      .filter((p) => p.id !== projectId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
  }, [projects, projectId])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const projectTitle = currentProject?.metadata?.workingTitle || 'Untitled'
  const truncatedTitle = projectTitle.length > 18 ? projectTitle.slice(0, 18) + '...' : projectTitle

  if (collapsed) {
    return (
      <NavLink
        to="/"
        className="flex items-center justify-center p-2 mx-2 rounded-md hover:bg-surface-elevated transition-colors"
        title={t.projectSwitcher.allProjects}
      >
        <FolderOpen className="h-5 w-5 text-text-secondary" />
      </NavLink>
    )
  }

  return (
    <div ref={dropdownRef} className="relative mx-2">
      {/* Breadcrumb header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-elevated transition-colors group"
      >
        <FolderOpen className="h-4 w-4 text-text-secondary flex-shrink-0" />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[10px] text-text-secondary uppercase tracking-wide font-medium">{t.projectSwitcher.project}</p>
          <p className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
            {truncatedTitle}
          </p>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-text-secondary transition-transform',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-surface-elevated border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-up duration-150">
          {/* All Projects link */}
          <NavLink
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-sm text-accent hover:bg-accent/10 transition-colors border-b border-border"
            onClick={() => setIsOpen(false)}
          >
            <FolderOpen className="h-4 w-4" />
            {t.projectSwitcher.allProjects}
          </NavLink>

          {/* Recent projects */}
          {recentProjects.length > 0 && (
            <div className="py-1">
              <p className="px-3 py-1 text-[10px] text-text-secondary uppercase tracking-wide font-medium">
                {t.projectSwitcher.recent}
              </p>
              {recentProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    navigate(`/projects/${project.id}/specification`)
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface hover:text-accent transition-colors text-left"
                >
                  <div className="w-2 h-2 rounded-full bg-accent/50 flex-shrink-0" />
                  <span className="truncate">
                    {project.metadata?.workingTitle || 'Untitled'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ projectId }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isMobile = useIsMobile()
  const t = useLanguageStore((state) => state.t)

  // Get current project to calculate phase
  const currentProject = useProjectStore((state) => state.currentProject)
  const currentPhase = currentProject ? calculateProjectPhase(currentProject) : 'specification'
  const unlockedSections = PHASE_UNLOCKS[currentPhase]
  const recommendedSection = PHASE_RECOMMENDED[currentPhase]

  // Close mobile menu when navigating
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false)
    }
  }, [isMobile])

  if (!projectId) return null

  // Helper to check if section is unlocked
  const isSectionUnlocked = (path: string) => unlockedSections.includes(path)
  const isSectionRecommended = (path: string) => path === recommendedSection

  // Mobile: Hamburger button + overlay sidebar
  if (isMobile) {
    return (
      <>
        {/* Mobile hamburger button */}
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-3 left-2 z-40 p-2 bg-surface border border-border rounded-lg shadow-lg md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5 text-text-primary" aria-hidden="true" />
        </button>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Mobile sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col transform transition-transform duration-200 md:hidden',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
          role="complementary"
          aria-label="Sidebar navigation"
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <span className="font-semibold text-text-primary">Navigation</span>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 rounded-md hover:bg-surface-elevated transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5 text-text-secondary" />
            </button>
          </div>

          {/* Project Switcher - Mobile */}
          <div className="pt-3 pb-2 border-b border-border">
            <ProjectSwitcher projectId={projectId} collapsed={false} />
          </div>

          {/* Phase Progress Bar - Mobile */}
          <PhaseProgressBar phase={currentPhase} collapsed={false} />

          <nav className="flex-1 py-4 overflow-y-auto" aria-label="Main navigation">
            <div className="space-y-4 px-2">
              {navGroupsConfig.map((group) => (
                <div key={group.labelKey}>
                  <div className="px-3 py-2 text-xs font-semibold text-text-secondary tracking-wider">
                    {t.nav[group.labelKey]}
                  </div>
                  <ul className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon
                      const unlocked = isSectionUnlocked(item.path)
                      const recommended = isSectionRecommended(item.path)
                      const itemLabel = t.navItems[item.labelKey]

                      return (
                        <li key={item.path}>
                          <NavLink
                            to={`/projects/${projectId}/${item.path}`}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) =>
                              cn(
                                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                                isActive
                                  ? 'bg-accent text-white'
                                  : unlocked
                                  ? 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                                  : 'text-text-secondary/50 hover:bg-surface-elevated/50'
                              )
                            }
                          >
                            <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                            <span className="flex-1">{itemLabel}</span>
                            {recommended && unlocked && (
                              <StarTooltip />
                            )}
                            {!unlocked && (
                              <LockTooltip
                                path={item.path}
                                label={itemLabel}
                                project={currentProject}
                              />
                            )}
                          </NavLink>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          {/* Language Toggle - Mobile */}
          <div className="border-t border-border pt-3 pb-2">
            <LanguageToggle collapsed={false} />
          </div>
        </aside>
      </>
    )
  }

  // Desktop: Traditional sidebar
  return (
    <aside
      className={cn(
        'bg-surface border-r border-border flex flex-col transition-all duration-200',
        collapsed ? 'w-16' : 'w-56'
      )}
      role="complementary"
      aria-label="Sidebar navigation"
    >
      {/* Project Switcher */}
      <div className="pt-3 pb-2 border-b border-border">
        <ProjectSwitcher projectId={projectId} collapsed={collapsed} />
      </div>

      {/* Phase Progress Bar */}
      <PhaseProgressBar phase={currentPhase} collapsed={collapsed} />

      <nav className="flex-1 py-4 overflow-y-auto" aria-label="Main navigation">
        <div className="space-y-4 px-2">
          {navGroupsConfig.map((group) => (
            <div key={group.labelKey}>
              {!collapsed && (
                <div className="px-3 py-2 text-xs font-semibold text-text-secondary tracking-wider">
                  {t.nav[group.labelKey]}
                </div>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const unlocked = isSectionUnlocked(item.path)
                  const recommended = isSectionRecommended(item.path)
                  const itemLabel = t.navItems[item.labelKey]

                  return (
                    <li key={item.path}>
                      <NavLink
                        to={`/projects/${projectId}/${item.path}`}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors relative',
                            isActive
                              ? 'bg-accent text-white'
                              : unlocked
                              ? 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                              : 'text-text-secondary/50 hover:bg-surface-elevated/50'
                          )
                        }
                        title={collapsed ? `${itemLabel}${!unlocked ? ` (${t.lockTooltip.locked})` : recommended ? ` (${t.starTooltip.title})` : ''}` : undefined}
                        aria-label={collapsed ? itemLabel : undefined}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                        {!collapsed && (
                          <>
                            <span className="flex-1">{itemLabel}</span>
                            {recommended && unlocked && (
                              <StarTooltip collapsed={collapsed} />
                            )}
                            {!unlocked && (
                              <LockTooltip
                                path={item.path}
                                label={itemLabel}
                                project={currentProject}
                                collapsed={collapsed}
                              />
                            )}
                          </>
                        )}
                        {collapsed && !unlocked && (
                          <div className="absolute right-1 top-1/2 -translate-y-1/2">
                            <LockTooltip
                              path={item.path}
                              label={itemLabel}
                              project={currentProject}
                              collapsed={collapsed}
                            />
                          </div>
                        )}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Language Toggle */}
      <div className="border-t border-border pt-2 pb-1">
        <LanguageToggle collapsed={collapsed} />
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 border-t border-border hover:bg-surface-elevated transition-colors flex items-center justify-center"
        aria-label={collapsed ? t.actions.expand : t.actions.collapse}
      >
        {collapsed ? (
          <ChevronRight className="h-5 w-5 text-text-secondary" aria-hidden="true" />
        ) : (
          <ChevronLeft className="h-5 w-5 text-text-secondary" aria-hidden="true" />
        )}
      </button>
    </aside>
  )
}
