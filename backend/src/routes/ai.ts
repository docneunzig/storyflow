import { Router, Request, Response } from 'express'
import { exec } from 'child_process'
import { promisify } from 'util'
import {
  generateWithClaude,
  registerGeneration,
  cancelGeneration,
  cleanupGeneration,
} from '../services/claude.js'

const execAsync = promisify(exec)
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
    case 'analyze-brainstorm':
      result = analyzeBrainstorm(context)
      break
    case 'generate-foundations':
      result = generateFoundations(context)
      break
    // NEW: Inline AI writing actions
    case 'expand-selection':
      result = expandSelection(context)
      break
    case 'condense-selection':
      result = condenseSelection(context)
      break
    case 'rewrite-selection':
      result = rewriteSelection(context)
      break
    case 'generate-alternatives':
      result = generateAlternatives(context)
      break
    case 'continue-writing':
      result = continueWriting(context)
      break
    case 'generate-chapter-draft':
      result = generateChapterDraft(context)
      break
    case 'generate-scene-prose':
      result = generateSceneProse(context)
      break
    case 'expand-beat':
      result = expandBeat(context)
      break
    case 'suggest-twists':
      result = suggestTwists(context)
      break
    case 'suggest-titles':
      result = suggestTitles(context)
      break
    case 'suggest-tones':
      result = suggestTones(context)
      break
    case 'suggest-themes':
      result = suggestThemes(context)
      break
    case 'extract-elements':
      result = extractWikiElements(context)
      break
    case 'expand-entry':
      result = expandWikiEntry(context)
      break
    case 'deepen-character':
      result = deepenCharacter(context)
      break
    case 'generate-character-dialogue':
      result = generateCharacterInteraction(context)
      break
    case 'generate-synopsis':
      result = generateSynopsis(context)
      break
    case 'generate-query-letter':
      result = generateQueryLetter(context)
      break
    case 'generate-book-description':
      result = generateBookDescription(context)
      break
    case 'analyze-market':
      result = analyzeMarket(context)
      break
    case 'suggest-keywords':
      result = suggestKeywords(context)
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

// NEW: Expand selected text with more detail
function expandSelection(context: Record<string, any>): string {
  const selectedText = context.selectedText || ''
  const spec = context.specification || {}
  const characters = context.characters || []

  // Simulate expanding the text with more detail
  const expanded = `${selectedText}

The moment stretched, each second laden with unspoken meaning. ${
    characters.length > 0
      ? `${characters[0].name || 'The protagonist'} felt the weight of the decision pressing down upon them.`
      : 'The weight of the decision pressed down upon all present.'
  }

The air itself seemed to thicken, charged with anticipation. Every detail came into sharp focus—the subtle shift of shadows, the distant echo of sounds, the way time itself seemed to hold its breath.

${spec.tone ? `The ${spec.tone.toLowerCase()} atmosphere deepened.` : 'The atmosphere intensified.'}`

  return expanded
}

// NEW: Condense selected text to be more concise
function condenseSelection(context: Record<string, any>): string {
  const selectedText = context.selectedText || ''

  // Simulate condensing - in production, AI would intelligently summarize
  const words = selectedText.split(/\s+/)
  if (words.length <= 10) {
    return selectedText // Already short
  }

  // Simulate a condensed version (roughly 50% of original)
  const targetLength = Math.max(10, Math.floor(words.length * 0.5))
  const condensed = words.slice(0, targetLength).join(' ') + '...'

  return `${condensed.replace('...', '')}. The moment passed, leaving its mark.`
}

// NEW: Rewrite selected text with different phrasing
function rewriteSelection(context: Record<string, any>): string {
  const selectedText = context.selectedText || ''
  const spec = context.specification || {}

  // Simulate a rewrite with different phrasing
  const tense = spec.tense?.toLowerCase() || 'past'
  const isPresentTense = tense.includes('present')

  // Generate a rewritten version with different structure
  const sentences = selectedText.split(/[.!?]+/).filter(s => s.trim())

  if (sentences.length === 0) return selectedText

  // Rewrite each sentence with variation
  const rewritten = sentences.map((sentence: string) => {
    const trimmed = sentence.trim()
    if (!trimmed) return ''

    // Add variety to sentence starts
    const starters = [
      isPresentTense ? 'Now, ' : 'Then, ',
      'In that moment, ',
      '',
      'Suddenly, ',
      '',
    ]
    const starter = starters[Math.floor(Math.random() * starters.length)]

    return `${starter}${trimmed.charAt(0).toLowerCase()}${trimmed.slice(1)}`
  }).filter(Boolean).join('. ')

  return rewritten + '.'
}

// NEW: Generate 3 alternative versions of selected text
function generateAlternatives(context: Record<string, any>): string {
  const selectedText = context.selectedText || ''
  const spec = context.specification || {}
  const tone = spec.tone?.toLowerCase() || 'neutral'

  // Generate 3 distinct alternatives
  const alternatives = [
    // Alternative 1: More dramatic
    `With a surge of emotion, the moment crystallized into something unforgettable. ${selectedText.split('.')[0]}—but with an intensity that left no one unchanged.`,

    // Alternative 2: More introspective
    `A quiet understanding settled over the scene. What had been said, what had happened—it all took on new meaning. ${selectedText.split('.')[0]}, though perhaps not in the way anyone expected.`,

    // Alternative 3: More action-oriented
    `There was no time to hesitate. ${selectedText.split('.')[0]}—and with that, everything shifted into motion, consequences rippling outward like waves.`,
  ]

  // Return as JSON array
  return JSON.stringify(alternatives)
}

// NEW: Continue writing from current content
function continueWriting(context: Record<string, any>): string {
  const currentContent = context.currentContent || ''
  const spec = context.specification || {}
  const characters = context.characters || []
  const scenes = context.scenes || []

  // Get the last paragraph/line for context
  const lastParagraph = currentContent.split('\n\n').filter((p: string) => p.trim()).pop() || ''

  // Get character names for use in continuation
  const characterNames = characters.map((c: any) => c.name).filter(Boolean)
  const mainCharacter = characterNames[0] || 'the protagonist'

  // Generate continuation
  let continuation = ''

  if (scenes.length > 0) {
    // If there are scene outlines, use them to guide continuation
    const currentScene = scenes[0]
    continuation = `The story continues as ${mainCharacter} navigates the challenges ahead.

${currentScene.summary ? `${currentScene.summary.split('.')[0]}. ` : ''}The path forward was uncertain, but there was no turning back now.

"We need to move," ${mainCharacter} said, the words carrying more weight than their simplicity suggested.

The others exchanged glances, a silent acknowledgment passing between them. Whatever came next, they would face it together.`
  } else {
    // Generic continuation
    continuation = `The moment stretched between heartbeats, pregnant with possibility.

${mainCharacter} took a breath, steadying themselves against what was to come. The world around them seemed to wait, patient and expectant.

"There's something you should know," they began, the words falling into the silence like stones into still water.

The response came not in words, but in the subtle shift of the air itself—an acknowledgment that nothing would be quite the same after this.`
  }

  return continuation
}

