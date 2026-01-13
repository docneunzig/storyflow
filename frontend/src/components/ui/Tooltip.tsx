import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  shortcut?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  delayDuration?: number
}

export function Tooltip({
  children,
  content,
  shortcut,
  side = 'top',
  align = 'center',
  delayDuration = 200,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={5}
            className={cn(
              'z-tooltip overflow-hidden rounded-md bg-surface-elevated border border-border px-3 py-1.5 text-xs shadow-lg',
              'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
              'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
              'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-text-primary">{content}</span>
              {shortcut && (
                <kbd className="inline-flex items-center gap-0.5 rounded bg-surface px-1.5 py-0.5 font-mono text-[10px] font-medium text-text-secondary border border-border">
                  {shortcut}
                </kbd>
              )}
            </div>
            <TooltipPrimitive.Arrow className="fill-surface-elevated" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

// Helper to format keyboard shortcuts for display
export function formatShortcut(keys: string[]): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')

  return keys.map(key => {
    if (key === 'mod') return isMac ? '⌘' : 'Ctrl'
    if (key === 'shift') return isMac ? '⇧' : 'Shift'
    if (key === 'alt') return isMac ? '⌥' : 'Alt'
    if (key === 'enter') return '↵'
    if (key === 'backspace') return '⌫'
    if (key === 'escape') return 'Esc'
    return key.toUpperCase()
  }).join(isMac ? '' : '+')
}
