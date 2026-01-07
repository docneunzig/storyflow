import { useEffect, useState, ReactNode } from 'react'
import { Loader2, Terminal } from 'lucide-react'

interface AuthCheckProps {
  children: ReactNode
}

export function AuthCheck({ children }: AuthCheckProps) {
  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking')

  useEffect(() => {
    checkAuthStatus()
  }, [])

  async function checkAuthStatus() {
    try {
      const response = await fetch('/api/ai/status')
      if (response.ok) {
        const data = await response.json()
        setAuthState(data.authenticated ? 'authenticated' : 'unauthenticated')
      } else {
        // If the status endpoint isn't available yet, assume authenticated for dev
        setAuthState('authenticated')
      }
    } catch {
      // In development, proceed anyway
      setAuthState('authenticated')
    }
  }

  if (authState === 'checking') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-accent animate-spin" />
          <p className="text-text-secondary">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (authState === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="card max-w-md text-center">
          <Terminal className="h-12 w-12 text-accent mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary mb-2">Claude Authentication Required</h1>
          <p className="text-text-secondary mb-6">
            Storyflow requires Claude CLI to be authenticated for AI features.
          </p>

          <div className="bg-surface-elevated rounded-md p-4 mb-6 text-left">
            <p className="text-sm text-text-secondary mb-2">Run this command in your terminal:</p>
            <code className="text-accent font-mono text-sm">claude login</code>
          </div>

          <button
            onClick={checkAuthStatus}
            className="btn-primary w-full"
          >
            Check Again
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
