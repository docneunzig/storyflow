import { useEffect, useState, ReactNode } from 'react'
import { Loader2, Terminal, Key, AlertTriangle } from 'lucide-react'

interface AuthCheckProps {
  children: ReactNode
}

interface AIStatus {
  authenticated: boolean
  apiKeyConfigured: boolean
  useRealClaude: boolean
  canUseAI: boolean
  message: string
}

export function AuthCheck({ children }: AuthCheckProps) {
  const [authState, setAuthState] = useState<'checking' | 'ready' | 'needs-api-key' | 'unauthenticated'>('checking')
  const [statusMessage, setStatusMessage] = useState<string>('')

  useEffect(() => {
    checkAuthStatus()
  }, [])

  async function checkAuthStatus() {
    try {
      const response = await fetch('/api/ai/status')
      if (response.ok) {
        const data: AIStatus = await response.json()
        setStatusMessage(data.message)

        if (data.canUseAI) {
          setAuthState('ready')
        } else if (!data.apiKeyConfigured && data.useRealClaude) {
          setAuthState('needs-api-key')
        } else if (!data.authenticated) {
          setAuthState('unauthenticated')
        } else {
          setAuthState('ready')
        }
      } else {
        // If the status endpoint isn't available yet, assume authenticated for dev
        setAuthState('ready')
      }
    } catch {
      // In development, proceed anyway
      setAuthState('ready')
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

  if (authState === 'needs-api-key') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="card max-w-lg text-center">
          <Terminal className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary mb-2">Claude CLI Login Required</h1>
          <p className="text-text-secondary mb-6">
            StoryFlow uses Claude CLI to access AI features with your Claude Max subscription.
          </p>

          <div className="bg-surface-elevated rounded-md p-4 mb-4 text-left">
            <p className="text-sm text-text-secondary mb-3">Run this command in your terminal:</p>
            <code className="text-accent font-mono text-sm block bg-background p-2 rounded">
              claude login
            </code>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-md p-3 mb-6 text-left">
            <div className="flex gap-2">
              <Key className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-200">
                This will authenticate using your Claude Max subscription - no separate API key needed!
              </p>
            </div>
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
