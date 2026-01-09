import { Router, Request, Response } from 'express'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const router = Router()

// Track active generation requests for cancellation
const activeGenerations = new Map<string, { cancelled: boolean }>()

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

// Helper function to simulate AI generation with delay
async function simulateAIGeneration(
  action: string,
  context: Record<string, any>,
  generationId: string
): Promise<{ result: string; cancelled: boolean }> {
  const generation = activeGenerations.get(generationId)

  // Simulate processing time (6-8 seconds to allow testing cancel)
  const totalTime = 6000 + Math.random() * 2000
  const checkInterval = 100 // Check for cancellation every 100ms
  let elapsed = 0

  while (elapsed < totalTime) {
    await new Promise(resolve => setTimeout(resolve, checkInterval))
    elapsed += checkInterval

    // Check if cancelled
    const current = activeGenerations.get(generationId)
    if (current?.cancelled) {
      return { result: '', cancelled: true }
    }
  }

  // Generate sample content based on action
  let result = ''
  switch (action) {
    case 'generate-chapter':
      result = generateSampleChapterContent(context)
      break
    case 'generate-scene':
      result = generateSampleSceneContent(context)
      break
    case 'generate-character':
      result = generateSampleCharacterContent(context)
      break
    case 'generate-dialogue':
      // Generate dialogue that matches character voice spec
      result = generateCharacterDialogue(context)
      break
    default:
      result = `Generated content for action: ${action}\n\nThis is placeholder AI-generated content that demonstrates the generation system is working.`
  }

  return { result, cancelled: false }
}

// Get tense-specific prose examples
function getTenseProse(tense: string, pov: string): { description: string; sampleNarration: string } {
  const tenseLower = (tense || '').toLowerCase()
  const povLower = (pov || '').toLowerCase()

  // Determine POV pronouns
  const isFirstPerson = povLower.includes('first')
  const subject = isFirstPerson ? 'I' : 'She'
  const possessive = isFirstPerson ? 'my' : 'her'

  // Present Tense
  if (tenseLower.includes('present')) {
    return {
      description: 'Present Tense',
      sampleNarration: `${subject} walk${isFirstPerson ? '' : 's'} through the doorway, ${possessive} heart pounding in ${possessive} chest. Something about this place feels wrong—${subject} can sense it in ${possessive} bones. Looking around, ${subject} notice${isFirstPerson ? '' : 's'} the shadows seem to shift. "Hello?" ${subject} call${isFirstPerson ? '' : 's'} out. There is no answer.`
    }
  }

  // Future Tense
  if (tenseLower.includes('future')) {
    return {
      description: 'Future Tense',
      sampleNarration: `${subject} will walk through the doorway, ${possessive} heart will pound in ${possessive} chest. Something about this place will feel wrong. ${subject} will look around, noticing shadows that will seem to shift. "${isFirstPerson ? 'I' : 'She'}'ll call out, 'Hello?'" There will be no answer.`
    }
  }

  // Default - Past Tense
  return {
    description: 'Past Tense',
    sampleNarration: `${subject} walked through the doorway, ${possessive} heart pounding in ${possessive} chest. Something about this place felt wrong—${subject} could sense it in ${possessive} bones. Looking around, ${subject} noticed the shadows seemed to shift. "Hello?" ${subject} called out. There was no answer.`
  }
}

