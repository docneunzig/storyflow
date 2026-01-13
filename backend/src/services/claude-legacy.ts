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

  // Phase 1: Subplot, Deadline, Series AI agents
  subplot: `You are a narrative structure expert specializing in subplot management.
You analyze how subplots weave through stories, tracking their tension curves,
pacing, and resolution timing. You identify dormant threads and suggest
optimal touch points for maintaining reader engagement.
You understand the balance between main plot and subplots across genres.`,

  deadline: `You are a writing productivity analyst who helps authors meet deadlines.
You analyze writing velocity patterns, identify productivity trends,
and provide realistic projections based on historical data.
You give actionable advice while being encouraging and supportive.
You understand the creative writing process and its inherent variability.`,

  series: `You are a series continuity editor who ensures consistency across multiple books.
You track character evolution, cross-book promises, timeline events, and world-building
elements. You flag contradictions and identify opportunities for callbacks.
You understand reader expectations for series and the importance of payoffs.`,

  // Phase 2: Story Memory / RAG
  storyMemory: `You are a story continuity expert who maintains perfect recall of narrative details.
You summarize chapters with focus on plot-relevant information, character knowledge states,
and setup/payoff tracking. Your summaries are optimized for retrieval during AI generation.
You track what each character knows at any given point in the story.`,

  // Phase 3: Show Don't Tell
  showDontTell: `You are a prose quality expert specializing in "show don't tell" analysis.
You identify passages where emotions, traits, or states are told rather than shown,
and provide concrete rewrites that demonstrate through action, dialogue, and sensory detail.
You understand the nuances of when telling is appropriate vs when showing is essential.`,

  // Phase 4: Style Cloning
  styleClone: `You are a literary style analyst who can deconstruct and replicate writing styles.
You analyze prose for rhythm, sentence structure, vocabulary choices, narrative techniques,
and voice markers. You can generate text that authentically matches a source style.
You understand the subtle elements that make each author's voice unique.`,
}