// NEW: Generate a complete chapter draft from scene outlines
function generateChapterDraft(context: Record<string, any>): string {
  const chapterTitle = context.chapterTitle || 'Untitled Chapter'
  const chapterNumber = context.chapterNumber || 1
  const spec = context.specification || {}
  const scenes = context.scenes || []
  const characters = context.characters || []
  const previousChapterContent = context.previousChapterContent || ''

  const pov = spec.pov || 'Third Person Limited'
  const tense = spec.tense || 'Past'
  const audience = spec.targetAudience || 'Adult'

  // Build the chapter draft
  let draft = `# Chapter ${chapterNumber}: ${chapterTitle}\n\n`

  // Opening hook
  if (previousChapterContent) {
    draft += `The echoes of what had come before still lingered in the air as ${chapterTitle.toLowerCase()} began.\n\n`
  }

  // Generate content for each scene
  if (scenes.length > 0) {
    scenes.forEach((scene: any, index: number) => {
      const povCharacter = characters.find((c: any) => c.id === scene.povCharacterId)
      const povName = povCharacter?.name || 'the protagonist'

      // Scene header (optional, can be removed)
      draft += `---\n\n`

      // Scene content based on outline
      if (scene.detailedOutline) {
        draft += `${scene.detailedOutline}\n\n`
      } else if (scene.summary) {
        // Expand summary into prose
        draft += `${povName} found themselves at a crossroads. ${scene.summary}\n\n`
        draft += `The weight of the moment pressed in from all sides. There would be no easy answers, no simple solutions to what lay ahead.\n\n`
      }

      // Add scene-specific elements based on metadata
      if (scene.conflictType) {
        draft += `The ${scene.conflictType.toLowerCase()} tension filled the space between them, unspoken but undeniable.\n\n`
      }

      if (scene.tone) {
        draft += `The ${scene.tone.toLowerCase()} atmosphere colored everything that followed.\n\n`
      }

      // Transition to next scene (except for last scene)
      if (index < scenes.length - 1) {
        draft += `And as one moment ended, another was already beginning...\n\n`
      }
    })
  } else {
    // No scenes - generate a basic chapter structure
    draft += `[No scene outlines provided - generating basic chapter structure]\n\n`
    draft += `The chapter begins with an establishing moment, grounding the reader in time and place.\n\n`
    draft += `Rising action builds through the middle portion, with characters making choices that will have consequences.\n\n`
    draft += `The chapter concludes with a hook that propels the reader forward, eager to discover what comes next.\n\n`
  }

  // Chapter closing
  draft += `---\n\n`
  draft += `[Draft generated with ${pov}, ${tense} tense, targeting ${audience} readers]\n`
  draft += `[Word count: ~${draft.split(/\s+/).length} words - expand scenes for full chapter]`

  return draft
}

// NEW: Generate prose from scene outline
function generateSceneProse(context: Record<string, any>): string {
  const scene = context.scene || {}
  const povCharacter = context.povCharacter || {}
  const charactersPresent = context.charactersPresent || []
  const spec = context.specification || {}

  const pov = spec.pov || 'Third Person Limited'
  const tense = spec.tense || 'Past'
  const isFirstPerson = pov.toLowerCase().includes('first')
  const isPresentTense = tense.toLowerCase().includes('present')

  // Build character names for dialogue
  const povName = povCharacter.name || 'the protagonist'
  const otherCharacters = charactersPresent.map((c: any) => c.name).filter(Boolean)

  // Build the prose
  let prose = ''

  // Opening based on opening emotion
  const openingEmotions: Record<string, string> = {
    'tense anticipation': `The air ${isPresentTense ? 'crackles' : 'crackled'} with tension as ${isFirstPerson ? 'I' : povName} ${isPresentTense ? 'enters' : 'entered'} the space.`,
    'curious determination': `Something ${isPresentTense ? 'stirs' : 'stirred'} in ${isFirstPerson ? 'my' : 'their'} chest—a hunger to understand, to know.`,
    'guarded vulnerability': `${isFirstPerson ? 'I keep' : povName + ' kept'} ${isFirstPerson ? 'my' : 'their'} guard up, though beneath it, something fragile ${isPresentTense ? 'waits' : 'waited'}.`,
    'shocked revelation': `The truth ${isPresentTense ? 'hits' : 'hit'} like a physical blow.`,
    'hopeful connection': `For the first time in what ${isPresentTense ? 'feels' : 'felt'} like forever, something like hope ${isPresentTense ? 'begins' : 'began'} to bloom.`,
  }

  const openingEmotion = scene.openingEmotion?.toLowerCase() || ''
  prose += openingEmotions[openingEmotion] || `The scene ${isPresentTense ? 'unfolds' : 'unfolded'} with ${scene.openingEmotion || 'quiet intensity'}.`
  prose += '\n\n'

  // Time and atmosphere
  if (scene.timeInStory) {
    prose += `${scene.timeInStory}. `
  }
  if (scene.weatherAtmosphere) {
    prose += `${scene.weatherAtmosphere} `
  }
  prose += '\n\n'

  // Main content from summary or outline
  if (scene.detailedOutline) {
    prose += scene.detailedOutline + '\n\n'
  } else if (scene.summary) {
    // Expand summary into prose
    prose += `${scene.summary}\n\n`

    // Add some dialogue if there are characters present
    if (otherCharacters.length > 0) {
      const otherChar = otherCharacters[0]
      prose += `"${isFirstPerson ? 'I' : povName} ${isPresentTense ? 'need' : 'needed'} to understand," ${isFirstPerson ? 'I say' : povName + ' said'}, the words carrying more weight than ${isFirstPerson ? 'I' : 'they'} ${isPresentTense ? 'intend' : 'intended'}.\n\n`
      prose += `${otherChar} ${isPresentTense ? 'pauses' : 'paused'}, something shifting behind ${otherChar}'s eyes. "And what makes you think you're ready for that?"\n\n`
    }
  }

  // Conflict development
  if (scene.conflictType) {
    prose += `The ${scene.conflictType.toLowerCase()} conflict ${isPresentTense ? 'intensifies' : 'intensified'}, `;
    if (scene.conflictDescription) {
      prose += `as ${scene.conflictDescription.toLowerCase()}\n\n`
    } else {
      prose += `pressing in from all sides.\n\n`
    }
  }

  // Scene goal progression
  if (scene.sceneGoal) {
    prose += `Every moment ${isPresentTense ? 'brings' : 'brought'} ${isFirstPerson ? 'me' : 'them'} closer to what ${isPresentTense ? 'matters' : 'mattered'} most: ${scene.sceneGoal.toLowerCase()}.\n\n`
  }

  // Pacing-appropriate action
  if (scene.pacing === 'Fast' || scene.pacing === 'Intense') {
    prose += `Events ${isPresentTense ? 'cascade' : 'cascaded'} forward with breathless momentum. There ${isPresentTense ? 'is' : 'was'} no time for hesitation, no room for doubt.\n\n`
  } else if (scene.pacing === 'Slow') {
    prose += `Time ${isPresentTense ? 'stretches' : 'stretched'} like honey, each moment given space to breathe, to be felt.\n\n`
  }

  // Closing based on closing emotion
  const closingEmotions: Record<string, string> = {
    'shocked revelation': `And then ${isFirstPerson ? 'I understand' : 'understanding dawned'}—a truth that ${isPresentTense ? 'changes' : 'changed'} everything.`,
    'unsettled realization': `Something ${isPresentTense ? 'doesn\'t' : 'didn\'t'} feel right. The implications ${isPresentTense ? 'settle' : 'settled'} into ${isFirstPerson ? 'my' : 'their'} bones like a chill.`,
    'hopeful connection': `For the first time, something like hope ${isPresentTense ? 'feels' : 'felt'} possible.`,
    'tense anticipation': `This ${isPresentTense ? 'isn\'t' : 'wasn\'t'} over. Not even close.`,
    'satisfied resolution': `It ${isPresentTense ? 'is' : 'was'} enough. For now.`,
  }

  const closingEmotion = scene.closingEmotion?.toLowerCase() || ''
  prose += '\n' + (closingEmotions[closingEmotion] || `The scene ${isPresentTense ? 'concludes' : 'concluded'} with ${scene.closingEmotion || 'quiet resolution'}.`)

  // Add tone marker
  if (scene.tone) {
    prose += `\n\n[Tone: ${scene.tone}]`
  }

  return prose
}