// Get POV-specific prose examples
function getPOVProse(pov: string): { description: string; sampleNarration: string } {
  const povLower = (pov || '').toLowerCase()

  // First Person
  if (povLower.includes('first')) {
    return {
      description: 'First Person (I, me, my)',
      sampleNarration: `I walked through the doorway, my heart pounding in my chest. Something about this place felt wrong—I could sense it in my bones. Looking around, I noticed the shadows seemed to shift whenever I turned my head. "Hello?" I called out, my voice echoing off the walls. There was no answer, but I knew I wasn't alone.`
    }
  }

  // Third Person Limited
  if (povLower.includes('third') && (povLower.includes('limited') || !povLower.includes('omniscient'))) {
    return {
      description: 'Third Person Limited (he, she, they)',
      sampleNarration: `She walked through the doorway, her heart pounding in her chest. Something about this place felt wrong—she could sense it in her bones. Looking around, she noticed the shadows seemed to shift whenever she turned her head. "Hello?" she called out, her voice echoing off the walls. There was no answer, but she knew she wasn't alone.`
    }
  }

  // Third Person Omniscient
  if (povLower.includes('omniscient')) {
    return {
      description: 'Third Person Omniscient (narrator knows all)',
      sampleNarration: `She walked through the doorway, though she didn't know that behind the walls, three others were watching her every move. Her heart pounded in her chest—a fear she couldn't explain but that her watchers understood all too well. The shadows in this place were more than they seemed, ancient things that had witnessed countless others enter, never to leave.`
    }
  }

  // Second Person
  if (povLower.includes('second')) {
    return {
      description: 'Second Person (you, your)',
      sampleNarration: `You walk through the doorway, your heart pounding in your chest. Something about this place feels wrong—you can sense it in your bones. Looking around, you notice the shadows seem to shift whenever you turn your head. "Hello?" you call out, your voice echoing off the walls. There is no answer, but you know you're not alone.`
    }
  }

  // Default - Third Person Limited
  return {
    description: 'Third Person Limited (default)',
    sampleNarration: `They walked through the doorway, uncertain of what lay ahead. The atmosphere was tense, charged with anticipation. Events would soon unfold that would change everything.`
  }
}

// Get audience-appropriate guidelines
function getAudienceGuidelines(audience: string): { description: string; contentGuidelines: string[]; avoid: string[]; themes: string[] } {
  const audienceLower = (audience || '').toLowerCase()

  // Middle Grade (ages 8-12)
  if (audienceLower.includes('middle grade') || audienceLower.includes('middle-grade') || audienceLower.includes('mg')) {
    return {
      description: 'Middle Grade (ages 8-12)',
      contentGuidelines: [
        'Age-appropriate language and situations',
        'Focus on friendship, family, and self-discovery',
        'Protagonist typically aged 10-13',
        'Positive resolution and hope'
      ],
      avoid: [
        'Graphic violence',
        'Explicit romantic content',
        'Excessive profanity',
        'Overly dark or hopeless themes',
        'Complex adult relationships'
      ],
      themes: ['friendship', 'courage', 'identity', 'belonging', 'adventure', 'discovery']
    }
  }

  // Young Adult (ages 13-18)
  if (audienceLower.includes('young adult') || audienceLower.includes('ya') || audienceLower.includes('teen')) {
    return {
      description: 'Young Adult (ages 13-18)',
      contentGuidelines: [
        'Coming-of-age themes and identity exploration',
        'Protagonist typically aged 15-18',
        'First love and relationship exploration acceptable',
        'Can tackle serious issues with care'
      ],
      avoid: [
        'Gratuitously explicit sexual content',
        'Excessive gore without purpose',
        'Nihilistic endings without redemption'
      ],
      themes: ['identity', 'first love', 'independence', 'rebellion', 'finding oneself', 'justice']
    }
  }

  // New Adult (ages 18-25)
  if (audienceLower.includes('new adult') || audienceLower.includes('na')) {
    return {
      description: 'New Adult (ages 18-25)',
      contentGuidelines: [
        'Post-adolescent challenges and transitions',
        'Protagonist typically aged 18-25',
        'Romantic and sexual content acceptable',
        'Career and life direction themes'
      ],
      avoid: [
        'Content that feels too juvenile',
        'Oversimplified life situations'
      ],
      themes: ['transition', 'independence', 'career', 'relationships', 'self-discovery', 'adulting']
    }
  }

  // Adult
  if (audienceLower.includes('adult') && !audienceLower.includes('young') && !audienceLower.includes('new')) {
    return {
      description: 'Adult (18+)',
      contentGuidelines: [
        'Full range of mature themes acceptable',
        'Complex moral situations',
        'Nuanced character relationships',
        'No content restrictions beyond legal limits'
      ],
      avoid: [],
      themes: ['mortality', 'legacy', 'complex relationships', 'moral ambiguity', 'redemption', 'loss']
    }
  }

  // Children's (ages 5-8)
  if (audienceLower.includes('children') || audienceLower.includes('kids') || audienceLower.includes('chapter book')) {
    return {
      description: "Children's (ages 5-8)",
      contentGuidelines: [
        'Simple, clear language',
        'Short chapters and sentences',
        'Positive, reassuring themes',
        'Protagonist typically aged 6-9'
      ],
      avoid: [
        'Any scary or violent content',
        'Death of main characters',
        'Complex emotional situations',
        'Morally ambiguous situations'
      ],
      themes: ['friendship', 'kindness', 'sharing', 'bravery', 'family', 'imagination']
    }
  }

  // Default - General Audience
  return {
    description: 'General Audience',
    contentGuidelines: [
      'Accessible to a broad readership',
      'Avoid extreme content',
      'Balance complexity with accessibility'
    ],
    avoid: [
      'Excessively graphic content',
      'Highly polarizing themes'
    ],
    themes: ['universal human experiences', 'relationships', 'growth', 'challenges']
  }
}

