import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, ArrowRight, Loader2 } from 'lucide-react'

export function LogoutPage() {
  const navigate = useNavigate()
  const [isCleared, setIsCleared] = useState(false)

  useEffect(() => {
    // Clear all session data
    sessionStorage.clear()
    localStorage.removeItem('storyflow-auth')
    localStorage.removeItem('storyflow-session')

    // Small delay to ensure storage is cleared
    const timer = setTimeout(() => {
      setIsCleared(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const handleLogin = () => {
    // Navigate to home which will trigger auth check
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="card max-w-md text-center">
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
          {isCleared ? (
            <LogOut className="h-8 w-8 text-accent" />
          ) : (
            <Loader2 className="h-8 w-8 text-accent animate-spin" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-2">
          {isCleared ? 'Signed Out Successfully' : 'Signing Out...'}
        </h1>

        <p className="text-text-secondary mb-6">
          {isCleared
            ? 'Your session has been cleared. You can safely close this window or sign in again.'
            : 'Clearing your session data...'
          }
        </p>

        {isCleared && (
          <button
            onClick={handleLogin}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            Sign In Again
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
