import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

// Check if Claude CLI is authenticated (has history.jsonl from prior use)
export function isClaudeCliAuthenticated(): boolean {
  const historyPath = join(homedir(), '.claude', 'history.jsonl')
  return existsSync(historyPath)
}

// Legacy function for API key check (kept for backwards compatibility)
export function isApiKeyConfigured(): boolean {
  // Now we check for Claude CLI authentication instead
  return isClaudeCliAuthenticated()
}

interface ClaudeCliResponse {
  type: string
  subtype: string
  is_error: boolean
  result: string
  duration_ms: number
  total_cost_usd: number
  usage?: {
    input_tokens: number
    output_tokens: number
  }
}

// Call Claude CLI with a prompt and return the response
async function callClaudeCli(prompt: string, systemPrompt?: string): Promise<{ result: string; usage?: { inputTokens: number; outputTokens: number } }> {
  return new Promise((resolve, reject) => {
    // Build the command with system prompt if provided
    const args = ['-p', '--output-format', 'json', '--model', 'sonnet']

    if (systemPrompt) {
      args.push('--append-system-prompt', systemPrompt)
    }

    const claude = spawn('claude', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    })

    let stdout = ''
    let stderr = ''

    claude.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    claude.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    claude.on('error', (err) => {
      reject(new Error(`Failed to start Claude CLI: ${err.message}. Make sure 'claude' is in your PATH.`))
    })

    claude.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr}`))
        return
      }

      try {
        const response: ClaudeCliResponse = JSON.parse(stdout)
        if (response.is_error) {
          reject(new Error(`Claude CLI error: ${response.result}`))
          return
        }
        resolve({
          result: response.result,
          usage: response.usage ? {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
          } : undefined,
        })
      } catch (err) {
        reject(new Error(`Failed to parse Claude CLI response: ${stdout}`))
      }
    })

    // Send the prompt to stdin
    claude.stdin.write(prompt)
    claude.stdin.end()
  })
}

// System prompts for different agent types
const SYSTEM_PROMPTS: Record<string, string> = {
  writer: `You are a world-class fiction writer with expertise in prose, narrative voice, and creative writing.
You write vivid, engaging prose that matches the specified POV, tense, and style.
Always maintain consistency with the story's specification, characters, and established facts.
Your writing should feel natural, emotionally resonant, and appropriate for the target audience.`,

  character: `You are an expert in character development and psychology.
You create deep, nuanced characters with consistent voices, clear motivations, and believable flaws.
When generating dialogue, each character should sound distinct and true to their personality.
Consider the character's background, education, emotional state, and relationships when writing their voice.`,

  plot: `You are a master story architect with deep knowledge of narrative structure.
You understand three-act structure, hero's journey, save the cat beats, and other frameworks.
You help develop compelling plot beats with proper setup/payoff, rising tension, and satisfying resolutions.
Always consider the genre conventions and reader expectations.`,

  review: `You are a professional book editor and literary critic.
You provide constructive, specific feedback across 12 quality dimensions:
- Plot Coherence, Character Consistency, Character Voice, Pacing
- Dialogue Quality, Prose Style, Emotional Impact, Tension Management
- Worldbuilding, Theme Expression, Market Appeal, Originality

Score each dimension 1-10 and provide actionable improvement suggestions.
Be honest but constructive - your goal is to help the author improve.`,

  wiki: `You are a worldbuilding expert and continuity editor.
You help maintain consistency across locations, timeline, magic systems, cultures, and lore.
You extract and organize world elements from manuscript text.
You flag potential continuity issues and contradictions.`,

  market: `You are a publishing industry expert with knowledge of current market trends.
You analyze manuscripts for market positioning, comparable titles, and genre fit.
You understand reader expectations across different genres and subgenres.
You provide insights on cover copy, query letters, and marketing angles.`,

  brainstorm: `You are a creative development partner who helps authors develop raw ideas into story foundations.
You ask probing questions that unlock story potential.
You identify implicit plot structures, character archetypes, and thematic elements.
You generate clear, actionable story seeds that authors can develop further.`,

  continuity: `You are a meticulous continuity editor who tracks every detail in a manuscript.
You extract facts about characters (physical descriptions, knowledge states, relationships),
locations (descriptions, distances, features), timeline (dates, durations, sequences),
and objects (locations, ownership, states).
You flag contradictions and inconsistencies with specific citations.`,

  voiceDNA: `You are a linguistic analyst specializing in character voice patterns.
You analyze dialogue to extract voice fingerprints: sentence length, vocabulary,
contractions, question patterns, emotional markers, filler words, and unique phrases.
You can identify when a character's dialogue drifts from their established voice.`,

  readerExperience: `You are a reader psychology expert who can model the naive reader experience.
You track what information readers have at each point in the story.
You predict emotional reactions, active questions, and twist impacts.
You identify pacing issues and engagement drops from the reader's perspective.`,
}