// Get setting-appropriate elements
function getSettingElements(setting: string): { elements: string[]; vocabulary: string[]; avoid: string[] } {
  const settingLower = (setting || '').toLowerCase()

  // Medieval Fantasy
  if (settingLower.includes('medieval') || settingLower.includes('fantasy') || settingLower.includes('sword')) {
    return {
      elements: ['castle', 'kingdom', 'sword', 'magic', 'forest', 'tavern', 'knight', 'dragon', 'throne'],
      vocabulary: ['thou', 'thy', 'hath', 'ere', 'whilst', 'methinks', 'forsooth', 'mayhap'],
      avoid: ['phone', 'computer', 'car', 'electricity', 'internet', 'technology', 'modern']
    }
  }

  // Sci-Fi / Space
  if (settingLower.includes('sci-fi') || settingLower.includes('space') || settingLower.includes('future')) {
    return {
      elements: ['starship', 'planet', 'galaxy', 'warp', 'laser', 'android', 'space station', 'hyperspace'],
      vocabulary: ['quantum', 'neural', 'cyber', 'nano', 'holographic', 'synthetic', 'orbital'],
      avoid: ['horse', 'carriage', 'candle', 'parchment', 'medieval']
    }
  }

  // Victorian / Steampunk
  if (settingLower.includes('victorian') || settingLower.includes('steampunk') || settingLower.includes('19th')) {
    return {
      elements: ['steam engine', 'clockwork', 'gaslight', 'manor', 'airship', 'brass', 'gears', 'fog'],
      vocabulary: ['jolly good', 'indeed', 'splendid', 'frightfully', 'terribly', 'most'],
      avoid: ['smartphone', 'internet', 'television', 'microwave', 'plastic']
    }
  }

  // Modern / Contemporary
  if (settingLower.includes('modern') || settingLower.includes('contemporary') || settingLower.includes('present')) {
    return {
      elements: ['smartphone', 'city', 'office', 'apartment', 'internet', 'car', 'cafe'],
      vocabulary: ['text', 'online', 'social media', 'trending', 'digital'],
      avoid: []
    }
  }

  // Default - return empty to not constrain
  return { elements: [], vocabulary: [], avoid: [] }
}