// NEW: Expand a plot beat into detailed scenes
function expandBeat(context: Record<string, any>): string {
  const beat = context.beat || {}
  const characters = context.characters || []
  const spec = context.specification || {}

  const beatTitle = beat.title || 'Untitled Beat'
  const beatSummary = beat.summary || ''
  const emotionalArc = beat.emotionalArc || 'tension rising'

  // Generate 3-5 scenes from this beat
  const scenes = []

  // Scene 1: Opening/Setup
  scenes.push({
    title: `${beatTitle}: Opening`,
    summary: `Establish the situation at the start of this beat. ${beatSummary.split('.')[0]}. Characters are positioned and stakes are made clear.`,
  })

  // Scene 2: Development
  if (characters.length > 0) {
    const charName = characters[0].name || 'The protagonist'
    scenes.push({
      title: `${beatTitle}: Confrontation`,
      summary: `${charName} faces the central challenge of this beat. Conflict intensifies as obstacles emerge. The emotional arc shifts toward ${emotionalArc}.`,
    })
  } else {
    scenes.push({
      title: `${beatTitle}: Rising Action`,
      summary: `The situation escalates. Complications arise that make the goal harder to achieve. Characters must adapt their approach.`,
    })
  }

  // Scene 3: Turning Point
  scenes.push({
    title: `${beatTitle}: Turning Point`,
    summary: `A critical moment changes the trajectory. ${beat.stakes ? `The stakes (${beat.stakes}) become undeniably real.` : 'Stakes become personal.'} Nothing can be the same after this.`,
  })

  // Scene 4: Aftermath (if beat is substantial)
  if (beatSummary.length > 100) {
    scenes.push({
      title: `${beatTitle}: Aftermath`,
      summary: `Characters process what happened. New understanding emerges. The path forward becomes clearer, though perhaps not easier.`,
    })
  }

  return JSON.stringify(scenes)
}

// NEW: Suggest plot twists for a beat
function suggestTwists(context: Record<string, any>): string {
  const beat = context.beat || {}
  const existingBeats = context.existingBeats || []
  const spec = context.specification || {}

  const genre = spec.genre?.[0] || 'fiction'
  const themes = spec.themes || ['conflict', 'growth']

  // Generate contextual twists based on the story
  const twists = []

  // Betrayal twist
  twists.push(
    `A character thought to be an ally has been working against the protagonist all along, motivated by ${themes[0] || 'hidden desires'}.`
  )

  // Revelation twist
  twists.push(
    `The true nature of ${beat.title || 'this situation'} is revealed: what seemed like ${beat.stakes || 'the main problem'} is actually a symptom of something much larger.`
  )

  // Role reversal twist
  if (existingBeats.length > 2) {
    twists.push(
      `The antagonist's methods prove to be the only solution, forcing the protagonist to adopt the very approach they opposed.`
    )
  } else {
    twists.push(
      `The mentor figure has been testing the protagonist with false information, and the real truth changes everything.`
    )
  }

  // Genre-specific twist
  if (genre.toLowerCase().includes('romance')) {
    twists.push(
      `The love interest has a hidden connection to the protagonist's past that complicates their relationship.`
    )
  } else if (genre.toLowerCase().includes('thriller') || genre.toLowerCase().includes('mystery')) {
    twists.push(
      `The evidence pointing to the obvious suspect was planted—the real culprit is the person who seemed most helpful.`
    )
  } else if (genre.toLowerCase().includes('fantasy') || genre.toLowerCase().includes('sci-fi')) {
    twists.push(
      `The power/technology that seemed like salvation has a terrible cost that was hidden until now.`
    )
  } else {
    twists.push(
      `The goal the protagonist has been pursuing would actually make things worse—they've been wrong about what they truly need.`
    )
  }

  return JSON.stringify(twists)
}

// NEW: Suggest novel titles
function suggestTitles(context: Record<string, any>): string {
  const genre = context.genre?.[0] || 'fiction'
  const themes = context.themes || []
  const tone = context.tone || ''
  const audience = context.targetAudience || 'Adult'

  const titles = []

  // Genre-inspired title
  if (genre.toLowerCase().includes('fantasy')) {
    titles.push('The Crown of Shadows')
    titles.push('Kingdoms of Ash and Light')
    titles.push('The Last Spellweaver')
  } else if (genre.toLowerCase().includes('romance')) {
    titles.push('The Heart Remembers')
    titles.push('Second Chances at Sunrise')
    titles.push('Where Love Finds You')
  } else if (genre.toLowerCase().includes('mystery') || genre.toLowerCase().includes('thriller')) {
    titles.push('The Silent Witness')
    titles.push('What She Knew')
    titles.push('The Truth Behind the Lies')
  } else if (genre.toLowerCase().includes('sci')) {
    titles.push('Beyond the Last Star')
    titles.push('The Quantum Protocol')
    titles.push('Echoes of Tomorrow')
  } else {
    titles.push('The Weight of Words')
    titles.push('Between the Lines')
    titles.push('What Remains')
  }

  // Theme-inspired adjustments
  if (themes.includes('Redemption')) {
    titles.push('The Road Back Home')
  }
  if (themes.includes('Love')) {
    titles.push('The Heart\'s True North')
  }
  if (themes.includes('Power')) {
    titles.push('The Price of Ambition')
  }

  // Return first 3 titles
  return JSON.stringify(titles.slice(0, 3))
}

// NEW: Suggest novel tones
function suggestTones(context: Record<string, any>): string {
  const genre = context.genre?.[0] || 'fiction'
  const themes = context.themes || []
  const audience = context.targetAudience || 'Adult'

  const tones = []

  // Genre-appropriate tones
  if (genre.toLowerCase().includes('fantasy')) {
    tones.push('Epic and sweeping with moments of intimate wonder')
    tones.push('Dark and atmospheric with threads of hope')
    tones.push('Whimsical yet grounded in emotional truth')
  } else if (genre.toLowerCase().includes('romance')) {
    tones.push('Warm and witty with emotional depth')
    tones.push('Passionate and dramatic with tender moments')
    tones.push('Light-hearted with an undercurrent of genuine connection')
  } else if (genre.toLowerCase().includes('thriller')) {
    tones.push('Tense and propulsive with psychological depth')
    tones.push('Gritty and realistic with moments of moral ambiguity')
    tones.push('Suspenseful and twisty with unreliable perspectives')
  } else if (genre.toLowerCase().includes('mystery')) {
    tones.push('Atmospheric and puzzling with elegant reveals')
    tones.push('Cozy yet intriguing with quirky charm')
    tones.push('Noir-influenced with sharp dialogue and shadows')
  } else {
    tones.push('Lyrical and contemplative with emotional resonance')
    tones.push('Spare and precise with powerful understatement')
    tones.push('Rich and immersive with vivid sensory detail')
  }

  return JSON.stringify(tones.slice(0, 3))
}

// NEW: Suggest novel themes
function suggestThemes(context: Record<string, any>): string {
  const genre = context.genre?.[0] || 'fiction'
  const currentThemes = context.currentThemes || []
  const title = context.title || ''

  const allThemes = [
    'The cost of keeping secrets',
    'Finding belonging after loss',
    'The gap between truth and perception',
    'Inheritance—what we receive and what we leave behind',
    'The masks we wear and who we are beneath them',
    'The tension between duty and desire',
    'Rebuilding after destruction',
    'The search for authentic connection',
    'Coming to terms with the past',
    'The price of power',
    'Memory as both burden and gift',
    'The courage to be vulnerable',
    'Confronting inherited trauma',
    'The nature of forgiveness',
    'Finding hope in darkness',
  ]

  // Filter out current themes
  const available = allThemes.filter(t =>
    !currentThemes.some((ct: string) =>
      t.toLowerCase().includes(ct.toLowerCase()) ||
      ct.toLowerCase().includes(t.toLowerCase())
    )
  )

  // Shuffle and take 3
  const shuffled = available.sort(() => Math.random() - 0.5)

  return JSON.stringify(shuffled.slice(0, 3))
}

