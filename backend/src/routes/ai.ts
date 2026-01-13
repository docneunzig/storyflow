/**
 * AI Generation Router
 * HTTP endpoints for AI-powered content generation
 */

import { Router, Request, Response } from 'express'
import {
  generateWithClaude,
  registerGeneration,
  cancelGeneration,
  cleanupGeneration,
  isClaudeCliAuthenticated,
} from '../services/claude.js'
import {
  subscribeToProgress,
  cleanupProgress,
  createProgressTracker,
  getProgress,
  type GenerationProgress,
} from '../services/claude/progress-emitter.js'
import { routeToAgent } from '../services/orchestrator.js'
import { simulateAIGeneration } from '../services/simulation.js'

const router = Router()

// Configuration: set to true to use real Claude API, false for simulated responses
const USE_REAL_CLAUDE = process.env.USE_REAL_CLAUDE !== 'false'

// Track active generation requests for cancellation
const activeGenerations = new Map<string, { cancelled: boolean }>()

// GET /api/ai/status - Check Claude CLI authentication status
router.get('/status', async (req, res) => {
  try {
    // For testing: allow forcing unauthenticated state via query param
    if (req.query.force === 'unauthenticated') {
      res.json({
        authenticated: false,
        cliAuthenticated: false,
        useRealClaude: USE_REAL_CLAUDE,
        canUseAI: false,
        message: 'Claude CLI not authenticated (forced for testing)',
      })
      return
    }

    // Check if Claude CLI is authenticated (uses Claude Max subscription)
    const cliAuthenticated = isClaudeCliAuthenticated()

    // Determine overall status - we now use Claude CLI, not API key
    const canUseAI = USE_REAL_CLAUDE ? cliAuthenticated : true

    res.json({
      authenticated: cliAuthenticated,
      cliAuthenticated,
      apiKeyConfigured: cliAuthenticated, // For backwards compatibility with frontend
      useRealClaude: USE_REAL_CLAUDE,
      canUseAI,
      message: canUseAI
        ? USE_REAL_CLAUDE
          ? 'Claude CLI ready (using your Claude Max subscription)'
          : 'Using simulated responses'
        : 'Claude CLI not authenticated. Run "claude login" in your terminal.',
    })
  } catch (error) {
    res.json({
      authenticated: false,
      cliAuthenticated: false,
      apiKeyConfigured: false,
      useRealClaude: USE_REAL_CLAUDE,
      canUseAI: !USE_REAL_CLAUDE,
      message: 'Status check failed',
    })
  }
})