function generateSampleChapterContent(context: Record<string, any>): string {
  const title = context.title || 'Untitled Chapter'
  const synopsis = context.synopsis || 'A new chapter begins.'

  // Extract settings from full specification if available
  const spec = context.specification || {}
  const setting = context.setting || context.worldSetting || spec.settingType?.join(', ') || ''
  const pov = context.pov || context.pointOfView || spec.pov || ''
  const tense = context.tense || context.narrativeTense || spec.tense || 'past'
  const audience = context.audience || context.targetAudience || spec.targetAudience || ''
  const themes = spec.themes || context.themes || []
  const tone = spec.tone || context.tone || ''

  // Get character names for reference
  // Handle both array format and object format { main: [...], supporting: [...] }
  let charactersArray: any[] = []
  if (Array.isArray(context.characters)) {
    charactersArray = context.characters
  } else if (context.characters && typeof context.characters === 'object') {
    // Combine main and supporting characters from object format
    charactersArray = [
      ...(context.characters.main || []),
      ...(context.characters.supporting || [])
    ]
  }
  const characterNames = charactersArray.map((c: any) => c.name).filter(Boolean)

  // Get plot beats for reference
  const plotBeats = context.plotBeats || []

  // Get previous chapter summaries for continuity
  const previousChapters = context.previousChapters || []

  // Get world-building context
  const wikiContext = context.wikiContext || []

  const settingElements = getSettingElements(setting)
  const povProse = getPOVProse(pov)
  const tenseProse = getTenseProse(tense, pov)
  const audienceGuidelines = getAudienceGuidelines(audience)

  let chapterContent = `Chapter: ${title}\n\n`
  chapterContent += `[Setting: ${setting || 'Not specified'}]\n`
  chapterContent += `[POV: ${povProse.description}]\n`
  chapterContent += `[Tense: ${tenseProse.description}]\n`
  chapterContent += `[Target Audience: ${audienceGuidelines.description}]\n\n`
  chapterContent += `${synopsis}\n\n`

  // Include POV and tense-appropriate sample narration
  chapterContent += `--- Sample Narrative (${povProse.description}, ${tenseProse.description}) ---\n\n`
  chapterContent += `${tenseProse.sampleNarration}\n\n`
  chapterContent += `--- End Sample ---\n\n`

  // Include setting-appropriate prose
  if (settingElements.elements.length > 0) {
    const randomElements = settingElements.elements.slice(0, 3).join(', ')
    chapterContent += `The story unfolds amidst ${randomElements} and other elements characteristic of this setting.\n\n`
  }

  chapterContent += `The narrative continues with developments and revelations appropriate to the ${setting || 'story'} setting, maintaining consistent ${povProse.description} perspective throughout.\n\n`

  // Note about setting compliance
  if (settingElements.avoid.length > 0) {
    chapterContent += `[Note: Generated content avoids anachronistic elements like: ${settingElements.avoid.join(', ')}]\n\n`
  }

  // Audience-specific content guidelines
  chapterContent += `--- Target Audience: ${audienceGuidelines.description} ---\n\n`
  chapterContent += `Content Guidelines:\n`
  audienceGuidelines.contentGuidelines.forEach(guideline => {
    chapterContent += `• ${guideline}\n`
  })
  chapterContent += `\n`

  if (audienceGuidelines.avoid.length > 0) {
    chapterContent += `Content to Avoid:\n`
    audienceGuidelines.avoid.forEach(item => {
      chapterContent += `• ${item}\n`
    })
    chapterContent += `\n`
  }

  chapterContent += `Recommended Themes for ${audienceGuidelines.description}:\n`
  chapterContent += `${audienceGuidelines.themes.join(', ')}\n\n`

  // Add character references if available
  if (characterNames.length > 0) {
    chapterContent += `--- Characters Referenced ---\n`
    chapterContent += `The following characters are available for this chapter:\n`
    characterNames.slice(0, 8).forEach((name: string) => {
      chapterContent += `• ${name}\n`
    })
    if (characterNames.length > 8) {
      chapterContent += `• ...and ${characterNames.length - 8} more\n`
    }
    chapterContent += `\n`
  }

  // Add plot beat references if available
  if (plotBeats.length > 0) {
    chapterContent += `--- Plot Beats for Context ---\n`
    chapterContent += `Current story arc includes:\n`
    plotBeats.slice(0, 5).forEach((beat: any) => {
      chapterContent += `• ${beat.title}: ${beat.summary?.substring(0, 80) || 'No summary'}${beat.summary?.length > 80 ? '...' : ''}\n`
    })
    chapterContent += `\n`
  }

  // Add previous chapter context for continuity
  if (previousChapters.length > 0) {
    chapterContent += `--- Previous Chapters (for continuity) ---\n`
    previousChapters.forEach((ch: any) => {
      chapterContent += `• Chapter ${ch.number}: "${ch.title}" - ${ch.summary?.substring(0, 100) || 'No summary'}${ch.summary?.length > 100 ? '...' : ''}\n`
    })
    chapterContent += `\n`
  }

  // Add world-building context if available
  if (wikiContext.length > 0) {
    chapterContent += `--- World-Building Reference ---\n`
    wikiContext.slice(0, 5).forEach((w: any) => {
      chapterContent += `• ${w.name} (${w.category}): ${w.description?.substring(0, 60) || ''}${w.description?.length > 60 ? '...' : ''}\n`
    })
    chapterContent += `\n`
  }

  // Add themes if specified
  if (themes.length > 0) {
    chapterContent += `--- Story Themes ---\n`
    chapterContent += `This story explores: ${themes.join(', ')}\n\n`
  }

  // Add tone if specified
  if (tone) {
    chapterContent += `[Tone: ${tone}]\n\n`
  }

  chapterContent += `The chapter would include:\n`
  chapterContent += `- Narrative written in ${povProse.description}\n`
  chapterContent += `- Scene descriptions and atmosphere consistent with ${setting || 'the story'} setting\n`
  chapterContent += `- Character dialogue and interactions appropriate for ${audienceGuidelines.description}\n`
  chapterContent += `- Plot advancement aligned with story beats\n`
  chapterContent += `- Thematic elements (${themes.length > 0 ? themes.slice(0, 3).join(', ') : 'general themes'}) woven naturally\n`
  chapterContent += `- Continuity with previous chapter events\n\n`
  chapterContent += `[End of generated sample content]`

  return chapterContent
}