// Build context string from project data
export function buildContext(context: Record<string, any>): string {
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

  // =============================================================================
  // STORY MEMORY CONTEXT (Phase 2)
  // =============================================================================

  // Include chapter summaries for story continuity
  if (context.storyMemory?.relevantSummaries && context.storyMemory.relevantSummaries.length > 0) {
    parts.push(`\n## Story Memory - Previous Chapter Summaries`)
    for (const summary of context.storyMemory.relevantSummaries) {
      parts.push(`### Chapter ${summary.chapterNumber}${summary.cliffhanger ? ' (ends with cliffhanger)' : ''}
${summary.summary}
- Key events: ${summary.keyEvents?.map((e: any) => typeof e === 'string' ? e : e.event).join('; ') || 'None'}
- Characters present: ${summary.charactersPresent?.join(', ') || 'None'}`)
    }
  }

  // Include character knowledge states for POV consistency
  if (context.storyMemory?.relevantCharacterStates && context.storyMemory.relevantCharacterStates.length > 0) {
    parts.push(`\n## Character Knowledge States (what characters know/believe)`)
    for (const state of context.storyMemory.relevantCharacterStates) {
      const charName = context.characters?.find((c: any) => c.id === state.characterId)?.name || 'Unknown'
      parts.push(`### ${charName} (as of Chapter ${state.asOfChapterNumber})
- Knows: ${state.knownFacts?.slice(0, 5).join('; ') || 'Nothing tracked'}
- Believes: ${state.beliefs?.slice(0, 3).join('; ') || 'No beliefs tracked'}
- Current goals: ${state.activeGoals?.join('; ') || 'None'}
- Emotional state: ${state.emotionalState || 'Unknown'}`)
    }
  }

  // Include relevant facts for continuity
  if (context.storyMemory?.relevantFacts && context.storyMemory.relevantFacts.length > 0) {
    parts.push(`\n## Established Facts (maintain these for continuity)`)
    const factsBySubject: Record<string, string[]> = {}
    for (const fact of context.storyMemory.relevantFacts) {
      if (!factsBySubject[fact.subjectId]) {
        factsBySubject[fact.subjectId] = []
      }
      factsBySubject[fact.subjectId].push(fact.assertion)
    }
    for (const [subject, assertions] of Object.entries(factsBySubject)) {
      parts.push(`- ${subject}: ${assertions.join('; ')}`)
    }
  }

  // Include active subplots for weaving
  if (context.storyMemory?.activeSubplots && context.storyMemory.activeSubplots.length > 0) {
    parts.push(`\n## Active Subplots (consider weaving these in)`)
    for (const subplot of context.storyMemory.activeSubplots) {
      parts.push(`- ${subplot.name} (${subplot.status}): ${subplot.description || 'No description'}`)
    }
  }

  // Include open questions for dramatic tension
  if (context.storyMemory?.openQuestions && context.storyMemory.openQuestions.length > 0) {
    parts.push(`\n## Reader's Open Questions (maintain these mysteries)
${context.storyMemory.openQuestions.map((q: string) => `- ${q}`).join('\n')}`)
  }

  // Include unresolved setups for potential payoffs
  if (context.storyMemory?.unresolvedSetups && context.storyMemory.unresolvedSetups.length > 0) {
    parts.push(`\n## Foreshadowing/Setups (consider paying off)
${context.storyMemory.unresolvedSetups.map((s: string) => `- ${s}`).join('\n')}`)
  }

  // POV character constraints
  if (context.storyMemory?.povCharacterConstraints) {
    const constraints = context.storyMemory.povCharacterConstraints
    parts.push(`\n## POV Character Constraints`)
    if (constraints.cannotKnow?.length > 0) {
      parts.push(`CANNOT reference (character doesn't know): ${constraints.cannotKnow.join('; ')}`)
    }
    if (constraints.mustRemember?.length > 0) {
      parts.push(`Should remember: ${constraints.mustRemember.join('; ')}`)
    }
    if (constraints.emotionalState) {
      parts.push(`Current emotional context: ${constraints.emotionalState}`)
    }
  }

  // =============================================================================
  // END STORY MEMORY CONTEXT
  // =============================================================================

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
export const ACTION_PROMPTS: Record<string, (context: Record<string, any>) => string> = {
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

  'fix-voice': (ctx) => `Rewrite this dialogue to match the character's established voice while preserving the meaning.

Character: ${ctx.characterName}
Voice DNA: ${JSON.stringify(ctx.voiceDNA, null, 2)}

Original Dialogue:
"${ctx.originalDialogue}"

Issues found:
${ctx.deviations?.map((d: { type: string; description: string }) => `- ${d.description}`).join('\n') || 'General voice mismatch'}

IMPORTANT INSTRUCTIONS:
1. Keep the same meaning and intent of the dialogue
2. Adjust vocabulary, sentence length, and speech patterns to match the character's voice
3. If the character uses catchphrases, incorporate them naturally if appropriate
4. If the character avoids certain words, replace them with alternatives
5. Match the character's typical formality level

Provide JSON:
{
  "fixedDialogue": "the rewritten dialogue",
  "changesApplied": ["list of changes made"],
  "newMatchScore": 0.0-1.0
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

  'auto-improve': (ctx) => `You are a world-class literary editor who has transformed mediocre manuscripts into bestsellers. Your job is to make BREAKTHROUGH improvements, not incremental polish.

${buildContext(ctx)}

CURRENT CHAPTER (Score: ${ctx.currentScore || 'N/A'}/10):
---
${ctx.chapterContent}
---

CURRENT SCORES:
${Object.entries(ctx.dimensionScores || {}).map(([dim, score]) => `- ${dim}: ${score}/10`).join('\n')}

WEAKEST DIMENSION: ${ctx.weakestDimension || 'Overall quality'}
SPECIFIC ISSUES: ${ctx.weakestDimensionIssues || 'Needs significant improvement'}

${ctx.previousAttempts ? `PREVIOUS IMPROVEMENT ATTEMPTS (DO NOT REPEAT THESE APPROACHES):
${ctx.previousAttempts.map((a: string, i: number) => `${i + 1}. ${a}`).join('\n')}` : ''}

ITERATION ${ctx.iteration || 1}/${ctx.maxIterations || 5}

## WHY INCREMENTAL CHANGES FAIL

Small polish (word substitutions, smoother transitions) yields diminishing returns. To jump from 7→9, you need TRANSFORMATIVE changes:

1. **Structural Surgery**: If pacing drags, don't just trim - restructure the scene's beats entirely
2. **Voice Injection**: If dialogue is flat, give the character a verbal tic, speech pattern, or distinct rhythm
3. **Sensory Replacement**: Don't add more adjectives - replace telling with a single vivid sensory detail
4. **Emotional Escalation**: If stakes feel low, add internal conflict or raise external consequences
5. **Originality Twist**: If derivative, subvert ONE expectation - the forest doesn't welcome, the animal doesn't speak, the magic has a cost

## GENRE EXCELLENCE MARKERS (German Middle-Grade)

What separates 7/10 from 9/10 in this genre:
- **Humor**: Dry internal commentary (like Lotta-Leben), absurdist observations
- **Voice**: First-person immediacy, authentic kid logic, slightly exaggerated reactions
- **Pacing**: Action or discovery within first 500 words, cliffhanger every chapter
- **Originality**: Familiar setup with ONE unexpected element that creates questions

## YOUR TASK

1. Identify the 2-3 SPECIFIC PASSAGES that most drag down ${ctx.weakestDimension}
2. For each passage, make a BOLD change - not polish, but transformation
3. If the previous iteration only improved 0.2 points, try something completely different
4. Be willing to cut, restructure, or completely rewrite weak sections
5. Inject at least ONE element that wasn't in the original (humor beat, sensory detail, character moment)

LOCKED PASSAGES (keep exactly as written):
${ctx.lockedPassages?.map((p: any) => `- "${p.text}"`).join('\n') || 'None'}

Respond with JSON:
{
  "improvedChapter": "The complete rewritten chapter...",
  "transformations": [
    {"original": "quote original weak passage", "revised": "your bold revision", "technique": "what technique you applied"}
  ],
  "boldestChange": "Description of your most significant structural or creative change",
  "expectedScoreJump": <number - be honest, if you only polished, say 0.2; if you transformed, could be 1.0+>,
  "newEstimatedScore": <your estimate for ${ctx.weakestDimension}>
}

Provide ONLY the JSON.`,

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

  'radical-alternatives': (ctx) => `You are THREE different world-class editors, each with a distinct approach to fixing this chapter's weaknesses. Generate three RADICALLY DIFFERENT rewrites.

${buildContext(ctx)}

CURRENT CHAPTER (Score: ${ctx.currentScore || 'N/A'}/10):
---
${ctx.chapterContent}
---

WEAKEST DIMENSION: ${ctx.weakestDimension} (${ctx.weakestScore}/10)
SPECIFIC ISSUES: ${ctx.weakestDimensionIssues}

## YOUR THREE EDITOR PERSONAS

**EDITOR A - The Surgeon**: Makes precise, surgical cuts. Removes 20-30% of content to tighten pacing. Believes "less is more." Cuts exposition, trims dialogue, accelerates to action.

**EDITOR B - The Amplifier**: Adds depth and texture. Expands key moments with sensory detail, internal conflict, and emotional resonance. Believes the problem is underwriting, not overwriting.

**EDITOR C - The Subverter**: Challenges assumptions. Flips one expectation on its head - maybe the fox is hostile, the forest is dying, or the protagonist has a secret. Believes originality comes from surprise.

## YOUR TASK

Generate THREE complete rewrites of this chapter, one from each editor's perspective. Each version should:
- Keep the same basic plot events
- Address the weakness in ${ctx.weakestDimension}
- Be a COMPLETE, readable chapter
- Take a genuinely different approach

LOCKED PASSAGES (all three versions must preserve):
${ctx.lockedPassages?.map((p: any) => `- "${p.text}"`).join('\n') || 'None'}

Respond with JSON:
{
  "surgeonVersion": {
    "approach": "Surgical - what you cut/tightened",
    "improvedChapter": "Complete rewritten chapter text...",
    "estimatedScore": <estimated score for ${ctx.weakestDimension}>
  },
  "amplifierVersion": {
    "approach": "Amplified - what you expanded/deepened",
    "improvedChapter": "Complete rewritten chapter text...",
    "estimatedScore": <estimated score>
  },
  "subverterVersion": {
    "approach": "Subverted - what expectation you flipped",
    "improvedChapter": "Complete rewritten chapter text...",
    "estimatedScore": <estimated score>
  },
  "recommendation": "Which version best addresses ${ctx.weakestDimension} and why"
}

Provide ONLY the JSON.`,

  'passage-surgery': (ctx) => `You are a line editor specializing in transforming weak passages into powerful ones. Focus on the SPECIFIC weak spots identified below.

${buildContext(ctx)}

FULL CHAPTER CONTEXT:
---
${ctx.chapterContent}
---

## WEAK PASSAGES TO TRANSFORM

${ctx.weakPassages?.map((p: any, i: number) => `
### Passage ${i + 1} (${p.dimension} issue)
ORIGINAL: "${p.text}"
PROBLEM: ${p.issue}
`).join('\n') || 'Identify the 3 weakest passages yourself.'}

## TRANSFORMATION TECHNIQUES

For each weak passage, apply ONE of these transformations:

1. **Show Don't Tell**: Replace "She was scared" → Show physical symptoms, actions, sensory details
2. **Voice Injection**: Add character-specific verbal tics, rhythm, word choices
3. **Sensory Grounding**: Add one precise sensory detail that anchors the reader
4. **Subtext Addition**: What's NOT said but implied? Add tension through omission
5. **Pacing Restructure**: Break long passages into shorter beats, or expand rushed moments
6. **Dialogue Sharpening**: Cut filler, add interruptions, give each speaker a distinct rhythm
7. **Stakes Escalation**: Add consequence, time pressure, or internal conflict
8. **Originality Injection**: Add one unexpected detail that subverts expectations

## YOUR TASK

Transform each weak passage. Be BOLD - don't polish, transform.

Respond with JSON:
{
  "transformations": [
    {
      "passageNumber": 1,
      "original": "exact original text",
      "transformed": "your bold revision",
      "technique": "which technique you applied",
      "improvement": "why this is dramatically better"
    }
  ],
  "improvedChapter": "The complete chapter with all transformations integrated...",
  "estimatedScore": <your estimate for overall quality after transformations>
}

Provide ONLY the JSON.`,

  'synthesize-best': (ctx) => `You are a master editor who combines the best elements from multiple chapter versions into one superior version.

${buildContext(ctx)}

## VERSIONS TO SYNTHESIZE

${ctx.versions?.map((v: any, i: number) => `
### VERSION ${i + 1}: ${v.approach}
Score: ${v.score}/10
---
${v.chapter}
---
`).join('\n')}

## YOUR TASK

Create the ULTIMATE version by:
1. Identifying the strongest passages/techniques from each version
2. Combining them seamlessly into one cohesive chapter
3. Ensuring consistent voice and flow
4. Resolving any contradictions between versions

For each section of the chapter, choose the best version's approach or create a hybrid.

Respond with JSON:
{
  "synthesizedChapter": "The complete combined chapter...",
  "sourceMap": [
    {"section": "opening paragraph", "source": "Version 2", "reason": "stronger hook"},
    {"section": "dialogue scene", "source": "hybrid of 1 and 3", "reason": "combined humor with stakes"}
  ],
  "expectedScore": <your estimate for overall quality>
}

Provide ONLY the JSON.`,

  // =============================================================================
  // PHASE 1.1: SUBPLOT TRACKER ACTIONS
  // =============================================================================

  'analyze-subplot-health': (ctx) => `Analyze the health and pacing of subplots in this story.

${buildContext(ctx)}

## Current Subplots
${JSON.stringify(ctx.subplots || [], null, 2)}

## Subplot Touches (appearances in chapters)
${JSON.stringify(ctx.subplotTouches || [], null, 2)}

## Story Progress
- Current Chapter: ${ctx.currentChapter || 1}
- Target Chapter Count: ${ctx.targetChapters || 20}
- Chapters Written: ${ctx.chaptersWritten || 0}

Analyze each subplot for:
1. Pacing issues (dormant too long, rushed resolution)
2. Tension curve appropriateness for the subplot type
3. Character arc integration
4. Setup/payoff balance
5. Reader engagement maintenance

Respond with JSON:
{
  "subplotAnalysis": [
    {
      "subplotId": "string",
      "subplotName": "string",
      "healthScore": 0-10,
      "status": "healthy|needs-attention|critical|dormant",
      "issues": [
        {
          "type": "dormant|rushed|missing-setup|unresolved|imbalanced",
          "description": "specific issue description",
          "severity": "high|medium|low"
        }
      ],
      "suggestions": ["actionable suggestion"],
      "recommendedNextTouch": {
        "chapterNumber": number,
        "touchType": "setup|development|escalation|reference|payoff",
        "description": "what should happen",
        "tensionTarget": 1-10
      },
      "optimalResolutionWindow": {
        "startChapter": number,
        "endChapter": number
      }
    }
  ],
  "overallPacing": {
    "assessment": "string describing overall subplot density",
    "chaptersWithTooManySubplots": [number],
    "chaptersWithNoSubplotActivity": [number]
  },
  "missingSubplotTypes": ["subplot types that would enhance the story"],
  "interactionOpportunities": [
    {
      "subplot1": "string",
      "subplot2": "string",
      "suggestion": "how they could interact"
    }
  ]
}

Provide ONLY the JSON.`,

  'suggest-subplot-touches': (ctx) => `Suggest optimal points to advance this subplot in upcoming chapters.

${buildContext(ctx)}

## Subplot Details
Name: ${ctx.subplot?.name || 'Unknown'}
Type: ${ctx.subplot?.type || 'custom'}
Description: ${ctx.subplot?.description || ''}
Current Status: ${ctx.subplot?.status || 'setup'}
Related Characters: ${ctx.relatedCharacters?.map((c: any) => c.name).join(', ') || 'None specified'}

## Previous Touches
${JSON.stringify(ctx.existingTouches || [], null, 2)}

## Upcoming Scenes/Chapters
${JSON.stringify(ctx.upcomingScenes || [], null, 2)}

## Story Context
- Current Chapter: ${ctx.currentChapter || 1}
- Total Target Chapters: ${ctx.targetChapters || 20}
- Main Plot Phase: ${ctx.mainPlotPhase || 'unknown'}

Suggest 3-5 natural opportunities to advance this subplot:

{
  "suggestions": [
    {
      "sceneId": "string or null if new scene needed",
      "chapterNumber": number,
      "touchType": "development|escalation|reference|payoff",
      "tensionLevel": 1-10,
      "description": "how to weave in the subplot naturally",
      "characterFocus": "which character's POV works best",
      "dialogueHint": "optional sample dialogue or beat",
      "narrativeHint": "optional narrative technique to use",
      "integrationWithMainPlot": "how this connects to main story"
    }
  ],
  "optimalResolutionWindow": {
    "startChapter": number,
    "endChapter": number,
    "reasoning": "why this timing works best"
  },
  "warningIfIgnored": "what happens if this subplot goes dormant"
}

Provide ONLY the JSON.`,

  'generate-subplot-scene': (ctx) => `Generate a scene that advances this subplot while integrating naturally with the main plot.

${buildContext(ctx)}

## Subplot to Advance
Name: ${ctx.subplot?.name || 'Unknown'}
Type: ${ctx.subplot?.type || 'custom'}
Description: ${ctx.subplot?.description || ''}
Current Status: ${ctx.subplot?.status || 'developing'}

## Scene Requirements
Location: ${ctx.location || 'Choose appropriate location'}
Characters Present: ${ctx.charactersPresent?.map((c: any) => c.name).join(', ') || 'Relevant characters'}
Tension Level Target: ${ctx.targetTension || 5}/10
Touch Type: ${ctx.touchType || 'development'}
Target Word Count: ${ctx.targetWords || 800}

## Integration Notes
Main Plot Context: ${ctx.mainPlotContext || 'Continue naturally from previous chapter'}
Must Include: ${ctx.mustInclude?.join(', ') || 'No specific requirements'}

## Constraints
- Must feel organic to the main narrative
- Should advance the subplot by one meaningful beat
- Maintain all character voices
- Follow the established POV and tense

Generate the scene prose directly. Output ONLY the scene text, no JSON or commentary.`,

  // =============================================================================
  // PHASE 1.2: DEADLINE DASHBOARD ACTIONS
  // =============================================================================

  'predict-completion': (ctx) => `Analyze this author's writing velocity and predict completion trajectory.

## Project Goals
Target Completion Date: ${ctx.deadline?.targetCompletionDate || 'Not set'}
Target Word Count: ${ctx.deadline?.targetWordCount || 80000}
Target Quality Score: ${ctx.deadline?.targetQualityScore || 8}

## Current Progress
Current Word Count: ${ctx.currentWordCount || 0}
Chapters Completed: ${ctx.chaptersCompleted || 0}
Target Chapters: ${ctx.targetChapters || 20}
Days Since Start: ${ctx.daysSinceStart || 0}
Days Remaining: ${ctx.daysRemaining || 'Unknown'}

## Historical Data (Last 30 Days)
Daily Word Counts: ${JSON.stringify(ctx.dailyWordCounts || [])}
Writing Sessions: ${JSON.stringify(ctx.sessions || [])}

## Milestones
${JSON.stringify(ctx.milestones || [], null, 2)}

Analyze and respond with JSON:
{
  "velocityStats": {
    "avgDraftWordsPerHour": number,
    "avgRevisionWordsPerHour": number,
    "projectedCompletionDate": "ISO date string",
    "onTrack": boolean,
    "daysAheadOrBehind": number,
    "requiredDailyOutput": number,
    "bestProductivityHours": [0-23],
    "bestProductivityDays": [0-6],
    "avgSessionDuration": number,
    "avgWordsPerSession": number,
    "longestStreak": number,
    "currentStreak": number,
    "wordsThisWeek": number,
    "weekOverWeekChange": number
  },
  "insights": [
    {
      "type": "positive|warning|suggestion",
      "message": "specific insight message",
      "data": {},
      "actionable": true
    }
  ],
  "adjustedMilestones": [
    {
      "id": "string",
      "name": "string",
      "originalDate": "ISO date",
      "recommendedDate": "ISO date",
      "reason": "why adjustment is needed",
      "achievable": true
    }
  ],
  "riskFactors": [
    {
      "factor": "string",
      "impact": "high|medium|low",
      "mitigation": "suggestion to address"
    }
  ]
}

Provide ONLY the JSON.`,

  'generate-sprint-plan': (ctx) => `Generate a realistic writing sprint plan to meet this deadline.

## Current State
Words Written: ${ctx.currentWordCount || 0}
Words Remaining: ${ctx.wordsRemaining || 0}
Days Remaining: ${ctx.daysRemaining || 30}
Author's Average Daily Output: ${ctx.avgDailyOutput || 0}

## Author's Productivity Patterns
Best Hours: ${ctx.bestHours?.join(', ') || 'Unknown'}
Best Days: ${ctx.bestDays?.join(', ') || 'Unknown'}
Typical Session Length: ${ctx.avgSessionLength || 60} minutes
Writing Style: ${ctx.writingStyle || 'Unknown'}

## Chapters/Scenes Remaining
${ctx.remainingChapters?.map((c: any) => `- ${c.title}: ~${c.estimatedWords || 2000} words`).join('\n') || 'Not specified'}

## Author Preferences
${ctx.preferences || 'No specific preferences'}

Create a day-by-day sprint plan:
{
  "sprintPlan": [
    {
      "day": 1,
      "date": "ISO date",
      "dayOfWeek": "Monday",
      "wordTarget": number,
      "suggestedChapter": "chapter title or null",
      "suggestedSessions": [
        {
          "startHour": number,
          "duration": number,
          "wordTarget": number,
          "focus": "drafting|revision|outlining"
        }
      ],
      "motivationalNote": "encouraging message",
      "flexibilityNotes": "what to do if behind/ahead"
    }
  ],
  "summary": {
    "totalDays": number,
    "totalWritingDays": number,
    "restDays": [number],
    "bufferDays": number,
    "avgDailyTarget": number,
    "peakDay": { "day": number, "words": number }
  },
  "riskAssessment": "low|medium|high",
  "contingencyPlan": {
    "ifBehind": "what to do if falling behind",
    "ifAhead": "what to do if ahead of schedule",
    "emergencyOptions": ["last resort options"]
  },
  "milestoneCheckpoints": [
    {
      "day": number,
      "expectedProgress": number,
      "celebration": "small reward suggestion"
    }
  ]
}

Provide ONLY the JSON.`,

  // =============================================================================
  // PHASE 1.3: SERIES MANAGER ACTIONS
  // =============================================================================

  'check-series-continuity': (ctx) => `Check continuity across all books in this series.

## Series Overview
Name: ${ctx.series?.name || 'Unknown Series'}
Description: ${ctx.series?.description || ''}
Book Count: ${ctx.books?.length || 0}

## Books Summary
${ctx.books?.map((b: any, i: number) => `Book ${i + 1}: ${b.title || 'Untitled'}
- Word Count: ${b.wordCount || 0}
- Status: ${b.status || 'unknown'}
- Characters: ${b.characters?.map((c: any) => c.name).join(', ') || 'None'}
- Key Events: ${b.keyEvents?.join('; ') || 'None documented'}`).join('\n\n') || 'No books'}

## Shared Characters
${JSON.stringify(ctx.sharedCharacters || [], null, 2)}

## Cross-Book Promises (setup/payoff tracking)
${JSON.stringify(ctx.crossBookPromises || [], null, 2)}

## Series Timeline
${JSON.stringify(ctx.timeline || [], null, 2)}

Analyze for continuity and respond with JSON:
{
  "continuityIssues": [
    {
      "id": "issue_1",
      "severity": "high|medium|low",
      "type": "character|timeline|worldbuilding|promise|factual",
      "description": "specific issue description",
      "book1": number,
      "book1Location": "chapter/scene reference",
      "book2": number,
      "book2Location": "chapter/scene reference",
      "contradiction": "what conflicts",
      "suggestion": "how to resolve"
    }
  ],
  "unresolvedPromises": [
    {
      "promiseId": "string",
      "promiseText": "what was set up",
      "madeInBook": number,
      "urgency": "high|medium|low",
      "suggestedResolutionBook": number,
      "suggestedResolution": "how to pay it off"
    }
  ],
  "characterEvolutionGaps": [
    {
      "characterName": "string",
      "lastKnownState": "state in previous book",
      "currentState": "state in current book",
      "missingDevelopment": "what growth is unexplained",
      "suggestion": "how to show evolution"
    }
  ],
  "callbackOpportunities": [
    {
      "element": "something from earlier book",
      "originalBook": number,
      "originalContext": "where it appeared",
      "suggestedCallback": "how to reference it",
      "suggestedLocation": "where in current book",
      "impactLevel": "high|medium|low"
    }
  ],
  "timelineConsistency": {
    "isConsistent": boolean,
    "issues": ["specific timeline problems"],
    "suggestions": ["how to fix"]
  },
  "overallHealth": {
    "score": 0-10,
    "summary": "brief assessment",
    "criticalActions": ["must-fix items"]
  }
}

Provide ONLY the JSON.`,

  'extract-series-elements': (ctx) => `Extract series-level elements from this book that should be tracked for future installments.

## Book Details
Title: ${ctx.book?.title || 'Untitled'}
Book Number in Series: ${ctx.bookNumber || 1}
Word Count: ${ctx.book?.wordCount || 0}

## Content Summary
${ctx.contentSummary || 'No summary available'}

## Chapter Summaries
${ctx.chapterSummaries?.map((ch: any) => `Chapter ${ch.number}: ${ch.summary}`).join('\n') || 'No summaries'}

## Characters in This Book
${JSON.stringify(ctx.characters || [], null, 2)}

## Existing Series Bible
${JSON.stringify(ctx.existingSeriesBible || [], null, 2)}

Extract elements for the series bible:
{
  "newWorldbuildingElements": [
    {
      "name": "string",
      "category": "location|culture|magic|technology|organization|rule|history",
      "description": "detailed description",
      "firstMentionChapter": number,
      "significance": "high|medium|low",
      "connections": ["related elements"]
    }
  ],
  "characterStateChanges": [
    {
      "characterId": "string",
      "characterName": "string",
      "changeType": "status|relationship|knowledge|physical|emotional|power",
      "previousState": "what was before",
      "newState": "what is now",
      "chapter": number,
      "permanence": "permanent|temporary|unknown",
      "storyImpact": "how this affects future books"
    }
  ],
  "newPromises": [
    {
      "promiseText": "what was set up",
      "promiseType": "foreshadowing|prophecy|character-goal|mystery|threat",
      "chapterMade": number,
      "suggestedResolutionBy": "book number or null for 'eventually'",
      "importance": "high|medium|low",
      "setupStrength": "strong|moderate|subtle"
    }
  ],
  "resolvedPromises": [
    {
      "promiseId": "id from earlier book",
      "howResolved": "description",
      "chapterResolved": number,
      "satisfactionLevel": "high|medium|low"
    }
  ],
  "timelineEvents": [
    {
      "event": "what happened",
      "relativeTime": "when in story timeline",
      "significance": "high|medium|low",
      "affectsCharacters": ["character names"]
    }
  ],
  "newRelationships": [
    {
      "character1": "string",
      "character2": "string",
      "relationshipType": "string",
      "startedInChapter": number,
      "seriesSignificance": "high|medium|low"
    }
  ],
  "seriesThemes": {
    "reinforced": ["themes strengthened"],
    "introduced": ["new themes"],
    "subverted": ["themes challenged"]
  }
}

Provide ONLY the JSON.`,

  // =============================================================================
  // PHASE 2: STORY MEMORY / RAG SYSTEM ACTIONS
  // =============================================================================

  'summarize-chapter': (ctx) => `Create a structured summary of this chapter optimized for story memory and retrieval.

${buildContext(ctx)}

## Chapter to Summarize
Chapter Number: ${ctx.chapterNumber || 1}
Chapter Title: ${ctx.chapterTitle || 'Untitled'}

Content:
---
${ctx.chapterContent}
---

## Summary Requirements
Focus on information that will be critical for maintaining continuity:
- Key plot events and their consequences
- Character appearances and interactions
- Emotional beats and character development moments
- Locations visited and described
- Foreshadowing and setups that need payoff
- Payoffs of earlier setups
- Any cliffhangers or unresolved tensions

Create a structured summary:
{
  "summary": "2-3 paragraph narrative summary focusing on plot-critical information",
  "keyEvents": [
    {
      "event": "description of what happened",
      "participants": ["character names"],
      "significance": "high|medium|low",
      "causedBy": "what triggered this event or null",
      "leads_to": "what this sets up or null"
    }
  ],
  "charactersPresent": ["list of all characters who appear"],
  "locationsUsed": [
    {
      "name": "location name",
      "newDetails": ["any new information revealed about this location"]
    }
  ],
  "emotionalBeats": [
    {
      "character": "who experienced this",
      "emotion": "what they felt",
      "trigger": "what caused it",
      "resolution": "how it resolved or 'unresolved'"
    }
  ],
  "plotBeatsAdvanced": ["which plot beats from the outline were touched"],
  "subplotsTouched": [
    {
      "subplotName": "string",
      "advancement": "what happened with this subplot",
      "newTension": 1-10
    }
  ],
  "foreshadowing": [
    {
      "element": "what was set up",
      "quote": "relevant text",
      "expectedPayoff": "when/how this should pay off"
    }
  ],
  "payoffs": [
    {
      "setup": "what was originally set up",
      "resolution": "how it paid off",
      "satisfaction": "high|medium|low"
    }
  ],
  "cliffhanger": "description of chapter-ending tension or null",
  "openQuestions": ["questions readers should have after this chapter"],
  "tokenCount": <estimated tokens for this summary>
}

Provide ONLY the JSON.`,

  'update-character-knowledge': (ctx) => `Update the knowledge state for this character based on events in this chapter.

${buildContext(ctx)}

## Character
Name: ${ctx.characterName}
Character ID: ${ctx.characterId}
Role: ${ctx.characterRole || 'Unknown'}

## Previous Knowledge State (as of Chapter ${ctx.previousChapter || 0})
${JSON.stringify(ctx.previousKnowledgeState || {}, null, 2)}

## Events in Current Chapter (${ctx.currentChapter})
${ctx.chapterSummary}

## Character's Direct Experiences in This Chapter
${ctx.characterExperiences || 'See chapter summary'}

## New Information Revealed to This Character
${ctx.newInformation || 'Determine from chapter content'}

Update their knowledge state:
{
  "characterId": "${ctx.characterId}",
  "asOfChapterId": "${ctx.chapterId}",
  "asOfChapterNumber": ${ctx.currentChapter},
  "knownFacts": [
    "fact they definitely know (marked with [NEW] if learned this chapter)"
  ],
  "beliefs": [
    "things they believe but might be wrong about"
  ],
  "secrets": [
    "things they know that they're hiding from others"
  ],
  "relationships": {
    "characterId": "current relationship description [CHANGED if modified]"
  },
  "emotionalState": "their emotional state at chapter end",
  "activeGoals": [
    "what they're currently trying to achieve"
  ],
  "recentExperiences": [
    "significant events from this chapter that would affect them"
  ],
  "changesFromPrevious": {
    "factsLearned": ["new facts"],
    "beliefsChanged": [{"old": "", "new": "", "reason": ""}],
    "relationshipsChanged": [{"character": "", "change": ""}],
    "goalsChanged": [{"old": "", "new": "", "reason": ""}]
  }
}

Provide ONLY the JSON.`,

  'retrieve-context': (ctx) => `Determine what story context is most relevant for this generation request.

${buildContext(ctx)}

## Current Writing Position
Chapter: ${ctx.currentChapter || 1}
Scene: ${ctx.currentScene || 'Unknown'}
POV Character: ${ctx.povCharacter || 'Unknown'}

## Generation Request
Task: ${ctx.taskDescription || 'Continue writing'}
Focus: ${ctx.focus || 'General narrative'}

## Available Context Sources

### Chapter Summaries (${ctx.availableSummaries?.length || 0} chapters)
${ctx.availableSummaries?.map((s: any) => `Chapter ${s.chapterNumber}: ${s.summary?.substring(0, 100)}...`).join('\n') || 'None'}

### Character Knowledge States (${ctx.availableCharacterStates?.length || 0} characters)
${ctx.availableCharacterStates?.map((c: any) => `${c.characterName}: as of Chapter ${c.asOfChapterNumber}`).join('\n') || 'None'}

### Relevant Facts (${ctx.availableFacts?.length || 0} facts)
${ctx.availableFacts?.slice(0, 10).map((f: any) => `- ${f.subjectId}: ${f.assertion}`).join('\n') || 'None'}

### Active Subplots (${ctx.activeSubplots?.length || 0} subplots)
${ctx.activeSubplots?.map((s: any) => `- ${s.name} (${s.status})`).join('\n') || 'None'}

### Worldbuilding Entries (${ctx.worldbuildingEntries?.length || 0} entries)
${ctx.worldbuildingEntries?.slice(0, 10).map((w: any) => `- ${w.name} (${w.category})`).join('\n') || 'None'}

## Your Task
Determine which context elements are MOST relevant to this specific generation request.
Prioritize:
1. What the POV character knows (they can't reference unknown information)
2. Recent events that affect the current scene
3. Active subplot threads that might be touched
4. Character relationships in the scene
5. Location details if a specific setting is involved

{
  "relevantSummaryIds": ["chapter IDs to include, ordered by relevance"],
  "relevantCharacterStateIds": ["character IDs whose states matter"],
  "relevantFactIds": ["fact IDs that must be respected"],
  "relevantWorldbuildingIds": ["wiki entry IDs for context"],
  "activeSubplotIds": ["subplot IDs that might come into play"],
  "openQuestions": ["reader questions this scene might address"],
  "recentEmotionalBeats": ["emotional context to maintain"],
  "unresolvedSetups": ["setups that could be paid off"],
  "povCharacterConstraints": {
    "cannotKnow": ["information the POV character doesn't have"],
    "mustRemember": ["recent experiences they'd reference"],
    "emotionalState": "their current emotional context"
  },
  "reasoning": "Brief explanation of why these elements are most relevant"
}

Provide ONLY the JSON.`,

  // =============================================================================
  // PHASE 3: SHOW DON'T TELL ANALYZER ACTIONS
  // =============================================================================

  'analyze-show-dont-tell': (ctx) => `Analyze this text for "telling" passages that would be stronger if "shown".

${buildContext(ctx)}

## Text to Analyze
${ctx.textToAnalyze || ctx.chapterContent}

## Analysis Parameters
Severity Threshold: ${ctx.severityThreshold || 'all'} (all|high|medium)
Focus: ${ctx.focus || 'all'} (all|emotions|traits|states|reactions)

## What Constitutes "Telling"
- Emotion labels: "She was angry", "He felt sad"
- State declarations: "The room was beautiful", "It was a scary night"
- Trait announcements: "He was a brave man", "She was intelligent"
- Reaction summaries: "She was shocked by the news"

## What Constitutes "Showing"
- Physical manifestations: "Her fists clenched, knuckles whitening"
- Sensory details: "The copper tang of blood filled his mouth"
- Actions that imply: "He stepped between her and the door"
- Dialogue that reveals: "'Just leave me alone,' she whispered"
- Metaphor/simile: "Dread pooled in her stomach like cold water"

Find telling passages and provide alternatives:
{
  "violations": [
    {
      "id": "v_1",
      "originalText": "exact text that tells",
      "position": { "start": character_offset, "end": character_offset },
      "violationType": "emotion|trait|state|reaction",
      "severity": "high|medium|low",
      "explanation": "why this is telling and why it matters",
      "alternatives": [
        {
          "rewrite": "showing version using action",
          "technique": "action",
          "explanation": "how this shows rather than tells"
        },
        {
          "rewrite": "showing version using dialogue",
          "technique": "dialogue",
          "explanation": "how this shows rather than tells"
        },
        {
          "rewrite": "showing version using sensory detail",
          "technique": "sensory",
          "explanation": "how this shows rather than tells"
        }
      ]
    }
  ],
  "summary": {
    "totalViolations": number,
    "byType": { "emotion": number, "trait": number, "state": number, "reaction": number },
    "bySeverity": { "high": number, "medium": number, "low": number },
    "overallAssessment": "brief assessment of showing vs telling balance"
  },
  "exemptions": [
    {
      "text": "telling passage that's actually appropriate",
      "reason": "why telling works here (pacing, voice, intentional summary)"
    }
  ]
}

Provide ONLY the JSON.`,

  'rewrite-to-show': (ctx) => `Rewrite this telling passage to show instead.

${buildContext(ctx)}

## Passage to Rewrite
"${ctx.tellingPassage}"

## Context
Previous text: "${ctx.contextBefore || ''}"
Following text: "${ctx.contextAfter || ''}"
POV Character: ${ctx.povCharacter || 'Third person'}
Tone: ${ctx.tone || 'Match surrounding text'}

## Violation Type: ${ctx.violationType || 'emotion'}

## Requested Technique: ${ctx.technique || 'best fit'}
Options: action, dialogue, sensory, physical, metaphor

## Constraints
- Maintain the same meaning
- Match the POV and tense
- Fit naturally with surrounding text
- Don't over-write (similar length preferred)

Generate the showing version:
{
  "rewrite": "the showing version",
  "technique": "which technique was used",
  "wordCountChange": number (positive = longer, negative = shorter),
  "explanation": "brief note on the transformation",
  "alternativeRewrites": [
    {
      "rewrite": "alternative approach",
      "technique": "different technique",
      "tradeoff": "what this gains/loses vs main rewrite"
    }
  ]
}

Provide ONLY the JSON.`,

  // =============================================================================
  // PHASE 4: STYLE CLONING ACTIONS
  // =============================================================================

  'analyze-style': (ctx) => `Analyze this text sample and extract a comprehensive style fingerprint.

## Sample Text
Author/Source: ${ctx.sourceName || 'Unknown'}
Text Type: ${ctx.textType || 'prose'}

Sample:
---
${ctx.sampleText}
---

## Analysis Depth
${ctx.analysisDepth || 'comprehensive'} (quick|standard|comprehensive)

Analyze every aspect of the writing style:

{
  "name": "${ctx.fingerprintName || 'Untitled Style'}",
  "sourceName": "${ctx.sourceName || 'Unknown'}",
  "sentenceStructure": {
    "avgLength": number (words per sentence),
    "variation": number (standard deviation),
    "complexity": 0-1 (clause nesting depth),
    "fragmentFrequency": 0-1 (intentional fragments),
    "patterns": [
      "common sentence structures (e.g., 'Subject-verb-object dominant')"
    ],
    "openingPatterns": ["how paragraphs typically begin"],
    "transitionStyle": "how sentences connect"
  },
  "vocabulary": {
    "sophistication": 0-1 (based on word rarity),
    "domainSpecific": ["frequently used domain terms"],
    "avoided": ["words conspicuously absent"],
    "favorites": ["distinctively overused words"],
    "adjectiveFrequency": 0-1,
    "adverbFrequency": 0-1,
    "concreteVsAbstract": 0-1 (0=abstract, 1=concrete)
  },
  "narrativeTechniques": {
    "pov": "detected POV style",
    "tense": "detected tense",
    "streamOfConsciousness": 0-1,
    "dialogueToNarrativeRatio": 0-1,
    "internalizationFrequency": 0-1,
    "showVsTell": 0-1 (0=telling, 1=showing),
    "sceneSummaryBalance": 0-1 (0=summary, 1=scene)
  },
  "rhythm": {
    "punctuationStyle": "sparse|standard|dramatic|experimental",
    "punctuationPatterns": ["notable uses of dashes, ellipses, etc."],
    "paragraphLength": "short|medium|long|varied",
    "dialogueTagStyle": "minimal|descriptive|action-oriented",
    "sceneTransitionStyle": "how scene changes are handled",
    "pacingPattern": "description of rhythm and flow"
  },
  "distinctiveMarkers": [
    "unique stylistic elements that define this voice"
  ],
  "authorVoice": "2-3 sentence prose description of the overall voice and feeling",
  "samplePassages": {
    "opening": "characteristic opening style",
    "dialogue": "characteristic dialogue style",
    "description": "characteristic descriptive style",
    "action": "characteristic action style",
    "introspection": "characteristic internal thought style"
  },
  "writingToAvoid": [
    "patterns this style specifically avoids"
  ],
  "generationGuidelines": [
    "specific instructions for generating in this style"
  ]
}

Provide ONLY the JSON.`,

  'generate-in-style': (ctx) => `Generate text that authentically matches this style fingerprint.

${buildContext(ctx)}

## Style Fingerprint to Match
${JSON.stringify(ctx.styleFingerprint, null, 2)}

## Generation Request
Task: ${ctx.task || 'Continue the narrative'}
Scene/Context: ${ctx.sceneContext || 'See story context'}
Target Words: ${ctx.targetWords || 500}

## Content Requirements
${ctx.contentRequirements || 'Follow the scene outline'}

## Style Matching Instructions
1. Match sentence length and variation patterns
2. Use vocabulary consistent with the fingerprint
3. Apply the same narrative techniques
4. Maintain the rhythm and punctuation style
5. Embody the distinctive markers
6. Avoid patterns marked as "writingToAvoid"

Generate the text in the specified style. Output ONLY the prose, no JSON or commentary.`,
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