// NEW: Extract wiki elements from chapters
function extractWikiElements(context: Record<string, any>): string {
  const chapters = context.chapters || []
  const existingEntries = context.existingEntries || []
  const spec = context.specification || {}

  const genre = spec.genre?.[0] || 'fiction'

  // Generate sample extracted elements based on genre
  const elements = []

  if (genre.toLowerCase().includes('fantasy')) {
    elements.push(
      { name: 'The Whispering Woods', category: 'locations', description: 'An ancient forest where magic lingers in the air and trees seem to speak to those who listen.' },
      { name: 'Binding Ritual', category: 'magicTechnology', description: 'A ceremonial practice that creates an unbreakable magical bond between participants.' },
      { name: 'The Silver Order', category: 'culturesFactions', description: 'A secretive organization dedicated to preserving ancient knowledge and artifacts.' },
    )
  } else if (genre.toLowerCase().includes('sci')) {
    elements.push(
      { name: 'Quantum Drive', category: 'magicTechnology', description: 'The propulsion system that allows faster-than-light travel through folded space.' },
      { name: 'Nexus Station', category: 'locations', description: 'The central hub of interstellar commerce and diplomacy.' },
      { name: 'The Collective', category: 'culturesFactions', description: 'A post-human civilization that has merged consciousness into a shared network.' },
    )
  } else if (genre.toLowerCase().includes('mystery') || genre.toLowerCase().includes('thriller')) {
    elements.push(
      { name: 'The Blackwood Estate', category: 'locations', description: 'A sprawling Victorian mansion with a history of mysterious deaths.' },
      { name: 'The Cipher', category: 'objects', description: 'A coded message that holds the key to unlocking the central mystery.' },
      { name: 'Protocol Seven', category: 'terminology', description: 'A clandestine operation referenced in classified documents.' },
    )
  } else {
    elements.push(
      { name: 'Maple Street', category: 'locations', description: 'The quiet neighborhood where much of the story takes place.' },
      { name: 'The Family Recipe', category: 'objects', description: 'A treasured heirloom that carries generations of meaning.' },
      { name: 'The Incident', category: 'timeline', description: 'A pivotal event that changed everything for the main characters.' },
    )
  }

  // Filter out elements that already exist
  const filtered = elements.filter(e =>
    !existingEntries.some((existing: string) =>
      existing.toLowerCase() === e.name.toLowerCase()
    )
  )

  return JSON.stringify(filtered)
}

// NEW: Expand a wiki entry with more detail
function expandWikiEntry(context: Record<string, any>): string {
  const entry = context.entry || {}
  const spec = context.specification || {}
  const genre = context.genre?.[0] || spec.genre?.[0] || 'fiction'

  const name = entry.name || 'Unknown'
  const category = entry.category || 'terminology'
  const description = entry.description || ''

  let expanded = description + '\n\n'

  // Add category-specific details
  if (category === 'locations') {
    expanded += `**Geography & Layout:**\n${name} occupies a strategic position within the story's world. Its physical characteristics reflect its history and purpose.\n\n`
    expanded += `**Atmosphere:**\nThe overall feeling of ${name} is one that immediately affects visitors. The environment tells a story of its own.\n\n`
    expanded += `**Significance:**\n${name} plays a crucial role in the narrative, serving as both a physical location and a symbolic space.`
  } else if (category === 'characters') {
    expanded += `**Background:**\nThe full history of this character reveals layers of complexity that inform their current motivations.\n\n`
    expanded += `**Relationships:**\nTheir connections to other characters create a web of loyalties, conflicts, and dependencies.\n\n`
    expanded += `**Arc:**\nThis character undergoes significant development throughout the story.`
  } else if (category === 'magicTechnology') {
    expanded += `**How It Works:**\nThe underlying principles that make this possible are rooted in the story's internal logic.\n\n`
    expanded += `**Limitations:**\nNo power comes without cost or constraint. These limitations create dramatic tension.\n\n`
    expanded += `**History:**\nThe origins and development of this capability inform how characters view and use it.`
  } else if (category === 'culturesFactions') {
    expanded += `**Values & Beliefs:**\nThe core principles that guide this group shape their actions and reactions.\n\n`
    expanded += `**Structure:**\nInternal organization determines how power flows and decisions are made.\n\n`
    expanded += `**Conflicts:**\nTensions with other groups or internal divisions create narrative opportunities.`
  } else {
    expanded += `**Details:**\nFurther examination reveals additional layers of meaning and significance.\n\n`
    expanded += `**Connections:**\nThis element connects to multiple aspects of the story, creating thematic resonance.\n\n`
    expanded += `**Impact:**\nThe presence of ${name} shapes how events unfold and characters respond.`
  }

  return expanded
}

// NEW: Deepen a character with psychological depth
function deepenCharacter(context: Record<string, any>): string {
  const character = context.character || {}
  const spec = context.specification || {}

  const name = character.name || 'The character'
  const role = character.role || 'protagonist'
  const backstory = character.backstory || ''
  const arc = character.arc || ''
  const flaw = character.flaw || ''
  const motivation = character.motivation || ''

  let deepened = backstory + '\n\n'

  // Add psychological depth sections
  deepened += `**Hidden Motivations:**\n`
  if (motivation) {
    deepened += `Beneath ${name}'s stated goal of ${motivation.toLowerCase()}, lies a deeper need: the desire to prove their own worth. This stems from early experiences that left them feeling fundamentally inadequate.\n\n`
  } else {
    deepened += `${name} carries an unspoken drive that even they may not fully recognize—a need for validation that shapes their choices in subtle but profound ways.\n\n`
  }

  deepened += `**Psychological Patterns:**\n`
  if (flaw) {
    deepened += `${name}'s ${flaw.toLowerCase()} is not merely a character trait but a defense mechanism, developed in response to past trauma. When under stress, they default to this pattern, often sabotaging the very things they care about most.\n\n`
  } else {
    deepened += `Under pressure, ${name} reveals patterns that hint at unresolved internal conflicts. These moments of vulnerability are when their true character emerges.\n\n`
  }

  deepened += `**Core Wound:**\n`
  deepened += `At the heart of ${name}'s psychology is a foundational belief: that they are somehow not enough. Every major decision can be traced back to this wound, which they either fight against or unconsciously fulfill.\n\n`

  deepened += `**Contradictions:**\n`
  if (role === 'protagonist') {
    deepened += `${name} presents a paradox: they long for connection yet push others away; they desire change but cling to familiar patterns; they seek the truth while being dishonest with themselves.`
  } else if (role === 'antagonist') {
    deepened += `${name} sees themselves as the hero of their own story. Their cruelty stems from conviction, their opposition from genuine belief in their own righteousness.`
  } else {
    deepened += `${name} contains multitudes—capable of great kindness and surprising coldness, driven by impulses they themselves don't fully understand.`
  }

  return deepened
}