function generateSampleSceneContent(context: Record<string, any>): string {
  const location = context.location || 'an unknown location'
  const setting = context.setting || context.worldSetting || ''
  const audience = context.audience || context.targetAudience || ''
  const settingElements = getSettingElements(setting)
  const audienceGuidelines = getAudienceGuidelines(audience)

  let sceneContent = `The scene unfolds at ${location}.\n\n`
  sceneContent += `[Target Audience: ${audienceGuidelines.description}]\n\n`

  // Add setting-appropriate atmosphere
  if (settingElements.elements.length > 0) {
    const element = settingElements.elements[Math.floor(Math.random() * settingElements.elements.length)]
    sceneContent += `The atmosphere is rich with the presence of ${element} and other elements of this ${setting || 'story'} world.\n\n`
  }

  sceneContent += `Characters interact and events transpire, moving the story forward. The atmosphere is palpable as tensions rise and fall.\n\n`

  if (settingElements.avoid.length > 0) {
    sceneContent += `[Setting-compliant: Avoiding modern anachronisms]\n`
  }

  // Add audience guidelines
  if (audienceGuidelines.avoid.length > 0) {
    sceneContent += `[Audience-appropriate: Content avoids ${audienceGuidelines.avoid.slice(0, 2).join(', ')}]\n`
  }

  sceneContent += `[Recommended themes: ${audienceGuidelines.themes.slice(0, 3).join(', ')}]\n`

  sceneContent += `\nThis is AI-generated sample content for the scene generation feature.`

  return sceneContent
}