// Build context string from project data
function buildContext(context: Record<string, any>): string {
  const parts: string[] = []

  if (context.specification) {
    const spec = context.specification
    parts.push(`## Novel Specification
- Title: ${spec.workingTitle || 'Untitled'}
- Genre: ${spec.genre?.join(', ') || 'Not specified'}
- Subgenre: ${spec.subgenre?.join(', ') || 'Not specified'}
- Target Audience: ${spec.targetAudience || 'Adult'}
- POV: ${spec.pov || 'Third Limited'}
- Tense: ${spec.tense || 'Past'}
- Tone: ${spec.tone || 'Not specified'}
- Themes: ${spec.themes?.join(', ') || 'Not specified'}
- Word Count Target: ${spec.targetWordCount || 80000}`)
  }

  if (context.characters && context.characters.length > 0) {
    parts.push(`\n## Characters`)
    for (const char of context.characters) {
      parts.push(`### ${char.name} (${char.role || 'Supporting'})
- Age: ${char.age || 'Unknown'}
- Description: ${char.physicalDescription || 'Not described'}
- Personality: ${char.personality?.join(', ') || 'Not specified'}
- Speech Patterns: ${char.speechPatterns || 'Standard'}
- Vocabulary Level: ${char.vocabularyLevel || 'Average'}`)
    }
  }

  if (context.plotBeats && context.plotBeats.length > 0) {
    parts.push(`\n## Plot Beats`)
    for (const beat of context.plotBeats) {
      parts.push(`- ${beat.title}: ${beat.summary || ''}`)
    }
  }

  if (context.scenes && context.scenes.length > 0) {
    parts.push(`\n## Scenes`)
    for (const scene of context.scenes) {
      parts.push(`- ${scene.title}: ${scene.description || ''}`)
    }
  }

  if (context.previousContent) {
    parts.push(`\n## Previous Content
${context.previousContent}`)
  }

  if (context.selectedText) {
    parts.push(`\n## Selected Text
${context.selectedText}`)
  }

  if (context.currentChapter) {
    parts.push(`\n## Current Chapter Content
${context.currentChapter}`)
  }

  return parts.join('\n')
}

