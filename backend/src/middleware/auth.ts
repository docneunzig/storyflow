import { Request, Response, NextFunction } from 'express'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Cache auth status to avoid checking filesystem on every request
let cachedAuthStatus: boolean | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 30000 // 30 seconds

async function checkClaudeAuth(): Promise<boolean> {
  const now = Date.now()

  // Return cached result if still valid
  if (cachedAuthStatus !== null && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedAuthStatus
  }

  try {
    const { stdout } = await execAsync('ls ~/.claude/history.jsonl 2>/dev/null && echo "authenticated" || echo "not authenticated"', { timeout: 5000 })
    cachedAuthStatus = stdout.includes('history.jsonl')
    cacheTimestamp = now
    return cachedAuthStatus
  } catch {
    cachedAuthStatus = false
    cacheTimestamp = now
    return false
  }
}

// Middleware to require authentication for protected routes
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // For testing: allow forcing unauthenticated state via header
  if (req.headers['x-test-unauth'] === 'true') {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Claude CLI authentication required. Run "claude login" in your terminal.',
    })
    return
  }

  const isAuthenticated = await checkClaudeAuth()

  if (!isAuthenticated) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Claude CLI authentication required. Run "claude login" in your terminal.',
    })
    return
  }

  next()
}

// Clear auth cache (useful for testing)
export function clearAuthCache() {
  cachedAuthStatus = null
  cacheTimestamp = 0
}