function generateSampleCharacterContent(context: Record<string, any>): string {
  const name = context.name || 'New Character'

  return `Character Profile: ${name}

A complex character with depth and motivation. Their backstory weaves into the larger narrative, creating connections and conflicts with other characters.

This is AI-generated sample content for the character generation feature.`
}

// Generate character dialogue using their voice specifications
function generateCharacterDialogue(context: Record<string, any>): string {
  const character = context.character || {}
  const name = character.name || 'Character'
  const speechPatterns = character.speechPatterns || ''
  const vocabularyLevel = character.vocabularyLevel || 'standard'
  const catchphrases = character.catchphrases || []
  const internalVoice = character.internalVoice || ''

  // Generate dialogue that reflects character voice
  let dialogueStyle = ''
  let vocabulary = ''
  let phrases = ''

  // Apply vocabulary level
  switch (vocabularyLevel.toLowerCase()) {
    case 'formal':
    case 'academic':
    case 'sophisticated':
      vocabulary = 'utilizing sophisticated vocabulary and precise terminology'
      dialogueStyle = 'Speaking with measured eloquence, '
      break
    case 'casual':
    case 'colloquial':
    case 'informal':
      vocabulary = 'using everyday language and relaxed expressions'
      dialogueStyle = 'Speaking casually, '
      break
    case 'street':
    case 'slang':
      vocabulary = 'using slang and street vernacular'
      dialogueStyle = 'Speaking in a street-smart way, '
      break
    default:
      vocabulary = 'using standard vocabulary'
      dialogueStyle = ''
  }

  // Include catchphrases if available
  if (catchphrases.length > 0) {
    phrases = `\nCharacteristic phrases: "${catchphrases.slice(0, 2).join('", "')}"`
  }

  // Build the dialogue output
  let dialogue = `[${name}'s dialogue - ${vocabulary}]${phrases}\n\n`

  if (speechPatterns) {
    dialogue += `Speech pattern note: ${speechPatterns}\n\n`
  }

  dialogue += `${dialogueStyle}${name} speaks:\n\n`

  // Generate sample dialogue based on voice characteristics
  if (vocabularyLevel.toLowerCase().includes('formal') || vocabularyLevel.toLowerCase().includes('academic')) {
    dialogue += `"I must confess, the circumstances before us require considerable deliberation. It would be imprudent to proceed without careful analysis of the potential ramifications."\n\n`
    dialogue += `"Furthermore, I believe our approach should reflect the gravity of this situation. Shall we discuss the matter in greater detail?"`
  } else if (vocabularyLevel.toLowerCase().includes('casual') || vocabularyLevel.toLowerCase().includes('informal')) {
    dialogue += `"Look, here's the thing - we gotta figure this out, you know? It's not like we've got all day."\n\n`
    dialogue += `"So what do you say we just wing it and see what happens? Can't be worse than sitting around doing nothing, right?"`
  } else {
    dialogue += `"I think we should consider our options carefully. There's a lot at stake here."\n\n`
    dialogue += `"What's your take on all this? I'd like to hear your thoughts before we make a decision."`
  }

  if (internalVoice) {
    dialogue += `\n\n[Internal thought pattern: ${internalVoice}]`
  }

  return dialogue
}

