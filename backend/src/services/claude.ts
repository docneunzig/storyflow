// Claude Service - Main Entry Point
// Re-exports from modular structure for backwards compatibility

export {
  // Client functions
  isClaudeCliAuthenticated,
  isApiKeyConfigured,
  callClaudeCli,
  type ClaudeCliResult,
  // Generation management
  registerGeneration,
  cancelGeneration,
  cleanupGeneration,
  isGenerationCancelled,
  // Agent prompts
  SYSTEM_PROMPTS,
  getSystemPrompt,
  // Context builder
  buildContext,
  // Main generation functions
  generateWithClaude,
  streamWithClaude,
  // Types
  type GenerationResult,
  type GenerationOptions,
} from './claude/index.js'

// Legacy exports - action prompts still in legacy file
export { ACTION_PROMPTS } from './claude-legacy.js'
