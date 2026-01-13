import { Request, Response, NextFunction } from 'express'
import { existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

// Cache auth status to avoid checking filesystem on every request
let cachedAuthStatus: boolean | null = null
let cacheTimestamp: number = 0
const CACHE_TTL = 30000 // 30 seconds

/**
 * Check if Claude CLI is authenticated by verifying the history file exists.
 * Uses Node.js fs API instead of shell commands for security.
 */
function checkClaudeAuth(): boolean {
  const now = Date.now()

  // Return cached result if still valid
  if (cachedAuthStatus !== null && now - cacheTimestamp < CACHE_TTL) {
    return cachedAuthStatus
  }

  try {
    // Safely construct the path using Node.js APIs
    const claudeHistoryPath = join(homedir(), '.claude', 'history.jsonl')
    cachedAuthStatus = existsSync(claudeHistoryPath)
    cacheTimestamp = now
    return cachedAuthStatus
  } catch {
    cachedAuthStatus = false
    cacheTimestamp = now
    return false
  }
}

/**
 * Middleware to require Claude CLI authentication for protected routes.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Test backdoor only available in test environment
  if (process.env.NODE_ENV === 'test' && req.headers['x-test-unauth'] === 'true') {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Claude CLI authentication required. Run "claude login" in your terminal.',
    })
    return
  }

  const isAuthenticated = checkClaudeAuth()

  if (!isAuthenticated) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Claude CLI authentication required. Run "claude login" in your terminal.',
    })
    return
  }

  next()
}

/**
 * Clear auth cache (useful for testing)
 */
export function clearAuthCache() {
  cachedAuthStatus = null
  cacheTimestamp = 0
}

/**
 * Check if Claude CLI is authenticated (synchronous version for use in services)
 */
export function isClaudeCliAuthenticated(): boolean {
  return checkClaudeAuth()
}