// Orchestrator: Route to the correct specialized agent based on request type
function routeToAgent(agentTarget: string, action: string): {
  agent: string
  description: string
  capabilities: string[]
} {
  // Map agent targets to specialized agents
  const agentMapping: Record<string, {
    agent: string
    description: string
    capabilities: string[]
  }> = {
    // Writer Agent - handles chapter/scene writing
    'writer': {
      agent: 'WriterAgent',
      description: 'Specialized in prose generation, narrative writing, and creative content',
      capabilities: ['generate-chapter', 'generate-scene', 'continue-writing', 'expand-scene'],
    },
    // Character Agent - handles character creation and development
    'character': {
      agent: 'CharacterAgent',
      description: 'Specialized in character profiles, dialogue, and character voice',
      capabilities: ['generate-character', 'generate-dialogue', 'character-backstory', 'voice-consistency'],
    },
    // Chapter Agent - handles chapter structure and outlines
    'chapter': {
      agent: 'ChapterAgent',
      description: 'Specialized in chapter structure, outlining, and content generation',
      capabilities: ['generate-chapter-outline', 'generate-chapter', 'chapter-structure', 'scene-breakdown'],
    },
    // Plot Agent - handles plot development and structure
    'plot': {
      agent: 'PlotAgent',
      description: 'Specialized in plot structure, story arcs, and narrative frameworks',
      capabilities: ['generate-plot-beat', 'plot-structure', 'story-arc', 'conflict-development'],
    },
    // Review/Critic Agent - handles critiques and quality analysis
    'review': {
      agent: 'CriticAgent',
      description: 'Specialized in manuscript critique, quality analysis, and improvement suggestions',
      capabilities: ['critique-chapter', 'implement-suggestions', 'auto-improve', 'quality-analysis'],
    },
    // Wiki Agent - handles world-building and consistency
    'wiki': {
      agent: 'WikiAgent',
      description: 'Specialized in world-building, consistency checking, and lore management',
      capabilities: ['generate-wiki-entry', 'consistency-check', 'world-building', 'lore-expansion'],
    },
    // Market Agent - handles market analysis and positioning
    'market': {
      agent: 'MarketAgent',
      description: 'Specialized in market analysis, comparable titles, and positioning',
      capabilities: ['market-analysis', 'comparable-titles', 'genre-positioning', 'audience-analysis'],
    },
  }

  // Find matching agent
  const targetLower = agentTarget?.toLowerCase() || 'writer'
  const matched = agentMapping[targetLower] || agentMapping['writer']

  return matched
}

// POST /api/ai/generate - Generic AI generation endpoint with cancellation support
router.post('/generate', async (req: Request, res: Response) => {
  const { agentTarget, action, context, payload } = req.body
  const generationId = `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Route to appropriate specialized agent via orchestrator
  const routedAgent = routeToAgent(agentTarget, action)
  console.log(`[Orchestrator] Routing request to ${routedAgent.agent} for action: ${action}`)
  console.log(`[${routedAgent.agent}] Starting generation ${generationId}`)

  // Register this generation
  activeGenerations.set(generationId, { cancelled: false })

  // Handle client disconnect (abort) - use socket close detection
  const socket = req.socket
  const onSocketClose = () => {
    const generation = activeGenerations.get(generationId)
    if (generation && !res.writableEnded) {
      console.log(`[AI Generate] Client disconnected, cancelling ${generationId}`)
      generation.cancelled = true
    }
  }
  socket.on('close', onSocketClose)

  try {
    // Simulate AI generation with cancellation support
    const { result, cancelled } = await simulateAIGeneration(action, context || {}, generationId)

    // Clean up socket listener
    socket.off('close', onSocketClose)
    activeGenerations.delete(generationId)

    if (cancelled) {
      console.log(`[AI Generate] Generation ${generationId} was cancelled`)
      if (!res.writableEnded) {
        res.status(499).json({
          status: 'cancelled',
          message: 'Generation cancelled by user',
        })
      }
      return
    }

    console.log(`[${routedAgent.agent}] Generation ${generationId} completed successfully`)
    res.json({
      status: 'success',
      result,
      action,
      generationId,
      agent: routedAgent.agent,
      agentDescription: routedAgent.description,
    })
  } catch (error) {
    socket.off('close', onSocketClose)
    activeGenerations.delete(generationId)
    console.error('AI generation error:', error)
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Generation failed',
    })
  }
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