// POST /api/ai/generate - Generic AI generation endpoint with cancellation support
router.post('/generate', async (req: Request, res: Response) => {
  const { agentTarget, action, context } = req.body
  const generationId = `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Create progress tracker for real-time updates
  const progressTracker = createProgressTracker(generationId)

  // Route to appropriate specialized agent via orchestrator
  const routedAgent = routeToAgent(agentTarget)
  console.log(`[Orchestrator] Routing request to ${routedAgent.agent} for action: ${action}`)
  console.log(`[${routedAgent.agent}] Starting generation ${generationId} (Claude: ${USE_REAL_CLAUDE})`)

  // Emit initial progress
  progressTracker.initialize()

  // Register this generation (both local and in Claude service)
  activeGenerations.set(generationId, { cancelled: false })
  if (USE_REAL_CLAUDE) {
    registerGeneration(generationId)
  }

  // Handle client disconnect (abort) - use socket close detection
  const socket = req.socket
  const onSocketClose = () => {
    const generation = activeGenerations.get(generationId)
    if (generation && !res.writableEnded) {
      console.log(`[AI Generate] Client disconnected, cancelling ${generationId}`)
      generation.cancelled = true
      if (USE_REAL_CLAUDE) {
        cancelGeneration(generationId)
      }
    }
  }
  socket.on('close', onSocketClose)

  try {
    let result: string
    let cancelled: boolean

    // Emit analyzing progress
    progressTracker.analyzing()

    if (USE_REAL_CLAUDE) {
      // Emit generating progress
      progressTracker.generating(`Generating with ${routedAgent.agent}...`)

      // Use real Claude API
      const agentType = agentTarget?.toLowerCase() || 'writer'
      const response = await generateWithClaude({
        agentType,
        action,
        context: context || {},
        generationId,
      })
      result = response.result
      cancelled = response.cancelled

      if (response.usage) {
        console.log(
          `[${routedAgent.agent}] Tokens used - Input: ${response.usage.inputTokens}, Output: ${response.usage.outputTokens}`
        )
      }
    } else {
      // Emit generating progress for simulated
      progressTracker.generating('Generating content...')

      // Use simulated generation for testing
      // Create a cancellation checker that checks the activeGenerations map
      const checkCancelled = () => {
        const current = activeGenerations.get(generationId)
        return current?.cancelled ?? false
      }
      const response = await simulateAIGeneration(action, context || {}, checkCancelled)
      result = response.result
      cancelled = response.cancelled
    }

    // Emit processing progress
    progressTracker.processing()

    // Clean up socket listener and registrations
    socket.off('close', onSocketClose)
    activeGenerations.delete(generationId)
    if (USE_REAL_CLAUDE) {
      cleanupGeneration(generationId)
    }

    if (cancelled) {
      console.log(`[AI Generate] Generation ${generationId} was cancelled`)
      progressTracker.cancelled()
      cleanupProgress(generationId)
      if (!res.writableEnded) {
        res.status(499).json({
          status: 'cancelled',
          message: 'Generation cancelled by user',
        })
      }
      return
    }

    console.log(`[${routedAgent.agent}] Generation ${generationId} completed successfully`)

    // Emit completion progress
    progressTracker.complete(result)

    // Clean up progress after a delay (allow clients to receive the final update)
    setTimeout(() => cleanupProgress(generationId), 5000)

    res.json({
      status: 'success',
      result,
      action,
      generationId,
      agent: routedAgent.agent,
      agentDescription: routedAgent.description,
      usingClaude: USE_REAL_CLAUDE,
    })
  } catch (error) {
    socket.off('close', onSocketClose)
    activeGenerations.delete(generationId)
    if (USE_REAL_CLAUDE) {
      cleanupGeneration(generationId)
    }
    const errorMessage = error instanceof Error ? error.message : 'Generation failed'
    console.error('AI generation error:', error)

    // Emit error progress
    progressTracker.error(errorMessage)
    setTimeout(() => cleanupProgress(generationId), 5000)

    res.status(500).json({
      status: 'error',
      message: errorMessage,
    })
  }
})

// GET /api/ai/stream/:generationId - SSE endpoint for real-time progress
router.get('/stream/:generationId', (req: Request, res: Response) => {
  const { generationId } = req.params

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no') // Disable nginx buffering

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', generationId })}\n\n`)

  // Check if there's already a progress for this generation
  const existingProgress = getProgress(generationId)
  if (existingProgress) {
    res.write(`data: ${JSON.stringify({ type: 'progress', ...existingProgress })}\n\n`)

    // If already completed or errored, close the connection
    if (['completed', 'error', 'cancelled'].includes(existingProgress.status)) {
      res.end()
      return
    }
  }

  // Subscribe to progress updates
  const unsubscribe = subscribeToProgress(generationId, (progress: GenerationProgress) => {
    try {
      res.write(`data: ${JSON.stringify({ type: 'progress', ...progress })}\n\n`)

      // Close connection when generation is done
      if (['completed', 'error', 'cancelled'].includes(progress.status)) {
        setTimeout(() => {
          unsubscribe()
          res.end()
        }, 100) // Small delay to ensure the final message is sent
      }
    } catch (err) {
      // Client disconnected
      unsubscribe()
    }
  })

  // Handle client disconnect
  req.on('close', () => {
    unsubscribe()
  })

  // Keep connection alive with periodic heartbeat
  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`)
    } catch {
      clearInterval(heartbeat)
      unsubscribe()
    }
  }, 30000) // Send heartbeat every 30 seconds

  // Clean up heartbeat on close
  req.on('close', () => {
    clearInterval(heartbeat)
  })
})

// POST /api/ai/consistency-check - Check for consistency issues
router.post('/consistency-check', async (req, res) => {
  const { content: _content, context: _context } = req.body

  // Placeholder for consistency checking
  res.json({
    status: 'success',
    warnings: [],
    message: 'Consistency check endpoint - implementation pending',
  })
})

export { router as aiRouter }
