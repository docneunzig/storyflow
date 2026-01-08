import { NavLink } from 'react-router-dom'
import {
  FileText,
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
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  projectId?: string
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

const navItems = [
  { icon: FileText, label: 'Specification', path: 'specification', shortcut: '1' },
  { icon: GitBranch, label: 'Plot', path: 'plot', shortcut: '2' },
  { icon: Users, label: 'Characters', path: 'characters', shortcut: '3' },
  { icon: Film, label: 'Scenes', path: 'scenes', shortcut: '4' },
  { icon: PenTool, label: 'Write', path: 'write', shortcut: '5' },
  { icon: CheckSquare, label: 'Review', path: 'review', shortcut: '6' },
  { icon: Download, label: 'Export', path: 'export', shortcut: '7' },
  { type: 'separator' as const },
  { icon: Book, label: 'Wiki', path: 'wiki' },
  { icon: BarChart2, label: 'Stats', path: 'stats' },
  { icon: TrendingUp, label: 'Market', path: 'market' },
]

export function Sidebar({ projectId }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isMobile = useIsMobile()

  // Close mobile menu when navigating
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false)
    }
  }, [isMobile])

  if (!projectId) return null

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

          <nav className="flex-1 py-4 overflow-y-auto" aria-label="Main navigation">
            <ul className="space-y-1 px-2">
              {navItems.map((item, index) => {
                if (item.type === 'separator') {
                  return <li key={index} className="h-px bg-border my-4" />
                }

                const Icon = item.icon
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
                            : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                        )
                      }
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                      <span className="flex-1">{item.label}</span>
                      {item.shortcut && (
                        <kbd className="text-xs text-text-secondary bg-surface-elevated px-1.5 py-0.5 rounded">
                          {item.shortcut}
                        </kbd>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </nav>
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
      <nav className="flex-1 py-4" aria-label="Main navigation">
        <ul className="space-y-1 px-2">
          {navItems.map((item, index) => {
            if (item.type === 'separator') {
              return <li key={index} className="h-px bg-border my-4" />
            }

            const Icon = item.icon
            return (
              <li key={item.path}>
                <NavLink
                  to={`/projects/${projectId}/${item.path}`}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                      isActive
                        ? 'bg-accent text-white'
                        : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                    )
                  }
                  title={collapsed ? item.label : undefined}
                  aria-label={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.shortcut && (
                        <kbd className="text-xs text-text-secondary bg-surface-elevated px-1.5 py-0.5 rounded">
                          {item.shortcut}
                        </kbd>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 border-t border-border hover:bg-surface-elevated transition-colors flex items-center justify-center"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
