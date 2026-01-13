import { useState, useCallback } from 'react'

type CopyStatus = 'idle' | 'copied' | 'error'

export function useCopyToClipboard(resetDelay = 2000) {
  const [status, setStatus] = useState<CopyStatus>('idle')

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setStatus('copied')
      setTimeout(() => setStatus('idle'), resetDelay)
      return true
    } catch (err) {
      console.error('Failed to copy text:', err)
      setStatus('error')
      setTimeout(() => setStatus('idle'), resetDelay)
      return false
    }
  }, [resetDelay])

  const reset = useCallback(() => {
    setStatus('idle')
  }, [])

  return { copy, status, reset, isCopied: status === 'copied' }
}
