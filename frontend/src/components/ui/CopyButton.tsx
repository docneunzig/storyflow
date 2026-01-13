import { Copy, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'

interface CopyButtonProps {
  text: string
  className?: string
  size?: 'sm' | 'md'
}

export function CopyButton({ text, className, size = 'md' }: CopyButtonProps) {
  const { copy, status } = useCopyToClipboard()

  const sizeClasses = {
    sm: 'p-1',
    md: 'p-1.5',
  }

  const iconSize = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
  }

  return (
    <button
      onClick={() => copy(text)}
      className={cn(
        'rounded-md transition-colors',
        status === 'copied'
          ? 'bg-green-500/10 text-green-500'
          : status === 'error'
          ? 'bg-red-500/10 text-red-500'
          : 'hover:bg-surface-elevated text-text-secondary hover:text-text-primary',
        sizeClasses[size],
        className
      )}
      title={status === 'copied' ? 'Copied!' : status === 'error' ? 'Failed to copy' : 'Copy to clipboard'}
    >
      {status === 'copied' ? (
        <Check className={iconSize[size]} />
      ) : status === 'error' ? (
        <AlertCircle className={iconSize[size]} />
      ) : (
        <Copy className={iconSize[size]} />
      )}
    </button>
  )
}