// NEW: Generate dialogue/interaction between two characters
function generateCharacterInteraction(context: Record<string, any>): string {
  const char1 = context.character1 || {}
  const char2 = context.character2 || {}
  const spec = context.specification || {}

  const name1 = char1.name || 'Character One'
  const name2 = char2.name || 'Character Two'
  const voice1 = char1.voiceProfile || {}
  const voice2 = char2.voiceProfile || {}

  const vocab1 = voice1.vocabularyLevel?.toLowerCase() || 'standard'
  const vocab2 = voice2.vocabularyLevel?.toLowerCase() || 'standard'

  // Determine relationship dynamics
  const role1 = char1.role || 'supporting'
  const role2 = char2.role || 'supporting'

  let dynamicType = 'equals'
  if (role1 === 'protagonist' && role2 === 'antagonist') {
    dynamicType = 'conflict'
  } else if (role1 === 'antagonist' && role2 === 'protagonist') {
    dynamicType = 'conflict'
  } else if (role1 === 'mentor' || role2 === 'mentor') {
    dynamicType = 'guidance'
  }

  // Generate dialogue based on dynamics
  let dialogue = `**Scene: ${name1} and ${name2} in conversation**\n\n`

  if (dynamicType === 'conflict') {
    dialogue += `*The tension between them is palpable.*\n\n`
    dialogue += `**${name1}:** "You know this can't continue. Not the way you're going about it."\n\n`
    dialogue += `**${name2}:** *A cold smile.* "And yet, here we are. Again."\n\n`
    dialogue += `**${name1}:** "I'm trying to—"\n\n`
    dialogue += `**${name2}:** "I know what you're trying to do. The question is whether you understand what you're actually accomplishing."\n\n`
    dialogue += `*Silence stretches between them.*\n\n`
    dialogue += `**${name1}:** "There was a time when we wanted the same things."\n\n`
    dialogue += `**${name2}:** "There was a time when I believed what you believe. I grew past that."\n\n`
  } else if (dynamicType === 'guidance') {
    const mentor = role1 === 'mentor' ? name1 : name2
    const mentee = role1 === 'mentor' ? name2 : name1

    dialogue += `*A moment of teaching, of passing something down.*\n\n`
    dialogue += `**${mentor}:** "You're ready for this. Even if you don't believe it yet."\n\n`
    dialogue += `**${mentee}:** "How can you be so sure?"\n\n`
    dialogue += `**${mentor}:** *A knowing look.* "Because I see something in you that you haven't learned to see in yourself."\n\n`
    dialogue += `*A beat. The weight of those words settling.*\n\n`
    dialogue += `**${mentee}:** "What if I fail?"\n\n`
    dialogue += `**${mentor}:** "Then you'll learn. That's how this works."\n\n`
  } else {
    dialogue += `*A moment of connection between two people navigating the same storm.*\n\n`
    dialogue += `**${name1}:** "I've been thinking about what you said."\n\n`
    dialogue += `**${name2}:** "And?"\n\n`
    dialogue += `**${name1}:** "You were right. About most of it, anyway."\n\n`
    dialogue += `**${name2}:** *A slight smile.* "Only most of it?"\n\n`
    dialogue += `**${name1}:** "I'm not going to give you everything."\n\n`
    dialogue += `*They share a look—understanding passing between them without words.*\n\n`
    dialogue += `**${name2}:** "We're going to get through this."\n\n`
    dialogue += `**${name1}:** "Together?"\n\n`
    dialogue += `**${name2}:** "Together."\n\n`
  }

  // Add voice notes
  dialogue += `---\n\n`
  dialogue += `*Voice Notes:*\n`
  dialogue += `- ${name1}: ${vocab1} vocabulary${voice1.speechPatterns ? `, ${voice1.speechPatterns}` : ''}\n`
  dialogue += `- ${name2}: ${vocab2} vocabulary${voice2.speechPatterns ? `, ${voice2.speechPatterns}` : ''}\n`

  return dialogue
}

// NEW: Generate synopsis at different lengths
function generateSynopsis(context: Record<string, any>): string {
  const spec = context.specification || {}
  const plot = context.plot || {}
  const characters = context.characters || []
  const length = context.length || 'one-page'

  const title = spec.title || 'Untitled'
  const genre = spec.genre?.[0] || 'fiction'
  const protagonist = characters.find((c: any) => c.role === 'protagonist')
  const protName = protagonist?.name || 'the protagonist'
  const antagonist = characters.find((c: any) => c.role === 'antagonist')

  // Get plot structure info
  const plotStructure = plot.selectedStructure || 'three-act'
  const beats = plot.beats || []
  const climaxBeat = beats.find((b: any) => b.title?.toLowerCase().includes('climax'))
  const resolutionBeat = beats.find((b: any) => b.title?.toLowerCase().includes('resolution'))

  if (length === 'elevator') {
    // 2-3 sentence elevator pitch
    return `${title.toUpperCase()} is a ${genre} novel about ${protName}, who must face impossible odds to ${protagonist?.motivation?.toLowerCase() || 'achieve their deepest desire'}. When ${antagonist ? antagonist.name + ' threatens everything' : 'dark forces emerge'}, ${protName} discovers that the greatest battles are fought within—and that sometimes, the only way forward is to become someone new.`
  }

  if (length === 'one-page') {
    let synopsis = `${title.toUpperCase()}\n\n`
    synopsis += `${genre.charAt(0).toUpperCase() + genre.slice(1)} | ${spec.targetWordCount ? Math.round(spec.targetWordCount / 1000) + 'K words' : 'Novel'}\n\n`

    synopsis += `---\n\n`

    // Opening
    synopsis += `In a world where ${spec.setting || 'nothing is as it seems'}, ${protName}${protagonist?.backstory ? ` (${protagonist.backstory.split('.')[0]})` : ''} wants nothing more than ${protagonist?.motivation?.toLowerCase() || 'to find their place'}.\n\n`

    // Inciting incident
    synopsis += `But when ${antagonist ? antagonist.name + ' appears' : 'an unexpected crisis strikes'}, ${protName}'s carefully ordered life shatters. Now, facing ${protagonist?.flaw ? 'their own ' + protagonist.flaw.toLowerCase() : 'inner demons'} and external threats alike, they must choose: retreat into safety, or risk everything for a chance at something more.\n\n`

    // Rising action
    synopsis += `As ${protName} navigates a web of ${genre.includes('thriller') ? 'danger and deception' : genre.includes('romance') ? 'complicated feelings and past wounds' : 'challenges and revelations'}, they form unexpected alliances and discover hidden truths. Each step forward demands a piece of who they were—and forces them to confront who they might become.\n\n`

    // Climax
    synopsis += `At the story's turning point, ${protName} faces an impossible choice: ${climaxBeat?.summary?.toLowerCase() || 'sacrifice everything they love, or betray everything they believe'}. In this crucible moment, the truth about ${antagonist ? antagonist.name : 'their greatest enemy'} is finally revealed—and it changes everything.\n\n`

    // Resolution
    synopsis += `${title.toUpperCase()} is a story about ${spec.themes?.[0]?.toLowerCase() || 'transformation'}, ${spec.themes?.[1]?.toLowerCase() || 'connection'}, and the courage it takes to become who we're meant to be.`

    return synopsis
  }

  // Two-page synopsis
  let synopsis = `${title.toUpperCase()}\n`
  synopsis += `by [Author Name]\n\n`
  synopsis += `${genre.charAt(0).toUpperCase() + genre.slice(1)} | ${spec.targetWordCount ? Math.round(spec.targetWordCount / 1000) + 'K words' : 'Novel'}\n\n`
  synopsis += `---\n\n`

  // Setup (expanded)
  synopsis += `**THE WORLD**\n\n`
  synopsis += `${spec.setting || 'The story takes place in a world'} where ${spec.tone ? 'the atmosphere is ' + spec.tone.toLowerCase() + ' and' : ''} nothing is quite as it appears on the surface. This is a place where ${spec.themes?.[0]?.toLowerCase() || 'truth and deception'} shape every interaction.\n\n`

  // Protagonist introduction
  synopsis += `**${protName?.toUpperCase() || 'THE PROTAGONIST'}**\n\n`
  synopsis += `${protName}${protagonist?.backstory ? ' ' + protagonist.backstory : ' carries a past that has shaped them in profound ways'}. Their greatest desire is to ${protagonist?.motivation?.toLowerCase() || 'find meaning and purpose'}. But their ${protagonist?.flaw?.toLowerCase() || 'deepest flaw'} threatens to undermine everything they hope to achieve.\n\n`

  // The catalyst
  synopsis += `**THE INCITING INCIDENT**\n\n`
  const firstBeat = beats[0]
  synopsis += `${firstBeat?.summary || 'When crisis strikes'}, ${protName}'s world is turned upside down. ${antagonist ? antagonist.name + ', ' + (antagonist.backstory?.split('.')[0] || 'a formidable force') + ', emerges as the central threat.' : 'Forces beyond their control begin to move.'} Suddenly, the life ${protName} knew is no longer possible.\n\n`

  // Rising action
  synopsis += `**THE JOURNEY**\n\n`
  synopsis += `Determined to ${protagonist?.motivation?.toLowerCase() || 'reclaim what was lost'}, ${protName} embarks on a path that will test everything they believe. Along the way, they encounter allies and enemies—and discover that the line between them isn't always clear.\n\n`

  // Add character dynamics
  const supporting = characters.filter((c: any) => c.role === 'supporting').slice(0, 2)
  if (supporting.length > 0) {
    synopsis += `${supporting.map((c: any) => c.name).join(' and ')} ${supporting.length > 1 ? 'become' : 'becomes'} crucial to ${protName}'s journey, each bringing their own secrets and agendas. Relationships deepen and complicate. Trust becomes both weapon and vulnerability.\n\n`
  }

  // Midpoint/dark night
  synopsis += `**THE CRISIS**\n\n`
  synopsis += `At the story's midpoint, ${protName} faces a devastating revelation that challenges everything they thought they knew. Their ${protagonist?.flaw?.toLowerCase() || 'greatest weakness'} leads to a catastrophic mistake, and for a moment, all seems lost. In this dark night of the soul, ${protName} must decide whether to continue fighting or surrender to despair.\n\n`

  // Climax
  synopsis += `**THE CLIMAX**\n\n`
  synopsis += `${climaxBeat?.summary || 'In the final confrontation'}, ${protName} faces ${antagonist ? antagonist.name : 'their greatest challenge'} in a battle that will determine everything. But the true victory isn't external—it's the transformation within. ${protName} finally embraces ${protagonist?.arc ? 'their arc: ' + protagonist.arc.toLowerCase() : 'who they were always meant to become'}.\n\n`

  // Resolution
  synopsis += `**THE RESOLUTION**\n\n`
  synopsis += `${resolutionBeat?.summary || 'In the aftermath'}, ${protName} emerges changed. The world around them has shifted too—nothing can go back to exactly what it was. But there is hope. There is possibility. And there is the promise that the journey has only begun.\n\n`

  // Themes
  synopsis += `---\n\n`
  synopsis += `${title.toUpperCase()} explores themes of ${spec.themes?.slice(0, 3).map((t: string) => t.toLowerCase()).join(', ') || 'transformation, connection, and the courage to change'}. It is a story that will resonate with readers who love ${genre} that challenges as much as it entertains.`

  return synopsis
}

