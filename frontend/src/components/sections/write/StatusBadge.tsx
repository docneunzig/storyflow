import { Circle, CheckCircle, Clock, Lock, PenLine } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'
import { STATUS_COLORS } from './constants'

// Status icons for visual distinction
const STATUS_ICONS: Record<string, React.ReactNode> = {
  outline: <Circle className="h-3 w-3" />,
  draft: <PenLine className="h-3 w-3" />,
  revision: <Clock className="h-3 w-3" />,
  final: <CheckCircle className="h-3 w-3" />,
  locked: <Lock className="h-3 w-3" />,
}

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const t = useLanguageStore((state) => state.t)
  const statusKey = status as keyof typeof t.status
  const translatedStatus = t.status[statusKey] || status
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[status] || STATUS_COLORS.outline}`}>
      {STATUS_ICONS[status]}
      <span>{translatedStatus}</span>
    </span>
  )
}
