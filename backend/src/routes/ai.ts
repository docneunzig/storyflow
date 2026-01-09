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
  const setting = context.setting || context.worldSetting || ''
  const settingElements = getSettingElements(setting)

  let chapterContent = `Chapter: ${title}\n\n`
  chapterContent += `[Setting: ${setting || 'Not specified'}]\n\n`
  chapterContent += `${synopsis}\n\n`

  // Include setting-appropriate prose
  if (settingElements.elements.length > 0) {
    const randomElements = settingElements.elements.slice(0, 3).join(', ')
    chapterContent += `The story unfolds amidst ${randomElements} and other elements characteristic of this setting.\n\n`
  }

  chapterContent += `The narrative continues with developments and revelations appropriate to the ${setting || 'story'} setting. Characters face challenges and make important decisions that will shape the story going forward.\n\n`

  // Note about setting compliance
  if (settingElements.avoid.length > 0) {
    chapterContent += `[Note: Generated content avoids anachronistic elements like: ${settingElements.avoid.join(', ')}]\n\n`
  }

  chapterContent += `The chapter would include:\n`
  chapterContent += `- Scene descriptions and atmosphere consistent with ${setting || 'the story'} setting\n`
  chapterContent += `- Character dialogue and interactions\n`
  chapterContent += `- Plot advancement\n`
  chapterContent += `- Thematic elements appropriate to the genre\n\n`
  chapterContent += `[End of generated sample content]`

  return chapterContent
}

function generateSampleSceneContent(context: Record<string, any>): string {
  const location = context.location || 'an unknown location'
  const setting = context.setting || context.worldSetting || ''
  const settingElements = getSettingElements(setting)

  let sceneContent = `The scene unfolds at ${location}.\n\n`

  // Add setting-appropriate atmosphere
  if (settingElements.elements.length > 0) {
    const element = settingElements.elements[Math.floor(Math.random() * settingElements.elements.length)]
    sceneContent += `The atmosphere is rich with the presence of ${element} and other elements of this ${setting || 'story'} world.\n\n`
  }

  sceneContent += `Characters interact and events transpire, moving the story forward. The atmosphere is palpable as tensions rise and fall.\n\n`

  if (settingElements.avoid.length > 0) {
    sceneContent += `[Setting-compliant: Avoiding modern anachronisms]\n`
  }

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

// POST /api/ai/generate - Generic AI generation endpoint with cancellation support
router.post('/generate', async (req: Request, res: Response) => {
  const { agentTarget, action, context, payload } = req.body
  const generationId = `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  console.log(`[AI Generate] Starting generation ${generationId} for action: ${action}`)

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

    console.log(`[AI Generate] Generation ${generationId} completed successfully`)
    res.json({
      status: 'success',
      result,
      action,
      generationId,
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