// NEW: Generate query letter
function generateQueryLetter(context: Record<string, any>): string {
  const spec = context.specification || {}
  const characters = context.characters || []

  const title = spec.title || 'UNTITLED'
  const genre = spec.genre?.[0] || 'fiction'
  const wordCount = spec.targetWordCount || 80000
  const protagonist = characters.find((c: any) => c.role === 'protagonist')
  const protName = protagonist?.name || 'the protagonist'

  let letter = `Dear [Agent Name],\n\n`

  // Hook
  letter += `I am seeking representation for ${title.toUpperCase()}, a ${genre} novel complete at ${Math.round(wordCount / 1000)},000 words.\n\n`

  // Story paragraph
  letter += `${protName}${protagonist?.backstory ? ` ${protagonist.backstory.split('.')[0].toLowerCase()}` : ' has always lived in the shadows of expectation'}. When ${spec.setting ? 'in ' + spec.setting : 'their world'} is turned upside down, ${protName} must face ${protagonist?.flaw ? 'their ' + protagonist.flaw.toLowerCase() : 'their deepest fears'} and discover whether they have what it takes to ${protagonist?.motivation?.toLowerCase() || 'become who they were meant to be'}.\n\n`

  letter += `Navigating a world of ${genre.includes('thriller') ? 'danger and deception' : genre.includes('romance') ? 'complicated feelings' : 'challenges and revelations'}, ${protName} learns that the greatest battles are fought within. With ${spec.themes?.[0]?.toLowerCase() || 'themes of transformation'} at its core, ${title.toUpperCase()} explores what it means to ${spec.themes?.[1]?.toLowerCase() || 'find connection in unexpected places'}.\n\n`

  // Comp titles placeholder
  letter += `${title.toUpperCase()} will appeal to readers of [COMP TITLE 1] and [COMP TITLE 2], combining [ELEMENT 1] with [ELEMENT 2].\n\n`

  // Bio placeholder
  letter += `[Author bio: Include relevant writing credentials, publications, and any platform or expertise relevant to this book.]\n\n`

  // Close
  letter += `Thank you for your time and consideration. I would be happy to send the full manuscript at your request.\n\n`
  letter += `Best regards,\n`
  letter += `[Your Name]\n`
  letter += `[Email]\n`
  letter += `[Website/Social Media (optional)]`

  return letter
}

// NEW: Generate book description (back-cover copy)
function generateBookDescription(context: Record<string, any>): string {
  const spec = context.specification || {}
  const characters = context.characters || []

  const title = spec.title || 'Untitled'
  const genre = spec.genre?.[0] || 'fiction'
  const protagonist = characters.find((c: any) => c.role === 'protagonist')
  const protName = protagonist?.name || 'The protagonist'
  const antagonist = characters.find((c: any) => c.role === 'antagonist')

  let description = ``

  // Tagline
  description += `*${spec.logline || 'Some secrets are worth any price. Others cost everything.'}*\n\n`

  // Hook paragraph
  description += `${protName} has always known ${protagonist?.flaw ? 'their ' + protagonist.flaw.toLowerCase() + ' would catch up with them' : 'that nothing comes easy'}. But when ${antagonist ? antagonist.name + ' enters their life' : 'an unexpected crisis strikes'}, everything changes. Now, trapped between ${genre.includes('thriller') ? 'dangerous enemies' : genre.includes('romance') ? 'past and present' : 'impossible choices'}, ${protName} must find the courage to face what they've been running from.\n\n`

  // Raising the stakes
  description += `In a world where ${spec.setting ? spec.setting : 'nothing is as it seems'}, ${protName} discovers that ${spec.themes?.[0]?.toLowerCase() || 'the truth'} comes with a price. As secrets unravel and loyalties are tested, ${protName} realizes that the only way forward is through—even if it means losing everything they thought they wanted.\n\n`

  // The choice/emotional hook
  description += `With ${genre.includes('romance') ? 'their heart' : 'time'} running out, ${protName} faces an impossible decision: ${protagonist?.motivation ? protagonist.motivation.toLowerCase() : 'fight for what matters'}, or watch it slip away forever.\n\n`

  // Closing hook
  description += `${title.toUpperCase()} is a ${spec.tone?.toLowerCase() || 'compelling'} ${genre} that explores ${spec.themes?.slice(0, 2).map((t: string) => t.toLowerCase()).join(' and ') || 'the resilience of the human spirit'}. Perfect for readers who love ${genre.includes('thriller') ? 'edge-of-your-seat suspense' : genre.includes('romance') ? 'emotionally rich love stories' : 'unforgettable characters and powerful storytelling'}.\n\n`

  // Review placeholder
  description += `---\n\n`
  description += `"[Placeholder for a quote or advance praise]" — [Reviewer/Author Name]\n\n`

  // Author note
  description += `---\n\n`
  description += `*Note: Customize the bracketed sections and adjust the emotional hooks to match your specific story beats.*`

  return description
}

