import { Router } from 'express'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const router = Router()

// GET /api/ai/status - Check Claude CLI authentication status
router.get('/status', async (req, res) => {
  try {
    // For testing: allow forcing unauthenticated state via query param
    if (req.query.force === 'unauthenticated') {
      res.json({
        authenticated: false,
        message: 'Claude CLI not authenticated (forced for testing)',
      })
      return
    }

    // Check if Claude CLI is installed and has configuration
    // The CLI stores config in ~/.claude/ directory - if history.jsonl exists, user has used Claude
    const { stdout } = await execAsync('ls ~/.claude/history.jsonl 2>/dev/null && echo "authenticated" || echo "not authenticated"', { timeout: 5000 })

    const authenticated = stdout.includes('history.jsonl')

    res.json({
      authenticated,
      message: authenticated ? 'Claude CLI is authenticated' : 'Claude CLI not authenticated',
    })
  } catch (error) {
    // If check fails, return unauthenticated
    res.json({
      authenticated: false,
      message: 'Claude CLI not available or not authenticated',
    })
  }
})

// POST /api/ai/generate - Generic AI generation endpoint
router.post('/generate', async (req, res) => {
  const { agentTarget, action, context, payload, userPreferences } = req.body

  // This is a placeholder for the Claude Agent SDK integration
  // The actual implementation will use the Claude SDK to generate content

  res.json({
    status: 'success',
    message: 'AI generation endpoint - implementation pending',
    request: { agentTarget, action },
  })
})

// POST /api/ai/consistency-check - Check for consistency issues
router.post('/consistency-check', async (req, res) => {
  const { content, context } = req.body

  // Placeholder for consistency checking
  res.json({
    status: 'success',
    warnings: [],
    message: 'Consistency check endpoint - implementation pending',
  })
})

export { router as aiRouter }
