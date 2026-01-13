// Claude Service - Modular Architecture
// This file provides the main interface to the Claude AI service

// Re-export client functions
export {
  isClaudeCliAuthenticated,
  isApiKeyConfigured,
  callClaudeCli,
  type ClaudeCliResult,
} from './client.js'

// Re-export generation management
export {
  registerGeneration,
  cancelGeneration,
  cleanupGeneration,
  isGenerationCancelled,
} from './generation-manager.js'

// Re-export agent system prompts
export { SYSTEM_PROMPTS, getSystemPrompt } from './agents/index.js'

// Re-export context builder
export { buildContext } from './context-builder.js'

// Re-export progress emitter for real-time streaming
export {
  emitProgress,
  getProgress,
  subscribeToProgress,
  cleanupProgress,
  createProgressTracker,
  type GenerationProgress,
} from './progress-emitter.js'

// Import for local use
import { callClaudeCli } from './client.js'
import { SYSTEM_PROMPTS } from './agents/index.js'
import { isGenerationCancelled } from './generation-manager.js'

// Types
export interface GenerationResult {
  result: string
  cancelled: boolean
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}

export interface GenerationOptions {
  agentType: string
  action: string
  context: Record<string, any>
  generationId: string
  maxTokens?: number
  temperature?: number
}

// Action prompts - these define how each action is handled
// For now, import from the legacy file until full migration is complete
import { ACTION_PROMPTS } from '../claude-legacy.js'

// Re-export for backwards compatibility
export { ACTION_PROMPTS }

// Main generation function using Claude CLI
export async function generateWithClaude(options: GenerationOptions): Promise<GenerationResult> {
  const { agentType, action, context, generationId } = options

  // Check for cancellation before starting
  if (isGenerationCancelled(generationId)) {
    return { result: '', cancelled: true }
  }

  // Get system prompt for agent type
  const systemPrompt = SYSTEM_PROMPTS[agentType] || SYSTEM_PROMPTS.writer

  // Get action-specific prompt builder
  const promptBuilder = ACTION_PROMPTS[action]
  if (!promptBuilder) {
    return {
      result: `Action "${action}" not yet implemented with Claude integration.`,
      cancelled: false,
    }
  }

  const userPrompt = promptBuilder(context)

  try {
    console.log(`[Claude CLI] Starting generation for action: ${action}`)
    const response = await callClaudeCli(userPrompt, systemPrompt)

    // Check for cancellation after API call
    if (isGenerationCancelled(generationId)) {
      return { result: '', cancelled: true }
    }

    console.log(`[Claude CLI] Generation complete, tokens: ${response.usage?.inputTokens || 'N/A'} in / ${response.usage?.outputTokens || 'N/A'} out`)

    return {
      result: response.result,
      cancelled: false,
      usage: response.usage,
    }
  } catch (error) {
    console.error('[Claude CLI] Generation error:', error)
    throw error
  }
}

// Streaming generation (CLI returns full result at once)
export async function* streamWithClaude(options: GenerationOptions): AsyncGenerator<string, void, unknown> {
  const { agentType, action, context, generationId } = options

  if (isGenerationCancelled(generationId)) {
    return
  }

  const systemPrompt = SYSTEM_PROMPTS[agentType] || SYSTEM_PROMPTS.writer
  const promptBuilder = ACTION_PROMPTS[action]

  if (!promptBuilder) {
    yield `Action "${action}" not yet implemented.`
    return
  }

  const userPrompt = promptBuilder(context)

  try {
    // Claude CLI doesn't support streaming, so we yield the full result at once
    const response = await callClaudeCli(userPrompt, systemPrompt)

    if (!isGenerationCancelled(generationId)) {
      yield response.result
    }
  } catch (error) {
    console.error('[Claude CLI] Streaming error:', error)
    yield `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}