// NEW: Analyze market and generate comparable titles
function analyzeMarket(context: Record<string, any>): string {
  const spec = context.specification || {}
  const characters = context.characters || []

  const genre = spec.genre?.[0] || 'Fiction'
  const title = spec.title || 'Untitled'
  const themes = spec.themes || []

  // Genre-specific comparable titles (more comprehensive than the mock)
  const comparableTitlesByGenre: Record<string, any[]> = {
    'Fantasy': [
      {
        title: 'Fourth Wing',
        author: 'Rebecca Yarros',
        similarity: 'Dragon riders, academy setting, high-stakes action',
        marketPerformance: '#1 NYT Bestseller, 3M+ copies sold (2023)'
      },
      {
        title: 'House of Flame and Shadow',
        author: 'Sarah J. Maas',
        similarity: 'Epic fantasy, strong female protagonist, world-ending stakes',
        marketPerformance: '#1 NYT Bestseller, 2024 release'
      },
      {
        title: 'The Priory of the Orange Tree',
        author: 'Samantha Shannon',
        similarity: 'Dragon mythology, multiple POVs, epic scope',
        marketPerformance: 'NYT Bestseller, major film adaptation in development'
      }
    ],
    'Romance': [
      {
        title: 'Happy Place',
        author: 'Emily Henry',
        similarity: 'Contemporary romance, second-chance love, witty dialogue',
        marketPerformance: '#1 NYT Bestseller, 2M+ copies sold (2023)'
      },
      {
        title: 'Things We Never Got Over',
        author: 'Lucy Score',
        similarity: 'Small-town romance, grumpy-sunshine dynamic',
        marketPerformance: '#1 BookTok phenomenon, Amazon charts leader'
      },
      {
        title: 'The Love Hypothesis',
        author: 'Ali Hazelwood',
        similarity: 'Academic setting, fake dating trope',
        marketPerformance: 'NYT Bestseller, Netflix adaptation announced'
      }
    ],
    'Thriller': [
      {
        title: 'The Silent Patient',
        author: 'Alex Michaelides',
        similarity: 'Psychological suspense, unreliable narrator',
        marketPerformance: '#1 NYT Bestseller, 8M+ copies worldwide'
      },
      {
        title: 'The Last Thing He Told Me',
        author: 'Laura Dave',
        similarity: 'Family secrets, propulsive mystery',
        marketPerformance: 'NYT Bestseller, Apple TV+ adaptation'
      },
      {
        title: 'None of This Is True',
        author: 'Lisa Jewell',
        similarity: 'Dark obsession, twisty narrative',
        marketPerformance: 'NYT Bestseller, 2023 psychological thriller hit'
      }
    ],
    'Science Fiction': [
      {
        title: 'Project Hail Mary',
        author: 'Andy Weir',
        similarity: 'Science-driven plot, survival narrative',
        marketPerformance: 'NYT Bestseller, Ryan Gosling film adaptation'
      },
      {
        title: 'The Three-Body Problem',
        author: 'Liu Cixin',
        similarity: 'Hard science fiction, cosmic scale',
        marketPerformance: 'Hugo Award winner, Netflix series'
      },
      {
        title: 'Starter Villain',
        author: 'John Scalzi',
        similarity: 'Humorous sci-fi, accessible entry point',
        marketPerformance: 'NYT Bestseller, 2023 release'
      }
    ],
    'Fiction': [
      {
        title: 'The Midnight Library',
        author: 'Matt Haig',
        similarity: 'Contemplative narrative, life-affirming themes',
        marketPerformance: '#1 NYT Bestseller, 5M+ copies worldwide'
      },
      {
        title: 'Lessons in Chemistry',
        author: 'Bonnie Garmus',
        similarity: 'Strong protagonist, period setting with modern themes',
        marketPerformance: '#1 NYT Bestseller, Apple TV+ adaptation'
      },
      {
        title: 'Tomorrow, and Tomorrow, and Tomorrow',
        author: 'Gabrielle Zevin',
        similarity: 'Relationship focus, creative industry setting',
        marketPerformance: '#1 NYT Bestseller, 2M+ copies sold'
      }
    ]
  }

  const comparableTitles = comparableTitlesByGenre[genre] || comparableTitlesByGenre['Fiction']

  const marketAnalysis = {
    comparableTitles,
    genrePositioning: `Your novel "${title}" positions well within the ${genre} genre, which has shown strong performance in 2024-2025. Current market trends favor ${
      genre === 'Fantasy' ? 'immersive world-building, morally complex characters, and romantic subplots' :
      genre === 'Romance' ? 'emotional depth, witty banter, and satisfying HEAs (happily ever afters)' :
      genre === 'Thriller' ? 'psychological depth, unreliable narrators, and twist endings' :
      genre === 'Science Fiction' ? 'accessible science concepts, hopeful futures, and strong characterization' :
      'compelling narratives and relatable protagonists'
    }.`,
    uniqueness: themes.length > 0
      ? `Your exploration of ${themes.slice(0, 2).map((t: string) => t.toLowerCase()).join(' and ')} offers a fresh angle in the ${genre} space. This thematic focus can differentiate your work from competitors while still appealing to core genre readers.`
      : 'Define your themes in the Specification section to receive personalized uniqueness analysis.',
    readerExpectations: [
      `${genre} readers expect strong ${
        genre === 'Romance' ? 'romantic tension and emotional payoff' :
        genre === 'Fantasy' ? 'world-building and magic systems' :
        genre === 'Thriller' ? 'pacing and suspense' :
        'pacing and character development'
      }`,
      'Modern readers value diverse representation and authentic voices',
      'Series potential is highly valued by publishers - consider sequel hooks',
      'Social media shareability (BookTok/Bookstagram moments) drives discovery',
      'Audio book compatibility is increasingly important for acquisition'
    ],
    lengthRecommendation: genre === 'Fantasy'
      ? 'Fantasy readers accept longer works (90,000-150,000 words). Debut fantasy under 100K is more marketable.'
      : genre === 'Romance'
      ? 'Romance typically ranges 70,000-90,000 words. Category romance runs shorter (50-70K).'
      : genre === 'Thriller'
      ? 'Thrillers typically range 80,000-100,000 words. Pacing is more important than length.'
      : 'General fiction typically ranges 70,000-100,000 words for debut authors.',
    analyzedAt: new Date().toISOString()
  }

  return JSON.stringify(marketAnalysis)
}

// NEW: Suggest keywords for discoverability
function suggestKeywords(context: Record<string, any>): string {
  const spec = context.specification || {}
  const characters = context.characters || []
  const plot = context.plot || {}

  const genre = spec.genre?.[0] || 'fiction'
  const themes = spec.themes || []
  const tone = spec.tone || ''
  const protagonist = characters.find((c: any) => c.role === 'protagonist')

  // Base genre keywords
  const genreKeywords: Record<string, string[]> = {
    'Fantasy': ['fantasy', 'epic fantasy', 'sword and sorcery', 'magic', 'dragons', 'quest', 'chosen one', 'dark fantasy'],
    'Romance': ['romance', 'love story', 'contemporary romance', 'slow burn', 'enemies to lovers', 'second chance romance', 'happily ever after'],
    'Thriller': ['thriller', 'suspense', 'psychological thriller', 'mystery', 'crime', 'detective', 'twisty', 'page-turner'],
    'Science Fiction': ['sci-fi', 'science fiction', 'space opera', 'dystopian', 'future', 'technology', 'first contact'],
    'Fiction': ['literary fiction', 'contemporary fiction', 'book club', 'women\'s fiction', 'family drama', 'coming of age']
  }

  const keywords: string[] = []

  // Add genre keywords
  const baseKeywords = genreKeywords[genre] || genreKeywords['Fiction']
  keywords.push(...baseKeywords.slice(0, 4))

  // Add theme-based keywords
  themes.forEach((theme: string) => {
    const themeLower = theme.toLowerCase()
    if (themeLower.includes('secret')) keywords.push('dark secrets', 'family secrets')
    if (themeLower.includes('love')) keywords.push('love', 'emotional')
    if (themeLower.includes('betrayal')) keywords.push('betrayal', 'trust')
    if (themeLower.includes('identity')) keywords.push('identity', 'self-discovery')
    if (themeLower.includes('power')) keywords.push('power', 'ambition')
    if (themeLower.includes('redemption')) keywords.push('redemption', 'second chances')
    if (themeLower.includes('family')) keywords.push('family saga', 'family drama')
  })

  // Add protagonist-based keywords
  if (protagonist) {
    if (protagonist.role === 'protagonist') {
      keywords.push('strong protagonist')
    }
  }

  // Add tone-based keywords
  if (tone) {
    const toneLower = tone.toLowerCase()
    if (toneLower.includes('dark')) keywords.push('dark', 'atmospheric')
    if (toneLower.includes('wit')) keywords.push('witty', 'humorous')
    if (toneLower.includes('tense')) keywords.push('tense', 'gripping')
    if (toneLower.includes('emotional')) keywords.push('emotional', 'heartfelt')
  }

  // Add general marketable keywords
  keywords.push('new release')
  keywords.push('must read')
  keywords.push('2025 books')

  // Remove duplicates and limit
  const uniqueKeywords = [...new Set(keywords)].slice(0, 15)

  return JSON.stringify(uniqueKeywords)
}

