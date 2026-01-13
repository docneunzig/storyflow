import { z } from 'zod'

/**
 * Zod schemas for AI generation request validation.
 * Provides runtime type safety for incoming API requests.
 */

// Valid agent targets for generation requests
export const AgentTargetSchema = z.enum([
  'writer',
  'critic',
  'analyzer',
  'brainstorm',
  'character',
  'plot',
  'scene',
  'wiki',
  'market',
])

export type AgentTarget = z.infer<typeof AgentTargetSchema>

// Valid generation actions
export const GenerationActionSchema = z.enum([
  'generate-chapter',
  'generate-scene',
  'generate-character',
  'generate-dialogue',
  'analyze-brainstorm',
  'generate-foundations',
  'expand-selection',
  'condense-selection',
  'rewrite-selection',
  'generate-alternatives',
  'continue-writing',
  'generate-chapter-draft',
  'generate-scene-prose',
  'expand-beat',
  'suggest-twists',
  'suggest-titles',
  'suggest-tones',
  'suggest-themes',
  'extract-elements',
  'expand-entry',
  'deepen-character',
  'generate-character-dialogue',
  'generate-synopsis',
  'generate-query-letter',
  'generate-book-description',
  'analyze-market',
  'suggest-keywords',
])

export type GenerationAction = z.infer<typeof GenerationActionSchema>

// Base context schema - allows additional properties
const BaseContextSchema = z.object({
  projectId: z.string().optional(),
  novelLanguage: z.enum(['en', 'de', 'fr', 'es', 'it']).optional(),
}).passthrough() // Allow additional properties for flexibility

// Generation request schema
export const GenerationRequestSchema = z.object({
  agentTarget: AgentTargetSchema.optional(),
  action: z.string().min(1, 'Action is required'),
  context: BaseContextSchema.optional().default({}),
  payload: z.record(z.unknown()).optional(),
})

export type GenerationRequest = z.infer<typeof GenerationRequestSchema>

// Validation result type
export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: z.ZodError['errors']
}

/**
 * Validate a generation request
 */
export function validateGenerationRequest(data: unknown): ValidationResult<GenerationRequest> {
  const result = GenerationRequestSchema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return { success: false, errors: result.error.errors }
}