// Action-specific prompt builders
const ACTION_PROMPTS: Record<string, (context: Record<string, any>) => string> = {
  'generate-chapter': (ctx) => `Write a complete chapter for this novel.

${buildContext(ctx)}

${ctx.chapterOutline ? `Chapter outline to follow:\n${ctx.chapterOutline}` : ''}
${ctx.targetWords ? `Target word count: ${ctx.targetWords}` : ''}

Write the full chapter prose, maintaining the specified POV and tense throughout.
Start directly with the narrative - do not include chapter numbers or titles.`,

  'generate-scene': (ctx) => `Write a complete scene for this novel.

${buildContext(ctx)}

Scene details:
${ctx.sceneOutline || 'Write an engaging scene that advances the plot.'}

Write vivid, engaging prose that brings this scene to life.
Maintain the specified POV and tense throughout.`,

  'expand-selection': (ctx) => `Expand the following text with more detail, description, and depth while maintaining the same voice, style, POV, and tense.

${buildContext(ctx)}

Text to expand:
"${ctx.selectedText}"

Provide the expanded version only, without any commentary or explanation.`,

  'condense-selection': (ctx) => `Condense the following text to be more concise while preserving the essential meaning, voice, and style.

${buildContext(ctx)}

Text to condense:
"${ctx.selectedText}"

Provide the condensed version only, without any commentary or explanation.`,

  'rewrite-selection': (ctx) => `Rewrite the following text with different phrasing while maintaining the same meaning, tone, and style.

${buildContext(ctx)}

Text to rewrite:
"${ctx.selectedText}"

Provide the rewritten version only, without any commentary or explanation.`,

  'generate-alternatives': (ctx) => `Generate 3 alternative versions of the following text, each with a different approach while maintaining the same general meaning.

${buildContext(ctx)}

Text to rewrite:
"${ctx.selectedText}"

Provide exactly 3 alternatives, separated by "---" on its own line. No numbering or labels.`,

  'continue-writing': (ctx) => `Continue writing from where this text ends, maintaining the same voice, style, POV, and tense.

${buildContext(ctx)}

Text to continue from:
"${ctx.selectedText || ctx.currentChapter}"

Continue the narrative naturally. Write approximately ${ctx.targetWords || 500} words.`,

  'analyze-brainstorm': (ctx) => `Analyze this brainstorm text and generate 5-7 clarifying questions that will help develop the story.

Brainstorm text:
${ctx.brainstormText}

Generate questions that:
1. Clarify the central conflict
2. Explore character motivations
3. Identify potential plot structures
4. Uncover thematic elements
5. Address gaps in the concept

Format as JSON array: ["question1", "question2", ...]`,

  'generate-foundations': (ctx) => `Based on this brainstorm and the author's answers, generate story foundations.

Brainstorm:
${ctx.brainstormText}

Author's answers:
${JSON.stringify(ctx.answers || {}, null, 2)}

Generate a JSON object with:
{
  "plot": {
    "premise": "one-sentence premise",
    "centralConflict": "the main conflict",
    "suggestedFramework": "Three-Act Structure" or similar,
    "plotSeeds": [{"title": "", "description": "", "confidence": "explicit|inferred|suggested"}]
  },
  "characters": {
    "identified": [{"name": "", "role": "", "traits": [], "confidence": ""}],
    "suggestedArchetypes": ["mentor", "antagonist", etc.]
  },
  "scenes": {
    "envisioned": [{"title": "", "description": ""}],
    "suggested": [{"title": "", "description": ""}]
  }
}`,

  'critique-chapter': (ctx) => `You are a world-class literary editor who has edited bestselling novels. Provide an expert critique of this chapter.

${buildContext(ctx)}

CHAPTER TO CRITIQUE:
---
${ctx.chapterContent}
---

CRITIQUE METHODOLOGY:
Analyze the chapter across these 12 professional quality dimensions. For each:
- Provide a score from 1-10 (be honest and calibrated - 7 is good, 8 is very good, 9+ is exceptional)
- Quote specific passages that exemplify issues or strengths
- Give actionable, specific improvement suggestions

THE 12 DIMENSIONS:
1. PLOT_COHERENCE (12% weight): Does the chapter advance the story logically? Are cause-and-effect clear?
2. CHARACTER_CONSISTENCY (10%): Do characters act in ways consistent with their established personalities?
3. CHARACTER_VOICE (8%): Is each character's dialogue distinctive and true to their voice?
4. PACING (10%): Does the chapter flow well? Is the balance of action/reflection appropriate?
5. DIALOGUE_QUALITY (8%): Is dialogue natural, purposeful, and distinct per character?
6. PROSE_STYLE (10%): Is the prose clear, evocative, and appropriate for the genre/audience?
7. EMOTIONAL_IMPACT (10%): Does the chapter create genuine emotional engagement?
8. TENSION_MANAGEMENT (8%): Is tension built and released effectively?
9. WORLD_BUILDING (6%): Are setting details vivid and consistent?
10. THEME_EXPRESSION (6%): Are themes expressed subtly through story rather than stated?
11. MARKET_APPEAL (6%): Would this engage the target audience? Genre expectations met?
12. ORIGINALITY (6%): Does this offer fresh perspectives or feel derivative?

RESPOND WITH THIS EXACT JSON STRUCTURE:
{
  "overallScore": <weighted average as number>,
  "dimensions": {
    "PLOT_COHERENCE": {
      "score": <1-10>,
      "weight": 12,
      "strengths": ["specific strength with quote"],
      "weaknesses": ["specific weakness with quote"],
      "suggestions": ["actionable improvement"]
    },
    "CHARACTER_CONSISTENCY": { "score": <1-10>, "weight": 10, "strengths": [], "weaknesses": [], "suggestions": [] },
    "CHARACTER_VOICE": { "score": <1-10>, "weight": 8, "strengths": [], "weaknesses": [], "suggestions": [] },
    "PACING": { "score": <1-10>, "weight": 10, "strengths": [], "weaknesses": [], "suggestions": [] },
    "DIALOGUE_QUALITY": { "score": <1-10>, "weight": 8, "strengths": [], "weaknesses": [], "suggestions": [] },
    "PROSE_STYLE": { "score": <1-10>, "weight": 10, "strengths": [], "weaknesses": [], "suggestions": [] },
    "EMOTIONAL_IMPACT": { "score": <1-10>, "weight": 10, "strengths": [], "weaknesses": [], "suggestions": [] },
    "TENSION_MANAGEMENT": { "score": <1-10>, "weight": 8, "strengths": [], "weaknesses": [], "suggestions": [] },
    "WORLD_BUILDING": { "score": <1-10>, "weight": 6, "strengths": [], "weaknesses": [], "suggestions": [] },
    "THEME_EXPRESSION": { "score": <1-10>, "weight": 6, "strengths": [], "weaknesses": [], "suggestions": [] },
    "MARKET_APPEAL": { "score": <1-10>, "weight": 6, "strengths": [], "weaknesses": [], "suggestions": [] },
    "ORIGINALITY": { "score": <1-10>, "weight": 6, "strengths": [], "weaknesses": [], "suggestions": [] }
  },
  "prioritizedSuggestions": [
    {
      "id": "sug_1",
      "dimension": "<DIMENSION_NAME>",
      "priority": "HIGH",
      "suggestion": "Specific, actionable improvement",
      "targetPassage": "Quote the exact passage to improve",
      "expectedImpact": "How this will improve the chapter"
    }
  ],
  "overallStrengths": ["Top 3 things working well"],
  "criticalIssues": ["Top 3 things that must be fixed"],
  "marketComparison": "Brief comparison to published works in genre"
}

Provide ONLY the JSON, no other text.`,

  'extract-facts': (ctx) => `Extract all factual assertions from this chapter that should be tracked for continuity.

${buildContext(ctx)}

Chapter content:
${ctx.chapterContent}

Extract facts about:
- Physical descriptions (eye color, height, scars, etc.)
- Character knowledge (who knows what)
- Object locations
- Relationship states
- Timeline details

Format as JSON array:
[{
  "subjectId": "character/location/object name",
  "factType": "physical|knowledge|location|relationship|temporal",
  "assertion": "has blue eyes",
  "quote": "exact text from chapter",
  "position": character_offset,
  "confidence": "explicit|inferred"
}]`,

  'check-continuity': (ctx) => `Check for continuity conflicts between these facts.

Established facts:
${JSON.stringify(ctx.existingFacts, null, 2)}

New facts from current chapter:
${JSON.stringify(ctx.newFacts, null, 2)}

Identify any contradictions. Format as JSON:
{
  "conflicts": [{
    "existingFact": {...},
    "newFact": {...},
    "description": "Sarah's eye color changed from blue to green",
    "severity": "high|medium|low"
  }],
  "warnings": ["potential issues that might not be contradictions"]
}`,

  'analyze-voice': (ctx) => `Analyze the dialogue for this character and build a voice fingerprint.

Character: ${ctx.characterName}

All dialogue samples:
${ctx.dialogueSamples?.join('\n---\n')}

Analyze and provide JSON:
{
  "avgSentenceLength": number,
  "contractionRatio": 0.0-1.0,
  "questionFrequency": 0.0-1.0,
  "exclamationFrequency": 0.0-1.0,
  "uniqueVocabulary": ["words this character uses uniquely"],
  "prohibitedVocabulary": ["words this character would never use"],
  "fillerWords": ["um", "like", etc.],
  "catchphrases": ["recurring phrases"],
  "emotionalMarkers": {"anger": 0.2, "joy": 0.3, ...},
  "speechPatternNotes": "narrative description of voice"
}`,

  'check-voice-consistency': (ctx) => `Check if this dialogue matches the character's established voice.

Character: ${ctx.characterName}
Voice DNA: ${JSON.stringify(ctx.voiceDNA, null, 2)}

Dialogue to check:
"${ctx.dialogue}"

Provide JSON:
{
  "matchScore": 0.0-1.0,
  "deviations": [{"type": "vocabulary|length|pattern", "description": "..."}],
  "suggestions": ["how to make it more in-character"]
}`,

  'predict-reader-state': (ctx) => `Predict the reader's experience at this point in the story.

Previous chapters summary:
${ctx.previousSummary}

Current chapter:
${ctx.chapterContent}

Predict the reader's state:
{
  "knownFacts": ["facts the reader now knows"],
  "activeQuestions": ["mysteries the reader is tracking"],
  "emotionalState": {
    "tension": 0.0-1.0,
    "curiosity": 0.0-1.0,
    "attachment": {"CharacterName": 0.0-1.0}
  },
  "predictedReactions": ["reader might feel confused about X", "twist will land well because Y"]
}`,

  'implement-suggestions': (ctx) => `You are a world-class fiction writer. Rewrite this chapter implementing the approved improvement suggestions while preserving everything that works well.

${buildContext(ctx)}

ORIGINAL CHAPTER:
---
${ctx.chapterContent}
---

APPROVED SUGGESTIONS TO IMPLEMENT:
${ctx.approvedSuggestions?.map((s: any, i: number) => `${i + 1}. [${s.dimension}] ${s.suggestion}
   Target passage: "${s.targetPassage || 'General improvement'}"`).join('\n\n')}

LOCKED PASSAGES (DO NOT MODIFY THESE):
${ctx.lockedPassages?.map((p: any) => `- "${p.text}"`).join('\n') || 'None - you may modify any passage'}

REWRITE INSTRUCTIONS:
1. Implement ALL approved suggestions thoughtfully
2. Preserve the chapter's strengths and working elements
3. Maintain the same POV, tense, voice, and overall structure
4. Keep the same approximate length (${ctx.targetWords || 'similar to original'} words)
5. DO NOT modify any locked passages - keep them exactly as written
6. Ensure all character voices remain consistent
7. Maintain plot continuity with the rest of the story

Write the COMPLETE revised chapter. Output ONLY the chapter text, no commentary.`,

  'auto-improve': (ctx) => `You are a world-class literary editor and writer. Improve this chapter by focusing on its weakest dimension.

${buildContext(ctx)}

CURRENT CHAPTER (Score: ${ctx.currentScore || 'N/A'}/10):
---
${ctx.chapterContent}
---

CURRENT CRITIQUE SCORES:
${Object.entries(ctx.dimensionScores || {}).map(([dim, score]) => `- ${dim}: ${score}/10`).join('\n')}

WEAKEST DIMENSION TO FOCUS ON: ${ctx.weakestDimension || 'Overall quality'}
SPECIFIC ISSUES: ${ctx.weakestDimensionIssues || 'Improve overall prose quality'}

LOCKED PASSAGES (DO NOT MODIFY):
${ctx.lockedPassages?.map((p: any) => `- "${p.text}"`).join('\n') || 'None'}

IMPROVEMENT ITERATION ${ctx.iteration || 1}/${ctx.maxIterations || 5}

YOUR TASK:
1. Focus primarily on improving ${ctx.weakestDimension || 'the weakest areas'}
2. Make targeted improvements that address the specific issues noted
3. Preserve what's already working well
4. Maintain POV, tense, voice, and overall structure
5. Keep approximately the same length
6. DO NOT modify locked passages

After improving, provide your response in this JSON format:
{
  "improvedChapter": "The complete rewritten chapter text...",
  "changesDescription": "Brief description of what you changed and why",
  "focusedDimension": "${ctx.weakestDimension || 'OVERALL'}",
  "estimatedImprovement": "Brief explanation of how this addresses the issues",
  "newEstimatedScore": <your estimate of the new score for the focused dimension>
}

Provide ONLY the JSON, no other text.`,

  'rewrite-chapter': (ctx) => `You are a world-class fiction writer. Rewrite this chapter to achieve professional publication quality.

${buildContext(ctx)}

ORIGINAL CHAPTER:
---
${ctx.chapterContent}
---

${ctx.focusAreas ? `PRIORITY FOCUS AREAS:\n${ctx.focusAreas.map((f: string) => `- ${f}`).join('\n')}` : ''}

${ctx.specificFeedback ? `SPECIFIC FEEDBACK TO ADDRESS:\n${ctx.specificFeedback}` : ''}

LOCKED PASSAGES (DO NOT MODIFY):
${ctx.lockedPassages?.map((p: any) => `- "${p.text}"`).join('\n') || 'None'}

REWRITE GUIDELINES:
1. Elevate the prose to professional publication quality
2. Sharpen character voices to be distinct and memorable
3. Enhance sensory details and "show don't tell"
4. Improve dialogue to feel natural and purposeful
5. Ensure pacing keeps readers engaged
6. Strengthen emotional beats
7. Maintain the same POV, tense, and overall structure
8. Keep approximately the same length (±10%)

Write the COMPLETE rewritten chapter. Output ONLY the chapter text, no commentary.`,
}

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

// Check if generation was cancelled
const activeGenerations = new Map<string, { cancelled: boolean }>()

export function registerGeneration(id: string): void {
  activeGenerations.set(id, { cancelled: false })
}

export function cancelGeneration(id: string): void {
  const gen = activeGenerations.get(id)
  if (gen) gen.cancelled = true
}

export function cleanupGeneration(id: string): void {
  activeGenerations.delete(id)
}

export function isGenerationCancelled(id: string): boolean {
  return activeGenerations.get(id)?.cancelled ?? false
}

// Main generation function using Claude CLI (uses Claude Max subscription)
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
    // Fallback for unknown actions
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

// Streaming generation for long content (using CLI, returns full result at once)
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