// Brainstorm analysis - generates questions based on brainstorm text
function analyzeBrainstorm(context: Record<string, any>): string {
  const brainstormText = context.brainstormText || ''

  // Generate questions based on content analysis
  const questions = [
    {
      id: `q-${Date.now()}-1`,
      category: 'Premise',
      questionText: 'What is the central conflict or challenge in your story?',
      contextQuote: brainstormText.substring(0, 100) + (brainstormText.length > 100 ? '...' : ''),
      priority: 1,
    },
    {
      id: `q-${Date.now()}-2`,
      category: 'Character',
      questionText: 'What does your main character want most, and what\'s stopping them?',
      contextQuote: null,
      priority: 2,
    },
    {
      id: `q-${Date.now()}-3`,
      category: 'Setting',
      questionText: 'Where and when does this story take place? What makes this setting unique?',
      contextQuote: null,
      priority: 3,
    },
    {
      id: `q-${Date.now()}-4`,
      category: 'Tone',
      questionText: 'What emotional journey do you want readers to experience?',
      contextQuote: null,
      priority: 4,
    },
    {
      id: `q-${Date.now()}-5`,
      category: 'Stakes',
      questionText: 'What happens if the protagonist fails? What\'s truly at risk?',
      contextQuote: null,
      priority: 5,
    },
  ]

  return JSON.stringify({ questions })
}

// Generate foundations based on brainstorm text and Q&A answers
function generateFoundations(context: Record<string, any>): string {
  const brainstormText = context.brainstormText || ''

  // In production, this would use Claude to deeply analyze the text
  // For now, generate structured foundations based on input

  const plotFoundation = {
    premise: brainstormText.length > 50
      ? `A story about ${brainstormText.substring(0, 100)}...`
      : 'A compelling story unfolds with rich characters and meaningful conflicts.',
    centralConflict: 'The protagonist must overcome both external obstacles and internal doubts to achieve their goal.',
    suggestedStructure: {
      framework: 'Three-Act Structure',
      reasoning: 'This classic framework provides clear progression while allowing flexibility in pacing.',
    },
    keyPlotPoints: [
      {
        id: `plot-${Date.now()}-1`,
        title: 'The Beginning',
        description: 'Establish the world and introduce the protagonist in their ordinary life.',
        storyPhase: 'beginning',
        confidence: 'suggested',
        sourceQuote: null,
        selected: true,
      },
      {
        id: `plot-${Date.now()}-2`,
        title: 'The Catalyst',
        description: 'An event that disrupts the status quo and sets the story in motion.',
        storyPhase: 'beginning',
        confidence: 'suggested',
        sourceQuote: null,
        selected: true,
      },
      {
        id: `plot-${Date.now()}-3`,
        title: 'The Midpoint',
        description: 'A revelation or event that raises the stakes and changes the protagonist\'s approach.',
        storyPhase: 'middle',
        confidence: 'suggested',
        sourceQuote: null,
        selected: true,
      },
      {
        id: `plot-${Date.now()}-4`,
        title: 'The Climax',
        description: 'The protagonist faces their greatest challenge and must make a crucial choice.',
        storyPhase: 'end',
        confidence: 'suggested',
        sourceQuote: null,
        selected: true,
      },
    ],
    potentialSubplots: ['Romance subplot', 'Mentor relationship', 'Internal character growth'],
    openQuestions: ['What specific events drive the plot forward?', 'What is the antagonist\'s motivation?'],
  }

  const characterFoundation = {
    identifiedCharacters: [
      {
        id: `char-${Date.now()}-1`,
        name: null,
        workingName: 'The Protagonist',
        role: 'protagonist',
        knownTraits: [],
        inferredTraits: ['determined', 'flawed', 'relatable'],
        potentialArc: 'Grows through challenges, learns to trust others, overcomes their fear.',
        keyRelationships: [],
        confidence: 'suggested',
        sourceQuotes: [],
        selected: true,
      },
      {
        id: `char-${Date.now()}-2`,
        name: null,
        workingName: 'The Antagonist',
        role: 'antagonist',
        knownTraits: [],
        inferredTraits: ['complex', 'motivated', 'formidable'],
        potentialArc: 'Their goals clash with the protagonist, revealing deeper truths about the world.',
        keyRelationships: [],
        confidence: 'suggested',
        sourceQuotes: [],
        selected: true,
      },
    ],
    relationshipHints: [
      {
        character1: 'The Protagonist',
        character2: 'The Antagonist',
        relationshipType: 'conflict',
        description: 'Their opposing goals create the central conflict.',
        confidence: 'suggested',
      },
    ],
    missingArchetypes: ['Mentor', 'Ally', 'Love Interest', 'Trickster'],
    openQuestions: ['Who supports the protagonist on their journey?', 'What is the antagonist\'s backstory?'],
  }

  const sceneFoundation = {
    envisionedScenes: [],
    suggestedScenes: [
      {
        id: `scene-${Date.now()}-1`,
        title: 'Opening Scene',
        description: 'Introduce the protagonist in their ordinary world, hinting at what they lack.',
        charactersInvolved: ['Protagonist'],
        emotionalBeat: 'Curiosity mixed with subtle discontent',
        storyFunction: 'Establish character, setting, and stakes',
        vividness: 'sketched',
        sourceQuote: null,
        selected: true,
      },
      {
        id: `scene-${Date.now()}-2`,
        title: 'The Call to Adventure',
        description: 'An event disrupts the protagonist\'s world and demands a response.',
        charactersInvolved: ['Protagonist'],
        emotionalBeat: 'Shock transitioning to determination',
        storyFunction: 'Launch the main plot',
        vividness: 'sketched',
        sourceQuote: null,
        selected: true,
      },
      {
        id: `scene-${Date.now()}-3`,
        title: 'First Major Confrontation',
        description: 'The protagonist faces their first real challenge and discovers what they\'re up against.',
        charactersInvolved: ['Protagonist', 'Antagonist'],
        emotionalBeat: 'Tension and revelation',
        storyFunction: 'Raise stakes and introduce antagonist',
        vividness: 'sketched',
        sourceQuote: null,
        selected: true,
      },
    ],
    keyMoments: [
      'The inciting incident',
      'First major setback',
      'The point of no return',
      'Dark night of the soul',
      'The climactic confrontation',
    ],
    settingNotes: [],
    openQuestions: ['Where does the story take place?', 'What makes this world unique?'],
  }

  return JSON.stringify({
    plotFoundation,
    characterFoundation,
    sceneFoundation,
  })
}

// Orchestrator: Route to the correct specialized agent based on request type
function routeToAgent(agentTarget: string, _action: string): {
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
    // Brainstorm Agent - handles brainstorm analysis and foundation generation
    'brainstorm': {
      agent: 'BrainstormAgent',
      description: 'Specialized in analyzing raw creative ideas and generating story foundations',
      capabilities: ['analyze-brainstorm', 'generate-foundations', 'generate-questions'],
    },
  }

  // Find matching agent
  const targetLower = agentTarget?.toLowerCase() || 'writer'
  const matched = agentMapping[targetLower] || agentMapping['writer']

  return matched
}

// POST /api/ai/generate - Generic AI generation endpoint with cancellation support
router.post('/generate', async (req: Request, res: Response) => {
  const { agentTarget, action, context, payload: _payload } = req.body
  const generationId = `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Route to appropriate specialized agent via orchestrator
  const routedAgent = routeToAgent(agentTarget, action)
  console.log(`[Orchestrator] Routing request to ${routedAgent.agent} for action: ${action}`)
  console.log(`[${routedAgent.agent}] Starting generation ${generationId} (Claude: ${USE_REAL_CLAUDE})`)

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

    if (USE_REAL_CLAUDE) {
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
        console.log(`[${routedAgent.agent}] Tokens used - Input: ${response.usage.inputTokens}, Output: ${response.usage.outputTokens}`)
      }
    } else {
      // Use simulated generation for testing
      const response = await simulateAIGeneration(action, context || {}, generationId)
      result = response.result
      cancelled = response.cancelled
    }

    // Clean up socket listener and registrations
    socket.off('close', onSocketClose)
    activeGenerations.delete(generationId)
    if (USE_REAL_CLAUDE) {
      cleanupGeneration(generationId)
    }

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
      usingClaude: USE_REAL_CLAUDE,
    })
  } catch (error) {
    socket.off('close', onSocketClose)
    activeGenerations.delete(generationId)
    if (USE_REAL_CLAUDE) {
      cleanupGeneration(generationId)
    }
    console.error('AI generation error:', error)
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Generation failed',
    })
  }
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
