/**
 * Agent Orchestrator Module
 * Routes AI generation requests to appropriate specialized agents
 */

export interface AgentRouting {
  agent: string
  description: string
  capabilities: string[]
}

// Agent target to specialized agent mapping
const agentMapping: Record<string, AgentRouting> = {
  // Writer Agent - handles chapter/scene writing
  writer: {
    agent: 'WriterAgent',
    description: 'Specialized in prose generation, narrative writing, and creative content',
    capabilities: ['generate-chapter', 'generate-scene', 'continue-writing', 'expand-scene'],
  },
  // Character Agent - handles character creation and development
  character: {
    agent: 'CharacterAgent',
    description: 'Specialized in character profiles, dialogue, and character voice',
    capabilities: [
      'generate-character',
      'generate-dialogue',
      'character-backstory',
      'voice-consistency',
    ],
  },
  // Chapter Agent - handles chapter structure and outlines
  chapter: {
    agent: 'ChapterAgent',
    description: 'Specialized in chapter structure, outlining, and content generation',
    capabilities: [
      'generate-chapter-outline',
      'generate-chapter',
      'chapter-structure',
      'scene-breakdown',
    ],
  },
  // Plot Agent - handles plot development and structure
  plot: {
    agent: 'PlotAgent',
    description: 'Specialized in plot structure, story arcs, and narrative frameworks',
    capabilities: ['generate-plot-beat', 'plot-structure', 'story-arc', 'conflict-development'],
  },
  // Review/Critic Agent - handles critiques and quality analysis
  review: {
    agent: 'CriticAgent',
    description: 'Specialized in manuscript critique, quality analysis, and improvement suggestions',
    capabilities: ['critique-chapter', 'implement-suggestions', 'auto-improve', 'quality-analysis'],
  },
  // Wiki Agent - handles world-building and consistency
  wiki: {
    agent: 'WikiAgent',
    description: 'Specialized in world-building, consistency checking, and lore management',
    capabilities: ['generate-wiki-entry', 'consistency-check', 'world-building', 'lore-expansion'],
  },
  // Market Agent - handles market analysis and positioning
  market: {
    agent: 'MarketAgent',
    description: 'Specialized in market analysis, comparable titles, and positioning',
    capabilities: ['market-analysis', 'comparable-titles', 'genre-positioning', 'audience-analysis'],
  },
  // Brainstorm Agent - handles brainstorm analysis and foundation generation
  brainstorm: {
    agent: 'BrainstormAgent',
    description: 'Specialized in analyzing raw creative ideas and generating story foundations',
    capabilities: ['analyze-brainstorm', 'generate-foundations', 'generate-questions'],
  },
}

/**
 * Route a request to the appropriate specialized agent
 * @param agentTarget - The target agent type (e.g., 'writer', 'character', 'plot')
 * @returns Agent routing information including name, description, and capabilities
 */
export function routeToAgent(agentTarget: string): AgentRouting {
  // Find matching agent
  const targetLower = agentTarget?.toLowerCase() || 'writer'
  const matched = agentMapping[targetLower] || agentMapping['writer']

  return matched
}

/**
 * Get all available agent types
 * @returns Array of available agent target strings
 */
export function getAvailableAgents(): string[] {
  return Object.keys(agentMapping)
}

/**
 * Check if an action is supported by a specific agent
 * @param agentTarget - The target agent type
 * @param action - The action to check
 * @returns Whether the agent supports the action
 */
export function isActionSupported(agentTarget: string, action: string): boolean {
  const agent = routeToAgent(agentTarget)
  return agent.capabilities.includes(action)
}
