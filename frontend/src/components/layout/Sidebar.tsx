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
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  projectId?: string
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

  if (!projectId) return null

  return (
    <aside
      className={cn(
        'bg-surface border-r border-border flex flex-col transition-all duration-200',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <nav className="flex-1 py-4">
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
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
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
          <ChevronRight className="h-5 w-5 text-text-secondary" />
        ) : (
          <ChevronLeft className="h-5 w-5 text-text-secondary" />
        )}
      </button>
    </aside>
  )
}
